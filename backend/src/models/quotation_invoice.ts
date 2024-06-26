// Import required dependencies and modules
import { Schema, model } from "mongoose"
import { quotation_invoice } from "../interface"
import { commonSchemaValues } from "../database/schema"
import mongooseAutoPopulate from "mongoose-autopopulate"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"
import { accountSelection, customerPopulation } from "../database/population"
import { controllers } from "bapig"

// Define the schema for quotation_invoice
const schema = new Schema<quotation_invoice>(
    {
        // Define the 'customer' field with indexing, ref, and autopopulate
        customer: {
            index: true,
            ref: "customer",
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: customerPopulation }
        },
        // Define the 'quotation' field with indexing, ref, and autopopulate
        quotation: {
            index: true,
            ref: "quotation",
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1 }
        },
        // Define the 'total_amount' field with indexing and required attribute
        total_amount: {
            index: true,
            type: Number,
            required: true
        },
        // Define the 'paid_amount' field with indexing and required attribute
        paid_amount: {
            index: true,
            type: Number,
            required: true
        },
        // Define the 'use_customer_account' field with indexing and default value
        use_customer_account: {
            index: true,
            type: Boolean,
            default: false
        },
        // Define the 'date' field with indexing and required attribute
        date: {
            index: true,
            type: Date,
            required: true
        },
        // Define the 'number' field with indexing and required attribute
        number: {
            index: true,
            type: String,
            required: true
        },
        // Define the 'reference' field with indexing and default value
        reference: {
            index: true,
            type: String,
            default: null
        },
        // Define the 'account' field with indexing, default value, ref, and autopopulate
        account: {
            index: true,
            default: null,
            ref: 'account',
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: accountSelection },
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
schema.plugin(mongooseAutoPopulate)

// Middleware before creating
schema.pre(schemaMiddlewareEvents.create, async function (next) {
    try {
        const quotation_invoice: any = this

        if (quotation_invoice.use_customer_account) {
            const account = await controllers.getSingleDocument({
                schema: "account",
                select: { balance: 1 },
                joinForeignKeys: false,
                condition: { type: "customer", customer: quotation_invoice.customer }
            })

            if (account.success) {
                if (account.message.balance >= quotation_invoice.paid_amount) {
                    quotation_invoice.account = account.message._id
                    next()
                } else {
                    return next(new Error("customer account has insufficient balance"))
                }
            } else {
                return next(new Error("customer account does not exist"))
            }
        } else {
            next()
        }
    } catch (error) {
        return next(new Error((error as Error).message))
    }
})

// Middleware on create
schema.post(schemaMiddlewareEvents.create, async function (quotation_invoice: any) {
    try {
        if (quotation_invoice) {
            createActivity({
                data: quotation_invoice,
                type: "creation",
                module: "quotation_invoice",
                branch: quotation_invoice.branch._id,
                user: quotation_invoice.created_by._id,
                description: activitySentence("create")
            })

            // Create accounts and transactions
            if (quotation_invoice.use_customer_account) {
                const customerAccountExist = await controllers.getSingleDocument({
                    schema: "account",
                    select: { balance: 1 },
                    joinForeignKeys: false,
                    condition: { type: "customer", customer: quotation_invoice.customer?._id }
                })

                if (customerAccountExist.success) {
                    const documentData = {
                        impact: false,
                        type: "withdraw",
                        cause: "automatic",
                        account_to_impact: null,
                        account_type: "customer",
                        date: new Date().toISOString(),
                        branch: quotation_invoice.branch?._id,
                        reference: quotation_invoice.reference,
                        quotation_invoice: quotation_invoice._id,
                        customer: quotation_invoice.customer._id,
                        account: customerAccountExist.message._id,
                        total_amount: quotation_invoice.paid_amount,
                        created_by: quotation_invoice.created_by?._id,
                        description: "An automatic transaction was generated due to a quotation_invoice made."
                    }

                    controllers.createSingleDocument({
                        documentData,
                        schema: "transaction"
                    })
                }
            } else if (quotation_invoice.account) {
                const documentData = {
                    impact: false,
                    type: "deposit",
                    cause: "automatic",
                    date: new Date().toISOString(),
                    branch: quotation_invoice.branch?._id,
                    account: quotation_invoice.account._id,
                    reference: quotation_invoice.reference,
                    quotation_invoice: quotation_invoice._id,
                    total_amount: quotation_invoice.total_amount,
                    account_type: quotation_invoice.account.type,
                    created_by: quotation_invoice.created_by?._id,
                    account_to_impact: quotation_invoice.account._id,
                    description: "An automatic transaction was generated due to a quotation_invoice made."
                }

                controllers.createSingleDocument({
                    documentData,
                    schema: "transaction"
                })
            }

            // Create new debt
            if (quotation_invoice.total_amount > quotation_invoice.paid_amount) {
                controllers.createSingleDocument({
                    schema: "debt",
                    documentData: {
                        type: "debtor",
                        status: "unpaid",
                        date: new Date().toISOString(),
                        branch: quotation_invoice.branch._id,
                        customer: quotation_invoice.customer._id,
                        quotation_invoice: quotation_invoice._id,
                        created_by: quotation_invoice.created_by._id,
                        description: "quotation invoice Induced Debt",
                        total_amount: quotation_invoice.total_amount - quotation_invoice.paid_amount,
                    }
                })
            }
        }
    } catch (error) {
        console.log(`quotation_invoice schema middleware error on create: ${(error as Error).message}`)
    }
})

// Middleware on update
schema.post(schemaMiddlewareEvents.update, function (quotation_invoice: any) {
    try {
        if (quotation_invoice) {
            if (!quotation_invoice.visible) {
                createActivity({
                    data: quotation_invoice,
                    type: "deletion",
                    module: "quotation_invoice",
                    branch: quotation_invoice.branch._id,
                    user: quotation_invoice.updated_by._id,
                    description: activitySentence()
                })

                // Delete transaction
                if (quotation_invoice.account) {
                    const transactionData = {
                        schema: "transaction",
                        condition: { quotation_invoice: quotation_invoice._id },
                        newDocumentData: {
                            $set: {
                                visible: false,
                                updated_by: quotation_invoice.updated_by._id
                            }
                        }
                    }

                    controllers.updateSingleDocument(transactionData)
                }

                // Delete debt
                controllers.deleteSingleDocument({
                    schema: "debt",
                    condition: { quotation_invoice: quotation_invoice._id }
                })
            } else {
                createActivity({
                    data: quotation_invoice,
                    type: "modification",
                    module: "quotation_invoice",
                    branch: quotation_invoice.branch._id,
                    user: quotation_invoice.updated_by._id,
                    description: activitySentence("modify")
                })
            }
        }
    } catch (error) {
        console.log(`quotation_invoice schema middleware error on update: ${(error as Error).message}`)
    }
})

// Middleware on delete
schema.post(schemaMiddlewareEvents.delete, function (quotation_invoice: any) {
    try {
        if (quotation_invoice) {
            createActivity({
                data: quotation_invoice,
                type: "deletion",
                module: "quotation_invoice",
                branch: quotation_invoice.branch,
                user: quotation_invoice.created_by,
                description: activitySentence("delete")
            })
        }
    } catch (error) {
        console.log(`quotation_invoice schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for quotation_invoice
const quotationInvoiceModel = model<quotation_invoice>("quotation_invoice", schema)

// Export the quotation_invoice model
export default quotationInvoiceModel