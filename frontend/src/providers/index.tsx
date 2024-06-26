// dependencies
import React from "react"
import reducer from "../hooks/reducer"
import { ApplicationContext } from "../context"
import Application from "../helpers/application"
import { application, children } from "../types"
import initialState from "../hooks/initial-state"

// creating and exporting application provider
export const ApplicationProvider: React.FunctionComponent<children> = React.memo(({ children }) => {

    // state management
    const [state, dispatch] = React.useReducer(reducer, initialState)

    // application
    const application: application = new Application(state, dispatch)

    // returning component
    return (
        <ApplicationContext.Provider value={{ application }}>
            {children}
        </ApplicationContext.Provider>
    )
})