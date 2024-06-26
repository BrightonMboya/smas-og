// Import required dependencies and modules
import { controllers } from "bapig"
import { Schema, model } from "mongoose"
import { commonInterface } from "../interface"
import { commonSchemaValues } from "../database/schema"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Define the schema for expense type
const schema = new Schema<commonInterface>(
  {
    // Define the 'name' field with indexing and required attribute
    name: {
      index: true,
      type: String,
      required: true,
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

// Schema middleware for creation
schema.post(schemaMiddlewareEvents.create, function (expenseType: any) {
  try {
    if (expenseType) {
      // Create activity for the expense type creation
      createActivity({
        type: "creation",
        data: expenseType,
        module: "expense_type",
        branch: expenseType.branch._id,
        user: expenseType.created_by._id,
        description: activitySentence("create")
      })
    }
  } catch (error) {
    console.log(`Expense type schema middleware error on create: ${(error as Error).message}`)
  }
})

// Schema middleware for update
schema.post(schemaMiddlewareEvents.update, function (expenseType: any) {
  try {
    if (expenseType) {
      if (!expenseType.visible) {
        // Create activity for expense type deletion
        createActivity({
          type: "deletion",
          data: expenseType,
          module: "expense_type",
          branch: expenseType.branch._id,
          user: expenseType.updated_by._id,
          description: activitySentence()
        })

        // Filter, update, and options objects for updating related 'expense' documents
        const condition: object = { expense_type: expenseType._id }
        const newDocumentData: object = { $set: { visible: false } }

        controllers.updateManyDocument({
          schema: "expense",
          condition,
          newDocumentData
        })
      } else {
        // Create activity for expense type modification
        createActivity({
          data: expenseType,
          type: "modification",
          module: "expense_type",
          branch: expenseType.branch._id,
          user: expenseType.updated_by._id,
          description: activitySentence("modify")
        })
      }
    }
  } catch (error) {
    console.log(`Expense Type Schema Middleware (update) Error: ${(error as Error).message}`)
  }
})

// Schema middleware for delete
schema.post(schemaMiddlewareEvents.delete, function (expenseType: any) {
  try {

    if (expenseType) {
      // Create activity for expense type deletion
      createActivity({
        type: "deletion",
        data: expenseType,
        module: "expense_type",
        branch: expenseType.branch,
        user: expenseType.updated_by,
        description: activitySentence("delete")
      })
    }
  } catch (error) {
    console.log(`Expense Type Schema Middleware (delete) Error: ${(error as Error).message}`)
  }
})

// Create the Mongoose model for expense type
const expense_typeModel = model<commonInterface>('expense_type', schema)

// Export the expense type model
export default expense_typeModel
