// Import required dependencies and modules
import { commonInterface } from "../interface"
import { Schema, model } from "mongoose"
import { TPDDSchemaValues } from "../database/schema"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Define the schema for freight
const schema = new Schema<commonInterface>(
    {
        // Define the 'name' field with indexing and required attribute
        name: {
            index: true,
            type: String,
            required: true,
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
schema.post(schemaMiddlewareEvents.create, function (freight: any) {
    try {
        if (freight) {
            // Create activity for the freight creation
            createActivity({
                data: freight,
                module: "freight",
                type: "creation",
                branch: freight.branch._id,
                user: freight.created_by._id,
                description: activitySentence("create")
            })
        }
    } catch (error) {
        console.log(`Freight schema middleware error on create: ${(error as Error).message}`)
    }
})

// Schema middleware for update
schema.post(schemaMiddlewareEvents.update, function (freight: any) {
    try {
        if (freight) {
            if (!freight.visible) {
                // Create activity for the freight deletion
                createActivity({
                    data: freight,
                    module: "freight",
                    type: "deletion",
                    branch: freight.branch._id,
                    user: freight.updated_by._id,
                    description: activitySentence()
                })
            } else {
                // Create activity for the freight modification
                createActivity({
                    data: freight,
                    module: "freight",
                    type: "modification",
                    branch: freight.branch._id,
                    user: freight.updated_by._id,
                    description: activitySentence("modify")
                })
            }
        }
    } catch (error) {
        console.log(`Freight schema middleware error on update: ${(error as Error).message}`)
    }
})

// Schema middleware for delete
schema.post(schemaMiddlewareEvents.delete, function (freight: any) {
    try {
        if (freight) {
            // Create activity for the freight deletion
            createActivity({
                data: freight,
                module: "freight",
                type: "deletion",
                branch: freight.branch,
                user: freight.updated_by,
                description: activitySentence("delete")
            })
        }
    } catch (error) {
        console.log(`Freight schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for freight
const freightModel = model<commonInterface>('freight', schema)

// Export the freight model
export default freightModel