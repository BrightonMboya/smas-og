// Import necessary dependencies
import { controllers } from "bapig"
import { Schema, model } from "mongoose"
import { customer } from "../interface"
import { commonSchemaValues } from "../database/schema"
import { branchPopulation, userPopulation } from "../database/population"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Define the schema for the "customer" collection
const schema = new Schema<customer>(
  {
    // Customer name
    name: {
      index: true,
      type: String,
      required: true,
    },
    // Customer phone number
    phone_number: {
      index: true,
      type: String,
      default: null
    },
    // Customer address
    address: {
      index: true,
      type: Object,
      default: null,
    },
    // Customer Tax Identification Number
    tin: {
      index: true,
      type: String,
      default: null,
    },
    // Whether the customer is global
    isGlobal: {
      index: true,
      type: Boolean,
      default: false,
    },
    // Include common schema values
    ...commonSchemaValues,
    // Reference to the user who created the customer
    created_by: {
      index: true,
      ref: "user",
      default: null,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: userPopulation },
    },
    // Reference to the branch associated with the customer
    branch: {
      index: true,
      ref: "branch",
      default: null,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: branchPopulation },
    },
    // Customer email
    email: {
      index: true,
      type: String,
      default: null,
    },
    // Customer identification (e.g., passport, ID)
    identification: {
      index: true,
      type: String,
      default: null,
    },
  },
  { timestamps: true } // Enable automatic timestamp fields
)

// Create indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Use the mongoose-autopopulate plugin to automatically populate references
schema.plugin(require("mongoose-autopopulate"))

// Schema middleware for post-create event
schema.post(schemaMiddlewareEvents.create, function (customer: any) {
  try {
    if (customer) {
      // Create an activity record for customer creation
      createActivity({
        data: customer,
        user: customer.created_by._id,
        module: "customer",
        type: "creation",
        description: activitySentence("create"),
        branch: customer.branch._id,
      })
    }
  } catch (error) {
    console.log(`Customer schema middleware error on create: ${(error as Error).message}`)
  }
})

// Schema middleware for post-update event
schema.post(schemaMiddlewareEvents.update, function (customer: any) {
  try {
    if (customer) {
      // Handle updates and deletions of the customer
      if (!customer.visible) {
        // Create an activity record for customer deletion
        createActivity({
          user: customer.updated_by._id,
          data: customer,
          module: "customer",
          type: "deletion",
          description: activitySentence(),
          branch: customer.branch._id,
        })

        // Perform bulk updates on related documents
        const condition = { customer: customer._id }
        const newDocumentData = { $set: { visible: customer.visible } }
        controllers.bulkUpdateManyDocument([
          { schema: "debt", condition, newDocumentData },
          { schema: "sale", condition, newDocumentData },
          { schema: "device", condition, newDocumentData },
          { schema: "account", condition, newDocumentData },
          { schema: "service", condition, newDocumentData },
          { schema: "truck_order", condition, newDocumentData },
          { schema: "quotation", condition, newDocumentData },
          { schema: "debt_history", condition, newDocumentData },
          { schema: "quotation_invoice", condition, newDocumentData },
        ])
      } else {
        // Create an activity record for customer modification
        createActivity({
          user: customer.updated_by._id,
          data: customer,
          module: "customer",
          type: "modification",
          description: activitySentence("modify"),
          branch: customer.branch._id,
        })
      }
    }
  } catch (error) {
    console.log(`Customer schema middleware (update) Error: ${(error as Error).message}`)
  }
})

// Schema middleware for post-delete event
schema.post(schemaMiddlewareEvents.delete, function (customer: any) {
  try {
    // Handle customer deletion
    createActivity({
      user: customer.updated_by,
      data: customer,
      module: "customer",
      type: "deletion",
      description: activitySentence("delete"),
      branch: customer.branch,
    })

    // Perform bulk deletes on related documents
    const condition = { customer: customer._id }
    controllers.documentBulkDeleteMany([
      { schema: "debt", condition },
      { schema: "sale", condition },
      { schema: "device", condition },
      { schema: "account", condition },
      { schema: "service", condition },
      { schema: "truck_order", condition },
      { schema: "quotation", condition },
      { schema: "debt_history", condition },
      { schema: "quotation_invoice", condition },
    ])
  } catch (error) {
    console.log(`Customer schema middleware (delete) Error: ${(error as Error).message}`)
  }
})

// Create the Mongoose model for the "customer" collection
const customerModel = model<customer>("customer", schema)

// Export the Mongoose model
export default customerModel