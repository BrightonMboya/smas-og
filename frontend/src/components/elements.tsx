/* requiring dependencies */
import React from "react"
import { ApplicationContext } from "../context"
import { FloatingButton } from "./button"
import Dialog from "./dialog"
import { getInfo, isAdmin, text } from "../helpers"
import { Route, Switch } from "react-router-dom"
import routes, { route } from "../routes"

/* icon */
export type icon = {
    type?: "rounded" | "outlined" | "sharp" | string
    name: string
    position?: "right" | "left" | "prefix"
    rotate?: boolean
    onClick?: any
}

/* icon */
export const Icon: React.FunctionComponent<icon> = React.memo((props: icon) => (
    <i className={`material-symbols-${props.type || "rounded"} hide-on-print ${props.position} ${props.rotate ? "rotate" : ""} `} onClick={props.onClick}>{props.name}</i>
))

// application view rendering
export const Main: React.FunctionComponent = React.memo(() => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // remove notification after five seconds
    React.useEffect(() => {
        if (application.state.notification) {
            setTimeout(() => {
                application.dispatch({ notification: "" })
            }, 5000)
        }
        // eslint-disable-next-line
    }, [application.state.notification])

    React.useEffect(() => {
        application.retrieveUserAndAuthenticate()
        // eslint-disable-next-line
    }, [])

    return (
        <main id={application.state.authenticated ? "main" : ""}>
            {
                application.state.authenticated ?
                    <>
                        <FloatingButton
                            to="#"
                            icon="menu"
                            tooltip=""
                            class="floating-button-menu"
                            onClick={application.toggleSidebar}
                        />
                        {
                            !isAdmin && (getInfo("user", "branch")?.days <= 0)
                                ?
                                <Dialog
                                    hideAction={true}
                                    toggleDialog={application.toggleComponent}
                                    action={async () => { console.log("payment reminder") }}
                                    text={`Please note that your services have been suspended because of an overdue payment. It is crucial to address this within the next 7 days to prevent permanent data deletion.

                                    We urge you to settle the outstanding balance promptly to avoid data loss. For assistance, please reach out to us.`}
                                    title={`Payment Reminder`}
                                />
                                // : !isAdmin && !isWorkingHours()
                                //     ? <Dialog
                                //         hideAction={true}
                                //         toggleDialog={application.toggleComponent}
                                //         action={async () => { console.log("working hours reminder") }}
                                //         text={`We regret to inform you that due to your shop settings hours having already passed, you may not be able to access certain features or services on our system, as per the shop settings hours you have specified ${getWorkingHours()}, the system may not be available for access beyond the designated operating hours.`}
                                //         title={`Notice of Unavailable Access`}
                                //     />
                                : null
                        }
                        <Dialog
                            title={`${text.reFormat(application.state.schema)} Confirmation`}
                            text={`Are you sure you want to ${application.state.backendStatus === "restored" ? "restore" : application.state.backendStatus === "canceled" ? "cancel" : application.state.backendStatus === "completed" ? "complete" : application.state.backendStatus === "disabled" ? "disable" : application.state.backendStatus === "enabled" ? "enable" : application.state.backendStatus === "deleted" ? "delete" : "change status" } ${application.state.ids.length > 1 ? `these ${text.reFormat(application.state.collection)}` : `this ${text.reFormat(application.state.schema)}`}?`}
                            action={application.updateBackendStatus}
                            toggleDialog={application.toggleComponent}
                        />
                    </>
                    : null
            }
            <Switch>
                {
                    routes.map((route: route, index: number) => {

                        // unprotected routes
                        if (route.guest && !application.state.authenticated)
                            return (
                                <Route
                                    key={index}
                                    path={route.path}
                                    render={(props) => (<route.component {...props} />)}
                                    exact
                                />
                            )

                        // protected routes
                        if (!route.guest && application.state.authenticated) {
                            return (
                                <Route
                                    key={index}
                                    path={route.path}
                                    render={(props) => (<route.component {...props} />)}
                                    exact
                                />
                            )
                        }

                        return null

                    })
                }
            </Switch>
        </main>
    )
})

