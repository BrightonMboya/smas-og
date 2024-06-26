// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { ActionButton, FloatingButton } from "../../../components/button"
import { apiV1, noAccess, number, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../../types"
import ViewDetail from "../../../components/view-detail"
import { ApplicationContext } from "../../../context"

// order view memorized function component
const OrderView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_order") || can("view_proforma_invoice")) {
            if (props.location.state) {
                const { order }: any = props.location.state
                if (order) {
                    const pathname: string = props.location.pathname
                    setPageTitle(pathname.includes("order") ? "view order" : "view proforma invoice")
                    application.dispatch({
                        pathname,
                        ids: [order],
                        schema: "order",
                        collection: "orders",
                    })
                    onMount(order)
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

        // component unomunting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(_id: string): Promise<void> {
        try {

            // parameters, condition, select and foreign key joining
            const joinForeignKeys: boolean = true
            const condition: string = JSON.stringify({ _id })
            const select: string = JSON.stringify({})
            const parameters: string = `schema=order&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

            // request options
            const options: readOrDelete = {
                route: apiV1 + "read",
                method: "GET",
                loading: true,
                disabled: false,
                parameters
            }

            // api request
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success)
                application.dispatch({ order: response.message })
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    return (
        <>
            <div className="row">
                <div className={`col s12 ${application.state.pathname.includes("order") ? "m4 l3" : "m5 l4"}`}>
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {text.abbreviate(application.state[application.state.schema]?.customer?.name)}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state[application.state.schema]?.customer?.name)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <i className="material-icons-round">info</i>
                                <div className="title">{translate(`${text.reFormat(application.state.pathname.includes("order") ? "order" : "proforma invoice")} information`)}</div>
                            </div>
                            {
                                application.state[application.state.schema]?.visible && (can("delete_order") || can("delete_proforma_invoice"))
                                    ?
                                    <Link
                                        to="#"
                                        className="view-item"
                                        onClick={() => application.openDialog("deleted")}
                                    >
                                        <i className="material-icons-round text-error">delete</i>
                                        <div className="title">{translate("delete")}</div>
                                    </Link>
                                    : null
                            }
                        </div>
                    </div>
                </div>
                <div className={`col s12 ${application.state.pathname.includes("order") ? "m8 l9" : "m7 l8"}`}>
                    <div className="view">
                        <div className="view-header">
                            <div className="title">
                                {translate(`${text.reFormat(application.state.pathname.includes("order") ? "order" : "proforma invoice")} information`)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">{translate("number")}</div>
                                        <div className="title bold text-primary">{number.format(application.state[application.state.schema]?.number)}</div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">{translate("products")}</div>
                                        <div className="title">{number.format(application.state[application.state.schema]?.sales?.length)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">{translate("amount")}</div>
                                        <div className="title text-primary">{number.format(application.state[application.state.schema]?.sales?.map((sale: any) => sale.total_amount).reduce((a: number, b: number) => a + b, 0))}</div>
                                    </div>
                                </div>
                                <div className="view-detail">
                                    <div className={`label`}>{translate("status")}:</div>
                                    <div className={`title ${application.state[application.state.schema]?.visible ? "text-success" : "text-error bold"}`}>
                                        {translate(application.state[application.state.schema]?.visible ? "active" : "deleted")}
                                    </div>
                                </div>
                            </div>
                            {
                                application.state.pathname.includes("order")
                                    ?
                                    <>
                                        {
                                            can("view_profit")
                                                ? <div className="row">
                                                    <div className="col s12 m6 l6">
                                                        <div className="view-detail">
                                                            <div className="label">{translate("profit")}</div>
                                                            <div className="title text-success">{
                                                                number.format(application.state[application.state.schema]?.sales
                                                                    ?.filter((sale: any) => sale.profit > 0)
                                                                    ?.map((sale: any) => sale.profit)
                                                                    ?.reduce((a: number, b: number) => a + b, 0))
                                                            }</div>
                                                        </div>
                                                    </div>

                                                    <div className="col s12 m6 l6">
                                                        <div className="view-detail">
                                                            <div className="label">{translate("extra profit")}</div>
                                                            <div className="title text-success">{
                                                                number.format(application.state[application.state.schema]?.sales
                                                                    ?.filter((sale: any) => sale.discount < 0)
                                                                    ?.map((sale: any) => sale.discount * -1)
                                                                    ?.reduce((a: number, b: number) => a + b, 0))
                                                            }</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                : null
                                        }
                                        {
                                            can("view_discount") || can("view_loss")
                                                ?
                                                <div className="row">
                                                    <div className="col s12 m6 l6">
                                                        <div className="view-detail">
                                                            <div className="label">{translate("discount")}</div>
                                                            <div className="title text-warning">{
                                                                number.format(application.state[application.state.schema]?.sales
                                                                    ?.filter((sale: any) => sale.discount > 0)
                                                                    ?.map((sale: any) => sale.discount)
                                                                    ?.reduce((a: number, b: number) => a + b, 0))
                                                            }</div>
                                                        </div>
                                                    </div>
                                                    <div className="col s12 m6 l6">
                                                        <div className="view-detail">
                                                            <div className="label">{translate("loss")}</div>
                                                            <div className="title text-error">{
                                                                number.format(application.state[application.state.schema]?.sales
                                                                    ?.filter((sale: any) => sale.profit < 0)
                                                                    ?.map((sale: any) => sale.profit * -1)
                                                                    ?.reduce((a: number, b: number) => a + b, 0))
                                                            }</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                : null
                                        }
                                    </>
                                    : null
                            }
                            <ViewDetail />
                            <table>
                                <thead>
                                    <tr>
                                        <th data-label="#">{translate("#")}</th>
                                        <th className="sticky">{translate("product")}</th>
                                        <th className="right-align">{translate("quantity")}</th>
                                        <th className="right-align">{translate("amount")}</th>
                                        {
                                            application.state.pathname.includes("order")
                                                ?
                                                <>
                                                    {
                                                        can("view_profit")
                                                            ? <th className="right-align">{translate("profit")}</th>
                                                            : null
                                                    }
                                                    {
                                                        can("view_discount")
                                                            ? <th className="right-align">{translate("discount")}</th>
                                                            : null
                                                    }
                                                    {
                                                        can("view_loss")
                                                            ? <th className="right-align">{translate("loss")}</th>
                                                            : null
                                                    }
                                                    <th className="center">{translate("status")}</th>
                                                </>
                                                : null
                                        }
                                        {
                                            can("view_sale") || can("delete_sale")
                                                ? <th className="center">{translate("options")}</th>
                                                : null
                                        }
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        application.state[application.state.schema]?.sales?.map((sale: any, index: number) => (
                                            <tr key={sale._id}>
                                                <td data-label="#">{index + 1}</td>
                                                <td data-label={translate("product")} className="sticky">
                                                    <Link to={can("view_product") ? {
                                                        pathname: "/product/view",
                                                        state: { product: sale.product._id }
                                                    } : "#"}>
                                                        {text.reFormat(sale.product.name)}
                                                    </Link>
                                                </td>
                                                <td className="right-align" data-label={translate("quantity")}>
                                                    {number.format(sale.quantity)}
                                                </td>
                                                <td className="right-align text-primary" data-label={translate("amount")}>
                                                    {number.format(sale.total_amount)}
                                                </td>
                                                {
                                                    application.state.pathname.includes("order")
                                                        ?
                                                        <>
                                                            {
                                                                can("view_profit")
                                                                    ?
                                                                    < td className="right-align text-success" data-label={translate("profit")}>
                                                                        {sale.profit > 0 ? number.format(sale.profit) : 0}
                                                                    </td>
                                                                    : null
                                                            }
                                                            {
                                                                can("view_discount")
                                                                    ?
                                                                    < td className="right-align text-warning" data-label={translate("discount")}>
                                                                        {sale.discount > 0 ? number.format(sale.discount) : 0}
                                                                    </td>
                                                                    : null
                                                            }
                                                            {
                                                                can("view_loss")
                                                                    ?
                                                                    < td className="right-align text-error" data-label={translate("loss")}>
                                                                        {sale.profit < 0 ? number.format(sale.profit * -1) : 0}
                                                                    </td>
                                                                    : null
                                                            }
                                                            <td className="center" data-label="status">
                                                                <span className={`badge ${sale.status === "cash" ? "success" : "error"}`} data-tooltip={sale.customer ? text.reFormat(sale.customer.name) : ""}>
                                                                    {translate(sale.status)}
                                                                </span>
                                                            </td>
                                                        </>
                                                        : null
                                                }

                                                {
                                                    can("view_sale") || can("delete_sale")
                                                        ?
                                                        <td>
                                                            <div className="action-button">
                                                                {
                                                                    can("view_sale")
                                                                        ?
                                                                        <ActionButton
                                                                            to={{
                                                                                pathname: "/sale/view",
                                                                                state: { sale: sale._id }
                                                                            }}
                                                                            type="info"
                                                                            icon="visibility"
                                                                            position="left"
                                                                            tooltip="view"
                                                                        />
                                                                        : null
                                                                }
                                                                {
                                                                    can("delete_sale")
                                                                        ?
                                                                        <ActionButton
                                                                            to="#"
                                                                            type="error"
                                                                            icon="delete"
                                                                            position="left"
                                                                            tooltip="delete"
                                                                            onClick={() => {
                                                                                application.dispatch({ ids: [sale._id] })
                                                                                application.dispatch({ schema: "sale" })
                                                                                application.openDialog("deleted")
                                                                                setTimeout(() => {
                                                                                    window.location.reload()
                                                                                }, 5000)
                                                                            }}
                                                                        />
                                                                        : null
                                                                }
                                                            </div>
                                                        </td>
                                                        : null
                                                }
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_order") || can("list_proforma_invoice")
                    ?
                    <FloatingButton
                        to={application.state.pathname.includes("order") ? "/sale/order-list" : "/sale/proforma-invoice-list"}
                        tooltip={application.state.pathname.includes("order") ? "list orders" : "list proforma invoice"}
                        icon="list_alt"
                    />
                    : null
            }
        </>
    )

})

export default OrderView