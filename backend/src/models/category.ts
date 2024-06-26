// Import dependencies
import { controllers } from "bapig"
import { Schema, model } from "mongoose"
import { commonInterface } from "../interface"
import { commonSchemaValues } from "../database/schema"
import mongooseAutoPopulate from "mongoose-autopopulate"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Create a category schema
const categorySchema = new Schema<commonInterface>(
    {
        name: {
            index: true,
            type: String,
            required: true
        },
        ...commonSchemaValues
    },
    { timestamps: true }
)

// Indexes for timestamps
categorySchema.index({ createdAt: -1 }, { background: true })
categorySchema.index({ updatedAt: -1 }, { background: true })

// Add mongoose-autopopulate plugin to the schema
categorySchema.plugin(mongooseAutoPopulate)

// Middleware for category creation
categorySchema.post(schemaMiddlewareEvents.create, function (category: any) {
    try {
        if (category) {
            // Create an activity for category creation
            createActivity({
                type: "creation",
                data: category,
                module: "category",
                branch: category.branch._id,
                user: category.created_by._id,
                description: activitySentence("create")
            })
        }
    } catch (error) {
        console.error(`Category type schema middleware error on create: ${(error as Error).message}`)
    }
})

// Middleware for category update
categorySchema.post(schemaMiddlewareEvents.update, function (category: any) {
    try {
        if (category) {
            if (!category.visible) {
                // Create an activity for category deletion
                createActivity({
                    type: "deletion",
                    data: category,
                    module: "category",
                    branch: category.branch._id,
                    user: category.updated_by._id,
                    description: activitySentence()
                })

                // Filter, update, and options objects for updating related 'category' documents
                const condition: object = { category: category._id }
                const newDocumentData: object = { $set: { visible: false } }

                // Use controllers to bulk update related documents
                controllers.bulkUpdateManyDocument([
                    { schema: "sale", newDocumentData, condition },
                    { schema: "product", newDocumentData, condition },
                ])
                
            } else {
                // Create an activity for category modification
                createActivity({
                    data: category,
                    type: "modification",
                    module: "category",
                    branch: category.branch._id,
                    user: category.updated_by._id,
                    description: activitySentence("modify")
                })
            }
        }
    } catch (error) {
        console.error(`Category Type Schema Middleware (update) Error: ${(error as Error).message}`)
    }
})

// Middleware for category deletion
categorySchema.post(schemaMiddlewareEvents.delete, function (category: any) {
    try {
        if (category) {
            // Create an activity for category deletion
            createActivity({
                type: "deletion",
                data: category,
                module: "category",
                branch: category.branch,
                user: category.updated_by,
                description: activitySentence("delete")
            })
        }
    } catch (error) {
        console.error(`Category Type Schema Middleware (delete) Error: ${(error as Error).message}`)
    }
})

// Create the category model
const categoryModel = model<commonInterface>("category", categorySchema)

export default categoryModel