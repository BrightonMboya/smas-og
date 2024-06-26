// Import necessary dependencies and modules
import { controllers } from "bapig"
import { truck } from "../interface"
import { Schema, model } from "mongoose"
import { commonSchemaValues } from "../database/schema"
import {
    activitySentence,
    createActivity,
    schemaMiddlewareEvents,
} from "../helpers"

// Define the schema for the "truck" collection
const schema = new Schema<truck>(
    {
        // Define the 'name' field with indexing and required attribute
        name: {
            index: true,
            type: String,
            required: true,
        },
        // Define the 'status' field with required attribute
        status: {
            type: String,
            index: true,
            required: true,
        },
        // Define the 'description' field with required attribute
        description: {
            type: String,
            index: true,
            required: true,
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
schema.post(schemaMiddlewareEvents.create, function (truck: any) {
    try {
        if (truck) {
            // Create activity entry for creation
            createActivity({
                data: truck,
                type: "creation",
                module: "truck",
                branch: truck.branch._id,
                user: truck.created_by._id,
                description: activitySentence("create"),
            })
        }
    } catch (error) {
        console.log(`truck schema middleware error on create: ${(error as Error).message}`)
    }
})

// Middleware for "update" event
schema.post(schemaMiddlewareEvents.update, function (truck: any) {
    try {
        if (truck) {
            if (!truck.visible) {
                // Create activity entry for deletion
                createActivity({
                    data: truck,
                    type: "deletion",
                    module: "truck",
                    branch: truck.branch._id,
                    user: truck.updated_by._id,
                    description: activitySentence(),
                })

                // Update related truck orders to be invisible
                controllers.updateManyDocument({
                    schema: "truck_order",
                    condition: { truck: truck._id },
                    newDocumentData: {
                        $set: {
                            updated_by: truck.updated_by._id,
                            visible: false,
                        },
                    },
                })
            } else {
                // Create activity entry for modification
                createActivity({
                    data: truck,
                    type: "modification",
                    module: "truck",
                    branch: truck.branch._id,
                    user: truck.updated_by._id,
                    description: activitySentence("modify"),
                })
            }
        }
    } catch (error) {
        console.log(`truck schema middleware error on update: ${(error as Error).message}`)
    }
})

// Middleware for "delete" event
schema.post(schemaMiddlewareEvents.delete, function (truck: any) {
    try {
        if (truck) {
            // Create activity entry for deletion
            createActivity({
                data: truck,
                type: "deletion",
                module: "truck",
                branch: truck.branch,
                user: truck.created_by,
                description: activitySentence("delete"),
            })

            // Delete related truck orders
            controllers.deleteManyDocument({
                schema: "truck_order",
                condition: { truck: truck._id },
            })
        }
    } catch (error) {
        console.log(`truck schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for "truck"
const truckModel = model<truck>("truck", schema)

// Export the "truck" model for global accessibility
export default truckModel