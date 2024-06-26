// Import required dependencies and modules
import { controllers } from "bapig"
import { sale } from "../interface"
import { Schema, model } from "mongoose"
import { commonSchemaValues } from "../database/schema"
import {
  accountSelection,
  customerPopulation,
  productPopulation,
} from "../database/population"
import {
  createActivity,
  schemaMiddlewareEvents,
  activitySentence,
  adjustStock,
} from "../helpers"

// Define the schema for the "sale" collection
const schema = new Schema<sale>(
  {
    // Define the 'customer' field with indexing, default value, and reference to 'customer' collection
    customer: {
      index: true,
      default: null,
      ref: "customer",
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: customerPopulation },
    },
    // Define the 'product' field with indexing, required attribute, and reference to 'product' collection
    product: {
      index: true,
      required: true,
      ref: "product",
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: productPopulation },
    },
    // Define the 'total_amount' field with indexing and required attribute
    total_amount: {
      index: true,
      type: Number,
      required: true,
    },
    // Define the 'discount' field with indexing and default value
    discount: {
      index: true,
      type: Number,
      default: 0,
    },
    // Define the 'quantity' field with indexing and required attribute
    quantity: {
      index: true,
      type: Number,
      required: true,
    },
    // Define the 'status' field with indexing and required attribute
    status: {
      index: true,
      type: String,
      required: true,
    },
    // Define the 'type' field with indexing and default value
    type: {
      index: true,
      type: String,
      default: "cart",
    },
    // Define the 'profit' field with indexing and required attribute
    profit: {
      index: true,
      type: Number,
      required: true,
    },
    // Define the 'stock_after' field with indexing and default value
    stock_after: {
      index: true,
      type: Number,
      default: null,
    },
    // Define the 'stock_before' field with indexing and default value
    stock_before: {
      index: true,
      type: Number,
      default: null,
    },
    // Define the 'use_customer_account' field with indexing and default value
    use_customer_account: {
      index: true,
      type: Boolean,
      default: false,
    },
    // Define the 'account' field with indexing, default value, and reference to 'account' collection
    account: {
      index: true,
      default: null,
      ref: "account",
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: accountSelection },
    },

    category: {
      index: true,
      default: null,
      ref: 'category',
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "name" }
    },

    reference: {
      index: true,
      type: String,
      default: null,
    },

    // Include common schema values
    ...commonSchemaValues,
  },
  { timestamps: true }
)

// Indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Add Mongoose autopopulate plugin
schema.plugin(require("mongoose-autopopulate"))

// Middleware for "create" event
schema.pre(schemaMiddlewareEvents.create, async function (next) {
  try {
    const sale: any = this

    if (sale.use_customer_account) {
      const account = await controllers.getSingleDocument({
        schema: "account",
        select: { balance: 1 },
        joinForeignKeys: false,
        condition: { type: "customer", customer: sale.customer },
      })

      if (account.success) {
        sale.account = account.message._id
        next()
      } else {
        return next(new Error("customer account does not exist"))
      }
    } else {
      next()
    }
  } catch (error) {
    return next(new Error((error as Error).message))
  }
})

// Middleware for "create" event
schema.post(schemaMiddlewareEvents.create, async function (sale: any) {
  try {
    if (sale) {
      // Creating activity
      createActivity({
        data: sale,
        module: "sale",
        type: "creation",
        branch: sale.branch._id,
        user: sale.created_by._id,
        description: activitySentence("create"),
      })

      // Adjusting stock
      if (
        (sale.type === "cart" || sale.type === "order") &&
        sale.status !== "invoice"
      ) {
        adjustStock({
          from: "sale_cart",
          data: sale,
          adjustment: sale.quantity,
          type: "decrease",
        })
      }

      // Creating debt
      if (sale.status === "credit") {
        const productId = sale.product._id
        const saleId = sale._id
        const customerId = sale.customer ? sale.customer._id : null
        const total_amount = sale.total_amount

        controllers.createSingleDocument({
          schema: "debt",
          documentData: {
            description: "Sale-Induced Debt",
            product: productId,
            sale: saleId,
            date: sale.createdAt,
            customer: customerId,
            total_amount,
            created_by: sale.created_by._id,
            branch: sale.branch._id,
            type: "debtor",
            status: "unpaid",
          },
        })
      }

      // Accounts and transactions
      if (sale.use_customer_account) {
        const customerAccountExist = await controllers.getSingleDocument({
          schema: "account",
          select: { balance: 1 },
          joinForeignKeys: false,
          condition: { type: "customer", customer: sale.customer?._id },
        })

        if (customerAccountExist.success) {
          const documentData = {
            impact: false,
            type: "withdraw",
            cause: "automatic",
            sale: sale._id,
            account_to_impact: null,
            account_type: "customer",
            branch: sale.branch?._id,
            customer: sale.customer._id,
            date: new Date().toISOString(),
            total_amount: sale.total_amount,
            created_by: sale.created_by?._id,
            account: customerAccountExist.message._id,
            description: "An automatic transaction was generated due to a sale made.",
          }

          controllers.createSingleDocument({
            documentData,
            schema: "transaction",
          })
        }
      } else if (sale.account) {
        const documentData = {
          impact: false,
          type: "deposit",
          cause: "automatic",
          sale: sale._id,
          branch: sale.branch?._id,
          date: new Date().toISOString(),
          account: sale.account._id,
          total_amount: sale.total_amount,
          account_type: sale.account.type,
          created_by: sale.created_by?._id,
          account_to_impact: sale.account._id,
          description: "An automatic transaction was generated due to a sale made.",
        }

        controllers.createSingleDocument({
          documentData,
          schema: "transaction",
        })
      }
    }
  } catch (error) {
    console.log(`Sale Schema Middleware (create) Error: ${(error as Error).message}`)
  }
})

// Middleware for "update" event
schema.post(schemaMiddlewareEvents.update, function (sale: any) {
  try {
    if (sale) {
      const saleId = sale._id
      if (!sale.visible) {
        // Creating activity
        createActivity({
          data: sale,
          module: "sale",
          type: "deletion",
          branch: sale.branch,
          user: sale.created_by,
          description: activitySentence(),
        })

        // Updating orders
        controllers.updateSingleDocument({
          schema: "order",
          newDocumentData: {
            $pullAll: { sales: [saleId] },
            $set: { updated_by: sale.updated_by },
          },
          condition: { branch: sale.branch._id, sales: saleId },
        })

        // Adjusting stock
        if (
          (sale.type === "cart" || sale.type === "order" || sale.type === "sale") &&
          sale.status !== "invoice"
        ) {
          adjustStock({
            data: sale,
            type: "increase",
            adjustment: sale.quantity,
            from: sale.type === "cart" || sale.type === "order" ? "sale_cart" : "sale",
          })
        }

        // Deleting sale
        if (sale.status === "credit") {
          controllers.deleteSingleDocument({
            schema: "debt",
            condition: { sale: saleId },
          })
        }

        // Deleting transaction
        if (sale.use_customer_account || sale.account) {
          const transactionData = {
            schema: "transaction",
            condition: { sale: sale._id },
            newDocumentData: {
              $set: {
                visible: false,
                updated_by: sale.updated_by._id,
              },
            },
          }
          controllers.updateSingleDocument(transactionData)
        }
      } else {
        // Creating activity
        createActivity({
          data: sale,
          module: "sale",
          type: "modification",
          branch: sale.branch._id,
          user: sale.created_by._id,
          description: activitySentence("modify"),
        })

        // Updating adjustment
        if (sale.type === "order" || sale.type === "sale") {
          controllers.updateManyDocument({
            schema: "adjustment",
            condition: { sale: sale._id },
            newDocumentData: {
              from: "sale",
              updated_by: sale.created_by._id,
            },
          })
        }
      }
    }
  } catch (error) {
    console.log(`Sale schema middleware error on update: ${(error as Error).message}`)
  }
})

// Middleware for "delete" event
schema.post(schemaMiddlewareEvents.delete, function (sale: any) {
  try {
    if (sale) {
      createActivity({
        data: sale,
        module: "sale",
        type: "deletion",
        branch: sale.branch,
        user: sale.created_by,
        description: activitySentence("delete"),
      })
    }
  } catch (error) {
    console.log(`Sale Schema Middleware (delete) Error: ${(error as Error).message}`)
  }
})

// Create the Mongoose model for "sale"
const saleModel = model<sale>("sale", schema)

// Export the "sale" model
export default saleModel