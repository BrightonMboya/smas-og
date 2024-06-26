// Import necessary dependencies
import { Schema, model } from "mongoose"
import { commonInterface } from "../interface"
import { commonSchemaValues } from "../database/schema"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Define the schema for the "customer_count" collection
const schema = new Schema<commonInterface>(
    {
        // Customer count number
        number: {
            index: true,
            type: Number,
            required: true,
        },
        // Include common schema values
        ...commonSchemaValues,
    },
    { timestamps: true } // Enable automatic timestamp fields
)

// Create indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Use the mongoose-autopopulate plugin to automatically populate references
schema.plugin(require("mongoose-autopopulate"))

// Schema middleware for post-create event
schema.post(schemaMiddlewareEvents.create, function (customer_count: any) {
    try {
        if (customer_count) {
            // Create an activity record for customer count creation
            createActivity({
                data: customer_count,
                type: "creation",
                module: "customer_count",
                branch: customer_count.branch._id,
                user: customer_count.created_by._id,
                description: activitySentence("create"),
            })
        }
    } catch (error) {
        console.log(`customer_count schema middleware error on create: ${(error as Error).message}`)
    }
})

// Schema middleware for post-update event
schema.post(schemaMiddlewareEvents.update, function (customer_count: any) {
    try {
        if (customer_count) {
            // Handle updates and deletions of the customer count
            if (!customer_count.visible) {
                // Create an activity record for customer count deletion
                createActivity({
                    data: customer_count,
                    type: "deletion",
                    module: "customer_count",
                    branch: customer_count.branch._id,
                    user: customer_count.updated_by._id,
                    description: activitySentence(),
                })
            } else {
                // Create an activity record for customer count modification
                createActivity({
                    data: customer_count,
                    type: "modification",
                    module: "customer_count",
                    branch: customer_count.branch._id,
                    user: customer_count.updated_by._id,
                    description: activitySentence("modify"),
                })
            }
        }
    } catch (error) {
        console.log(`customer_count schema middleware error on update: ${(error as Error).message}`)
    }
})

// Schema middleware for post-delete event
schema.post(schemaMiddlewareEvents.delete, function (customer_count: any) {
    try {
        if (customer_count) {
            // Handle customer count deletion
            createActivity({
                data: customer_count,
                type: "deletion",
                module: "customer_count",
                branch: customer_count.branch,
                user: customer_count.created_by,
                description: activitySentence("delete"),
            })
        }
    } catch (error) {
        console.log(`customer_count schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for the "customer_count" collection
const customer_countModel = model<commonInterface>("customer_count", schema)

// Export the Mongoose model
export default customer_countModel
