/* dependencies */
import React from "react"
import { ApplicationContext } from "../context"

/* loader */
const Loader: React.FunctionComponent<{ loading?: boolean }> = React.memo(({ loading }) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    if (loading || application.state.loading)
        return (
            <div className="loader-container">
                <div className="loader">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>

        )

    return null
})

/* exporting component */
export default Loader