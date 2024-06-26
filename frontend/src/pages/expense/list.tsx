// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../components/button"
import { Checkbox } from "../../components/form"
import Search from "../../components/search"
import { apiV1, commonCondition, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { routerProps } from "../../types"
import Pagination from "../../components/pagination"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { ApplicationContext } from "../../context"
import { number } from "fast-web-kit"
import ListComponentFilter from "../../components/reusable/list-component-filter"
import { Icon } from "../../components/elements"

// expense list memorized functional component
const ExpenseList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    //    application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("list_expense")) {
            setPageTitle("expenses")
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
            const select: object = {}
            const sort: string = JSON.stringify({ createdAt: -1 })
            const condition: string = JSON.stringify(initialCondition)
            const joinForeignKeys: boolean = true
            const parameters: string = `schema=expense&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            application.mount({
                route: `${apiV1}list`,
                select,
                joinForeignKeys,
                fields: ["name", "description", "reference"],
                condition: "expenses",
                sort: "created time",
                order: -1,
                parameters,
                schema: "expense",
                collection: "expenses"
            })


        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderExpenses = React.useCallback(() => {
        try {
            return application.state.expenses.map((data: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(data._id)}>
                    {
                        can("delete_expense") || can("restore_deleted")
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
                    <td data-label={translate("name")} className="sticky bold"> {text.reFormat(data.name)}</td>
                    <td data-label={translate("reference")} className="semibold">
                        {data.reference ? data.reference : translate("n/a")}
                    </td>
                    {
                        can("view_truck_on_expense")
                            ?
                            <td data-label={translate("truck")}>
                                {
                                    data.truck ?
                                        text.reFormat(data.truck.name)
                                        : translate("n/a")
                                }
                            </td>
                            : null
                    }
                    <td data-label={translate("type")}> {text.reFormat(data.expense_type?.name)}</td>
                    <td data-label={translate("total amount")} className="right-align text-success">
                        {number.format(data.total_amount)}
                    </td>
                    <td data-label={translate("paid amount")} className="right-align text-primary">
                        {number.format(data.paid_amount)}
                    </td>
                    <td data-label={translate("remain amount")} className="right-align text-error">
                        {number.format(data.total_amount - data.paid_amount)}
                    </td>
                    <td className="center">
                        <span className={`badge ${data.has_receipt ? "primary" : "warning"}`}>
                            <Icon name={`${data.has_receipt ? "done_all" : "warning"}`} />
                            {translate(data.has_receipt ? "yes" : "no")}
                        </span>
                    </td>
                    <td data-label={translate("date")} className="center">
                        {getDate(data.date)}
                    </td>
                    {
                        can("edit_expense") || can("view_expense")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("edit_expense") && data.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/expense/form",
                                                    state: { expense: data._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                position="left"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_expense")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/expense/view",
                                                    state: { expense: data._id }
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
    }, [application.state.expenses, application.state.ids])

    // component view
    return (
        <>
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
                        application.state.ids.length > 0 && (can("delete_expense") || can("restore_deleted"))
                            ?
                            <>
                                {
                                    can("delete_expense") && (application.state.condition !== "deleted")
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
                                {
                                    can("restore_deleted") && (application.state.condition === "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="primary"
                                            icon="restore_from_trash"
                                            tooltip="restore"
                                            position="left"
                                            onClick={() => application.openDialog("restored")}
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
                                    (can("delete_expense") || can("restore_deleted"))
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
                                <th className="sticky">{translate("name")}</th>
                                <th>{translate("reference")}</th>
                                {
                                    can("view_truck_on_expense")
                                        ?
                                        <th >{translate("truck")}</th>
                                        : null
                                }
                                <th >{translate("type")}</th>
                                <th className="right-align">{translate("total amount")}</th>
                                <th className="right-align">{translate("paid amount")}</th>
                                <th className="right-align">{translate("remain amount")}</th>
                                <th className="center">{translate("has receipt")}</th>
                                <th className="center">{translate("date")}</th>
                                {
                                    can("edit_expense") || can("view_expense")
                                        ?
                                        <th className="center sticky-right">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderExpenses()}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={can("view_truck_on_expense") ? 6 : 5}>
                                    <span className="text-primary uppercase bold">
                                        {translate("total")}
                                    </span>
                                </td>
                                <td className="right-align" data-label={translate("total amount")}>
                                    <span className="text-success bold">
                                        {
                                            number.format(
                                                application.state.expenses
                                                    .map((expense: any) => expense.total_amount)
                                                    .reduce((a: number, b: number) => a + b, 0)
                                            )
                                        }
                                    </span>
                                </td>
                                <td className="right-align" data-label={translate("paid amount")}>
                                    <span className="text-primary bold">
                                        {
                                            number.format(
                                                application.state.expenses
                                                    .map((expense: any) => expense.paid_amount)
                                                    .reduce((a: number, b: number) => a + b, 0)
                                            )
                                        }
                                    </span>
                                </td>
                                <td className="right-align" data-label={translate("remain amount")}>
                                    <span className="text-error bold">
                                        {
                                            number.format(
                                                application.state.expenses
                                                    .map((expense: any) => expense.total_amount - expense.paid_amount)
                                                    .reduce((a: number, b: number) => a + b, 0)
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
                can("create_expense")
                    ?
                    <FloatingButton
                        to="/expense/form"
                        tooltip="new expense"
                    />
                    : null
            }
        </>
    )

})

// export component
export default ExpenseList