// dependencies
import { Schema } from "mongoose"
import { accountSelection, branchPopulation, userPopulation } from "./population"

// common schema values
export const commonSchemaValues = {

    disabled: {
        index: true,
        type: Boolean,
        default: false
    },

    visible: {
        index: true,
        type: Boolean,
        default: true
    },

    created_by: {
        index: true,
        ref: "user",
        required: true,
        type: Schema.Types.ObjectId,
        autopopulate: { maxDepth: 1, select: userPopulation }
    },

    updated_by: {
        index: true,
        ref: "user",
        default: null,
        type: Schema.Types.ObjectId,
        autopopulate: { maxDepth: 1, select: userPopulation }
    },

    branch: {
        index: true,
        ref: "branch",
        required: true,
        type: Schema.Types.ObjectId,
        autopopulate: { maxDepth: 1, select: branchPopulation }
    }

}

// total amount, paid amount , description, date schema values
export const TPDDSchemaValues = {
    reference: {
        index: true,
        type: String,
        default: null
    },

    account: {
        index: true,
        default: null,
        ref: 'account',
        type: Schema.Types.ObjectId,
        autopopulate: { maxDepth: 1, select: accountSelection },
    },

    fee: {
        index: true,
        type: Number,
        default: 0
    },

    total_amount: {
        index: true,
        type: Number,
        required: true
    },

    paid_amount: {
        default: 0,
        index: true,
        type: Number
    },

    date: {
        type: Date,
        index: true,
        required: true
    },

    description: {
        index: true,
        type: String,
        required: true
    },

    ...commonSchemaValues
}

export const accountSchemaValues = {
    user: {
        index: true,
        ref: "user",
        default: null,
        type: Schema.Types.ObjectId,
        autopopulate: { maxDepth: 1 }
    },

    customer: {
        index: true,
        default: null,
        ref: "customer",
        type: Schema.Types.ObjectId,
        autopopulate: { maxDepth: 1 }
    },

    supplier: {
        index: true,
        default: null,
        ref: "supplier",
        type: Schema.Types.ObjectId,
        autopopulate: { maxDepth: 1 }
    },

    ...commonSchemaValues
}