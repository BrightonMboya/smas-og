// Import necessary dependencies and modules
import { user } from "../interface"
import { Schema, model } from "mongoose"
import { commonSchemaValues } from "../database/schema"
import { branchPopulation } from "../database/population"
import {
  createActivity,
  schemaMiddlewareEvents,
  activitySentence,
  domain,
  sendSMS,
  emessageAPIKey,
  getVendorName,
} from "../helpers"

// Define the schema for the "user" collection
const schema = new Schema<user>(
  {
    // Define the 'username' field with indexing, required, and unique attributes
    username: {
      index: true,
      type: String,
      required: true,
      unique: true,
    },
    // Define the 'phone_number' field with indexing, required, and unique attributes
    phone_number: {
      index: true,
      type: String,
      required: true,
      unique: true,
    },
    // Define the 'two_factor_authentication_enabled' field with indexing and default attribute
    two_factor_authentication_enabled: {
      index: true,
      type: Boolean,
      default: false,
    },
    // Define the 'phone_number_verified' field with indexing and default attribute
    phone_number_verified: {
      index: true,
      type: Boolean,
      default: false,
    },
    // Define the 'role' field with indexing and autopopulate attribute
    role: {
      index: true,
      ref: "role",
      default: null,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "name permissions" },
    },
    // Define the 'password' field with indexing and required attribute
    password: {
      index: true,
      type: String,
      required: true,
    },
    // Define the 'account_type' field with indexing and default attribute
    account_type: {
      index: true,
      type: String,
      default: "user",
    },
    // Include common schema values
    ...commonSchemaValues,
    // Define the 'created_by' field with indexing and autopopulate attribute
    created_by: {
      index: true,
      ref: "user",
      default: null,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "username" },
    },
    // Define the 'branch' field with indexing and autopopulate attribute
    branch: {
      index: true,
      ref: "branch",
      default: null,
      type: Schema.Types.ObjectId,
      autopopulate: {
        maxDepth: 1,
        select: {
          days: 1,
          visible: 1,
          ...branchPopulation,
        },
      },
    },
    // Define the 'settings' field as an Object with default attributes
    settings: {
      type: Object,
      default: {
        language: "english",
        system_loading: "yes",
      },
    },
    // Define the 'branches' field as an array of ObjectIds
    branches: [
      {
        index: true,
        ref: "branch",
        default: null,
        type: Schema.Types.ObjectId,
      },
    ],
    stores: [
      {
        index: true,
        ref: "store",
        default: null,
        type: Schema.Types.ObjectId,
      },
    ],
  },
  { timestamps: true }
)

// Indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Add Mongoose autopopulate plugin
schema.plugin(require("mongoose-autopopulate"))

// Middleware for "create" event
schema.post(schemaMiddlewareEvents.create, function (user: any) {
  try {
    if (user) {
      // Create activity entry for creation
      createActivity({
        data: user,
        module: "user",
        type: "creation",
        branch: user.branch?._id,
        user: user.created_by?._id,
        description: activitySentence("create"),
      })

      if (user.created_by && user.role) {
        // Send an SMS notification to the newly created user
        const receivers: string[] = [`+255${user.phone_number.substring(1)}`]
        const message = `A new account has been created. Use these credentials to log in:\nAccount: ${user.username}, Password: ${user.phone_number}\nRemember to change your password and enable two-factor authentication.\n${domain}`
        sendSMS({
          message,
          receivers,
          apiKey: emessageAPIKey,
          vendor: getVendorName(user.branch),
        })
      }
    }
  } catch (error) {
    console.log(`User schema middleware error on create: ${(error as Error).message}`)
  }
})

// Middleware for "update" event
schema.post(schemaMiddlewareEvents.update, function (user: any) {
  try {
    if (user) {
      if (!user.visible) {
        // Create activity entry for deletion
        createActivity({
          data: user,
          module: "user",
          type: "deletion",
          branch: user.branch?._id,
          user: user.updated_by?._id,
          description: activitySentence(),
        })
      } else {
        // Create activity entry for modification
        createActivity({
          data: user,
          module: "user",
          type: "modification",
          branch: user.branch?._id,
          user: user.updated_by?._id,
          description: activitySentence("modify"),
        })
      }
    }
  } catch (error) {
    console.log(`User schema middleware error on update: ${(error as Error).message}`)
  }
})

// Middleware for "delete" event
schema.post(schemaMiddlewareEvents.delete, function (user: any) {
  try {
    if (user) {
      // Create activity entry for deletion
      createActivity({
        data: user,
        module: "user",
        type: "deletion",
        branch: user.branch?._id,
        user: user.updated_by._id,
        description: activitySentence("delete"),
      })
    }
  } catch (error) {
    console.log(`User schema middleware error on delete: ${(error as Error).message}`)
  }
})

// Create the Mongoose model for "user"
const userModel = model<user>("user", schema)

// Export the "user" model for global accessibility
export default userModel