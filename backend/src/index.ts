// dependencies
import cors from "cors"
import http from "http"
import https from "https"
import customRoute from "./routes"
import { router, helpers } from "bapig"
import fileUploader from "express-fileupload"
import express, { Application } from "express"
import { serverEntrace } from "./middleware"
import { httpsOptions, serverInformation } from "./helpers"
import databaseConnectionWithRetry from "./database/connection"

// application initialization
const application: Application = express()

// application middleware
application.disable("x-powered-by")
application.use(cors({ origin: "*" }))
application.use(express.json({ limit: "100mb" }))
application.use(express.static(helpers.staticFilesDirectory))
application.use(fileUploader())
application.use(serverEntrace)

// api's
application.use("/api", router)
application.use("/custom", customRoute)

// server
const server: http.Server | https.Server = serverInformation.environment === "development" ? http.createServer(application) : https.createServer(httpsOptions, application)

// initiate database connection
databaseConnectionWithRetry(server)