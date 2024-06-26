// dependencies
import state from "./state"
import { action } from "../types"
import initialState from "./initial-state"

// reducer
const reducer = (state: state, action: action): state => {
    try {

        const newStateValues: state = { ...state, ...action }
        const stateKeys = Object.getOwnPropertyNames(action)
        const type = stateKeys[0]

        // checking wether reducer action types contains "Error" keyword so that we can change disabled state to true
        if (type.includes("Error"))
            // copy the previous state then update only the received keywords and set disabled to true
            return { ...newStateValues, disabled: true }

        // checking for action that are'nt allowed to change disabled state
        if ((type === "authenticated") || (type === "disabled") || (type === "loading"))
            // copy the previous state then update only the received keywords
            return newStateValues

        if ((type === "unMount"))
            // return initial state
            return { ...initialState, authenticated: state.authenticated ? true : false, notification: state.notification, theme: state.theme, primaryColor: state.primaryColor }

        // copy the previous state then update only the received keywords, set disabled to true and update "Error" field with empty string
        return { ...newStateValues, [`${type}Error`]: "", disabled: false }

    } catch (error) {
        console.log(`Reducer error ${(error as Error).message}`)
        return state
    }
}

// exporting reducer
export default reducer