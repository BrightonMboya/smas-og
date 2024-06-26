// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../components/button"
import { Textarea } from "../../components/form"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"

// truck view memorized function component
const TruckView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_truck"))
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
                const { truck }: any = props.location.state
                if (truck) {

                    const joinForeignKeys: boolean = true
                    const condition: string = JSON.stringify({ _id: truck })
                    const select: string = JSON.stringify({})
                    const parameters: string = `schema=truck&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read",
                    }

                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        setPageTitle("view truck")
                        application.dispatch({
                            schema: "truck",
                            collection: "trucks",
                            truck: response.message,
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
                                {text.abbreviate(application.state.truck?.name)}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state.truck?.name)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("truck menu & action")}</div>
                            </div>
                            {
                                application.state.truck?.visible && (can("list_truck_order") || can("create_truck_order") || can("create_report") || can("list_expense"))
                                    ?
                                    <>
                                        {
                                            can("list_expense")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/expense/list`,
                                                        state: { propsCondition: { truck: application.state.truck?._id } }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="chevron_right" />
                                                    <div className="title">{translate("list expenses")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("create_report")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/report/form`,
                                                        state: { truck: application.state.truck }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="chevron_right" />
                                                    <div className="title">{translate("new report")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("create_truck_order") && application.state.truck?.status === "available"
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/truck/order-form`,
                                                        state: { truck: application.state.truck }
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
                                                        state: { propsCondition: { truck: application.state.truck?._id } }
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
                                        value={application.state.truck?.description}
                                    />
                                </div>
                            </div>
                            {
                                (can("edit_truck") || can("delete_truck")) && application.state.truck?.visible
                                    ?
                                    <>
                                        {
                                            can("edit_truck")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/truck/form`,
                                                        state: { truck: application.state.truck._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_truck")
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
                                    can("restore_deleted") && !application.state.truck?.visible && !application.state.loading
                                        ?
                                        <Link
                                            to="#"
                                            className="view-item"
                                            onClick={() => application.openDialog("restored")}
                                        >
                                            <Icon name="restore_from_trash" type="rounded text-warning" />
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
                                <span>{translate("truck information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("status")}:
                                        </div>
                                        <div className="title semibold uppercase">
                                            {text.reFormat(application.state.truck?.status)}
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
                can("list_truck")
                    ? <FloatingButton to="/truck/list" tooltip="list trucks" icon="list_alt" />
                    : null
            }
        </>
    )
})

export default TruckView