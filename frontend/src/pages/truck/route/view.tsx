// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../../components/button"
import { Textarea } from "../../../components/form"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../../types"
import { ApplicationContext } from "../../../context"
import ViewDetail from "../../../components/view-detail"
import { Icon } from "../../../components/elements"
import { number } from "fast-web-kit"

// route view memorized function component
const RouteView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_route"))
            onMount()
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }
        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            if (props.location.state) {
                const { route }: any = props.location.state
                if (route) {

                    const joinForeignKeys: boolean = true
                    const condition: string = JSON.stringify({ _id: route })
                    const select: string = JSON.stringify({})
                    const parameters: string = `schema=route&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read",
                    }

                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        setPageTitle("view route")
                        application.dispatch({
                            schema: "route",
                            collection: "routes",
                            route: response.message,
                            ids: [response.message._id]
                        })
                    }
                    else
                        application.dispatch({ notification: response.message })
                }
                else
                    props.history.goBack()
            }
            else
                props.history.goBack()

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {application.state.route?.from[0]}
                                {application.state.route?.to[0]}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state.route?.from)} - {text.reFormat(application.state.route?.to)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("route menu & action")}</div>
                            </div>
                            {
                                application.state.route?.visible && (can("view_truck_order") || can("create_truck_order"))
                                    ?
                                    <>
                                        {
                                            can("create_truck_order")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/truck/order-form`,
                                                        state: { route: application.state.route }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="chevron_right" />
                                                    <div className="title">{translate("new truck order")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("list_truck_order")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/truck/order-list`,
                                                        state: { propsCondition: { route: application.state.route?._id } }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="chevron_right" />
                                                    <div className="title">{translate("list truck orders")}</div>
                                                </Link>
                                                : null
                                        }
                                    </>

                                    : null
                            }
                            <div className="row">
                                <div className="col s12">
                                    <Textarea
                                        name=""
                                        label=""
                                        error=""
                                        disabled
                                        placeholder=""
                                        onChange={() => { }}
                                        value={application.state.route?.description}
                                    />
                                </div>
                            </div>
                            {
                                (can("edit_route") || can("delete_route")) && application.state.route?.visible
                                    ?
                                    <>
                                        {
                                            can("edit_route")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/route/form`,
                                                        state: { route: application.state.route._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_route")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.openDialog("deleted")}
                                                >
                                                    <Icon name="delete" type="rounded text-error" />
                                                    <div className="title semibold">{translate("delete")}</div>
                                                </Link>
                                                : null
                                        }
                                    </>
                                    :
                                    can("restore_deleted") && !application.state.route?.visible && !application.state.loading
                                        ?
                                        <Link
                                            to="#"
                                            className="view-item"
                                            onClick={() => application.openDialog("restored")}
                                        >
                                            <Icon name="remove_from_trash" type="rounded text-warning" />
                                            <div className="title semibold">{translate("restore")}</div>
                                        </Link>
                                        : null
                            }
                        </div>
                    </div>
                </div>
                <div className="col s12 m7 l8">
                    <div className="view">
                        <div className="view-header">
                            <div className="title">
                                <span>{translate("route information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("from")}:
                                        </div>
                                        <div className="title">
                                            {text.reFormat(application.state.route?.from)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("to")}:
                                        </div>
                                        <div className="title">
                                            {text.reFormat(application.state.route?.to)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("distance")}:
                                        </div>
                                        <div className="title text-success semibold">
                                            {number.format(application.state.route?.distance)}km
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("cost")}:
                                        </div>
                                        <div className="title text-primary semibold">
                                            {number.format(application.state.route?.cost)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title semibold uppercase ${application.state.route?.visible ? "text-success" : "text-error bold"}`}>
                                            {application.state.route?.visible ? translate("active") : translate("deleted")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ViewDetail />
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_route")
                    ? <FloatingButton to="/route/list" tooltip="list routes" />
                    : null
            }
        </>
    )
})

export default RouteView