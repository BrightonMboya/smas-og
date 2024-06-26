import React from "react"
import { routerProps } from "../../../../types"
import { can } from "../../../../helpers/permissions"
import { ActionButton, FloatingButton } from "../../../../components/button"
import { ApplicationContext } from "../../../../context"
import { apiV1, commonCondition, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../../../helpers"
import Search from "../../../../components/search"
import translate from "../../../../helpers/translator"
import { Checkbox } from "../../../../components/form"
import { array, number } from "fast-web-kit"
import PrintQuotation from "../components/print"
import ListComponentFilter from "../../../../components/reusable/list-component-filter"

const Quotation_invoiceInvoiceList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])
    async function onMount(): Promise<void> {
        try {

            if (can("list_quotation_invoice")) {

                setPageTitle("quotation_invoices")
                // creating initial condition
                let initialCondition: object = commonCondition()

                // checking if condition has been passed from other components
                if (props.location.state) {
                    const { propsCondition }: any = props.location.state
                    if (propsCondition) {
                        initialCondition = { ...initialCondition, ...propsCondition }
                        application.dispatch({ propsCondition })
                    }
                }

                const order = 1
                const joinForeignKeys: boolean = true
                const sort: string = JSON.stringify({ createdAt: -1 })
                const condition: string = JSON.stringify(initialCondition)
                const select: object = { customer: 1, number: 1, total_amount: 1, paid_amount: 1, date: 1, visible: 1, reference: 1, createdAt: 1, }
                const parameters: string = `schema=quotation_invoice&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

                application.mount({
                    order,
                    select,
                    parameters,
                    joinForeignKeys,
                    sort: "created Time",
                    schema: "quotation_invoice",
                    route: `${apiV1}list`,
                    condition: "quotation_invoices",
                    collection: "quotation_invoices",
                    fields: ["number", "reference"]
                })

            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({ notification: noAccess })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }


    const renderInvoice = React.useCallback(() => {
        try {
            return application.state.quotation_invoices.map((invoice: any, index: number) => (
                <tr key={index} /* onClick={() => application.selectList(invoice._id)} */>
                    {
                        can("delete_quotation_invoice")
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(invoice._id)}
                                    checked={application.state.ids.indexOf(invoice._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td>{index + 1}</td>
                    <td className="sticky" data-label={translate("customer")}>
                        {text.reFormat(invoice.customer.name)}
                    </td>
                    <td data-label={translate("number")} className="right-align">
                        {invoice.number}
                    </td>
                    <td data-label={translate("reference")}>
                        {invoice.reference ? invoice.reference : translate("n/a")}
                    </td>
                    <td className="right-align text-primary" data-label={translate("total amount")}>
                        {number.format(invoice.total_amount)}
                    </td>
                    <td className="right-align text-success" data-label={translate("paid amount")}>
                        {number.format(invoice.paid_amount)}
                    </td>
                    <td className="right-align text-error" data-label={translate("remain amount")}>
                        {number.format(invoice.total_amount - invoice.paid_amount)}
                    </td>
                    <td className="center" data-label={translate("date")}>
                        {getDate(invoice.date)}
                    </td>
                    <td className="center sticky-right">
                        <div className="action-button">
                            <ActionButton
                                to="#"
                                type="success"
                                icon="print"
                                tooltip="print"
                                position="left"
                                onClick={() => {
                                    application.dispatch({ quotation_invoice: invoice })
                                    setTimeout(() => window.print(), 1000)
                                }}
                            />
                            {
                                can("create_expense") && invoice.visible
                                    ?
                                    <ActionButton
                                        to={{
                                            pathname: "/expense/form",
                                            state: { quotation_invoice: invoice }
                                        }}
                                        type="primary"
                                        icon="add_circle"
                                        tooltip="new expense"
                                        position="left"
                                    />
                                    : null
                            }
                            {
                                can("list_expense")
                                    ?
                                    <ActionButton
                                        to={{
                                            pathname: "/expense/list",
                                            state: {propsCondition: {  quotation_invoice: invoice._id }}
                                        }}
                                        type="warning"
                                        icon="money"
                                        tooltip="list expense"
                                        position="left"
                                    />
                                    : null
                            }
                            {
                                can("view_quotation_invoice")
                                    ?
                                    <ActionButton
                                        to={{
                                            pathname: "/quotation/invoice-view",
                                            state: { quotation_invoice: invoice._id }
                                        }}
                                        type="info"
                                        icon="visibility"
                                        tooltip="view"
                                        position="left"
                                    />
                                    : null
                            }
                            {
                                can("edit_quotation_invoice") && invoice.visible
                                    ?
                                    <ActionButton
                                        to={{
                                            pathname: "/quotation/invoice-form",
                                            state: { quotation_invoice: invoice._id }
                                        }}
                                        type="error"
                                        icon="edit_note"
                                        tooltip="edit"
                                        position="left"
                                    />
                                    : null
                            }

                        </div>
                    </td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.ids, application.state.quotation_invoices])

    return (
        <>
            <div className="hide-on-print">
                <ListComponentFilter />
                <div className="card list">
                    <Search
                        onChange={application.handleInputChange}
                        onClick={application.searchData}
                        value={application.state.searchKeyword}
                        refresh={onMount}
                        select={application.selectList}
                    >
                        {
                            (application.state.ids.length > 0) && can("delete_quotation_invoice")
                                ?
                                <>
                                    {
                                        can("delete_quotation_invoice") && (application.state.condition !== "deleted")
                                            ?
                                            <ActionButton
                                                to="#"
                                                type="error"
                                                icon="delete"
                                                tooltip="delele"
                                                position="left"
                                                onClick={() => application.openDialog("deleted")}
                                            />
                                            : null
                                    }
                                </>
                                : null
                        }
                    </Search>
                    <div className="card-content">
                        <table>
                            <thead>
                                <tr onClick={() => application.selectList()}>
                                    {
                                        can("delete_quotation_invoice")
                                            ?
                                            <th>
                                                <Checkbox
                                                    onChange={() => application.selectList()}
                                                    checked={(application.state.ids.length > 0) && (application.state.quotation_invoices.length === application.state.ids.length)}
                                                    onTable
                                                />
                                            </th>
                                            : null
                                    }
                                    <th>#</th>
                                    <th className="sticky">{translate("customer")}</th>
                                    <th className="right-align">{translate("number")}</th>
                                    <th>{translate("reference")}</th>
                                    <th className="right-align">{translate("total amount")}</th>
                                    <th className="right-align">{translate("paid amount")}</th>
                                    <th className="right-align">{translate("remain amount")}</th>
                                    <th className="center">{translate("date")}</th>
                                    {
                                        can("edit_quotation_invoice") || can("view_quotation_menu") || can("list_expense")
                                        ?<th className="center sticky-right">{translate("options")}</th>
                                        : null
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                {renderInvoice()}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className="bold text-primary" colSpan={5}>
                                        {translate("total")}
                                    </td>
                                    <td className="text-primary bold right-align">
                                        {
                                            number.format(array.computeMathOperation(application.state.quotation_invoices.map((invoice: any) => invoice.total_amount), "+"))
                                        }
                                    </td>
                                    <td className="text-success bold right-align">
                                        {
                                            number.format(array.computeMathOperation(application.state.quotation_invoices.map((invoice: any) => invoice.paid_amount), "+"))
                                        }
                                    </td>
                                    <td className="text-error bold right-align">
                                        {
                                            number.format(array.computeMathOperation(application.state.quotation_invoices.map((invoice: any) => invoice.total_amount - invoice.paid_amount), "+"))
                                        }
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
            {
                application.state.quotation_invoice
                    ?
                    <PrintQuotation data={application.state.quotation_invoice} type="quotation_invoice" />
                    : null
            }
            {
                can("create_quotation_invoice")
                    ?
                    <FloatingButton
                        to="/quotation/invoice-form"
                        tooltip="create quotation_invoice invoice"
                    />
                    : null
            }
        </>
    )
})

export default Quotation_invoiceInvoiceList