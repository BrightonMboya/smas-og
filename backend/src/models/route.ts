// Import required dependencies and modules
import { route } from "../interface"
import { Schema, model } from "mongoose"
import { commonSchemaValues } from "../database/schema"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Define the schema for the "route" collection
const schema = new Schema<route>(
    {
        // Define the 'from' field with indexing and required attribute
        from: {
            index: true,
            type: String,
            required: true
        },
        // Define the 'to' field with indexing and required attribute
        to: {
            index: true,
            type: String,
            required: true
        },
        // Define the 'cost' field with indexing and required attribute
        cost: {
            index: true,
            type: Number,
            required: true
        },
        // Define the 'distance' field with indexing and required attribute
        distance: {
            index: true,
            type: Number,
            required: true
        },
        // Define the 'description' field with indexing and required attribute
        description: {
            index: true,
            type: String,
            required: true
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
schema.plugin(require("mongoose-autopopulate"))

// Middleware for "create" event
schema.post(schemaMiddlewareEvents.create, function (route: any) {
    try {
        if (route) {
            createActivity({
                data: route,
                type: "creation",
                module: "route",
                branch: route.branch._id,
                user: route.created_by._id,
                description: activitySentence("create")
            })
        }
    } catch (error) {
        console.log(`route schema middleware error on create: ${(error as Error).message}`)
    }
})

// Middleware for "update" event
schema.post(schemaMiddlewareEvents.update, function (route: any) {
    try {
        if (route) {
            if (!route.visible) {
                createActivity({
                    data: route,
                    type: "deletion",
                    module: "route",
                    branch: route.branch._id,
                    user: route.updated_by._id,
                    description: activitySentence()
                })
            } else {
                createActivity({
                    data: route,
                    type: "modification",
                    module: "route",
                    branch: route.branch._id,
                    user: route.updated_by._id,
                    description: activitySentence("modify")
                })
            }
        }
    } catch (error) {
        console.log(`route schema middleware error on update: ${(error as Error).message}`)
    }
})

// Middleware for "delete" event
schema.post(schemaMiddlewareEvents.delete, function (route: any) {
    try {
        if (route) {
            createActivity({
                data: route,
                type: "deletion",
                module: "route",
                branch: route.branch,
                user: route.created_by,
                description: activitySentence("delete")
            })
        }
    } catch (error) {
        console.log(`route schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for "route"
const routeModel = model<route>("route", schema)

// Export the "route" model
export default routeModel