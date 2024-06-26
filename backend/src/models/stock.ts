// Import necessary dependencies and modules
import { Schema, model } from "mongoose"
import { commonInterface } from "../interface"
import { commonSchemaValues } from "../database/schema"
import {
    activitySentence,
    createActivity,
    schemaMiddlewareEvents,
} from "../helpers"

// Define the schema for the "stock" collection
const schema = new Schema<commonInterface>(
    {
        // Define the 'product' field with indexing, reference to 'product' collection, and required attribute
        product: {
            index: true,
            ref: "product",
            required: true,
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: { name: 1 } },
        },
        // Define the 'is_store_product' field with indexing and default value
        is_store_product: {
            index: true,
            type: Boolean,
            default: false,
        },
        // Define the 'store' field with indexing, reference to 'store' collection, and required attribute
        store: {
            index: true,
            ref: "store",
            required: true,
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: "name" },
        },
        // Define the 'stock' field with indexing and required attribute
        stock: {
            index: true,
            type: Number,
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
schema.post(schemaMiddlewareEvents.create, function (stock: any) {
    try {
        if (stock) {
            createActivity({
                data: stock,
                type: "creation",
                module: "stock",
                branch: stock.branch._id,
                user: stock.created_by._id,
                description: activitySentence("create"),
            })
        }
    } catch (error) {
        console.log(`stock schema middleware error on create: ${(error as Error).message}`)
    }
})

// Middleware for "update" event
schema.post(schemaMiddlewareEvents.update, function (stock: any) {
    try {
        if (stock) {
            if (!stock.visible) {
                createActivity({
                    data: stock,
                    type: "deletion",
                    module: "stock",
                    branch: stock.branch._id,
                    user: stock.updated_by._id,
                    description: activitySentence(),
                })
            } else {
                createActivity({
                    data: stock,
                    type: "modification",
                    module: "stock",
                    branch: stock.branch._id,
                    user: stock.updated_by._id,
                    description: activitySentence("modify"),
                })
            }
        }
    } catch (error) {
        console.log(`stock schema middleware error on update: ${(error as Error).message}`)
    }
})

// Middleware for "delete" event
schema.post(schemaMiddlewareEvents.delete, function (stock: any) {
    try {
        if (stock) {
            createActivity({
                data: stock,
                type: "deletion",
                module: "stock",
                branch: stock.branch,
                user: stock.created_by,
                description: activitySentence("delete"),
            })
        }
    } catch (error) {
        console.log(`stock schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for "stock"
const stockModel = model<commonInterface>("stock", schema)

// Export the "stock" model
export default stockModel