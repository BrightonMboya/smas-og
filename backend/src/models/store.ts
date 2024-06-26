// Import necessary dependencies and modules
import { controllers } from "bapig"
import { Schema, model } from "mongoose"
import { commonInterface } from "../interface"
import { commonSchemaValues } from "../database/schema"
import {
    schemaMiddlewareEvents,
    activitySentence,
    createActivity,
} from "../helpers"
import { userPopulation } from "../database/population"

// Define the schema for the "store" collection
const schema = new Schema<commonInterface>(
    {
        // Define the 'user' field with indexing, reference to 'user' collection, and required attribute
        user: {
            index: true,
            ref: 'user',
            required: true,
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: userPopulation },
        },
        // Define the 'name' field with indexing and required attribute
        name: {
            index: true,
            type: String,
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
schema.plugin(require('mongoose-autopopulate'))

// Middleware for "create" event
schema.post(schemaMiddlewareEvents.create, function (store: any) {
    try {
        if (store) {
            createActivity({
                data: store,
                module: "store",
                type: "creation",
                branch: store.branch._id,
                user: store.created_by._id,
                description: activitySentence("create"),
            })
        }
    } catch (error) {
        console.log(`Store schema middleware error on create: ${(error as Error).message}`)
    }
})

// Middleware for "update" event
schema.post(schemaMiddlewareEvents.update, function (store: any) {
    try {
        if (store) {
            if (!store.visible) {
                createActivity({
                    data: store,
                    module: "store",
                    type: "deletion",
                    branch: store.branch._id,
                    user: store.updated_by._id,
                    description: activitySentence(),
                })

                controllers.updateManyDocument({
                    schema: "store_product",
                    condition: { store: store._id },
                    newDocumentData: {
                        $set: { visible: false },
                    },
                })
            } else {
                createActivity({
                    data: store,
                    module: "store",
                    type: "modification",
                    branch: store.branch._id,
                    user: store.updated_by._id,
                    description: activitySentence("modify"),
                })
            }
        }
    } catch (error) {
        console.log(`Store schema middleware error on update: ${(error as Error).message}`)
    }
})

// Middleware for "delete" event
schema.post(schemaMiddlewareEvents.delete, function (store: any) {
    try {
        if (store) {
            createActivity({
                data: store,
                module: "store",
                type: "deletion",
                branch: store.branch._id,
                user: store.updated_by._id,
                description: activitySentence("delete"),
            })

            controllers.deleteManyDocument({
                schema: "store_product",
                condition: { store: store._id },
            })
        }
    } catch (error) {
        console.log(`Store schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for "store"
const storeModel = model<commonInterface>('store', schema)

// Export the "store" model
export default storeModel