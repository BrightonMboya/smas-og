// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../../components/button"
import Pagination from "../../../components/pagination"
import Search from "../../../components/search"
import { apiV1, commonCondition, formatDate, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { routerProps } from "../../../types"
import { ApplicationContext } from "../../../context"
import { Link } from "react-router-dom"
import ListComponentFilter from "../../../components/reusable/list-component-filter"
import { number } from "fast-web-kit"

// adjustment list memorized function component
const AdjustmentList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("list_stock_adjustment")) {
            setPageTitle("Stock adjustments")
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

            const pathname: string = props.location.pathname
            application.dispatch({ pathname })

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

            const order = -1
            const joinForeignKeys: boolean = true
            const sort: string = JSON.stringify({ createdAt: order })
            const select: object = { branch: 0, created_by: 0, updatedAt: 0, updated_by: 0 }
            const condition: string = JSON.stringify({ ...initialCondition, module: pathname.includes("store") ? "store" : "product" })
            const parameters: string = `schema=adjustment&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

            application.dispatch({ pathname })

            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "adjustments",
                sort: "createdAt",
                order,
                schema: "adjustment",
                collection: "adjustments",
                select,
                joinForeignKeys,
                fields: ["type", "description", "module"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // render list
    const renderList = React.useCallback(() => {
        try {
            return application.state.adjustments.map((adjustment: any, index: number) => (
                <tr key={adjustment._id} onClick={() => application.selectList(adjustment._id)}>
                    <td data-label={translate("#")}>{index + 1}</td>
                    <td data-label={translate("product")} className="sticky">
                        <Link to={can("view_product") ? {
                            pathname: application.state.pathname.includes("store") ? "/store/product-view" : "/product/view",
                            state: { [adjustment.product ? "product" : "store_product"]: adjustment.product ? adjustment.product._id : adjustment.store_product._id, }
                        } : "#"} className="bold">
                            {text.reFormat(adjustment.product.name)}&nbsp;{adjustment.category ? `(${text.reFormat(adjustment.category.name)})` : null}
                        </Link>
                    </td>
                    <td data-label={translate("user")}>
                        <Link to={can("view_user") ? {
                            pathname: "/user/view",
                            state: { user: adjustment.user._id }
                        } : "#"}>
                            {text.reFormat(adjustment.user.username)}
                        </Link>
                    </td>
                    <td data-label={translate("before adjustment")} className="right-align bold">
                        {number.format(adjustment.before_adjustment)}
                    </td>
                    <td data-label={translate("adjustment")} className={`right-align bold text-${adjustment.type === "increase" ? "success" : "error"}`}>
                        {adjustment.type === "increase" ? "+" : "-"}{number.format(adjustment.adjustment)}
                    </td>
                    <td data-label={translate("after adjustment")} className="right-align text-primary bold">
                        {number.format(adjustment.after_adjustment)}
                    </td>
                    <td data-label={translate("caused by")}>
                        {
                            translate(adjustment?.from === "sale_cart" ? "point of sale" :
                                adjustment?.from === "sale" ? "Sale" :
                                    adjustment?.from === "service" ? "Service" :
                                        adjustment?.from === "purchase" ? "Purchase" :
                                            adjustment.description.includes("sale") ? "Sale" :
                                                adjustment.description.includes("service") ? "Service" : "User")
                        }
                    </td>
                    <td className="center" data-label={translate("type")}>
                        <span className={`badge ${adjustment.type === "increase" ? "success" : "error"}`} data-tooltip={translate(adjustment.description)}>
                            <i className="material-icons-round">
                                {adjustment.type === "increase" ? "trending_up" : "trending_down"}
                            </i>
                            {translate(adjustment.type === "increase" ? "increased" : "decreased")}
                        </span>
                    </td>
                    <td className="center" data-label={translate("moment")} data-tooltip={translate(formatDate(adjustment.createdAt))} >
                        {getDate(adjustment.createdAt)}
                    </td>
                    {
                        can("view_stock_adjustment")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    <ActionButton
                                        to={{
                                            pathname: application.state.pathname.includes("product") ? "/product/adjustment-view" : "/store/adjustment-view",
                                            state: { adjustment: adjustment._id }
                                        }}
                                        type="info"
                                        icon="visibility"
                                        tooltip="view"
                                    />
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
    }, [application.state.ids, application.state.adjustments])

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
                                <th className="sticky">{translate("product")}</th>
                                <th>{translate("user")}</th>
                                <th className="right-align">{translate("before adjustment")}</th>
                                <th className="right-align">{translate("adjustment")}</th>
                                <th className="right-align">{translate("after adjustment")}</th>
                                <th >{translate("cause by")}</th>
                                <th className="center" >{translate("type")}</th>
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
                can("adjust_stock")
                    ? <FloatingButton
                        to={application.state.pathname.includes("store") ? "/store/adjustment-form" : "/product/adjustment-form"}
                        tooltip="adjust stock"
                    />
                    : null
            }
        </>
    )
})

export default AdjustmentList