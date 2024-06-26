// dependecies
import React from "react"
import { readOrDelete, routerProps, serverResponse } from "../../../../types"
import { can } from "../../../../helpers/permissions"
import { FloatingButton } from "../../../../components/button"
import { ApplicationContext } from "../../../../context"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../../../helpers"
import translate from "../../../../helpers/translator"
import { Link } from "react-router-dom"
import ViewDetail from "../../../../components/view-detail"
import PrintQuotation from "../components/print"
import { Icon } from "../../../../components/elements"
import { number } from "fast-web-kit"

// quotation view memorized functional component
const QuotationInvoiceView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

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

            if (can("view_quotation_invoice")) {
                if (props.location.state) {

                    const { quotation_invoice }: any = props.location.state

                    if (quotation_invoice) {
                        // backend data for fetching quotation_invoice data
                        const joinForeignKeys: boolean = true
                        const select: string = JSON.stringify({})
                        const condition: string = JSON.stringify({ _id: quotation_invoice })

                        // parameter
                        const parameters: string = `schema=quotation_invoice&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                            setPageTitle("view quotation invoice")

                            // updating state
                            application.dispatch({
                                schema: "quotation_invoice",
                                collection: "quotation_invoices",
                                quotation_invoice: response.message,
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
                                    {text.abbreviate(application.state.quotation_invoice?.customer?.name)}
                                </div>
                                <div className="view-title">
                                    {text.reFormat(application.state.quotation_invoice?.customer?.name)}
                                </div>
                            </div>
                            <div className="view-items">
                                <div className="view-item active">
                                    <Icon name="summarize" />
                                    <div className="title semibold">{translate("quotation invoice menu")}</div>
                                </div>
                                <Link
                                    to="#"
                                    className="view-item"
                                    onClick={() => {
                                        window.print()
                                    }}
                                >
                                    <Icon name="print" type="rounded text-secondary" />
                                    <div className="title semibold">{translate("print quotation invoice")}</div>
                                </Link>
                                {
                                    application.state[application.state.schema]?.visible && (can("edit_quotation_invoice") || can("delete_quotation_invoice") ||can("list_expense"))
                                        ?
                                        <>
                                            {
                                                can("create_expense")
                                                    ?
                                                    <Link
                                                        to={{
                                                            pathname: `/expense/form`,
                                                            state: { quotation_invoice: application.state[application.state.schema] }
                                                        }}
                                                        className="view-item"
                                                    >
                                                        <Icon name="chevron_right" />
                                                        <div className="title semibold">{translate("new expense")}</div>
                                                    </Link>
                                                    : null
                                            }
                                            {
                                                can("list_expense")
                                                    ?
                                                    <Link
                                                        to={{
                                                            pathname: `/expense/list`,
                                                            state: { propsCondition:  { quotation_invoice: application.state[application.state.schema]?._id }}
                                                        }}
                                                        className="view-item"
                                                    >
                                                        <Icon name="chevron_right" />
                                                        <div className="title semibold">{translate("list expense")}</div>
                                                    </Link>
                                                    : null
                                            }
                                            {
                                                can("edit_quotation_invoice")
                                                    ?
                                                    <Link
                                                        to={{
                                                            pathname: `/quotation/invoice-form`,
                                                            state: { quotation_invoice: application.state[application.state.schema]?._id }
                                                        }}
                                                        className="view-item"
                                                    >
                                                        <Icon name="edit_note" type="rounded text-success" />
                                                        <div className="title semibold">{translate("edit")}</div>
                                                    </Link>
                                                    : null
                                            }
                                            {
                                                can("delete_quotation_invoice")
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
                                        : /* !application.state[application.state.schema]?.visible && can("restore_deleted")
                                            ?
                                            <Link
                                                to="#"
                                                className="view-item"
                                                onClick={() => application.openDialog("restored")}
                                            >
                                                <i className="material-icons-round text-warning">restore_from_trash</i>
                                                <div className="title">{translate("restore")}</div>
                                            </Link>
                                            : */
                                        null
                                }
                            </div>
                        </div>
                    </div>
                    <div className="col s12 m7 l8">
                        <div className="view">
                            <div className="view-header">
                                <div className="title">
                                    {translate("quotation invoice information")}
                                </div>
                            </div>
                            <div className="view-items">
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("invoice number")}:
                                            </div>
                                            <div className="title text-primary semibold">
                                                {application.state.quotation_invoice?.number}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("reference")}:
                                            </div>
                                            <div className="title semibold">
                                                {application.state.quotation_invoice?.reference ? application.state.quotation_invoice?.reference : translate("n/a")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("total amount")}:
                                            </div>
                                            <div className="title semibold text-success">
                                                {number.format(application.state.quotation_invoice?.total_amount)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("paid amount")}:
                                            </div>
                                            <div className="title text-primary semibold">
                                                {number.format(application.state.quotation_invoice?.paid_amount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("remain amount")}:
                                            </div>
                                            <div className="title text-error semibold">
                                                {number.format(application.state.quotation_invoice?.total_amount - application.state.quotation_invoice?.paid_amount)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <div className="view-detail">
                                            <div className={`label`}>
                                                {translate("status")}:
                                            </div>
                                            <div className={`title uppercase semibold ${application.state[application.state.schema]?.visible ? "text-success" : "text-error bold"}`}>
                                                {application.state[application.state.schema]?.visible ? translate("active") : translate("deleted")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ViewDetail />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_quotation_invoice")
                    ?
                    <FloatingButton
                        to="/quotation/invoice-list"
                        icon="list_alt"
                        tooltip="list quotation invoices"
                    />
                    : null
            }
            {
                application.state.quotation_invoice
                    ?
                    <PrintQuotation data={application.state.quotation_invoice} type="quotation_invoice" />
                    : null
            }
        </>
    )
})

export default QuotationInvoiceView