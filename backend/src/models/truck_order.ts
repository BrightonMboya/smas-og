// Import necessary dependencies and modules
import { controllers } from "bapig"
import { Schema, model } from "mongoose"
import { truck_order } from "../interface"
import { TPDDSchemaValues } from "../database/schema"
import mongooseAutoPopulate from "mongoose-autopopulate"
import {
    activitySentence,
    createActivity,
    schemaMiddlewareEvents,
} from "../helpers"
import { customerPopulation } from "../database/population"

// Define the schema for the "truck_order" collection
const schema = new Schema<truck_order>(
    {
        // Define the 'editable' field with indexing and default value
        editable: {
            index: true,
            type: Boolean,
            default: true,
        },
        // Define the 'route_name' field with indexing and required attribute
        route_name: {
            index: true,
            type: String,
            required: true,
        },
        // Define the 'distance' field with indexing and required attribute
        distance: {
            index: true,
            type: Number,
            required: true,
        },
        // Define the 'number' field with required attribute
        number: {
            type: String,
            required: true,
        },
        // Define the 'truck' field with indexing, reference, and autopopulation
        truck: {
            index: true,
            ref: "truck",
            required: true,
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: { name: 1, status: 1 } },
        },
        // Define the 'customer' field with indexing, reference, and autopopulation
        customer: {
            index: true,
            ref: "customer",
            required: true,
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: customerPopulation },
        },
        // Define the 'route' field with indexing, reference, and autopopulation
        route: {
            index: true,
            ref: "route",
            required: true,
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: { from: 1, to: 1, cost: 1, distance: 1 } },
        },
        // Include TPDD schema values
        ...TPDDSchemaValues,
    },
    { timestamps: true }
)

// Indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Add Mongoose autopopulate plugin
schema.plugin(mongooseAutoPopulate)

// Middleware for "create" event
schema.post(schemaMiddlewareEvents.create, function (truck_order: any) {
    try {
        if (truck_order) {
            // Create activity entry for creation
            createActivity({
                data: truck_order,
                type: "creation",
                module: "truck_order",
                branch: truck_order.branch._id,
                user: truck_order.created_by._id,
                description: activitySentence("create"),
            })

            // Update truck status to "rented"
            controllers.updateSingleDocument({
                schema: "truck",
                condition: { _id: truck_order.truck._id },
                newDocumentData: {
                    $set: {
                        status: "rented",
                        updated_by: truck_order.created_by._id,
                    },
                },
            })

            // Create transaction if account is specified
            if (truck_order.account) {
                // Transaction data
                const transactionData = {
                    fee: 0,
                    impact: false,
                    type: "deposit",
                    cause: "automatic",
                    date: new Date().toISOString(),
                    truck_order: truck_order._id,
                    branch: truck_order.branch?._id,
                    account: truck_order.account._id,
                    reference: truck_order.reference,
                    total_amount: truck_order.paid_amount,
                    account_type: truck_order.account.type,
                    created_by: truck_order.created_by?._id,
                    description: "An automatic transaction was generated due to a truck order made.",
                }

                // Create the transaction
                controllers.createSingleDocument({
                    documentData: transactionData,
                    schema: "transaction",
                })
            }

            // Create new debt if total_amount > paid_amount
            if (truck_order.total_amount > truck_order.paid_amount) {
                controllers.createSingleDocument({
                    schema: "debt",
                    documentData: {
                        type: "debtor",
                        status: "unpaid",
                        truck_order: truck_order._id,
                        branch: truck_order.branch._id,
                        date: new Date().toISOString(),
                        customer: truck_order.customer._id,
                        created_by: truck_order.created_by._id,
                        description: "Truck order Induced Debt",
                        total_amount: truck_order.total_amount - truck_order.paid_amount,
                    },
                })
            }
        }
    } catch (error) {
        console.log(`truck_order schema middleware error on create: ${(error as Error).message}`)
    }
})

// Middleware for "update" event
schema.post(schemaMiddlewareEvents.update, function (truck_order: any) {
    try {
        if (truck_order) {
            if (!truck_order.visible) {
                // Create activity entry for deletion
                createActivity({
                    data: truck_order,
                    type: "deletion",
                    module: "truck_order",
                    branch: truck_order.branch._id,
                    user: truck_order.updated_by._id,
                    description: activitySentence(),
                })

                // Update truck status to "available"
                controllers.updateSingleDocument({
                    schema: "truck",
                    condition: { _id: truck_order.truck._id },
                    newDocumentData: {
                        $set: {
                            status: "available",
                            updated_by: truck_order.updated_by._id,
                        },
                    },
                })

                // Delete transaction if it exists
                if (truck_order.account) {
                    const transactionData = {
                        schema: "transaction",
                        condition: { truck_order: truck_order._id },
                        newDocumentData: {
                            $set: {
                                visible: false,
                                updated_by: truck_order.updated_by._id,
                            },
                        },
                    }

                    controllers.updateSingleDocument(transactionData)
                }

                // Delete debt related to the truck order
                controllers.deleteSingleDocument({
                    schema: "debt",
                    condition: { truck_order: truck_order._id },
                })
            } else {
                if (truck_order.status_after) {
                    // Update truck status based on "status_after"
                    controllers.updateSingleDocument({
                        schema: "truck",
                        condition: { _id: truck_order.truck._id },
                        newDocumentData: {
                            $set: {
                                status: truck_order.status_after === "bad_condition" ? "unavailable" : "available",
                                updated_by: truck_order.updated_by._id,
                            },
                        },
                    })
                }

                // Create activity entry for modification
                createActivity({
                    data: truck_order,
                    type: "modification",
                    module: "truck_order",
                    branch: truck_order.branch._id,
                    user: truck_order.updated_by._id,
                    description: activitySentence("modify"),
                })
            }
        }
    } catch (error) {
        console.log(`truck_order schema middleware error on update: ${(error as Error).message}`)
    }
})

// Middleware for "delete" event
schema.post(schemaMiddlewareEvents.delete, function (truck_order: any) {
    try {
        if (truck_order) {
            // Create activity entry for deletion
        createActivity({
            data: truck_order,
            type: "deletion",
            module: "truck_order",
            branch: truck_order.branch,
            user: truck_order.created_by,
            description: activitySentence("delete"),
        })
        }
    } catch (error) {
        console.log(`truck_order schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for "truck_order"
const truckOrderModel = model<truck_order>("truck_order", schema)

// Export the "truck_order" model for global accessibility
export default truckOrderModel
