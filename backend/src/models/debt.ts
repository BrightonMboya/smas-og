// Import necessary dependencies and modules
import { controllers } from "bapig"
import { debt } from "../interface"
import { Schema, model } from "mongoose"
import { TPDDSchemaValues } from "../database/schema"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Define the schema for the 'debt' model
const schema = new Schema<debt>(
  {
    // Define the 'customer' field with autopopulation
    customer: {
      index: true,
      default: null,
      ref: 'customer',
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "name" },
    },

    // Define the 'purchase' field
    purchase: {
      index: true,
      default: null,
      ref: 'purchase',
      type: Schema.Types.ObjectId,
    },

    // Define the 'truck_order' field
    truck_order: {
      index: true,
      default: null,
      ref: "truck_order",
      type: Schema.Types.ObjectId,
    },

    // Define the 'expense' field with autopopulation
    expense: {
      index: true,
      default: null,
      ref: "expense",
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "name" },
    },

    // Define the 'quotation_invoice' field
    quotation_invoice: {
      index: true,
      default: null,
      ref: 'quotation_invoice',
      type: Schema.Types.ObjectId,
    },

    // Define the 'supplier' field with autopopulation
    supplier: {
      index: true,
      default: null,
      ref: 'supplier',
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: { name: 1 } },
    },

    // Define the 'product' field
    product: {
      index: true,
      default: null,
      ref: 'product',
      type: Schema.Types.ObjectId,
    },

    // Define the 'sale' field
    sale: {
      index: true,
      ref: 'sale',
      default: null,
      type: Schema.Types.ObjectId,
    },

    // Define the 'status' field
    status: {
      index: true,
      type: String,
      required: true,
    },

    // Define the 'type' field
    type: {
      index: true,
      type: String,
      required: true,
    },

    // Include TPDD schema values
    ...TPDDSchemaValues
  },
  { timestamps: true }
)

// Index timestamps for efficient querying
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Use the mongoose-autopopulate plugin for automatic population of references
schema.plugin(require('mongoose-autopopulate'))

// Middleware for the 'create' event
schema.post(schemaMiddlewareEvents.create, function (debt: any) {
  try {
    if (debt) {
      // Create an activity log for debt creation
      createActivity({
        data: debt,
        user: debt.created_by._id,
        module: "debt",
        type: "creation",
        description: activitySentence("create"),
        branch: debt.branch._id
      })
    }
  } catch (error) {
    console.log(`Debt middleware error on create: ${(error as Error).message}`)
  }
})

// Middleware for the 'update' event
schema.post(schemaMiddlewareEvents.update, function (debt: any) {
  try {
    if (debt) {
      if (!debt.visible) {
        // Create an activity log for debt deletion
        createActivity({
          data: debt,
          user: debt.created_by._id,
          module: "debt",
          type: "deletion",
          description: activitySentence(),
          branch: debt.branch._id
        })

        // Update related documents using the 'controllers.updateManyDocument' method
        const condition: object = { debt: debt._id }
        const newDocumentData: object = { $set: { visible: false } }
        controllers.updateManyDocument({
          condition,
          schema: "debt_history",
          newDocumentData
        })
      } else {
        // Create an activity log for debt modification
        createActivity({
          data: debt,
          user: debt.created_by._id,
          module: "debt",
          type: "modification",
          description: activitySentence("modify"),
          branch: debt.branch._id
        })
      }
    }
  } catch (error) {
    console.log(`Debt Schema Middleware (update) Error: ${(error as Error).message}`)
  }
})

// Middleware for the 'delete' event
schema.post(schemaMiddlewareEvents.delete, function (debt: any) {
  try {
    if (debt) {
      // Create an activity log for debt deletion
      createActivity({
        data: debt,
        user: debt.created_by._id,
        module: "debt",
        type: "deletion",
        description: activitySentence("delete"),
        branch: debt.branch
      })

      // Delete related documents using the 'controllers.deleteManyDocument' method
      const condition: object = { debt: debt._id }
      controllers.deleteManyDocument({
        condition,
        schema: "debt_history"
      })
    }
  } catch (error) {
    console.log(`Debt Schema Middleware (delete) Error: ${(error as Error).message}`)
  }
})

// Create the 'debt' model
const debtModel = model<debt>('debt', schema)

// Export the 'debt' model
export default debtModel