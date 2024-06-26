// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../components/button"
import { Textarea } from "../../components/form"
import { apiV1, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import Report from "../report/components/report"
import { InvoiceFooter } from "../sale/invoice"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"
import { number } from "fast-web-kit"

// service view memorized function component
const ServiceView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_service")) {
            onMount()
            setPageTitle("view service")
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
                const { service }: any = props.location.state
                if (service) {
                    const joinForeignKeys: boolean = true
                    const condition: string = JSON.stringify({ _id: service })
                    const parameters: string = `schema=service&condition=${condition}&joinForeignKeys=${joinForeignKeys}&select=`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read"
                    }
                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success)
                        application.dispatch({
                            schema: "service",
                            ids: [response.message],
                            collection: "services",
                            service: response.message,
                            branch: response.message.branch,
                            customer: response.message.customer,
                        })
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
            <div className="row hide-on-print">
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {text.abbreviate(application.state[application.state.schema]?.service)}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state[application.state.schema]?.service)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("service menu & action")}</div>
                            </div>
                            <div className="row">
                                <div className="col s12">
                                    <Textarea
                                        label=""
                                        error=""
                                        disabled
                                        placeholder=""
                                        name="description"
                                        onChange={() => { }}
                                        value={translate(application.state[application.state.schema]?.description)}
                                    />
                                </div>
                            </div>
                            {
                                application.state[application.state.schema]?.status !== "completed"
                                    ?
                                    <Link
                                        to="#"
                                        className="view-item"
                                        onClick={() => application.openDialog("completed")}
                                    >
                                        <Icon name="done_all" type="rounded text-success" />
                                        <div className="title semibold">{translate("complete service")}</div>
                                    </Link>
                                    : null
                            }
                            {
                                can("print_report")
                                    ?
                                    <Link
                                        to="#"
                                        className="view-item"
                                        onClick={() => window.print()}
                                    >
                                        <Icon name="print" type="rounded text-secondary" />
                                        <div className="title semibold">{translate("print")}</div>
                                    </Link>
                                    : null
                            }
                            {
                                application.state[application.state.schema]?.visible && can("delete_device")
                                    ?
                                    <>

                                        {
                                            can("delete_device")
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
                                <span>{translate(`${text.reFormat(application.state.schema)} information`)}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <Link
                                        to={{
                                            pathname: can("view_customer") && application.state[application.state.schema]?.customer ? "/customer/view" : "#",
                                            state: { customer: application.state[application.state.schema]?.customer?._id }
                                        }}
                                        className="view-detail"
                                    >
                                        <div className="label">
                                            {translate("customer")}:
                                        </div>
                                        <div className="title text-primary">
                                            {text.reFormat(application.state[application.state.schema]?.customer?.name)} - {application.state[application.state.schema]?.customer?.phone_number}
                                        </div>
                                    </Link>
                                </div>
                                <div className="col s12 m6 l6">
                                    <Link
                                        to={{
                                            pathname: can("view_device") && application.state[application.state.schema]?.device ? "/device/view" : "#",
                                            state: { device: application.state[application.state.schema]?.device?._id }
                                        }}
                                        className="view-detail"
                                    >
                                        <div className="label">
                                            {translate("device")}:
                                        </div>
                                        <div className="title text-secondary">
                                            {text.reFormat(application.state[application.state.schema]?.device?.name)}
                                        </div>
                                    </Link>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("service cost")}:
                                        </div>
                                        <div className="title text-primary semibold">
                                            {number.format(application.state[application.state.schema]?.service_cost)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("product cost")}:
                                        </div>
                                        <div className="title semibold">
                                            {number.format(application.state[application.state.schema]?.product_cost)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("total cost")}:
                                        </div>
                                        <div className="title semibold text-success">
                                            {number.format(application.state[application.state.schema]?.service_cost + application.state[application.state.schema]?.product_cost)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold ${!application.state[application.state.schema]?.visible ? "text-error" : ""}`}>
                                            {translate(!application.state[application.state.schema]?.visible ? "deleted" : application.state[application.state.schema]?.status)}
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
                can("list_service")
                    ? <FloatingButton to="/service/list" tooltip="list services" />
                    : null
            }

            <Report
                type="report"
                title={application.state.title}
                report="service"
                branch={application.state.branch}
                customer={application.state.customer}
            >
                <table>
                    <thead>
                        <tr>
                            <th className="number">{translate("number")}</th>
                            <th>{translate("device")}</th>
                            <th>{translate("service")}</th>
                            <th className="right-align">{translate("service cost")}</th>
                            <th>{translate("product")}</th>
                            <th className="right-align">{translate("product cost")}</th>
                            <th className="right-align">{translate("total cost")}</th>
                            <th className="center">{translate("date")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="right-align" data-label={translate("number")}>{application.state.service?.number}</td>
                            <td className="text-primary bold">
                                {text.reFormat(application.state.service?.device?.name)}
                            </td>
                            <td className="">
                                {text.reFormat(application.state.service?.service)}
                            </td>
                            <td className="text-primary bold right-align">
                                {number.format(application.state.service?.service_cost)}
                            </td>
                            <td className="">
                                {application.state.service?.product ? text.reFormat(application.state.service?.product?.name) : translate("n/a")}
                            </td>
                            <td className="bold right-align">
                                {number.format(application.state.service?.product_cost)}
                            </td>
                            <td className="text-success bold right-align">
                                {number.format(application.state.service?.service_cost + application.state.service?.product_cost)}
                            </td>
                            <td className="center">
                                {getDate(application.state.service?.createdAt)}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <InvoiceFooter type="order" />
            </Report>
        </>
    )

})

// exporting component
export default ServiceView