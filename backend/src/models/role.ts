// Import required dependencies and modules
import { role } from "../interface"
import { Schema, model } from "mongoose"
import { commonSchemaValues } from "../database/schema"
import { createActivity, schemaMiddlewareEvents, activitySentence } from "../helpers"

// Define the schema for the "role" collection
const schema = new Schema<role>(
  {
    // Define the 'name' field with indexing and required attribute
    name: {
      index: true,
      type: String,
      required: true
    },
    // Define the 'description' field with indexing and default value
    description: {
      index: true,
      type: String,
      default: null
    },
    // Define the 'permissions' array field with indexing and required strings
    permissions: [
      {
        index: true,
        type: String,
        required: true
      }
    ],
    // Include common schema values
    ...commonSchemaValues,
    // Define the 'branch' field with indexing, default value, ref, and autopopulate
    branch: {
      index: true,
      ref: 'branch',
      default: null,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "name" }
    },
  },
  { timestamps: true }
)

// Indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Add Mongoose autopopulate plugin
schema.plugin(require('mongoose-autopopulate'))

// Middleware for "create" event
schema.post(schemaMiddlewareEvents.create, function (role: any) {
  try {
    if (role) {
      createActivity({
        data: role,
        module: "role",
        type: "creation",
        branch: role.branch?._id,
        user: role.created_by._id,
        description: activitySentence("create")
      })
    }
  } catch (error) {
    console.log(`Role schema middleware error on create: ${(error as Error).message}`)
  }
})

// Middleware for "update" event
schema.post(schemaMiddlewareEvents.update, function (role: any) {
  try {
    if (role) {
      if (!role.visible) {
        createActivity({
          data: role,
          module: "role",
          type: "deletion",
          branch: role.branch?._id,
          user: role.updated_by._id,
          description: activitySentence()
        })

        // controllers.updateManyDocument({
        //   schema: "user",
        //   condition: { role: role._id },
        //   newDocumentData: { $set: { visible: false } }
        // })
      } else {
        createActivity({
          data: role,
          module: "role",
          type: "modification",
          branch: role.branch?._id,
          user: role.updated_by._id,
          description: activitySentence("modify")
        })
      }
    }
  } catch (error) {
    console.log(`Role schema middleware error on update: ${(error as Error).message}`)
  }
})

// Middleware for "delete" event
schema.post(schemaMiddlewareEvents.delete, function (role) {
  try {
    if (role) {
      createActivity({
        data: role,
        module: "role",
        type: "deletion",
        branch: role.branch,
        user: role.updated_by,
        description: activitySentence("delete")
      })

      // controllers.deleteManyDocument({
      //   schema: "user",
      //   condition: { role: role._id }
      // })
    }
  } catch (error) {
    console.log(`Role schema middleware error on delete: ${(error as Error).message}`)
  }
})

// Create the Mongoose model for "role"
const roleModel = model<role>('role', schema)

// Export the "role" model
export default roleModel