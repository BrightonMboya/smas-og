// dependencies
import React from "react"
import { application } from "../types"
import initialState from "../hooks/initial-state"
import Application from "../helpers/application"

// application context
export const ApplicationContext = React.createContext<{ application: application }>
(
    {
        application: new Application(initialState, () => { }),
    }
)

// authentication context
export const AuthContext = React.createContext<boolean>(false)