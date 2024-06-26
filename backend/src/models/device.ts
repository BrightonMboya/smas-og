// Import necessary dependencies and modules
import { controllers } from "bapig";
import { device } from "../interface";
import { Schema, model } from "mongoose";
import { commonSchemaValues } from "../database/schema";
import { customerPopulation } from "../database/population";
import { activitySentence, createActivity, schemaMiddlewareEvents } from "../helpers";

// Define the schema for the 'device' model
const schema = new Schema<device>(
    {
        // Define the 'name' field
        name: {
            index: true,
            type: String,
            required: true
        },

        // Define the 'type' field
        type: {
            index: true,
            type: String,
            required: true
        },

        // Define the 'isGlobal' field
        isGlobal: {
            index: true,
            type: Boolean,
            default: true
        },

        // Define the 'imei' field
        imei: {
            index: true,
            type: String,
            default: null
        },

        // Define the 'model' field
        model: {
            index: true,
            type: String,
            default: null
        },

        // Define the 'brand' field
        brand: {
            index: true,
            type: String,
            default: null
        },

        // Define the 'features' field as an array of objects
        features: [
            {
                index: true,
                type: Object,
                required: true
            }
        ],

        // Define the 'description' field
        description: {
            index: true,
            type: String,
            required: true
        },

        // Define the 'customer' field with autopopulation
        customer: {
            index: true,
            required: true,
            ref: "customer",
            type: Schema.Types.ObjectId,
            autopopulate: { maxDepth: 1, select: customerPopulation }
        },

        // Include common schema values
        ...commonSchemaValues
    },
    { timestamps: true }
);

// Index timestamps for efficient querying
schema.index({ createdAt: -1 }, { background: true });
schema.index({ updatedAt: -1 }, { background: true });

// Use the mongoose-autopopulate plugin for automatic population of references
schema.plugin(require("mongoose-autopopulate"));

// Middleware for the 'create' event
schema.post(schemaMiddlewareEvents.create, function (device: any) {
    try {
        if (device) {
            // Create an activity log for device creation
            createActivity({
                data: device,
                type: "creation",
                module: "device",
                branch: device.branch._id,
                user: device.created_by._id,
                description: activitySentence("create")
            });
        }
    } catch (error) {
        console.log(`device schema middleware error on create: ${(error as Error).message}`);
    }
});

// Middleware for the 'update' event
schema.post(schemaMiddlewareEvents.update, function (device: any) {
    try {
        if (device) {
            if (!device.visible) {
                // Create an activity log for device deletion
                createActivity({
                    data: device,
                    type: "deletion",
                    module: "device",
                    branch: device.branch._id,
                    user: device.updated_by._id,
                    description: activitySentence()
                });

                // Update related documents using the 'controllers.updateManyDocument' method
                const condition: object = { device: device._id };
                const newDocumentData: object = { $set: { visible: device.visible, updated_by: device.updated_by._id } };
                controllers.updateManyDocument({
                    condition,
                    schema: "service",
                    newDocumentData
                });
            } else {
                // Create an activity log for device modification
                createActivity({
                    data: device,
                    type: "modification",
                    module: "device",
                    branch: device.branch._id,
                    user: device.updated_by._id,
                    description: activitySentence("modify")
                });
            }
        }
    } catch (error) {
        console.log(`device schema middleware error on update: ${(error as Error).message}`);
    }
});

// Middleware for the 'delete' event
schema.post(schemaMiddlewareEvents.delete, function (device: any) {
    try {
        if (device) {
            // Create an activity log for device deletion
            createActivity({
                data: device,
                type: "deletion",
                module: "device",
                branch: device.branch,
                user: device.created_by,
                description: activitySentence("delete")
            });

            // Delete related documents using the 'controllers.deleteManyDocument' method
            const condition: object = { device: device._id };
            controllers.deleteManyDocument({
                condition,
                schema: "service",
            });
        }
    } catch (error) {
        console.log(`device schema middleware error on delete: ${(error as Error).message}`);
    }
});

// Create the 'device' model
const deviceModel = model<device>("device", schema);

// Export the 'device' model
export default deviceModel;
