// Import required dependencies and modules
import { controllers } from "bapig"
import { Schema, model } from "mongoose"
import { commonInterface } from "../interface"
import { commonSchemaValues } from "../database/schema"
import {
  activitySentence,
  createActivity,
  schemaMiddlewareEvents
} from "../helpers";

// Define the schema for the product
const schema = new Schema<commonInterface>(
  {
    // Define the 'name' field with indexing and default value
    name: {
      index: true,
      type: String,
      default: null
    },
    // Define the 'buying_price' field with indexing and required attribute
    buying_price: {
      index: true,
      type: Number,
      required: true
    },
    // Define the 'selling_price' field with indexing and required attribute
    selling_price: {
      index: true,
      type: Number,
      required: true
    },
    // Define the 'stock' field with indexing and required attribute
    stock: {
      index: true,
      type: Number,
      required: true
    },
    // Define the 'reorder_stock_level' field with indexing and required attribute
    reorder_stock_level: {
      index: true,
      type: Number,
      required: true
    },
    // Define the 'quantity' field with indexing and required attribute
    quantity: {
      index: true,
      type: Number,
      required: true
    },
    // Define the 'barcode' field with indexing and default value
    barcode: {
      index: true,
      type: String,
      default: null
    },
    // Define the 'is_store_product' field with indexing and default value
    is_store_product: {
      index: true,
      type: Boolean,
      default: false
    },

    // Define the 'store' field with indexing, ref, and autopopulate
    store: {
      index: true,
      ref: 'store',
      default: null,
      type: Schema.Types.ObjectId,
      autopopulate: { maxDepth: 1, select: "name" }
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
  { timestamps: true }
);

// Indexes for timestamps
schema.index({ createdAt: -1 }, { background: true });
schema.index({ updatedAt: -1 }, { background: true });

// Add Mongoose autopopulate plugin
schema.plugin(require('mongoose-autopopulate'));

// Middleware for create
schema.post(schemaMiddlewareEvents.create, async function (product: any) {
  try {
    if (product) {
      // Create activity for product creation
      createActivity({
        data: product,
        module: "product",
        type: "creation",
        branch: product.branch._id,
        user: product.created_by._id,
        description: activitySentence("create")
      });

      if (product.stock > 0) {
        // Create a new purchase
        const purchaseCreated = await controllers.createSingleDocument({
          schema: "purchase",
          documentData: {
            product: product._id,
            quantity: product.stock,
            branch: product.branch._id,
            date: new Date().toISOString(),
            created_by: product.created_by._id,
            for_store_product: product.is_store_product,
            store: product.store ? product.store._id : null,
            paid_amount: product.buying_price * product.stock,
            total_amount: product.buying_price * product.stock,
          }
        });

        // Check if there's a failure in purchase creation
        if (!purchaseCreated.success) {
          await controllers.deleteSingleDocument({
            schema: "product",
            condition: { _id: product._id }
          });
        }
      }
    }
  } catch (error) {
    console.log(`Product Schema Middleware (create) Error: ${(error as Error).message}`);
  }
});

// Middleware for update
schema.post(schemaMiddlewareEvents.update, async function (product: any) {
  try {
    if (product) {
      if (!product.visible) {
        // Create activity for product deletion
        createActivity({
          data: product,
          module: "product",
          type: "deletion",
          branch: product.branch._id,
          user: product.updated_by._id,
          description: activitySentence()
        });

        // Filter, update, and options object
        const condition: object = { product: product._id };
        const newDocumentData: object = {
          $set: { visible: product.visible, updated_by: product.updated_by._id }
        };

        // Change visibility status for related documents
        controllers.bulkUpdateManyDocument([
          { schema: "sale", condition, newDocumentData },
          { schema: "stock", condition, newDocumentData },
          { schema: "service", condition, newDocumentData },
          { schema: "purchase", condition, newDocumentData },
          { schema: "adjustment", condition, newDocumentData }
        ]);
      } else {
        // Create activity for product modification
        createActivity({
          data: product,
          module: "product",
          type: "modification",
          branch: product.branch._id,
          user: product.updated_by._id,
          description: activitySentence("modify")
        });

        if (product.buying_price > 0) {
          const purchaseExist = await controllers.getSingleDocument({
            schema: "purchase",
            condition: { product: product._id, total_amount: 0, paid_amount: 0 },
            select: {},
            joinForeignKeys: false,
          });

          if (purchaseExist.success) {
            const purchase = purchaseExist.message;
            const amount = product.buying_price * purchase.quantity;
            controllers.updateSingleDocument({
              schema: "purchase",
              condition: { _id: purchase._id },
              newDocumentData: {
                $set: {
                  paid_amount: amount,
                  total_amount: amount,
                  updated_by: product.updated_by._id
                }
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(`Product Schema Middleware (update) Error: ${(error as Error).message}`);
  }
});

// Middleware for delete
schema.post(schemaMiddlewareEvents.delete, function (product: any) {
  try {
    if (product) {
      // Create activity for product deletion
      createActivity({
        data: product,
        module: "product",
        type: "deletion",
        branch: product.branch,
        user: product.updated_by,
        description: activitySentence("delete")
      });

      // Condition
      const condition: object = { product: product._id };

      // Delete related documents
      controllers.documentBulkDeleteMany([
        { schema: "sale", condition },
        { schema: "stock", condition },
        { schema: "service", condition },
        { schema: "purchase", condition },
        { schema: "adjustment", condition },
      ]);
    }
  } catch (error) {
    console.log(`Product Schema Middleware (delete) Error: ${(error as Error).message}`);
  }
});

// Create the Mongoose model for product
const productModel = model<commonInterface>('product', schema);

// Export the product model
export default productModel;
