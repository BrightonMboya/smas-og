// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../../components/button"
import Search from "../../../components/search"
import { apiV1, commonCondition, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { routerProps } from "../../../types"
import { ApplicationContext } from "../../../context"
import { Link } from "react-router-dom"
import { number } from "fast-web-kit"
import ListComponentFilter from "../../../components/reusable/list-component-filter"

// truck order list memorized function component
const TruckOrderList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("list_truck_order")) {
            onMount()
            setPageTitle("truck orders")
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

            // request parameter, condition and sort
            const sort: string = JSON.stringify({ date: -1 })
            const condition: string = JSON.stringify(initialCondition)
            const select: object = {}
            const joinForeignKeys: boolean = true
            const parameters: string = `schema=truck_order&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            application.mount({
                route: `${apiV1}list`,
                select,
                joinForeignKeys,
                fields: ["number", "route_name", "description"],
                condition: "truck_orders",
                sort: "date",
                order: -1,
                parameters,
                schema: "truck_order",
                collection: "truck_orders"
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderList = React.useCallback(() => {
        try {
            return application.state.truck_orders.map((order: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("order number")} className="right-align">{order.number}</td>
                    <td data-label={translate("debtor / creditor")} className="sticky">
                        <Link to={can("view_customer") ? {
                            pathname: "/customer/view",
                            state: { customer: order.customer?._id }
                        } : "#"} className="bold">
                            {text.reFormat(order.customer?.name)}
                        </Link>
                    </td>
                    <td data-label={translate("truck")}>
                        <Link to={can("view_truck") ? {
                            pathname: "/truck/view",
                            state: { truck: order.truck?._id }
                        } : "#"}>
                            {text.reFormat(order.truck.name)}
                        </Link>
                    </td>
                    <td data-label={translate("route")}>
                        <Link to={can("view_route") ? {
                            pathname: "/truck/route-view",
                            state: { route: order.route?._id }
                        } : "#"}>
                            {text.reFormat(order.route_name)}
                        </Link>
                    </td>
                    <td className="right-align text-primary" data-label={translate("cost")}>{number.format(order.total_amount)}</td>
                    <td className="right-align text-success" data-label={translate("paid amount")}>{number.format(order.paid_amount)}</td>
                    <td className="right-align text-error" data-label={translate("remain amount")}>{number.format(order.total_amount - order.paid_amount)}</td>
                    <td className="center">
                        {getDate(order.date)}
                    </td>
                    <td className="sticky-right">
                        <div className="action-button">
                            {
                                order.truck.status === "rented"
                                    ?
                                    <ActionButton
                                        to="#"
                                        icon="done_all"
                                        type="success"
                                        position="left"
                                        tooltip="delivered"
                                        onClick={() => {
                                            application.openDialog("available")
                                            application.dispatch({ ids: [order.truck._id], schema: "truck" })
                                        }}
                                    />
                                    : null
                            }
                            {
                                can("edit_truck_order") && order.visible /* && order.status !== "paid" */
                                    ?
                                    <ActionButton
                                        to={{
                                            pathname: "/truck/order-form",
                                            state: { truck_order: order._id }
                                        }}
                                        icon="edit_note"
                                        type="primary"
                                        position="left"
                                        tooltip="edit"
                                    />
                                    : null
                            }
                            {
                                can("view_truck_order")
                                    ?
                                    <ActionButton
                                        to={{
                                            pathname: "/truck/order-view",
                                            state: { truck_order: order._id }
                                        }}
                                        icon="visibility"
                                        type="info"
                                        position="left"
                                        tooltip="view"
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
    }, [application.state.ids, application.state.truck_orders])

    // component view
    return (
        <>
            <ListComponentFilter />
            <div className="card list">
                <Search
                    refresh={onMount}
                    select={application.selectList}
                    onClick={application.searchData}
                    value={application.state.searchKeyword}
                    onChange={application.handleInputChange}
                >
                </Search>
                <div className="card-content">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th className="right-align">{translate("order number")}</th>
                                <th className="sticky">{translate("customer")}</th>
                                <th>{translate("truck")}</th>
                                <th>{translate("route")}</th>
                                <th className="right-align">{translate("cost")}</th>
                                <th className="right-align">{translate("paid amount")}</th>
                                <th className="right-align">{translate("remain amount")}</th>
                                <th className="center">{translate("date")}</th>
                                {
                                    can("edit_truck_order") || (can("view_truck_order"))
                                        ? <th className="center sticky-right">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderList()}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="uppercase text-primary bold" colSpan={5}>
                                    {translate("total")}
                                </td>
                                <td className="right-align bold text-primary" data-label={translate("cost")}>
                                    {
                                        number.format(
                                            application.state.truck_orders.map((order) => order.total_amount).reduce((a: number, b: number) => a + b, 0)
                                        )
                                    }
                                </td>
                                <td className="right-align text-success bold" data-label={translate("paid amount")}>
                                    {
                                        number.format(
                                            application.state.truck_orders.map((order) => order.paid_amount).reduce((a: number, b: number) => a + b, 0)
                                        )
                                    }
                                </td>
                                <td className="right-align text-error bold" data-label={translate("remain amount")}>
                                    {
                                        number.format(
                                            application.state.truck_orders.map((order) => order.total_amount - order.paid_amount).reduce((a: number, b: number) => a + b, 0)
                                        )
                                    }
                                </td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            {
                can("create_truck_order")
                    ? <FloatingButton to="/truck/order-form" tooltip="new truck order" />
                    : null
            }
        </>
    )

})

export default TruckOrderList