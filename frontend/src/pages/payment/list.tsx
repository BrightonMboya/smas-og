// dependencies
import React from "react"
import { ActionButton } from "../../components/button"
import Filter from "../../components/filter"
import { Checkbox } from "../../components/form"
import Pagination from "../../components/pagination"
import Search from "../../components/search"
import { apiV1, commonCondition, getDate, noAccess, number, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { routerProps } from "../../types"
import { ApplicationContext } from "../../context"
import { Link } from "react-router-dom"

// payment list memorized function component
const PaymentList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // check permission
        if (can("list_payment")) {
            setPageTitle("payments")
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

    // fetch component data
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
            const joinForeignKeys: boolean = true
            const sort: string = JSON.stringify({ createdAt: -1 })
            const condition: string = JSON.stringify({ ...initialCondition, status: "active" })
            const select: object = { created_by: 0, updated_by: 0, __v: 0, updatedAt: 0 }
            const parameters: string = `schema=payment&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            application.mount({
                route: `${apiV1}list`,
                select,
                joinForeignKeys,
                fields: ["type"],
                condition: "active",
                sort: "createdAt",
                order: -1,
                parameters,
                schema: "payment",
                collection: "payments"
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // render payment
    const renderList = React.useCallback(() => {
        try {
            return application.state.payments.map((payment: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(payment._id)}>
                    {
                        can("cancel_payment") && (application.state.condition === "active")
                            ? <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(payment._id)}
                                    checked={application.state.ids.indexOf(payment._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("branch")} className="sticky">
                        <Link to={can("view_branch") ? {
                            pathname: "/branch/view",
                            state: { branch: payment.branch._id }
                        } : "#"} className="bold">
                            {text.reFormat(payment.branch?.name)}
                        </Link>
                    </td>
                    <td data-label={translate("type")}>{translate(payment.type)}</td>
                    <td className="right-align text-primary" data-label={("total amount")}>
                        {number.format(payment.total_amount)}
                    </td>
                    <td className="center" data-label={translate("status")}>
                        <span className={`badge ${payment.status === "active" ? "success" : "error"}`}>
                            {translate(payment.status)}
                        </span>
                    </td>
                    <td className="center" data-label={translate("date")}>
                        {getDate(payment.createdAt)}
                    </td>
                    {
                        can("view_payment")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("view_payment")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/payment/view",
                                                    state: { payment: payment._id }
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
    }, [application.state.payments, application.state.ids])

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
                        application.state.ids.length > 0 && (can("cancel_payment")) && (application.state.condition === "active")
                            ?
                            <>
                                {
                                    can("cancel_payment")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="error"
                                            icon="cancel"
                                            tooltip="cancel"
                                            position="left"
                                            onClick={() => application.openDialog("canceled")}
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
                                    can("cancel_payment") && (application.state.condition === "active")
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
                                <th className="sticky">{translate("branch")}</th>
                                <th>{translate("type")}</th>
                                <th className="right-align">{translate("total amount")}</th>
                                <th className="center">{translate("status")}</th>
                                <th className="center">{translate("date")}</th>
                                {
                                    can("view_payment")
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
                                <td colSpan={can("cancel_payment") && (application.state.condition === "active") ? 4 : 3}>
                                    <span className="bold uppercase text-primary">
                                        {translate("total")}
                                    </span>
                                </td>
                                <td className="right-align bold text-primary" data-label={translate("total amount")}>
                                    {number.format(application.state.payments.map((payment: any) => payment.total_amount).reduce((a: number, b: number) => a + b, 0))}
                                </td>
                                <td colSpan={3}></td>
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
        </>
    )

})

// export component
export default PaymentList