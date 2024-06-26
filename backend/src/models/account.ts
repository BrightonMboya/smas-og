import { controllers } from "bapig"
import { account } from "../interface"
import { Schema, model } from "mongoose"
import mongooseAutoPopulate from "mongoose-autopopulate"
import { accountSchemaValues } from "../database/schema"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Account schema design
const schema = new Schema<account>(
    {
        name: {
            index: true,
            type: String,
            required: true
        },
        number: {
            index: true,
            type: String,
            default: null
        },
        type: {
            index: true,
            type: String,
            required: true
        },
        provider: {
            index: true,
            type: String,
            required: true
        },
        balance: {
            index: true,
            type: Number,
            default: 0
        },
        monthly_fee: {
            index: true,
            type: Number,
            default: 0
        },
        ...accountSchemaValues // additional schema values
    },
    { timestamps: true }
)

// Timestamps schema indexing
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Schema plugin for autopopulating references
schema.plugin(mongooseAutoPopulate)

// Schema middleware for post-create event
schema.post(schemaMiddlewareEvents.create, function (account: any) {
    try {
        if (account) {
            // Create an activity record for account creation
            createActivity({
                data: account,
                type: "creation",
                module: "account",
                branch: account.branch._id,
                user: account.created_by._id,
                description: activitySentence("create")
            })
        }
    } catch (error) {
        console.log(`Account schema middleware error on create: ${(error as Error).message}`)
    }
})

// Schema middleware for post-update event
schema.post(schemaMiddlewareEvents.update, function (account: any) {
    try {
        if (account) {
            if (!account.visible) {
                // Create an activity record for account deletion
                createActivity({
                    data: account,
                    type: "deletion",
                    module: "account",
                    branch: account.branch._id,
                    user: account.updated_by._id,
                    description: activitySentence()
                })

                // Update visibility of related transactions
                controllers.updateManyDocument({
                    schema: "transaction",
                    newDocumentData: { visible: false },
                    condition: { account: account._id }
                })
            } else {
                // Create an activity record for account modification
                createActivity({
                    data: account,
                    type: "modification",
                    module: "account",
                    branch: account.branch._id,
                    user: account.updated_by._id,
                    description: activitySentence("modify")
                })
            }
        }
    } catch (error) {
        console.log(`Account schema middleware error on update: ${(error as Error).message}`)
    }
})

// Schema middleware for post-delete event
schema.post(schemaMiddlewareEvents.delete, function (account: any) {
    try {
        if (account) {
            // Create an activity record for account deletion
            createActivity({
                data: account,
                type: "deletion",
                module: "account",
                branch: account.branch,
                user: account.created_by,
                description: activitySentence("delete")
            })
        }
    } catch (error) {
        console.log(`Account schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Model for the account schema
const accountModel = model<account>("account", schema)

export default accountModel