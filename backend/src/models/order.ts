// Import required dependencies and modules
import { controllers } from "bapig"
import { order } from "../interface"
import { Schema, model } from "mongoose"
import { commonSchemaValues } from "../database/schema"
import { customerPopulation } from "../database/population"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Define the schema for order
const schema = new Schema<order>(
    {
        // Define the 'customer' field with indexing, required attribute, and autopopulate
        customer: {
            index: true,
            required: true,
            ref: 'customer',
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: customerPopulation },
        },
        // Define the 'sales' field as an array with indexing, required attribute, and autopopulate
        sales: [
            {
                ref: 'sale',
                index: true,
                required: true,
                type: Schema.Types.ObjectId,
                autopopulate: {
                    maxDepth: 2, select: {
                        branch: 0,
                        createdAt: 0,
                        updatedAt: 0,
                        created_by: 0,
                        updated_by: 0,
                        customer: 0,
                        __v: 0,
                        disabled: 0,
                        type: 0,
                        visible: 0
                    }
                },
            }
        ],
        // Define the 'type' field with indexing and required attribute
        type: {
            index: true,
            type: String,
            required: true
        },
        // Define the 'number' field with indexing and default value
        number: {
            index: true,
            type: String,
            default: null
        },

        reference: {
            index: true,
            type: String,
            default: null,
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
schema.plugin(require('mongoose-autopopulate'))

// Schema middleware for creation
schema.post(schemaMiddlewareEvents.create, function (order: any) {
    try {
        if (order) {
            // Create activity for the order creation
            createActivity({
                data: order,
                module: "order",
                type: "creation",
                branch: order.branch._id,
                user: order.created_by._id,
                description: activitySentence("create")
            })
        }
        // Update sales documents
        controllers.documentBulkUpdate(order.sales.map((sale: any) => ({
            schema: "sale",
            condition: { _id: sale._id, visible: true },
            newDocumentData: {
                $set: { type: "sale", updated_by: order.created_by._id }
            }
        })))
    } catch (error) {
        console.log(`Order Schema Middleware (create) Error: ${(error as Error).message}`)
    }
})

// Schema middleware for update
schema.post(schemaMiddlewareEvents.update, function (order: any) {
    try {
        if (order) {
            if (order.sales.length === 0) {
                // Delete the order if it has no sales
                controllers.deleteSingleDocument({
                    schema: "order",
                    condition: { _id: order._id }
                })
            }
            if (!order.visible) {
                // Create activity for the order deletion
                createActivity({
                    data: order,
                    module: "order",
                    type: "deletion",
                    branch: order.branch._id,
                    user: order.updated_by._id,
                    description: activitySentence()
                })
                // Update sales documents
                controllers.documentBulkUpdate(order.sales.map((sale: any) => ({
                    schema: "sale",
                    condition: { _id: sale._id, visible: true },
                    newDocumentData: {
                        $set: {
                            updated_by: order.updated_by._id,
                            visible: false
                        }
                    }
                })))
            } else {
                // Create activity for the order modification
                createActivity({
                    data: order,
                    module: "order",
                    type: "modification",
                    branch: order.branch._id,
                    user: order.updated_by._id,
                    description: activitySentence("modify")
                })
            }
        }
    } catch (error) {
        console.log(`Order schema middleware error on update: ${(error as Error).message}`)
    }
})

// Schema middleware for delete
schema.post(schemaMiddlewareEvents.delete, function (order: any) {
    try {
        if (order) {
            // Create activity for the order deletion
            createActivity({
                data: order,
                module: "order",
                type: "deletion",
                branch: order.branch,
                user: order.updated_by,
                description: activitySentence("delete")
            })
            // Delete related sales documents
            controllers.documentBulkDelete(order.sales.map((sale: any) => ({ schema: "sale", condition: { _id: sale } })))
        }
    } catch (error) {
        console.log(`Order schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for order
const orderModel = model<order>('order', schema)

// Export the order model
export default orderModel