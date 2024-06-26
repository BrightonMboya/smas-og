// Import necessary dependencies
import { activity } from "../interface"
import { Schema, model } from 'mongoose'
import { commonSchemaValues } from "../database/schema"

// Define the schema for the "activity" collection
const schema = new Schema<activity>(
    {
        // Reference to the user who performed the activity
        user: {
            ref: 'user', // Reference to the "user" collection
            index: true,
            required: true,
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: "username" }, // Autopopulate user's username
        },

        // Data associated with the activity
        data: {
            type: Object,
            required: true
        },

        // Module associated with the activity
        module: {
            index: true,
            type: String,
            required: true
        },

        // Type of activity (e.g., creation, deletion, modification)
        type: {
            index: true,
            type: String,
            required: true
        },

        // Description of the activity
        description: {
            index: true,
            type: String,
            required: true
        },

        // Common schema values shared among different collections
        ...commonSchemaValues,

        // User who created the activity (default is null)
        created_by: {
            default: null,
            type: Schema.Types.ObjectId
        },

        // User who updated the activity (default is null)
        updated_by: {
            default: null,
            type: Schema.Types.ObjectId
        },
    },
    { timestamps: true } // Enable automatic timestamp fields
)

// Create indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Use the mongoose-autopopulate plugin to automatically populate references
schema.plugin(require('mongoose-autopopulate'))

// Create the Mongoose model for the "activity" collection
const activityModel = model<activity>('activity', schema)

// Export the Mongoose model
export default activityModel