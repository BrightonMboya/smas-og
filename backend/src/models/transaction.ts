// Import necessary dependencies and modules
import { Schema, model } from "mongoose"
import { transaction } from "../interface"
import mongooseAutopopulate from "mongoose-autopopulate"
import {
    activitySentence,
    createActivity,
    schemaMiddlewareEvents,
} from "../helpers"
import { accountSchemaValues } from "../database/schema"
import { controllerResponse } from "bapig/dist/types"
import { controllers } from "bapig"
import { accountSelection } from "../database/population"

// Define the schema for the "transaction" collection
const schema = new Schema<transaction>(
    {
        // Define the 'date' field with indexing and required attribute
        date: {
            type: Date,
            index: true,
            required: true,
        },
        // Define the 'type' field with indexing and required attribute
        type: {
            index: true,
            type: String,
            required: true,
        },
        // Define the 'reference' field with indexing and default value
        reference: {
            index: true,
            type: String,
            default: null,
        },
        // Define the 'number' field with indexing and default value
        number: {
            index: true,
            type: String,
            default: null,
        },
        // Define the 'debt_history' field with indexing and reference
        debt_history: {
            index: true,
            default: null,
            ref: "debt_history",
            type: Schema.Types.ObjectId,
            // autopopulate: { maxDepth: 1 }
        },
        // Define the 'expense' field with indexing and reference
        expense: {
            index: true,
            default: null,
            ref: "expense",
            type: Schema.Types.ObjectId,
            // autopopulate: { maxDepth: 1 }
        },
        // Define the 'truck_order' field with indexing and reference
        truck_order: {
            index: true,
            default: null,
            ref: "truck_order",
            type: Schema.Types.ObjectId,
            // autopopulate: { maxDepth: 1 }
        },
        // Define the 'quotation_invoice' field with indexing and reference
        quotation_invoice: {
            index: true,
            default: null,
            ref: "quotation_invoice",
            type: Schema.Types.ObjectId,
            // autopopulate: { maxDepth: 1 }
        },
        // Define the 'sale' field with indexing and reference
        sale: {
            index: true,
            default: null,
            ref: "sale",
            type: Schema.Types.ObjectId,
            // autopopulate: { maxDepth: 1 }
        },
        // Define the 'account' field with indexing, reference, and required attribute
        account: {
            index: true,
            ref: "account",
            required: true,
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: accountSelection },
        },
        // Define the 'purchase' field with indexing and reference
        purchase: {
            index: true,
            default: null,
            ref: "purchase",
            type: Schema.Types.ObjectId,
            // autopopulate: { maxDepth: 1 }
        },
        // Define the 'total_amount' field with indexing and required attribute
        total_amount: {
            index: true,
            type: Number,
            required: true,
        },
        // Define the 'fee' field with indexing and default value
        fee: {
            index: true,
            type: Number,
            default: 0,
        },
        // Define the 'description' field with indexing and required attribute
        description: {
            index: true,
            type: String,
            required: true,
        },
        // Define the 'cause' field with indexing and required attribute
        cause: {
            index: true,
            type: String,
            required: true,
        },
        // Define the 'account_type' field with indexing and required attribute
        account_type: {
            index: true,
            type: String,
            required: true,
        },
        // Define the 'account_to_impact' field with indexing, reference, and autopopulation
        account_to_impact: {
            index: true,
            default: null,
            ref: "account",
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: accountSelection },
        },
        // Define the 'impact' field with indexing and required attribute
        impact: {
            index: true,
            type: Boolean,
            required: true,
        },
        // Include account schema values
        ...accountSchemaValues,
    },
    { timestamps: true }
)

// Indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Add Mongoose autopopulate plugin
schema.plugin(mongooseAutopopulate)

// Middleware for "create" event
schema.pre(schemaMiddlewareEvents.create, async function (next) {
    try {
        let transaction: any = this

        // Count existing transactions to generate the transaction number
        const transactionCount: controllerResponse = await controllers.countDocuments({
            schema: "transaction",
            condition: { branch: transaction.branch },
        })

        transaction.number = (transactionCount.message + 1).toString()

        if (transaction.total_amount + transaction.fee) next()
        else return next(new Error("Transaction total amount and fee must be greater than 0"))
    } catch (error) {
        return next(new Error((error as Error).message))
    }
})

// Middleware for "create" event
schema.post(schemaMiddlewareEvents.create, function (transaction: any) {
    try {
        if (transaction) {
            createActivity({
                data: transaction,
                type: "creation",
                module: "transaction",
                branch: transaction.branch._id,
                user: transaction.created_by._id,
                description: activitySentence("create"),
            })

            let balance = 0

            if (transaction.account_type !== "supplier")
                balance = transaction.type === "deposit" ? transaction.total_amount : (-1 * transaction.total_amount) - transaction.fee
            else
                balance = transaction.type === "deposit" ? -1 * transaction.total_amount : transaction.total_amount

            // Update account balances
            controllers.updateSingleDocument({
                schema: "account",
                condition: { _id: transaction.account._id, disabled: false },
                newDocumentData: {
                    $set: { updated_by: transaction.created_by._id },
                    $inc: { balance: transaction.account_type !== "supplier" ? balance : -1 * balance },
                },
            })

            if (transaction.account_to_impact && transaction.impact) {
                controllers.updateSingleDocument({
                    schema: "account",
                    condition: { _id: transaction.account_to_impact._id, disabled: false },
                    newDocumentData: {
                        $inc: { balance },
                        $set: { updated_by: transaction.created_by._id },
                    },
                })
            }
        }
    } catch (error) {
        console.log(`Transaction schema middleware error on create: ${(error as Error).message}`)
    }
})

// Middleware for "update" event
schema.post(schemaMiddlewareEvents.update, function (transaction: any) {
    try {
        if (transaction) {
            if (!transaction.visible) {
                createActivity({
                    data: transaction,
                    type: "deletion",
                    module: "transaction",
                    branch: transaction.branch._id,
                    user: transaction.updated_by._id,
                    description: activitySentence(),
                })

                let balance = 0

                if (transaction.account_type !== "supplier")
                    balance = transaction.type === "deposit" ? (-1 * transaction.total_amount) - transaction.fee : transaction.total_amount + transaction.fee
                else
                    balance = transaction.type === "deposit" ? (-1 * transaction.total_amount) - transaction.fee : transaction.total_amount + transaction.fee

                // Update account balances
                controllers.updateSingleDocument({
                    schema: "account",
                    condition: { _id: transaction.account._id, disabled: false },
                    newDocumentData: {
                        $inc: { balance },
                        $set: { updated_by: transaction.created_by._id },
                    },
                })

                if (transaction.account_to_impact && transaction.impact) {
                    controllers.updateSingleDocument({
                        schema: "account",
                        condition: { _id: transaction.account_to_impact._id, disabled: false },
                        newDocumentData: {
                            $inc: { balance: transaction.account_type !== "supplier" ? balance : -1 * balance },
                            $set: { updated_by: transaction.created_by._id },
                        },
                    })
                }
            } else {
                createActivity({
                    data: transaction,
                    type: "modification",
                    module: "transaction",
                    branch: transaction.branch._id,
                    user: transaction.updated_by._id,
                    description: activitySentence("modify"),
                })
            }
        }
    } catch (error) {
        console.log(`Transaction schema middleware error on update: ${(error as Error).message}`)
    }
})

// Middleware for "delete" event
schema.post(schemaMiddlewareEvents.delete, function (transaction: any) {
    try {
        if (transaction) {
            createActivity({
                data: transaction,
                type: "deletion",
                module: "transaction",
                branch: transaction.branch,
                user: transaction.created_by,
                description: activitySentence("delete"),
            })
        }
    } catch (error) {
        console.log(`Transaction schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for "transaction"
const transactionModel = model<transaction>("transaction", schema)

// Export the "transaction" model for global accessibility
export default transactionModel