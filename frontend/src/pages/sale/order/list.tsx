// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../../components/button"
import Filter from "../../../components/filter"
import { Checkbox } from "../../../components/form"
import Pagination from "../../../components/pagination"
import Search from "../../../components/search"
import { apiV1, commonCondition, getDate, noAccess, number, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { routerProps } from "../../../types"
import Report from "../../report/components/report"
import Invoice from "../../sale/invoice"
import { ApplicationContext } from "../../../context"
import { Link } from "react-router-dom"

// order list memorized function component
const OrderList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("list_order") || can("list_proforma_invoice")) {
            const pathname: string = props.location.pathname
            setPageTitle(pathname.includes("order") ? "orders" : "proforma invoice")
            application.dispatch({ pathname })
            onMount(pathname.includes("order") ? "order" : "invoice")
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(type: "order" | "invoice"): Promise<void> {
        try {
            // creating initial condition
            let initialCondition: object = commonCondition(true)

            // checking if condition has been passed from other components
            if (props.location.state) {
                const { propsCondition }: any = props.location.state
                if (propsCondition) {
                    initialCondition = { ...initialCondition, ...propsCondition }
                    application.dispatch({ propsCondition })
                }
            }

            // parameters, sort, condition, select and foreign key
            const sort: string = JSON.stringify({ createdAt: -1 })
            const condition: string = JSON.stringify({ ...initialCondition, type })
            const select: object = {
                branch: 0, created_by: 0, updated_by: 0, updatedAt: 0, __v: 0
            }
            const joinForeignKeys: boolean = true
            const parameters: string = `schema=order&condition=${condition}&select=${JSON.stringify(select)}&sort=${sort}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            // making api request
            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "orders",
                sort: "createdAt",
                order: -1,
                collection: "orders",
                schema: "order",
                select,
                joinForeignKeys,
                fields: ["number", "reference"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const printInvoice = (order: any, type?: string): void => {
        try {
            setPageTitle(application.state.pathname.includes("order") && !type ? "order invoice" : type ? "delivery note" : "proforma invoice")
            application.dispatch({
                sales: order.sales,
                type: type ? type : "",
                customer: order.customer,
                orderNumber: order.number,
                branch: application.user?.branch,
            })
            setTimeout(() => { window.print() }, 500)
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderList = React.useCallback(() => {
        try {
            // console.log(application.state.orders.map((order: any) => order.sales).map((sales: any) => sales))
            return application.state.orders.map((order: any, index: number) => (
                <tr key={order._id} onClick={() => application.selectList(order._id)}>
                    {
                        (can("delete_order") || can("delete_proforma_invoice")) && (application.state.condition !== "deleted")
                            ? <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(order._id)}
                                    checked={application.state.ids.indexOf(order._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("customer")} className="sticky">
                        <Link to={can("view_customer") ? {
                            pathname: "/customer/view",
                            state: { customer: order.customer._id }
                        } : "#"} className="bold">
                            {text.reFormat(order.customer.name)}
                        </Link>
                    </td>
                    {
                        can("view_reference_on_sale")
                            ?
                            <td>{order.reference ? order.reference : translate("n/a")}</td>
                            : null
                    }
                    <td className="right-align" data-label={translate("number")}>
                        {order.number}
                    </td>
                    <td className="right-align" data-label={translate("product")}>
                        {number.format(order.sales.length)}
                    </td>
                    <td className="right-align text-primary" data-label={translate("amount")}>
                        {number.format(
                            order.sales.map((sale: any) => sale.total_amount).reduce((a: number, b: number) => a + b, 0)
                        )}
                    </td>
                    <td className="center" data-label={translate("date")}>
                        {getDate(order.createdAt)}
                    </td>
                    <td className="center sticky-right">
                        <div className="action-button">

                            {
                                can("view_order") || can("view_proforma_invoice")
                                    ?
                                    <>
                                        {
                                            application.state.pathname.includes("order")
                                                ?
                                                <ActionButton
                                                    to="#"
                                                    type="success"
                                                    icon="local_shipping"
                                                    position="left"
                                                    tooltip="print delivery note"
                                                    onClick={() => printInvoice(order, "note")}
                                                />
                                                : null
                                        }
                                        <ActionButton
                                            to="#"
                                            type="primary"
                                            icon="print"
                                            position="left"
                                            tooltip="print"
                                            onClick={() => printInvoice(order)}
                                        />
                                        {
                                            can("view_order") || can("view_proforma_invoice")
                                                ?
                                                <ActionButton
                                                    to={{
                                                        pathname: application.state.pathname.includes("order") ? "/sale/order-view" : "/sale/proforma-invoice-view",
                                                        state: { order: order._id }
                                                    }}
                                                    type="info"
                                                    icon="visibility"
                                                    position="left"
                                                    tooltip="view"
                                                />
                                                : null
                                        }
                                    </>
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
    }, [application.state.ids, application.state.orders])

    const renderFilter = React.useCallback(() => {
        return (
            <Filter
                sort={application.state.sort}
                order={application.state.order}
                limit={application.state.limit}
                filter={application.filterData}
                limits={application.state.limits}
                condition={application.state.condition}
                sorts={application.getSortOrCondition("sort")}
                conditions={application.getSortOrCondition("condition")}
            />
        )
        // eslint-disable-next-line
    }, [
        application.state.sort,
        application.state.order,
        application.state.limit,
        application.state.limits,
        application.state.condition,
    ])

    return (
        <>
            <div className="hide-on-print">
                {renderFilter()}
                <div className="card list">
                    <Search
                        onChange={application.handleInputChange}
                        onClick={application.searchData}
                        value={application.state.searchKeyword}
                        refresh={() => onMount(application.state.pathname.includes("order") ? "order" : "invoice")}
                        select={application.selectList}
                    // disabled
                    >
                        {
                            application.state.ids.length > 0 && ((can("delete_order") || can("delete_proforma_invoice")) && (application.state.condition !== "deleted"))
                                ?
                                <>
                                    {
                                        (can("delete_order") || can("delete_proforma_invoice")) && (application.state.condition !== "deleted")
                                            ?
                                            <ActionButton
                                                to="#"
                                                type="error"
                                                icon="delete"
                                                tooltip="delete"
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
                                        (can("delete_order") || can("delete_proforma_invoice")) && (application.state.condition !== "deleted")
                                            ?
                                            <th>
                                                <Checkbox
                                                    onChange={() => application.selectList()}
                                                    checked={(application.state.ids.length > 0) && (application.state[application.state.collection]?.length === application.state.ids.length)}
                                                    onTable
                                                />
                                            </th>
                                            : null

                                    }
                                    <th>#</th>
                                    <th className="sticky">{translate("customer")}</th>
                                    {
                                        can("view_reference_on_sale")
                                            ?
                                            <th>{translate("reference")}</th>
                                            : null
                                    }
                                    <th className="right-align">{translate("number")}</th>
                                    <th className="right-align">{translate("products")}</th>
                                    <th className="right-align">{translate("amount")}</th>
                                    <th className="center">{translate("date")}</th>
                                    <th className="center sticky-right">{translate("options")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderList()}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        paginate={application.paginateData}
                        currentPage={application.state.page}
                        nextPage={application.state.nextPage}
                        pageNumbers={application.state.pageNumbers}
                        previousPage={application.state.previousPage}
                    />
                </div>
                {
                    can("create_order") || can("create_proforma_invoice")
                        ?
                        <FloatingButton
                            to={application.state.pathname.includes("order") ? "/sale/order-form" : "/sale/proforma-invoice-form"}
                            tooltip={application.state.pathname.includes("order") ? "new order" : "new proforma invoice"}
                            icon="add_circle"
                        />
                        : null
                }
            </div>
            <Report
                title=""
                report={application.state.pathname.includes("order") ? "order" : "proforma_invoice"}
                number={application.state.orderNumber}
                type={application.state.pathname.includes("order") && (application.state.type.trim() === "") ? "order" : application.state.type === "note" ? "delivery" : "invoice"}
                branch={application.state.branch}
                customer={application.state.customer}
            >
                <Invoice sales={application.state.sales} type={application.state.pathname.includes("order") && (application.state.type.trim() === "") ? "order" : application.state.type === "note" ? "delivery" : "invoice"} />
            </Report>
        </>
    )

})

export default OrderList