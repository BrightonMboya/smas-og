// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../components/button"
import Filter from "../../components/filter"
import { Checkbox } from "../../components/form"
import Pagination from "../../components/pagination"
import Search from "../../components/search"
import { apiV1, commonCondition, getDate, getTon, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { routerProps } from "../../types"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { ApplicationContext } from "../../context"
import { Link } from "react-router-dom"
import { array, number } from "fast-web-kit"

// purchase list memorized functional component
const PurchaseList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("list_purchase")) {
            setPageTitle("Purchases")
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

    // fetching component data
    async function onMount(): Promise<void> {
        try {

            const pathname = props.location.pathname
            application.dispatch({ isStoreProduct: pathname.includes("store") })

            // creating initial condition
            let initialCondition: object = { ...commonCondition(), for_store_product: pathname.includes("store") }

            // checking if condition has been passed from other components
            if (props.location.state) {
                const { propsCondition }: any = props.location.state
                if (propsCondition) {
                    initialCondition = { ...initialCondition, ...propsCondition }
                    application.dispatch({ propsCondition })
                }
            }

            // parameters, sort, condition, select and foreign key
            const condition: string = JSON.stringify(initialCondition)
            const sort: string = JSON.stringify({ createdAt: -1 })
            const select: object = { branch: 0, created_by: 0, createdAt: 0, updatedAt: 0, updated_by: 0 }
            const joinForeignKeys: boolean = true
            const parameters: string = `schema=purchase&condition=${condition}&select=${JSON.stringify(select)}&sort=${sort}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            // making api request
            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "purchases",
                sort: "created time",
                order: -1,
                collection: "purchases",
                schema: "purchase",
                select,
                joinForeignKeys,
                fields: ["number"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderList = React.useCallback(() => {
        try {
            return application.state.purchases.map((data: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(data._id)}>
                    {
                        can("delete_purchase") && (application.state.condition !== "deleted")
                            ? <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(data._id)}
                                    checked={application.state.ids.indexOf(data._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#"> {index + 1}</td>
                    <td data-label={translate("product")} className="sticky">
                        <Link to={can("view_product") ? {
                            pathname: "/product/view",
                            state: { product: data.product?._id }
                        } : "#"} className="bold">
                            {text.reFormat(data.product?.name)}&nbsp;{data.category ? `(${text.reFormat(data.category.name)})` : null}
                        </Link>
                    </td>
                    {
                        application.user.branch && application.user.branch?.type === "energy_supplies"
                        ?
                        <td data-label={translate("ton")} className="right-align">
                            {number.format(getTon(data.product?.name, data.quantity))}
                        </td>
                        : null
                    }
                    {
                        can("view_stock")
                            ?
                            <td className="right-align" data-label={translate("stock before")}>
                                {data.stock_before ? number.format(data.stock_before) : translate("n/a")}
                            </td>
                            : null
                    }
                    <td data-label={translate("quantity")} className="right-align"> {data.quantity}</td>
                    {
                        can("view_stock")
                            ?
                            <td className="right-align" data-label={translate("stock after")}>
                                {data.stock_after ? number.format(data.stock_after) : translate("n/a")}
                            </td>
                            : null
                    }
                    <td data-label={translate("supplier")}> {data.supplier ? text.reFormat(data.supplier?.name) : translate("n/a")}</td>
                    <td data-label={translate("invoice number")} className="right-align"> {data.number ? data.number : translate("n/a")}</td>
                    <td data-label={translate("reference")}> {data.reference ? data.reference : translate("n/a")}</td>
                    <td data-label={translate("amount")} className="right-align text-success"> {number.format(data.total_amount)}</td>
                    <td data-label={translate("paid")} className="right-align text-primary"> {number.format(data.paid_amount)}</td>
                    <td data-label={translate("remain amount")} className="right-align text-error"> {number.format(data.total_amount - data.paid_amount)}</td>
                    <td data-label={translate("date")} className="center">{getDate(data.date)}</td>
                    {
                        can("view_purchase") || can("edit_purchase")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("edit_purchase") && data.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: application.state.isStoreProduct ? "/store/purchase-form" : "/purchase/form",
                                                    state: { purchase: data._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                position="left"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_purchase")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: application.state.isStoreProduct ? "/store/purchase-view" : "/purchase/view",
                                                    state: { purchase: data._id }
                                                }}
                                                type="info"
                                                icon="visibility"
                                                position="left"
                                                tooltip="view"
                                            />
                                            : null
                                    }
                                </div>
                            </td>
                            : null
                    }
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.purchases, application.state.ids])

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
            {renderFilter()}
            <div className="card list">
                <Search
                    refresh={onMount}
                    select={application.selectList}
                    onClick={application.searchData}
                    value={application.state.searchKeyword}
                    onChange={application.handleInputChange}
                >
                    {
                        application.state.ids.length > 0 && (can("delete_purchase") && (application.state.condition !== "deleted"))
                            ?
                            <>
                                {
                                    can("delete_purchase") && (application.state.condition !== "deleted")
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
                                    can("delete_purchase") && (application.state.condition !== "deleted")
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
                                <th className="sticky">{translate("product")}</th>
                                {
                                    application.user.branch && application.user.branch?.type === "energy_supplies"
                                        ?
                                        <th className="right-align">
                                            {translate("ton")}
                                        </th>
                                        : null
                                }
                                {
                                    can("view_stock")
                                        ?
                                        <th className="right-align">{translate("stock before")}</th>
                                        : null
                                }
                                <th className="right-align">{translate("quantity")}</th>
                                {
                                    can("view_stock")
                                        ?
                                        <th className="right-align">{translate("stock after")}</th>
                                        : null
                                }
                                <th>{translate("supplier")}</th>
                                <th className="right-align">{translate("invoice number")}</th>
                                <th className="">{translate("reference")}</th>
                                <th className="right-align">{translate("total amount")}</th>
                                <th className="right-align">{translate("paid amount")}</th>
                                <th className="right-align">{translate("remain amount")}</th>
                                <th className="center">{translate("date")}</th>
                                {
                                    can("view_purchase")
                                        ?
                                        <th className="center sticky-right">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderList()}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={(application.state.condition !== "deleted") && can("delete_purchase") ? 9 : 8}>
                                    <span className="text-primary uppercase bold">
                                        {translate("total")}
                                    </span>
                                </td>
                                <td className="right-align" data-label={translate("total amount")}>
                                    <span className="text-success bold">
                                        {
                                            number.format(
                                                array.computeMathOperation(application.state.purchases
                                                    .map((purchase: any) => purchase.total_amount), "+")
                                            )
                                        }
                                    </span>
                                </td>
                                <td className="right-align" data-label={translate("paid amount")}>
                                    <span className="text-primary bold">
                                        {
                                            number.format(
                                                array.computeMathOperation(application.state.purchases
                                                    .map((purchase: any) => purchase.paid_amount), "+")
                                            )
                                        }
                                    </span>
                                </td>
                                <td className="right-align" data-label={translate("remain amount")}>
                                    <span className="text-error bold">
                                        {
                                            number.format(
                                                array.computeMathOperation(application.state.purchases
                                                    .map((purchase: any) => purchase.total_amount - purchase.paid_amount), '+')
                                            )
                                        }
                                    </span>
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
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
                can("create_purchase")
                    ?
                    <FloatingButton
                        tooltip="new purchase"
                        to={application.state.isStoreProduct ? "/store/purchase-form" : "/purchase/form"}
                    />
                    : null
            }
        </>
    )

})

// exporting component
export default PurchaseList