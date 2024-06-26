import http from "http"
import https from "https"
import cluster from "cluster"
import mongoose from "mongoose"
import { helpers } from "bapig"
import { createSystemAccount, serverInformation } from "../helpers"

mongoose.set('strictQuery', true)

// Function to handle database connection with retry logic
const databaseConnectionWithRetry = async (server: http.Server | https.Server) => {
    try {
        // Calculate the number of CPU cores to be used for clustering
        const usedCPUCores = helpers.numberOfCPUs - 0

        // Check if this process is the primary and environment is production
        if (cluster.isPrimary && serverInformation.environment === "production") {
            console.log(`Primary ${process.pid} is in control running with ${usedCPUCores} threads`)

            // Fork worker processes for each available core
            for (let i = 0; i < usedCPUCores; i++) {
                cluster.fork()
            }

            // Handle worker online event
            cluster.on('online', function (worker) {
                if (worker.process.connected) {
                    console.log('Worker ' + worker.process.pid + ' is online')
                }
            })

            // Handle worker disconnect event
            cluster.on('disconnect', (worker) => {
                console.log(`worker ${worker.process.pid} disconnected, a new one will be created once it exits`)
            })

            // Handle worker exit event
            cluster.on('exit', (worker, _exitCode, _signalCode) => {
                console.log(`worker ${worker.process.pid} died`)
                cluster.fork()
                console.log(`worker ${worker.process.pid} is attempting to signal for a new worker to take its place`)
            })
        } else {
            // Connect to the database
            const databaseConnected = await mongoose.connect(`${serverInformation.connectionString}/${serverInformation.databaseName}`)

            if (databaseConnected) {
                require("./collections")
                const { worker } = cluster

                // Execute setup tasks on first worker or in development environment
                if ((worker && worker.id === 1) || (serverInformation.environment === "development")) {
                    createSystemAccount()
                    require("../helpers/dailyActivity")
                }

                // Start the server to listen on the specified port
                server.listen(serverInformation.port, () => {
                    console.log(`Database has been connected and ${serverInformation.environment} server is running on http://127.0.0.1:${serverInformation.port}`)
                })
            } else {
                // Retry the database connection after a delay if it fails
                console.log(`Database connection failed`)
                setInterval(() => databaseConnectionWithRetry(server), 5000)
            }
        }
    } catch (error) {
        // Handle errors and retry the database connection after a delay
        console.log(`Database connection error: ${(error as Error).message}`)
        setInterval(() => databaseConnectionWithRetry(server), 5000)
    }
}

export default databaseConnectionWithRetry
