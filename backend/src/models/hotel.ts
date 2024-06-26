// Import required dependencies and modules
import { hotel } from "../interface"
import { Schema, model } from "mongoose"
import mongooseAutoPopulate from "mongoose-autopopulate"
import { commonSchemaValues } from "../database/schema"
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers"
import { controllers } from "bapig"

// Define the schema for hotel
const schema = new Schema<hotel>(
    {
        // Define the 'name' field with indexing and required attribute
        name: {
            index: true,
            type: String,
            required: true
        },
        // Define the 'category' field with indexing and required attribute
        category: {
            index: true,
            type: String,
            default: null,
          },
        // Define the 'rooms' field as an array of objects
        rooms: [
            {
                index: true,
                type: Object,
                required: true
            }
        ],
        // Define the 'address' field as an object with indexing and required attribute
        address: {
            index: true,
            type: Object,
            required: true
        },
        // Define the 'contacts' field as an object with indexing and required attribute
        contacts: {
            index: true,
            type: Object,
            required: true
        },
        // Include common schema values
        ...commonSchemaValues
    },
    { timestamps: true }
)

// Indexes for timestamps
schema.index({ createdAt: 1 }, { background: true })
schema.index({ updatedAt: 1 }, { background: true })

// Add Mongoose autopopulate plugin
schema.plugin(mongooseAutoPopulate)

// Schema middleware for creation
schema.post(schemaMiddlewareEvents.create, function (hotel: any) {
    try {
        if (hotel) {
            // Create activity for the hotel creation
            createActivity({
                data: hotel,
                type: "creation",
                module: "hotel",
                branch: hotel.branch._id,
                user: hotel.created_by._id,
                description: activitySentence("create")
            })
        }
    } catch (error) {
        console.log(`Hotel schema middleware error on create: ${(error as Error).message}`)
    }
})

// Schema middleware for update
schema.post(schemaMiddlewareEvents.update, function (hotel: any) {
    try {
        if (hotel) {
            if (!hotel.visible) {
                // Create activity for the hotel deletion
                createActivity({
                    data: hotel,
                    type: "deletion",
                    module: "hotel",
                    branch: hotel.branch._id,
                    user: hotel.updated_by._id,
                    description: activitySentence()
                })

                // Update related attraction documents
                controllers.updateManyDocument({
                    schema: "attraction",
                    condition: { visible: true },
                    newDocumentData: {
                        $pullAll: { hotels: [hotel._id] }
                    }
                })

            } else {
                // Create activity for the hotel modification
                createActivity({
                    data: hotel,
                    type: "modification",
                    module: "hotel",
                    branch: hotel.branch._id,
                    user: hotel.updated_by._id,
                    description: activitySentence("modify")
                })
            }
        }
    } catch (error) {
        console.log(`Hotel schema middleware error on update: ${(error as Error).message}`)
    }
})

// Schema middleware for delete
schema.post(schemaMiddlewareEvents.delete, function (hotel: any) {
    try {
        if (hotel) {
            // Create activity for the hotel deletion
            createActivity({
                data: hotel,
                type: "deletion",
                module: "hotel",
                branch: hotel.branch,
                user: hotel.created_by,
                description: activitySentence("delete")
            })
        }
    } catch (error) {
        console.log(`Hotel schema middleware error on delete: ${(error as Error).message}`)
    }
})

// Create the Mongoose model for hotel
const hotelModel = model<hotel>("hotel", schema)

// Export the hotel model
export default hotelModel