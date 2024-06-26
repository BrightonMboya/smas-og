// Import necessary dependencies
import { controllers } from "bapig"
import { Schema, model } from "mongoose"
import { adjustment } from "../interface"
import { commonSchemaValues } from "../database/schema"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"


// Define the schema for the "adjustment" collection
const schema = new Schema<adjustment>(
    {
        // Type of adjustment (e.g., increase or decrease)
        type: {
            index: true,
            type: String,
            required: true
        },

        // Source of the adjustment (e.g., sale, purchase)
        from: {
            index: true,
            type: String,
            default: null
        },

        // Module associated with the adjustment
        module: {
            index: true,
            type: String,
            required: true
        },

        // Description of the adjustment
        description: {
            index: true,
            type: String,
            required: true
        },

        // Reference to the associated product (if applicable)
        product: {
            index: true,
            default: null,
            ref: "product",
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: "name" }
        },

        // Reference to the associated sale (if applicable)
        sale: {
            index: true,
            default: null,
            ref: "sale",
            type: Schema.Types.ObjectId
        },

        // Reference to the associated purchase (if applicable)
        purchase: {
            index: true,
            default: null,
            ref: "purchase",
            type: Schema.Types.ObjectId
        },

        // Reference to the user who performed the adjustment
        user: {
            index: true,
            ref: "user",
            required: true,
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: "username" }
        },

        // Stock quantity before the adjustment
        before_adjustment: {
            index: true,
            type: Number,
            required: true
        },

        // Stock quantity after the adjustment
        after_adjustment: {
            index: true,
            type: Number,
            required: true
        },

        // Amount of adjustment
        adjustment: {
            index: true,
            type: Number,
            required: true
        },

        category: {
            index: true,
            default: null,
            ref: 'category',
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: "name" }
          },

        // Include common schema values
        ...commonSchemaValues
    },
    { timestamps: true } // Enable automatic timestamp fields
)

// Create indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Use the mongoose-autopopulate plugin to automatically populate references
schema.plugin(require('mongoose-autopopulate'))

// Schema middleware for post-create event
schema.post(schemaMiddlewareEvents.create, function (adjustment: any) {
    try {
        if (adjustment) {
            // Create an activity record for adjustment creation
            createActivity({
                data: adjustment,
                type: "creation",
                module: "adjustment",
                branch: adjustment.branch._id,
                user: adjustment.created_by._id,
                description: activitySentence("create")
            })

            // Update the stock or quantity based on the adjustment type
            const sale = adjustment.description.includes("sale")

            const action: "increase" | "decrease" = adjustment.type

            const amount = action === "increase" ? adjustment.adjustment : (-1 * adjustment.adjustment)

            const $inc: object = sale ? { stock: amount } : { stock: amount, quantity: amount }


            // Update the product's stock or quantity
            controllers.updateSingleDocument({
                schema: "product",
                condition: { _id: adjustment.product._id },
                newDocumentData: {
                    $inc,
                    $set: { updated_by: adjustment.created_by._id }
                },
            })
        }
    } catch (error) {
        console.log(`Adjustment schema middleware error on create: ${(error as Error).message}`)

    }
})

// Schema middleware for post-update event
schema.post(schemaMiddlewareEvents.update, function (adjustment: any) {
    try {
        if (adjustment) {
            if (!adjustment.visible) {
                // Create an activity record for adjustment deletion
                createActivity({
                    data: adjustment,
                    module: "adjustment",
                    type: "deletion",
                    branch: adjustment.branch._id,
                    user: adjustment.updated_by._id,
                    description: activitySentence()
                })

            } else {
                // Create an activity record for adjustment modification
                createActivity({
                    data: adjustment,
                    module: "adjustment",
                    type: "modification",
                    branch: adjustment.branch._id,
                    user: adjustment.updated_by._id,
                    description: activitySentence("modify")
                })

            }
        }
    } catch (error) {
        console.log(`Adjustment schema middleware error on update: ${(error as Error).message}`)

    }
})

// Schema middleware for post-delete event
schema.post(schemaMiddlewareEvents.delete, function (adjustment: any) {
    try {
        if (adjustment) {
            // Create an activity record for adjustment deletion
            createActivity({
                data: adjustment,
                module: "adjustment",
                type: "deletion",
                branch: adjustment.branch,
                user: adjustment.updated_by,
                description: activitySentence("delete")
            })
        }
    } catch (error) {
        console.log(`Adjustment schema middleware error on delete: ${(error as Error).message}`)

    }
})

// Create the Mongoose model for the "adjustment" collection
const adjustmentModel = model<adjustment>("adjustment", schema)

// Export the Mongoose model
export default adjustmentModel