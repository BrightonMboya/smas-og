// Import required dependencies and modules
import { controllers } from "bapig"
import { Schema, model } from "mongoose"
import { expense } from "../interface"
import { TPDDSchemaValues } from "../database/schema"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Define the schema for expenses
const schema = new Schema<expense>(
  {
    // Define the 'name' field with indexing and required attribute
    name: {
      index: true,
      type: String,
      required: true,
    },

    // Define the 'truck' field with indexing and autopopulation
    truck: {
      index: true,
      ref: 'truck',
      default: null,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "name" },
    },

    // Define the 'customer' field with indexing and autopopulation
    customer: {
      index: true,
      ref: 'customer',
      default: null,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "name" },
    },

    // Define the 'expense_type' field with indexing, required attribute, and autopopulation
    expense_type: {
      index: true,
      required: true,
      ref: 'expense_type',
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "name" },
    },

    // Define the 'editable' field with indexing and default value
    editable: {
      index: true,
      type: Boolean,
      default: true,
    },

    has_receipt: {
      index: true,
      type: Boolean,
      default: false
    },

    quotation_invoice: {
      index: true,
      default: null,
      ref: 'quotation_invoice',
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1 },
    },

    // Include common schema values
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
schema.post(schemaMiddlewareEvents.create, function (expense: any) {
  try {
    if (expense) {
      // Create activity for the expense creation
      createActivity({
        data: expense,
        module: "expense",
        type: "creation",
        branch: expense.branch._id,
        user: expense.created_by._id,
        description: activitySentence("create")
      })

      // Create transaction for the expense
      if (expense.account) {
        // Construct transaction data
        const transactionData = {
          impact: false,
          type: "withdraw",
          fee: expense.fee,
          cause: "automatic",
          expense: expense._id,
          branch: expense.branch?._id,
          account: expense.account._id,
          reference: expense.reference,
          date: new Date().toISOString(),
          total_amount: expense.paid_amount,
          account_type: expense.account.type,
          created_by: expense.created_by?._id,
          description: "An automatic transaction was generated due to an expense made."
        }

        // Create the transaction
        controllers.createSingleDocument({
          documentData: transactionData,
          schema: "transaction"
        })

        // Create new debt if the expense amount is unpaid
        if (expense.total_amount > expense.paid_amount) {
          controllers.createSingleDocument({
            schema: "debt",
            documentData: {
              type: "creditor",
              status: "unpaid",
              date: expense.date,
              expense: expense._id,
              branch: expense.branch._id,
              created_by: expense.created_by._id,
              description: "Expense Induced Debt",
              total_amount: expense.total_amount - expense.paid_amount,
            }
          })
        }
      }
    }
  } catch (error) {
    console.log(`Expense schema middleware error on create: ${(error as Error).message}`)
  }
})

// Schema middleware for update
schema.post(schemaMiddlewareEvents.update, function (expense: any) {
  try {
    if (expense) {
      if (!expense.visible) {
        // Create activity for the expense deletion
        createActivity({
          data: expense,
          module: "expense",
          type: "deletion",
          branch: expense.branch._id,
          user: expense.updated_by._id,
          description: activitySentence()
        })

        // Delete transaction if expense has an account
        if (expense.account) {
          const transactionData = {
            schema: "transaction",
            condition: { expense: expense._id },
            newDocumentData: {
              $set: {
                visible: false,
                updated_by: expense.updated_by._id
              }
            }
          }

          controllers.updateSingleDocument(transactionData)
        }

        // Delete debt associated with the expense
        controllers.deleteSingleDocument({
          schema: "debt",
          condition: { expense: expense._id }
        })
      }
    } else {
      // Create activity for the expense modification
      createActivity({
        data: expense,
        module: "expense",
        type: "modification",
        branch: expense.branch._id,
        user: expense.updated_by._id,
        description: activitySentence("modify")
      })
    }
  } catch (error) {
    console.log(`Expense schema middleware error on update: ${(error as Error).message}`)
  }
})

// Schema middleware for delete
schema.post(schemaMiddlewareEvents.delete, function (expense: any) {
  try {
    if (expense) {
      // Create activity for the expense deletion
      createActivity({
        data: expense,
        module: "expense",
        type: "deletion",
        branch: expense.branch,
        user: expense.updated_by,
        description: activitySentence("delete")
      })
    }
  } catch (error) {
    console.log(`Expense schema middleware error on delete: ${(error as Error).message}`)
  }
})

// Create the Mongoose model for expenses
const expenseModel = model<expense>('expense', schema)

// Export the expense model
export default expenseModel
