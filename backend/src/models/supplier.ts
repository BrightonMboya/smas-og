// Import necessary dependencies and modules
import { Schema, model } from "mongoose"
import { commonInterface } from "../interface"
import { commonSchemaValues } from "../database/schema"
import {
  schemaMiddlewareEvents,
  activitySentence,
  createActivity,
} from "../helpers"

// Define the schema for the "supplier" collection
const schema = new Schema<commonInterface>(
  {
    // Define the 'name' field with indexing and required attribute
    name: {
      index: true,
      type: String,
      required: true,
    },
    // Define the 'phone_number' field with indexing and required attribute
    phone_number: {
      index: true,
      type: String,
      required: true,
    },
    // Define the 'address' field with indexing and required attribute
    address: {
      index: true,
      type: Object,
      required: true,
    },
    // Include common schema values
    ...commonSchemaValues,
  },
  { timestamps: true }
)

// Indexes for timestamps
schema.index({ createdAt: 1 }, { background: true })
schema.index({ updatedAt: 1 }, { background: true })

// Add Mongoose autopopulate plugin
schema.plugin(require("mongoose-autopopulate"))

// Middleware for "create" event
schema.post(schemaMiddlewareEvents.create, function (supplier: any) {
  try {
    createActivity({
      data: supplier,
      type: "creation",
      module: "supplier",
      branch: supplier.branch._id,
      user: supplier.created_by._id,
      description: activitySentence("create"),
    })
  } catch (error) {
    console.log(`Supplier schema middleware error on create: ${(error as Error).message}`)
  }
})

// Middleware for "update" event
schema.post(schemaMiddlewareEvents.update, function (supplier: any) {
  try {
    if (supplier) {
        if (!supplier.visible) {
            createActivity({
              data: supplier,
              type: "deletion",
              module: "supplier",
              branch: supplier.branch._id,
              user: supplier.updated_by._id,
              description: activitySentence(),
            })
          } else {
            createActivity({
              data: supplier,
              type: "modification",
              module: "supplier",
              branch: supplier.branch._id,
              user: supplier.updated_by._id,
              description: activitySentence("modify"),
            })
          }
    }
  } catch (error) {
    console.log(`Supplier schema middleware error on update: ${(error as Error).message}`)
  }
})

// Middleware for "delete" event
schema.post(schemaMiddlewareEvents.delete, function (supplier: any) {
  try {
    if (supplier) {
        createActivity({
            data: supplier,
            type: "deletion",
            module: "supplier",
            branch: supplier.branch,
            user: supplier.created_by,
            description: activitySentence("delete"),
          })
    }
  } catch (error) {
    console.log(`Supplier schema middleware error on delete: ${(error as Error).message}`)
  }
})

// Create the Mongoose model for "supplier"
const supplierModel = model<commonInterface>("supplier", schema)

// Export the "supplier" model
export default supplierModel