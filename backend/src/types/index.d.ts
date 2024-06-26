// dependencies
import { Schema } from "mongoose"

// server environment type
export type environmentType = "production" | "development"

// server information
export type serverInformationType = {
    port: number
    databaseName: string
    connectionString: string
    environment: environmentType
}

// activity type
export type activityType = {
    data: object
    module: string
    description: string
    user: Schema.Types.ObjectId
    branch: Schema.Types.ObjectId
    type: "creation" | "modification" | "deletion"
}

export type adjustmentType = {
    adjustment: number
    data: any
    type: "increase" | "decrease"
    from: "sale" | "purchase" | "store_product" | "service" | "sale_cart"
}

export type sendMessage = {
    apiKey: string
    vendor: string
    message: string
    receivers: string[]
}
