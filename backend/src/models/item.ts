// Import required dependencies and modules
import { item } from "../interface"
import { Schema, model } from "mongoose"
import mongooseAutoPopulate from "mongoose-autopopulate"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"
import { commonSchemaValues } from "../database/schema"
import { controllers } from "bapig"

// Define the schema for item
const schema = new Schema<item>(
    {
        // Define the 'name' field with indexing and required attribute
        name: {
            index: true,
            type: String,
            required: true
        },

        attraction: {
            index: true,
            required: true,
            ref: "attraction",
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: { name: 1 } }
        },

        prices: {
            index: true,
            type: Object,
            required: true,
        },

        ...commonSchemaValues
    },
    { timestamps: true }
)

// Indexes for timestamps
schema.index({ createdAt: 1 }, { background: true })
schema.index({ updatedAt: 1 }, { background: true })

// Add Mongoose autopopulate plugin
schema.plugin(mongooseAutoPopulate)

// Schema middleware for creation
schema.post(schemaMiddlewareEvents.create, function (item: any) {
    try {
        if (item) {
            // Create activity for the item creation
            createActivity({
                data: item,
                type: "creation",
                module: "item",
                branch: item.branch._id,
                user: item.created_by._id,
                description: activitySentence("create")
            })
        }
    } catch (error) {
        console.log(`Item schema middleware error on create: ${(error as Error).message}`)
    }
})

// Schema middleware for update
schema.post(schemaMiddlewareEvents.update, function (item: any) {
    try {
        if (item) {
            if (!item.visible) {
                // Create activity for the item deletion
                createActivity({
                    data: item,
                    type: "deletion",
                    module: "item",
                    branch: item.branch._id,
                    user: item.updated_by._id,
                    description: activitySentence()
                })
                // Update related attraction_activity documents
                controllers.updateManyDocument({
                    schema: "attraction_activity",
                    condition: { visible: true },
                    newDocumentData: {
                        $pullAll: { items: [item._id] }
                    }
                })
            } else {
                // Create activity for the item modification
                createActivity({
                    data: item,
                    type: "modification",
                    module: "item",
                    branch: item.branch._id,
                    user: item.updated_by._id,
                    description: activitySentence("modify")
                })
            }
        }
    } catch (error) {
        console.log(`Item schema middleware error on update: ${(error as Error).message}`)
    }
})

// Schema middleware for delete
schema.post(schemaMiddlewareEvents.delete, function (item: any) {
    try {
        if (item) {
            // Create activity for the item deletion
            createActivity({
                data: item,
                type: "deletion",
                module: "item",
                branch: item.branch,
                user: item.created_by,
                description: activitySentence("delete")
            })
        }
    } catch (error) {
        console.log(`Item schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for item
const itemModel = model<item>("item", schema)

// Export the item model
export default itemModel
