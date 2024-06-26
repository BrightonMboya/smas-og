// Import necessary dependencies
import { controllers } from "bapig"
import { attraction } from "../interface"
import { Schema, model } from "mongoose"
import mongooseAutoPopulate from "mongoose-autopopulate"
import { commonSchemaValues } from "../database/schema"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"

// Define the schema for the "attraction" collection
const schema = new Schema<attraction>(
    {
        // Name of the attraction
        name: {
            index: true,
            type: String,
            required: true
        },

        category: {
            index: true,
            default: null,
            type: String,
        },

        address: {
            index: true,
            type: Object,
            required: true
        },

        // Array of associated hotels
        hotels: [
            {
                index: true,
                ref: "hotel",
                type: Schema.Types.ObjectId,
                autopopulate: { maxDepth: 1 }
            }
        ],

        // Include common schema values
        ...commonSchemaValues
    },
    { timestamps: true } // Enable automatic timestamp fields
)

// Create indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Use the mongoose-autopopulate plugin to automatically populate references
schema.plugin(mongooseAutoPopulate)

// Schema middleware for post-create event
schema.post(schemaMiddlewareEvents.create, function (attraction: any) {
    try {
        // Create an activity record for attraction creation
        if (attraction) {
            createActivity({
                data: attraction,
                type: "creation",
                module: "attraction",
                branch: attraction.branch._id,
                user: attraction.created_by._id,
                description: activitySentence("create")
            })
        }
    } catch (error) {
        console.log(`attraction schema middleware error on create: ${(error as Error).message}`)
    }
})

// Schema middleware for post-update event
schema.post(schemaMiddlewareEvents.update, function (attraction: any) {
    try {
        // Create activity records for attraction updates and deletions
        if (attraction) {
            if (!attraction.visible) {
                createActivity({
                    data: attraction,
                    module: "attraction",
                    type: "deletion",
                    branch: attraction.branch._id,
                    user: attraction.updated_by._id,
                    description: activitySentence()
                })
                // delete attraction activitiy
                controllers.updateManyDocument({
                    schema: "attraction_activity",
                    condition: { attraction: attraction._id },
                    newDocumentData: { visible: attraction.visible }
                })
            } else {
                createActivity({
                    data: attraction,
                    module: "attraction",
                    type: "modification",
                    branch: attraction.branch._id,
                    user: attraction.updated_by._id,
                    description: activitySentence("modify")
                })
            }
        }
    } catch (error) {
        console.log(`attraction schema middleware error on update: ${(error as Error).message}`)
    }
})

// Schema middleware for post-delete event
schema.post(schemaMiddlewareEvents.delete, function (attraction: any) {
    try {
        // Create an activity record for attraction deletion
        if (attraction) {
            createActivity({
                data: attraction,
                module: "attraction",
                type: "deletion",
                branch: attraction.branch,
                user: attraction.created_by,
                description: activitySentence("delete")
            })
        }
    } catch (error) {
        console.log(`attraction schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for the "attraction" collection
const attractionModel = model<attraction>("attraction", schema)

// Export the Mongoose model
export default attractionModel