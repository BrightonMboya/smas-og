import fs from "fs"
import zlib from "zlib"
import path from "path"
import https from "https"
import axios from "axios"
import { controllers, schema } from "bapig"
import { array, string } from "fast-web-kit"
import { activityType, adjustmentType, environmentType, sendMessage, serverInformationType } from "../types"
import { branch } from "./activities"
import { controllerResponse } from "bapig/dist/types"

// Database password
const databasePassword: string = process.env.DATABASE_PASSWORD || ""

// Middleware events for schema
export const schemaMiddlewareEvents: any = {
    create: "save",
    update: "findOneAndUpdate",
    delete: "findOneAndDelete"
}

// Application domain name
export const domain: string = "https://smas.app"

// Emessage API key
export const emessageAPIKey: string = "c13431e1e81ee16e431e1e8c7c3813"

// SMAS app contacts
export const contacts: string = "+255757628215 or ++255752628215"

// Paths to SSL key and cert files
const key: string = `/etc/letsencrypt/live/${domain.substring(8)}/privkey.pem`
const cert: string = `/etc/letsencrypt/live/${domain.substring(8)}/fullchain.pem`

// Get server environment
export const getEnvironment = (): environmentType => {
    let environment: environmentType = "development"
    try {
        const keyExists: boolean = fs.existsSync(path.join(key))
        const certExists: boolean = fs.existsSync(path.join(cert))

        if (keyExists && certExists) {
            environment = "production"
        }
        return environment
    } catch (error) {
        console.log((error as Error).message)
        return environment
    }
}

// Create activity record
export const createActivity = (activity: activityType) => {
    try {
        controllers.createSingleDocument({
            schema: "activity",
            documentData: {
                data: activity.data,
                user: activity.user,
                type: activity.type,
                module: activity.module,
                branch: activity.branch,
                description: activity.description
            }
        })
    } catch (error) {
        console.log(`Activity creation failed: ${(error as Error).message}`)
    }
}

// Generate activity sentence based on type
export const activitySentence = (type?: "create" | "delete" | "modify"): string => {
    let text: string = "data was deleted temporarily"
    if (type === "create") {
        text = "data was created"
    } else if (type === "delete") {
        text = "data was deleted permanently"
    } else if (type === "modify") {
        text = "data was modified"
    }
    return text
}

// Create system admin account
export const createSystemAccount = async () => {
    try {
        // Check if a system account already exists
        const accountExist = await controllers.getSingleDocument({
            schema: "user",
            select: { _id: 1 },
            joinForeignKeys: false,
            condition: { role: null, account_type: "smasapp", created_by: null },
        })

        if (!accountExist.success) {
            // Create a new system account
            const newAccount = await controllers.createDocumentFieldEncryption({
                schema: "user",
                fieldToEncrypt: "password",
                documentData: {
                    username: "smas_app",
                    account_type: "smasapp",
                    phone_number: "0752628215",
                    phone_number_verified: true,
                    password: "pLabTech23@#",
                    two_factor_authentication_enabled: true
                }
            })

            if (newAccount.success) {
                console.log(`System account has been created`)
            } else {
                console.log(`Failed to create system account: ${newAccount.message}`)
            }
        }
    } catch (error) {
        console.log(`System account creation error ${(error as Error).message}`)
    }
}

// Adjust product stock
export const adjustStock = async (options: adjustmentType) => {
    try {
        // Extract information from options
        const adjustment = options.adjustment // Amount by which stock is adjusted
        const before_adjustment = options.data.product.stock // Stock quantity before adjustment
        const after_adjustment = options.type === "increase" ? adjustment + before_adjustment : before_adjustment - adjustment // Calculate stock quantity after adjustment

        // Determine the module (store or product) for the adjustment
        const module = options.data.product.is_store_product || options.data?.for_store_product ? "store" : "product"

        // Generate adjustment description
        const description: string = `Stock was automatically ${options.type === "increase" ? "increased" : "decreased"} because ${options.from.includes("sale") ? "sale" : string.removeCase(options.from, "snake_case")} was ${(((options.type === "increase") && (options.from.includes("sale"))) || ((options.type === "decrease") && (options.from === "purchase"))) ? "deleted" : "created"}, stock was adjusted from ${before_adjustment} to ${after_adjustment}, stock adjustment was ${adjustment}.`

        const id = options.data._id // ID of the data (e.g., sale, purchase) causing the adjustment

        // Create a record in the "adjustment" collection
        controllers.createSingleDocument({
            schema: "adjustment",
            documentData: {
                module,
                adjustment,
                description,
                after_adjustment,
                before_adjustment,
                category: options.data?.category?._id,
                type: options.type, // Adjustment type (increase or decrease)
                from: options.from, // Source of the adjustment (e.g., sale, purchase)
                branch: options.data.branch._id, // ID of the branch
                user: options.data.created_by._id, // ID of the user who triggered the adjustment
                product: options.data.product._id, // ID of the product being adjusted
                created_by: options.data.created_by._id,
                sale: options.from.includes("sale") ? id : null, // ID of the associated sale (if applicable)
                purchase: options.from === "purchase" ? id : null, // ID of the associated purchase (if applicable)
                service: options.from === "service" ? id : null, // ID of the associated service (if applicable)
            }
        })
    } catch (error) {
        console.log(`Stock adjustment error: ${(error as Error).message}`)
    }
}

// Send text message via emessage
export const sendSMS = async (options: sendMessage): Promise<void> => {
    try {
        if (options.message.trim().length > 0) {
            await axios({
                data: options,
                method: "POST",
                url: "https://emessage.co.tz/api/send-message"
            })
        }
    } catch (error) {
        console.log(`Sending SMS error: ${(error as Error).message}`)
    }
}

const serverEnvironment = getEnvironment()

// Server information
export const serverInformation: serverInformationType = {
    port: 2001,
    databaseName: "smasapp",
    environment: serverEnvironment,
    connectionString: serverEnvironment === "production" ? `mongodb+srv://hekima:${databasePassword}@hekima.vnkuxnq.mongodb.net` : "mongodb://127.0.0.1:27017"
}

// HTTPS options for server
export const httpsOptions: https.ServerOptions = {
    key: serverInformation.environment === "production" ? fs.readFileSync(key) : "",
    cert: serverInformation.environment === "production" ? fs.readFileSync(cert) : ""
}

// Get vendor name based on branch
export function getVendorName(branch: branch): string {
    let vendorName: string = "Smas App" // Default vendor name
    try {
        if (branch && branch.api_key && branch.vendor) {
            vendorName = branch.vendor
        }
        return vendorName
    } catch (error) {
        console.log((error as Error).message)
        return vendorName
    }
}

/**
 * Zip the data of a given branch.
 *
 * @param branch - The branch object for which data needs to be zipped.
 * @param fileName - The name of the file where the data will be temporarily stored before zipping.
 * @returns A promise with a controllerResponse object indicating the success status and the zipped data or an error message.
 */
export const zipBranchData = async (branch: any, fileName: string, deleteZip = true): Promise<controllerResponse> => {
    try {
        // Retrieve all database models/schemas
        const databaseModels: controllerResponse = schema.getAllSchema()

        // Check if database models were successfully retrieved
        if (databaseModels.success) {
            const models = databaseModels.message
            // Initialize the structure to store branch data
            const branchData: { branch: object, data: any[] } = { branch, data: [] }

            // Iterate over each model to fetch related data for the branch
            for (const model of models) {
                // Fetch data for the model related to the given branch
                const modelData: any[] = await model.model.find({ branch: branch._id }).lean({ autopopulate: false }).exec()

                // Check if the fetched data is not empty, then add it to the branchData object
                if (!array.isEmpty(modelData))
                    branchData.data.push({ [model.name]: modelData })
            }

            // Write the branch data to a temporary file
            fs.writeFileSync(fileName, JSON.stringify(branchData))

            // Read the temporary file data
            const data = fs.readFileSync(fileName)
            // Zip the read data
            const zipped = zlib.gzipSync(data)

            if (deleteZip)
                // Clean up: Delete the temporary file
                fs.unlinkSync(fileName)

            // Return the zipped data with a success status
            return { success: true, message: zipped }
        }

        // If database models were not retrieved successfully, return the error response
        return databaseModels

    } catch (error) {
        // Return an error response in case of any unexpected issues
        return { success: false, message: (error as Error).message }
    }
}


export const unzipBranchData = async (zippedData: Buffer, branchId: string): Promise<controllerResponse> => {
    try {
        // Unzip the data
        const unzipped = zlib.gunzipSync(zippedData)

        // Parse the unzipped data
        const branchData = JSON.parse(unzipped.toString())

        // Retrieve all database models/schemas
        const databaseModels: controllerResponse = schema.getAllSchema()

        // Check if database models were successfully retrieved
        if (databaseModels.success) {
            const models = databaseModels.message

            // Iterate over each model and insert data back into the database
            for (const modelData of branchData.data) {
                const modelName = Object.keys(modelData)[0]
                const data = modelData[modelName]

                // Find the corresponding model
                const model = models.find((m: any) => m.name === modelName)

                // Check if model exists
                if (model) {

                    // Update the branch reference for each document
                    const updatedData = data.map((doc: any) => ({ ...doc, branch: branchId }))

                    // Insert data for the model
                    await model.model.insertMany(updatedData)
                }
            }

            // Return a success response
            return { success: true, message: 'Data successfully imported into the database.' }
        }

        // If database models were not retrieved successfully, return the error response
        return databaseModels

    } catch (error) {
        // Return an error response in case of any unexpected issues
        return { success: false, message: (error as Error).message }
    }
}