// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../../components/button"
import Pagination from "../../../components/pagination"
import Search from "../../../components/search"
import { apiV1, commonCondition, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import { routerProps } from "../../../types"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { Checkbox } from "../../../components/form"
import { ApplicationContext } from "../../../context"
import ListComponentFilter from "../../../components/reusable/list-component-filter"
import { number } from "fast-web-kit"

// debt list memorized functional component
const DebtHistoryList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("list_debt_history")) {

            // defining document title
            setPageTitle("debt histories")
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
            const joinForeignKeys: boolean = true
            const sort: string = JSON.stringify({ date: -1 })
            const condition: string = JSON.stringify(initialCondition)
            const select: object = { branch: 0, created_by: 0, updated_by: 0, createdAt: 0, updatedAt: 0, __v: 0 }
            const parameters: string = `schema=debt_history&condition=${condition}&select=${JSON.stringify(select)}&sort=${sort}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            // making api request
            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "debt_histories",
                sort: "date",
                order: -1,
                collection: "debt_histories",
                schema: "debt_history",
                select,
                joinForeignKeys,
                fields: ["description", "reference"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering debts
    const renderList = React.useCallback(() => {
        try {
            return application.state.debt_histories.map((data: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(data._id)}>
                    {
                        (can("delete_debt_history") || can("restore_deleted"))
                            ? <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(data._id)}
                                    checked={application.state.ids.indexOf(data._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">
                        {index + 1}
                    </td>
                    <td data-label={translate("debtor / creditor")} className="sticky bold">
                        {
                            text.reFormat(
                                data.debt.customer ? data.debt.customer?.name :
                                    data.debt.expense ? data.debt.expense?.name :
                                        data.debt.supplier ? data.debt.supplier?.name : "n/a"
                            )
                        }
                    </td>
                    <td data-label={translate("reference")} className="semibold">
                        {data.reference ? data.reference : translate("n/a")}
                    </td>
                    <td data-label={translate("type")} className="center">
                        {
                            translate(
                                data.debt.sale ? "sale debt" :
                                    data.debt.expense ? "expense debt" :
                                    data.debt.truck_order ? "truck order debt" :
                                        data.debt.purchase || data.debt.supplier ? "supplier debt" :
                                            data.debt.quotation_invoice ? "quotation invoice debt" : "customer debt"
                            )
                        }&nbsp;-&nbsp;
                        <span className={`semibold text-${data.debt.type === "debtor" ? "primary" : "error"}`}>
                            {translate(data.debt.type)}
                        </span>
                    </td>
                    <td data-label={translate("debt")} className="right-align text-error">
                        {number.format(data.debt.total_amount)}
                    </td>
                    <td data-label={translate("paid amount")} className="right-align text-success">
                        {number.format(data.total_amount)}
                    </td>
                    <td className="center" data-label={translate("date")}>
                        {getDate(data.date)}
                    </td>
                    {
                        can("view_debt_history")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    <ActionButton
                                        type="info"
                                        to={{
                                            pathname: "/debt/history-view",
                                            state: { debt_history: data._id }
                                        }}
                                        tooltip="view"
                                        icon="visibility"
                                        position="left"
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
    }, [application.state.debt_histories, application.state.ids])

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
                    {

                        (application.state.ids.length >= 1) && (application.state.condition !== "deleted")
                            ?
                            <ActionButton
                                to="#"
                                icon="delete"
                                type="error"
                                tooltip="delete"
                                position="left"
                                onClick={() => application.openDialog("deleted")}
                            />
                            : null
                    }
                </Search>
                <div className="card-content">
                    <table>
                        <thead>
                            <tr onClick={() => application.selectList()}>
                                {
                                    can("delete_debt_history") || can("restore_deleted")
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
                                <th className="sticky">{translate("debtor / creditor")}</th>
                                <th>{translate("reference")}</th>
                                <th className="center">{translate("type")}</th>
                                <th className="right-align">{translate("debt")}</th>
                                <th className="right-align">{translate("paid amount")}</th>
                                <th className="center">{translate("date")}</th>
                                {
                                    can("view_debt_history")
                                        ? <th className="center sticky-right">{translate("options")}</th>
                                        : null
                                }
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
                can("create_debt")
                    ?
                    <FloatingButton to="/debt/form" tooltip="new debt" />
                    : null
            }
        </>
    )

})

// exporting component
export default DebtHistoryList