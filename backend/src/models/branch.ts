// Import necessary dependencies
import { controllers } from "bapig"
import { branch } from "../interface"
import { string } from "fast-web-kit"
import { Schema, model } from 'mongoose'
import { commonSchemaValues } from "../database/schema"
import { userPopulation } from "../database/population"
import { activitySentence, contacts, createActivity, emessageAPIKey, getVendorName, schemaMiddlewareEvents, sendSMS } from "../helpers"

// Define the schema for the "branch" collection
const schema = new Schema<branch>(
  {
    // Name of the branch
    name: {
      index: true,
      type: String,
      required: true,
    },

    // Reference to the user associated with the branch
    user: {
      ref: 'user',
      index: true,
      default: null,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: userPopulation }
    },

    // Phone number of the branch
    phone_number: {
      index: true,
      type: String,
      required: true
    },

    // Tax Identification Number (TIN) of the branch
    tin: {
      index: true,
      type: String,
      default: null
    },

    // Type of the branch
    type: {
      index: true,
      type: String,
      default: ""
    },

    // Number of days
    days: {
      default: 0,
      index: true,
      type: Number
    },

    // Image of the branch
    image: {
      index: true,
      type: String,
      default: null
    },

    // Address information of the branch
    address: {
      index: true,
      type: Object,
      default: null
    },

    // Fee associated with the branch
    fee: {
      index: true,
      type: Number,
      default: null
    },

    // API key for the branch
    api_key: {
      index: true,
      type: String,
      default: null
    },

    // Vendor information
    vendor: {
      index: true,
      type: String,
      default: null
    },

    // Email address of the branch
    email: {
      index: true,
      type: String,
      default: null
    },

    // Website of the branch
    website: {
      index: true,
      type: String,
      default: null
    },

    // Settings associated with the branch
    settings: {
      index: true,
      type: Object,
      default: {
        pobox: "",
        sale_note: "",
        invoice_note: "",
        payment_methods: [],
        opening_time: "00:00",
        closing_time: "23:59",
        primary_color: "#0066CC",
        font_family: "Google Sans",
        notifications: [
          "product_stock",
          "daily_report",
          "annual_report",
          "weekly_report",
          "monthly_report",
          "stolen_product",
          "daily_debts_report",
          "incomplete_service",
          "store_product_stock",
          "monthly_subscription",
          "customer_debt_reminder",
          "unpaid_expense_and_purchase",
          "customer_service_completion",
          "customer_sale_or_order_receipt",
        ],
      }
    },

    // Include common schema values
    ...commonSchemaValues,

    // Reference to the parent branch (if applicable)
    branch: {
      default: null,
      type: Schema.Types.ObjectId
    }
  },
  { timestamps: true } // Enable automatic timestamp fields
)

// Create indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Use the mongoose-autopopulate plugin to automatically populate references
schema.plugin(require('mongoose-autopopulate'))

// Schema middleware for post-create event
schema.post(schemaMiddlewareEvents.create, function (branch: any) {
  try {
    if (branch) {
      // Create an activity record for branch creation
      createActivity({
        user: branch.created_by._id,
        data: branch,
        module: "branch",
        type: "creation",
        description: activitySentence("create"),
        branch: branch._id
      })

      // Send an SMS notification to the branch owner
      const receivers: string[] = [`+${branch.phone_number}`]
      const message: string = `${string.removeCase(branch.name, "snake_case").toUpperCase()} branch has been created, to continue using our service please activate your branch or contact us through ${contacts}.`

      sendSMS({
        message,
        receivers,
        apiKey: emessageAPIKey,
        vendor: getVendorName(branch)
      })
    }
  } catch (error) {
    console.log(`Branch schema middleware error (create): ${(error as Error).message}`)
  }
})

// Schema middleware for post-update event
schema.post(schemaMiddlewareEvents.update, function (branch: any) {
  try {
    if (branch) {
      // Handle updates and deletions of the branch
      if (!branch.visible) {
        // Update visibility for related documents
        controllers.updateAllCollections({
          condition: { branch: branch._id },
          newDocumentData: { $set: { visible: branch.visible } }
        })

        // Create an activity record for branch deletion
        createActivity({
          user: branch.updated_by._id,
          data: branch,
          module: "branch",
          type: "deletion",
          description: activitySentence(),
          branch: branch._id
        })

      } else {
        // Create an activity record for branch modification
        createActivity({
          data: branch,
          user: branch.updated_by._id,
          module: "branch",
          type: "modification",
          description: activitySentence("modify"),
          branch: branch._id
        })
      }
    }
  } catch (error) {
    console.log(`Branch schema middleware error (update): ${(error as Error).message}`)
  }
})

// Schema middleware for post-delete event
schema.post(schemaMiddlewareEvents.delete, function (branch: any) {
  try {
    if (branch) {
      // Handle branch deletion
      createActivity({
        user: branch.updated_by,
        data: branch,
        module: "branch",
        type: "deletion",
        description: activitySentence("delete"),
        branch: branch._id
      })

      // Delete related data and files
      controllers.deleteAllCollections({
        condition: { branch: branch._id }
      })

      controllers.deleteSingleFile({
        folderName: "branch",
        fileName: branch.image
      })

      // Update related user documents
      controllers.updateManyDocument({
        schema: "user",
        condition: { visible: true },
        newDocumentData: {
          $pullAll: { branches: [branch._id] }
        }
      })
    }
  } catch (error) {
    console.log(`Branch schema middleware error (delete): ${(error as Error).message}`)
  }
})

// Create the Mongoose model for the "branch" collection
const branchModel = model<branch>('branch', schema)

// Export the Mongoose model
export default branchModel
