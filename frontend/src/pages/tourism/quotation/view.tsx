// dependecies
import React from "react"
import { readOrDelete, routerProps, serverResponse } from "../../../types"
import { can } from "../../../helpers/permissions"
import { FloatingButton } from "../../../components/button"
import { ApplicationContext } from "../../../context"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import translate from "../../../helpers/translator"
import { Link } from "react-router-dom"
import ViewDetail from "../../../components/view-detail"
import TripComponent from "./components/trip"
import { array, number } from "fast-web-kit"
import PrintQuotation from "./components/print"
import { Icon } from "../../../components/elements"

// quotation view memorized functional component
const QuotationView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            if (can("view_quotation")) {
                if (props.location.state) {

                    const { quotation }: any = props.location.state

                    if (quotation) {
                        // backend data for fetching quotation data
                        const joinForeignKeys: boolean = true
                        const select: string = JSON.stringify({})
                        const condition: string = JSON.stringify({ _id: quotation })

                        // parameter
                        const parameters: string = `schema=quotation&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

                        // request options
                        const options: readOrDelete = {
                            parameters,
                            method: "GET",
                            loading: true,
                            disabled: false,
                            route: apiV1 + "read"
                        }

                        // api request
                        const response: serverResponse = await application.readOrDelete(options)

                        if (response.success) {

                            // updating page title
                            setPageTitle("view quotation")

                            // updating state
                            application.dispatch({
                                schema: "quotation",
                                collection: "quotations",
                                quotation: response.message,
                                ids: [response.message._id],
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
            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({ notification: noAccess })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    return (
        <>
            <div className="hide-on-print">
                <div className="row">
                    <div className="col s12 m5 l4">
                        <div className="view">
                            <div className="view-profile">
                                <div className="view-initials">
                                    {text.abbreviate(application.state.quotation?.customer?.name)}
                                </div>
                                <div className="view-title">
                                    {text.reFormat(application.state.quotation?.customer?.name)}
                                </div>
                            </div>
                            <div className="view-items">
                                <div className="view-item active">
                                    <Icon name="summarize" />
                                    <div className="title semibold">{translate("quotation action")}</div>
                                </div>
                                <Link
                                    to="#"
                                    className="view-item"
                                    onClick={() => {
                                        application.toggleComponent("modal")
                                        application.dispatch({ trips: application.state.quotation?.trips })
                                    }}
                                >
                                    <Icon name="luggage" />
                                    <div className="title semibold">{translate("view trips")}</div>
                                </Link>
                                <Link
                                    to="#"
                                    className="view-item"
                                    onClick={() => {
                                        window.print()
                                    }}
                                >
                                    <Icon name="print" type="rounded text-secondary" />
                                    <div className="title semibold">{translate("print quotation")}</div>
                                </Link>
                                {
                                    application.state[application.state.schema]?.visible && (can("edit_quotation") || can("delete_quotation"))
                                        ?
                                        <>
                                            {
                                                can("edit_quotation")
                                                    ?
                                                    <Link
                                                        to={{
                                                            pathname: `/quotation/form`,
                                                            state: { quotation: application.state[application.state.schema]?._id }
                                                        }}
                                                        className="view-item"
                                                    >
                                                        <Icon name="edit_note" type="rounded text-success" />
                                                        <div className="title semibold">{translate("edit")}</div>
                                                    </Link>
                                                    : null
                                            }
                                            {
                                                can("delete_quotation")
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
                                        : !application.state[application.state.schema]?.visible && can("restore_deleted") && !application.state.loading
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
                                    {translate("quotation information")}
                                </div>
                            </div>
                            <div className="view-items">
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("total amount")}:
                                            </div>
                                            <div className="title text-primary semibold">
                                                {number.format(application.state.quotation?.total_amount)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("total margin")}:
                                            </div>
                                            <div className="title text-success semibold">
                                                {number.format(application.state.quotation?.total_margin)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("quotation number")}:
                                            </div>
                                            <div className="title text-secondary">
                                                {application.state.quotation?.number}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col s12 m6 l6" onClick={() => {
                                        application.toggleComponent("modal")
                                        application.dispatch({ trips: application.state.quotation?.trips })
                                    }}>
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("total trips")}:
                                            </div>
                                            <div className="title">
                                                {array.getLength(application.state.quotation?.trips)}
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
                                            <div className={`title semibold uppercase ${application.state[application.state.schema]?.visible ? "text-success" : "text-error bold"}`}>
                                                {application.state[application.state.schema]?.visible ? translate("active") : translate("deleted")}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("total profit")}:
                                            </div>
                                            <div className="title text-success semibold">
                                                {number.format(application.state.quotation?.profit)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ViewDetail />
                            </div>
                        </div>
                    </div>
                </div>
                <TripComponent />
            </div>
            {
                can("list_quotation")
                    ?
                    <FloatingButton
                        to="/quotation/list"
                        tooltip="list quotations"
                    />
                    : null
            }
            {
                application.state.quotation
                    ?
                    <PrintQuotation data={application.state.quotation} type="quotation" />
                    : null
            }
        </>
    )
})

export default QuotationView