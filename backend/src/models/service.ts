// Import necessary dependencies and modules
import { service } from "../interface"
import { Schema, model } from "mongoose"
import { commonSchemaValues } from "../database/schema"
import { customerPopulation, productPopulation } from "../database/population"
import {
    activitySentence,
    adjustStock,
    createActivity,
    schemaMiddlewareEvents,
} from "../helpers"

// Define the schema for the "service" collection
const schema = new Schema<service>(
    {
        // Define the 'device' field with indexing, reference to 'device' collection, and required attribute
        device: {
            index: true,
            ref: "device",
            required: true,
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: { name: 1 } },
        },
        // Define the 'customer' field with indexing, reference to 'customer' collection, and required attribute
        customer: {
            index: true,
            ref: "customer",
            required: true,
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: customerPopulation },
        },
        // Define the 'product' field with indexing, reference to 'product' collection, and default value
        product: {
            index: true,
            default: null,
            ref: "product",
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: productPopulation },
        },
        // Define the 'product_cost' field with indexing and required attribute
        product_cost: {
            index: true,
            type: Number,
            required: true,
        },
        // Define the 'service' field with indexing and required attribute
        service: {
            index: true,
            type: String,
            required: true,
        },
        // Define the 'service_cost' field with indexing and required attribute
        service_cost: {
            index: true,
            type: Number,
            required: true,
        },
        // Define the 'description' field with indexing and required attribute
        description: {
            index: true,
            type: String,
            required: true,
        },
        // Define the 'profit' field with default value and indexing
        profit: {
            default: 0,
            index: true,
            type: Number,
        },
        // Define the 'discount' field with default value and indexing
        discount: {
            default: 0,
            index: true,
            type: Number,
        },
        // Define the 'status' field with default value and indexing
        status: {
            index: true,
            type: String,
            default: "incomplete",
        },
        // Define the 'number' field with indexing and required attribute
        number: {
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
schema.plugin(require("mongoose-autopopulate"))

// Middleware for "create" event
schema.post(schemaMiddlewareEvents.create, function (service: any) {
    try {
        if (service) {
            createActivity({
                data: service,
                type: "creation",
                module: "service",
                branch: service.branch._id,
                user: service.created_by._id,
                description: activitySentence("create"),
            })

            if (service.product) {
                adjustStock({
                    from: "service",
                    data: service,
                    adjustment: 1,
                    type: "decrease",
                })
            }
        }
    } catch (error) {
        console.log(`service schema middleware error on create: ${(error as Error).message}`)
    }
})

// Middleware for "update" event
schema.post(schemaMiddlewareEvents.update, function (service: any) {
    try {
        if (service) {
            if (!service.visible) {
                createActivity({
                    data: service,
                    type: "deletion",
                    module: "service",
                    branch: service.branch._id,
                    user: service.updated_by._id,
                    description: activitySentence(),
                })

                if (service.product) {
                    adjustStock({
                        from: "service",
                        data: service,
                        adjustment: 1,
                        type: "increase",
                    })
                }
            } else {
                createActivity({
                    data: service,
                    type: "modification",
                    module: "service",
                    branch: service.branch._id,
                    user: service.updated_by._id,
                    description: activitySentence("modify"),
                })
            }
        }
    } catch (error) {
        console.log(`service schema middleware error on update: ${(error as Error).message}`)
    }
})

// Middleware for "delete" event
schema.post(schemaMiddlewareEvents.delete, function (service: any) {
    try {
        if (service) {
            createActivity({
                data: service,
                type: "deletion",
                module: "service",
                branch: service.branch,
                user: service.created_by,
                description: activitySentence("delete"),
            })
        }
    } catch (error) {
        console.log(`service schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for "service"
const serviceModel = model<service>("service", schema)

// Export the "service" model
export default serviceModel