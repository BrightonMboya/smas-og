// Import required dependencies and modules
import { controllers } from "bapig"
import { Schema, model } from "mongoose"
import { debt_history } from "../interface"
import { TPDDSchemaValues } from "../database/schema"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Define the schema for debt history
const schema = new Schema<debt_history>(
  {
    debt: {
      ref: 'debt',
      index: true,
      required: true,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 2 },
    },
    customer: {
      ref: 'customer',
      index: true,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "name" },
    },
    supplier: {
      index: true,
      ref: 'supplier',
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: { name: 1 } },
    },
    expense: {
      index: true,
      ref: 'expense',
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: { name: 1 } },
    },
    ...TPDDSchemaValues
  },
  { timestamps: true }
)

// Indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Add Mongoose autopopulate plugin
schema.plugin(require('mongoose-autopopulate'))

// Schema middleware for creation
schema.post(schemaMiddlewareEvents.create, async function (debtHistory: any) {
  try {
    if (debtHistory) {
      // Create activity for the debt history creation
      createActivity({
        data: debtHistory,
        user: debtHistory.created_by._id,
        module: "debt_history",
        type: "creation",
        description: activitySentence("create"),
        branch: debtHistory.branch._id
      })

      // Update status and related documents
      const status = (debtHistory.total_amount + debtHistory.debt.paid_amount) === debtHistory.debt.total_amount ? "paid" : "unpaid"
      const debt = debtHistory.debt
      const updated_by = debtHistory.created_by

      // Update debt status and related documents
      await controllers.updateSingleDocument({
        schema: "debt",
        condition: { _id: debtHistory.debt._id },
        newDocumentData: {
          $set: { status, updated_by },
          $inc: { paid_amount: debtHistory.total_amount }
        }
      })

      // Update sale or other related documents
      if (debt.sale) {
        await controllers.updateSingleDocument({
          schema: "sale",
          condition: { _id: debt.sale._id, visible: true },
          newDocumentData: {
            $set: { status: status === "paid" ? "cash" : "credit", updated_by }
          }
        })
      }
      // Handle updates for other related documents
      else if (debt.purchase || debt.expense || debt.quotation_invoice || debt.truck_order) {
        const schema = debt.purchase ? "purchase" : debt.expense ? "expense" : debt.truck_order ? "truck_order" : "quotation_invoice"
        controllers.updateSingleDocument({
          schema,
          condition: { _id: debt[schema]._id, visible: true },
          newDocumentData: {
            $set: { status, updated_by },
            $inc: { paid_amount: debtHistory.total_amount }
          }
        })
      }

      // Create automatic transaction for debt history
      if (debtHistory.account) {
        const type = debtHistory.debt.type === "creditor" ? "withdraw" : "deposit"
        const fee = type === "withdraw" ? debtHistory.fee : 0

        const transactionData = {
          fee,
          type,
          impact: false,
          cause: "automatic",
          debt_history: debtHistory._id,
          branch: debtHistory.branch?._id,
          date: new Date().toISOString(),
          account: debtHistory.account._id,
          reference: debtHistory.reference,
          total_amount: debtHistory.total_amount,
          account_type: debtHistory.account.type,
          created_by: debtHistory.created_by?._id,
          description: "An automatic transaction was generated due to a debt history made."
        }

        await controllers.createSingleDocument({
          documentData: transactionData,
          schema: "transaction",
        })
      }
    }
  } catch (error) {
    console.log(`Debt History Schema Middleware (create) Error: ${(error as Error).message}`)
  }
})

// Schema middleware for update
schema.post(schemaMiddlewareEvents.update, async function (debtHistory: any) {
  try {
    if (debtHistory) {
      // Handle updates for visible and related documents
      if (!debtHistory.visible) {
        createActivity({
          data: debtHistory,
          user: debtHistory.updated_by._id,
          module: "debt_history",
          type: "deletion",
          description: activitySentence(),
          branch: debtHistory.branch._id
        })

        // Update debt status and related documents for visibility change
        await controllers.updateSingleDocument({
          schema: "debt",
          condition: { _id: debtHistory.debt._id },
          newDocumentData: {
            $set: { status: "unpaid" },
            $inc: { paid_amount: -debtHistory.total_amount }
          }
        })

        // Handle updates for sale and other related documents
        const debt = debtHistory.debt
        const updated_by = debtHistory.updated_by

        if (debt.sale) {
          controllers.updateSingleDocument({
            schema: "sale",
            condition: { _id: debt.sale, visible: true },
            newDocumentData: {
              $set: { status: "credit", updated_by }
            }
          })
        }
        else if (debt.purchase || debt.expense || debt.quotation_invoice || debt.truck_order) {
          const schema = debt.purchase ? "purchase" : debt.expense ? "expense" : debt.truck_order ? "truck_order" : "quotation_invoice"
          controllers.updateSingleDocument({
            schema,
            condition: { _id: debt[schema], visible: true },
            newDocumentData: {
              $set: { status: "unpaid", updated_by },
              $inc: { paid_amount: (-1 * debtHistory.total_amount) }
            }
          })
        }

        // Delete associated transaction for debt history
        if (debtHistory.account) {
          const transactionData = {
            schema: "transaction",
            condition: { debt_history: debtHistory._id },
            newDocumentData: {
              $set: {
                visible: false,
                updated_by: debtHistory.updated_by._id
              }
            }
          }

          await controllers.updateSingleDocument(transactionData)
        }
      } else {
        createActivity({
          data: debtHistory,
          user: debtHistory.updated_by._id,
          module: "debt_history",
          type: "modification",
          description: activitySentence("modify"),
          branch: debtHistory.branch._id
        })
      }
    }
  } catch (error) {
    console.log(`Debt history schema middleware error (update): ${(error as Error).message}`)
  }
})

// Schema middleware for delete
schema.post(schemaMiddlewareEvents.delete, async function (debtHistory: any) {
  try {
    if (debtHistory) {
      // Create activity for debt history deletion
      createActivity({
        data: debtHistory,
        user: debtHistory.updated_by,
        module: "debt_history",
        type: "deletion",
        description: activitySentence("delete"),
        branch: debtHistory.branch
      })
    }
  } catch (error) {
    console.log(`Debt history schema middleware error (delete): ${(error as Error).message}`)
  }
})

// Create the Mongoose model for debt history
const debt_history = model<debt_history>('debt_history', schema)

// Export the debt history model
export default debt_history
