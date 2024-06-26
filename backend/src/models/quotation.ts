import { Schema, model } from "mongoose"
import { quotation } from "../interface"
import mongooseAutoPopulate from "mongoose-autopopulate"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"
import { commonSchemaValues } from "../database/schema"
import { customerPopulation } from "../database/population"
import { controllers } from "bapig"

const schema = new Schema<quotation>(
    {
        customer: {
            index: true,
            required: true,
            ref: "customer",
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: customerPopulation }
        },

        number: {
            index: true,
            default: "",
            type: String,
        },

        total_amount: {
            index: true,
            type: Number,
            required: true,
        },

        profit: {
            default: 0,
            index: true,
            type: Number,
        },

        total_margin: {
            index: true,
            type: Number,
            required: true,
        },

        trips: [
            {
                index: true,
                type: Object,
                required: true
            }
        ],

        ...commonSchemaValues

    },
    { timestamps: true }
)

// schema timestamp indexing
schema.index({ createdAt: 1 }, { background: true })
schema.index({ updatedAt: 1 }, { background: true })

// schema plugin
schema.plugin(mongooseAutoPopulate)

// schema middleware events
schema.pre(schemaMiddlewareEvents.create, async function (next) {
    try {

        let quotation = this
        const quotationCount = await controllers.countDocuments({
            schema: "quotation",
            condition: { branch: quotation.branch }
        })

        quotation.number = (quotationCount.message + 1).toString()
        next()

    } catch (error) {
        return next(new Error((error as Error).message))
    }
})
// on create
schema.post(schemaMiddlewareEvents.create, function (quotation: any) {
    try {

        if (quotation) {
            createActivity({
                data: quotation,
                type: "creation",
                module: "quotation",
                branch: quotation.branch._id,
                user: quotation.created_by._id,
                description: activitySentence("create")
            })
        }

    } catch (error) {
        console.log(`quotation schema middleware error on create: ${(error as Error).message}`)
    }
})

// on update
schema.post(schemaMiddlewareEvents.update, function (quotation: any) {
    try {

        if (quotation) {
            if (!quotation.visible) {
                createActivity({
                    data: quotation,
                    type: "deletion",
                    module: "quotation",
                    branch: quotation.branch._id,
                    user: quotation.updated_by._id,
                    description: activitySentence()
                })
                controllers.updateSingleDocument({
                    schema: "quotation_invoice",
                    condition: { quotation: quotation._id },
                    newDocumentData: { $set: { visible: false } }
                })
            }
            else {
                createActivity({
                    data: quotation,
                    type: "modification",
                    module: "quotation",
                    branch: quotation.branch._id,
                    user: quotation.updated_by._id,
                    description: activitySentence("modify")
                })
            }
        }

    } catch (error) {
        console.log(`quotation schema middleware error on update: ${(error as Error).message}`)
    }
})

// on delete
schema.post(schemaMiddlewareEvents.delete, function (quotation: any) {
    try {

        if (quotation) {
            createActivity({
                data: quotation,
                type: "deletion",
                module: "quotation",
                branch: quotation.branch,
                user: quotation.created_by,
                description: activitySentence("delete")
            })
        }

    } catch (error) {
        console.log(`quotation schema middleware error on create: ${(error as Error).message}`)
    }
})

// quotation model
const quotation = model<quotation>("quotation", schema)

// exporting quotation model
export default quotation