// Import required dependencies and modules
import numeral from "numeral"
import { controllers } from "bapig"
import { string } from "fast-web-kit"
import { Schema, model } from "mongoose"
import { commonInterface } from "../interface"
import { commonSchemaValues } from "../database/schema"
import {
  activitySentence,
  createActivity,
  domain,
  emessageAPIKey,
  getVendorName,
  schemaMiddlewareEvents,
  sendSMS
} from "../helpers"

// Define the schema for payment
const schema = new Schema<commonInterface>(
  {
    // Define the 'type' field with indexing and required attribute
    type: {
      index: true,
      type: String,
      required: true
    },
    // Define the 'total_amount' field with indexing and required attribute
    total_amount: {
      index: true,
      type: Number,
      required: true
    },
    // Define the 'status' field with indexing and default value
    status: {
      index: true,
      type: String,
      default: "active"
    },
    // Define the 'profit' field with indexing and default value
    profit: {
      index: true,
      type: Number,
      default: 0
    },
    // Define the 'user' field with indexing, ref, and autopopulate
    user: {
      index: true,
      ref: "user",
      default: null,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1 }
    },
    // Include common schema values
    ...commonSchemaValues
  },
  { timestamps: true }
)

// Indexes for timestamps
schema.index({ createdAt: -1 }, { background: true })
schema.index({ updatedAt: -1 }, { background: true })

// Add Mongoose autopopulate plugin
schema.plugin(require('mongoose-autopopulate'))

// Schema middleware for create
schema.post(schemaMiddlewareEvents.create, function (payment: any) {
  try {
    if (payment) {
      // Create activity for payment creation
      createActivity({
        data: payment,
        type: "creation",
        module: "payment",
        branch: payment.branch._id,
        user: payment.created_by._id,
        description: activitySentence("create")
      })

      const fee: number = payment.branch.fee
      const amount: number = payment.total_amount
      const receivers: string[] = [`+${payment.branch.phone_number}`]

      if (payment.type === "monthly_subscription") {
        const days: number = (amount / fee) * 31
        controllers.updateSingleDocument({
          schema: "branch",
          newDocumentData: { $inc: { days } },
          condition: { _id: payment.branch._id }
        })
      } else if (payment.type === "system_installation") {
        controllers.updateSingleDocument({
          schema: "branch",
          condition: { _id: payment.branch._id },
          newDocumentData: { $inc: { days: 31 } }
        })
      }

      const message: string = `Hi! Payment of TZS ${numeral(amount).format("0,0")} for ${string.removeCase(
        payment.type,
        "snake_case"
      )} has been received. Thank you for trusting us.\n${domain}`

      sendSMS({
        message,
        receivers,
        apiKey: emessageAPIKey,
        vendor: getVendorName(payment.branch)
      })
    }
  } catch (error) {
    console.log(`Payment schema middleware create error: ${(error as Error).message}`)
  }
})

// Schema middleware for update
schema.post(schemaMiddlewareEvents.update, function (payment: any) {
  try {
    if (payment) {
      const branchId = payment.branch._id
      const fee: number = payment.branch.fee
      const amount: number = payment.total_amount
      const receivers: string[] = [`+${payment.branch.phone_number}`]

      if (payment.type === "monthly_subscription" && payment.status === "canceled") {
        const days: number = (amount / fee) * 31
        controllers.updateSingleDocument({
          schema: "branch",
          condition: { _id: branchId },
          newDocumentData: { $inc: { days: -days } }
        })
      } else if (payment.type === "system_installation" && payment.status === "canceled") {
        controllers.updateSingleDocument({
          schema: "branch",
          condition: { _id: branchId },
          newDocumentData: { $inc: { days: -30 } }
        })
      }

      if (payment.status === "canceled") {
        const message = `Hi! Payment of TZS ${numeral(amount).format("0,0")} for ${string.removeCase(
          payment.type,
          "snake_case"
        )} has been canceled. Thank you for trusting us.\n${domain}`

        sendSMS({
          message,
          receivers,
          apiKey: emessageAPIKey,
          vendor: getVendorName(payment.branch)
        })

        createActivity({
          data: payment,
          type: "deletion",
          module: "payment",
          branch: payment.branch._id,
          user: payment.updated_by._id,
          description: activitySentence()
        })
      }
    }
  } catch (error) {
    console.log(`Payment schema middleware update error: ${(error as Error).message}`)
  }
})

// Create the Mongoose model for payment
const paymentModel = model<commonInterface>('payment', schema)

// Export the payment model
export default paymentModel
