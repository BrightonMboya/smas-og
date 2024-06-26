import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../../components/button"
import { Textarea } from "../../../components/form"
import { apiV1, getDate, noAccess, number, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../../types"
import { ApplicationContext } from "../../../context"
import ViewDetail from "../../../components/view-detail"
import { Icon } from "../../../components/elements"

// truck order view memorized function component
const TruckOrderView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        if (can("view_truck_order")) {
            onMount()
        }
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
                const { truck_order }: any = props.location.state
                if (truck_order) {
                    const joinForeignKeys: boolean = true
                    const condition: string = JSON.stringify({ _id: truck_order })
                    const parameters: string = `schema=truck_order&condition=${condition}&joinForeignKeys=${joinForeignKeys}&select={}`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read"
                    }
                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        setPageTitle("view truck order")
                        application.dispatch({
                            schema: "truck_order",
                            collection: "truck_orders",
                            ids: [response.message._id],
                            truck_order: response.message
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
                                {text.abbreviate(application.state.truck_order?.route_name.split("-")[0])}
                                {text.abbreviate(application.state.truck_order?.route_name.split("-")[1])}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state.truck_order?.route_name)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("truck action")}</div>
                            </div>
                            <div className="row">
                                <div className="col s12">
                                    <Textarea
                                        name=""
                                        label=""
                                        error=""
                                        disabled
                                        placeholder=""
                                        onChange={() => { }}
                                        value={application.state.truck_order?.description}
                                    />
                                </div>
                            </div>
                            {
                                (can("edit_truck_order") || can("delete_truck_order")) && application.state.truck_order?.visible
                                    ?
                                    <>
                                        {
                                            can("edit_truck_order")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/truck/order-form`,
                                                        state: { truck_order: application.state.truck_order._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_truck_order")
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
                                    : null
                            }
                        </div>
                    </div>
                </div>
                <div className="col s12 m7 l8">
                    <div className="view">
                        <div className="view-header">
                            <div className="title">
                                <span>{translate("truck order information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                        <div className="row">
                                <div className="col s12">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("reference")}:
                                        </div>
                                        <div className={`title semibold`}>
                                            {application.state.truck_order?.reference ? application.state.truck_order?.reference : translate("n/a")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <Link to={can("view_customer") && application.state.truck_order?.customer ? {
                                        pathname: "/customer/view",
                                        state: { customer: application.state.truck_order?.customer?._id }
                                    } : "#"}>
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("customer")}:
                                            </div>
                                            <div className="title text-primary">
                                                {text.reFormat(application.state.truck_order?.customer?.name)}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                                <div className="col s12 m6 l6">
                                    <Link to={can("view_truck") && application.state.truck_order?.truck ? {
                                        pathname: "/truck/view",
                                        state: { truck: application.state.truck_order?.truck?._id }
                                    } : "#"}>
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("truck")}:
                                            </div>
                                            <div className="title">
                                                {text.reFormat(application.state.truck_order?.truck?.name)}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("distance")}:
                                        </div>
                                        <div className="title text-secondary semibold">
                                            {number.format(application.state.truck_order?.distance)} km
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("cost")}:
                                        </div>
                                        <div className="title text-primary semibold">
                                            {number.format(application.state.truck_order?.total_amount)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("paid amount")}:
                                        </div>
                                        <div className="title text-success semibold">
                                            {number.format(application.state.truck_order?.paid_amount)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("remain amount")}:
                                        </div>
                                        <div className="title text-error semibold">
                                            {number.format(application.state.truck_order?.total_amount - application.state.truck_order?.paid_amount)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold ${application.state.truck_order?.visible ? "text-success" : "text-error bold"}`}>
                                            {translate(application.state.truck_order?.visible ? "active" : "deleted")}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("date")}:
                                        </div>
                                        <div className="title">
                                            {getDate(application.state.truck_order?.date)}
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
                can("list_truck_order")
                    ? <FloatingButton to="/truck/order-list" tooltip="list truck orders" />
                    : null
            }
        </>
    )

})

export default TruckOrderView