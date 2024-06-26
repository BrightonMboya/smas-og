// Import required dependencies and modules
import { controllers } from "bapig"
import { Schema, model } from "mongoose"
import { purchase } from "../interface"
import { commonSchemaValues } from "../database/schema"
import {
  accountSelection,
  productPopulation
} from "../database/population"
import {
  createActivity,
  schemaMiddlewareEvents,
  activitySentence,
  adjustStock
} from "../helpers"

// Define the schema for the purchase
const schema = new Schema<purchase>(
  {
    // Define the 'total_amount' field with indexing and required attribute
    total_amount: {
      index: true,
      type: Number,
      required: true
    },
    // Define the 'paid_amount' field with indexing and default value
    paid_amount: {
      index: true,
      type: Number,
      default: 0
    },
    // Define the 'product' field with indexing, required attribute, and autopopulate
    product: {
      index: true,
      required: true,
      ref: 'product',
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: productPopulation }
    },
    // Define the 'supplier' field with indexing, default value, ref, and autopopulate
    supplier: {
      index: true,
      default: null,
      ref: 'supplier',
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: { name: 1, phone_number: 1 } }
    },
    // Define the 'number' field with indexing and default value
    number: {
      index: true,
      type: String,
      default: null
    },
    // Define the 'quantity' field with indexing and required attribute
    quantity: {
      index: true,
      type: Number,
      required: true
    },
    // Define the 'buying_price' field with default value and indexing
    buying_price: {
      type: Number,
      default: 0,
      index: true
    },
    // Define the 'selling_price' field with default value and indexing
    selling_price: {
      type: Number,
      default: 0,
      index: true
    },
    // Define the 'reorder_stock_level' field with default value and indexing
    reorder_stock_level: {
      type: Number,
      default: 0,
      index: true
    },
    // Define the 'date' field with indexing and required attribute
    date: {
      index: true,
      type: Date,
      required: true
    },
    // Define the 'stock_after' field with indexing and default value
    stock_after: {
      index: true,
      type: Number,
      default: null
    },
    // Define the 'stock_before' field with indexing and default value
    stock_before: {
      index: true,
      type: Number,
      default: null
    },
    // Define the 'use_supplier_account' field with indexing and default value
    use_supplier_account: {
      index: true,
      type: Boolean,
      default: false
    },
    // Define the 'account' field with indexing, default value, ref, and autopopulate
    account: {
      index: true,
      default: null,
      ref: 'account',
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: accountSelection }
    },
    // Define the 'fee' field with default value and indexing
    fee: {
      index: true,
      type: Number,
      default: 0
    },
    // Define the 'for_store_product' field with indexing and default value
    for_store_product: {
      index: true,
      type: Boolean,
      default: false
    },
    // Define the 'store' field with indexing and ref
    store: {
      index: true,
      ref: 'store',
      default: null,
      type: Schema.Types.ObjectId
    },
    // Define the 'editable' field with indexing and default value
    editable: {
      index: true,
      type: Boolean,
      default: true
    },
    // Define the 'reference' field with indexing and default value
    reference: {
      index: true,
      type: String,
      default: null
    },

    category: {
      index: true,
      default: null,
      ref: 'category',
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "name" }
    },
    
    // Include common schema values
    ...commonSchemaValues
  },
  { timestamps: true }
)

// Indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Add Mongoose autopopulate plugin
schema.plugin(require('mongoose-autopopulate'))

// Middleware before creating
schema.pre(schemaMiddlewareEvents.create, async function (next) {
  try {
    const purchase: any = this

    if (purchase.use_supplier_account) {
      const account = await controllers.getSingleDocument({
        schema: "account",
        select: { balance: 1 },
        joinForeignKeys: false,
        condition: { type: "supplier", supplier: purchase.supplier }
      })

      if (account.success) {
        purchase.account = account.message._id
        next()
      } else {
        return next(new Error("supplier account does not exist"))
      }
    } else {
      next()
    }
  } catch (error) {
    return next(new Error((error as Error).message))
  }
})

// Middleware for create
schema.post(schemaMiddlewareEvents.create, async function (purchase: any) {
  try {
    if (purchase) {
      // Create activity for purchase creation
      createActivity({
        data: purchase,
        type: "creation",
        module: "purchase",
        branch: purchase.branch._id,
        user: purchase.created_by._id,
        description: activitySentence("create")
      })

      // Adjust product stock if needed
      if (
        purchase.buying_price !== 0 ||
        purchase.selling_price !== 0
      ) {
        adjustStock({
          data: purchase,
          type: "increase",
          from: "purchase",
          adjustment: purchase.quantity
        })

        const product = purchase.product
        const updateProduct =
          product.buying_price !== purchase.buying_price ||
          product.selling_price !== purchase.selling_price ||
          product.reorder_stock_level !== purchase.reorder_stock_level

        if (updateProduct) {
          controllers.updateSingleDocument({
            schema: "product",
            condition: { _id: product._id },
            newDocumentData: {
              $set: {
                buying_price: purchase.buying_price,
                selling_price: purchase.selling_price,
                reorder_stock_level: purchase.reorder_stock_level
              }
            }
          })
        }
      }

      // Create transaction for supplier account or custom account
      if (purchase.use_supplier_account) {
        const supplierAccountExist = await controllers.getSingleDocument({
          schema: "account",
          select: { balance: 1 },
          joinForeignKeys: false,
          condition: { type: "supplier", supplier: purchase.supplier?._id }
        })

        if (supplierAccountExist.success) {
          const documentData = {
            impact: false,
            type: "withdraw",
            fee: purchase.fee,
            cause: "automatic",
            purchase: purchase._id,
            account_to_impact: null,
            account_type: "supplier",
            branch: purchase.branch?._id,
            date: new Date().toISOString(),
            supplier: purchase.supplier._id,
            total_amount: purchase.paid_amount,
            created_by: purchase.created_by?._id,
            account: supplierAccountExist.message._id,
            reference: purchase.number ? purchase.number.toUpperCase() : null,
            description:
              "An automatic transaction was generated due to a purchase made."
          }

          controllers.createSingleDocument({
            documentData,
            schema: "transaction"
          })
        }
      } else if (purchase.account) {
        const documentData = {
          impact: false,
          type: "withdraw",
          fee: purchase.fee,
          cause: "automatic",
          purchase: purchase._id,
          branch: purchase.branch?._id,
          date: new Date().toISOString(),
          reference: purchase.reference,
          account: purchase.account._id,
          total_amount: purchase.paid_amount,
          account_type: purchase.account.type,
          created_by: purchase.created_by?._id,
          account_to_impact: purchase.account._id,
          description:
            "An automatic transaction was generated due to a purchase made."
        }

        controllers.createSingleDocument({
          documentData,
          schema: "transaction"
        })
      }

      // Create new debt if necessary
      if (purchase.total_amount > purchase.paid_amount) {
        controllers.createSingleDocument({
          schema: "debt",
          documentData: {
            type: "creditor",
            status: "unpaid",
            date: purchase.date,
            purchase: purchase._id,
            branch: purchase.branch._id,
            product: purchase.product._id,
            created_by: purchase.created_by._id,
            description: "Purchase Induced Debt",
            total_amount: purchase.total_amount - purchase.paid_amount,
            supplier: purchase.supplier ? purchase.supplier._id : null
          }
        })
      }
    }
  } catch (error) {
    console.log("Purchase Schema Middleware (create) Error: ", (error as Error).message)
  }
})

// Middleware for update
schema.post(schemaMiddlewareEvents.update, function (purchase: any) {
  try {
    if (purchase) {
      if (!purchase.visible) {
        // Create activity for purchase deletion
        createActivity({
          data: purchase,
          type: "deletion",
          module: "purchase",
          branch: purchase.branch._id,
          user: purchase.updated_by._id,
          description: activitySentence()
        })

        // Adjust product stock for deletion
        adjustStock({
          from: "purchase",
          data: purchase,
          adjustment: purchase.quantity,
          type: "decrease"
        })

        // Delete related transactions and debt
        if (purchase.use_supplier_account || purchase.account) {
          const transactionData = {
            schema: "transaction",
            condition: { purchase: purchase._id },
            newDocumentData: {
              $set: {
                visible: false,
                updated_by: purchase.updated_by._id
              }
            }
          }

          controllers.updateSingleDocument(transactionData)
        }

        controllers.deleteSingleDocument({
          schema: "debt",
          condition: { purchase: purchase._id }
        })
      } else {
        // Create activity for purchase modification
        createActivity({
          data: purchase,
          type: "modification",
          module: "purchase",
          branch: purchase.branch._id,
          user: purchase.updated_by._id,
          description: activitySentence("modify")
        })
      }
    }
  } catch (error) {
    console.log("Purchase Schema Middleware (update) Error: ", (error as Error).message)
  }
})

// Middleware for delete
schema.post(schemaMiddlewareEvents.delete, function (purchase: any) {
  try {
    if (purchase) {
      // Create activity for purchase deletion
      createActivity({
        data: purchase,
        type: "deletion",
        module: "purchase",
        branch: purchase.branch,
        user: purchase.updated_by,
        description: activitySentence("delete")
      })
    }
  } catch (error) {
    console.log("Purchase Schema Middleware (delete) Error: ", (error as Error).message)
  }
})

// Create the Mongoose model for purchase
const purchaseModel = model<purchase>('purchase', schema)

// Export the purchase model
export default purchaseModel