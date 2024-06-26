// dependencies
import React from "react"
import { routerProps } from "../../types"
import { ApplicationContext } from "../../context"
import { apiV1, commonCondition, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import { ActionButton, FloatingButton } from "../../components/button"
import Filter from "../../components/filter"
import Search from "../../components/search"
// import { Checkbox } from "../../components/form"
import translate from "../../helpers/translator"
import { array, number } from "fast-web-kit"
import { Link } from "react-router-dom"

// transactionlist memorized functional component
const TransactionList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        setPageTitle("transactions")
        onMount()

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            if (can("list_transaction")) {
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
                const select: object = {
                    fee: 1,
                    type: 1,
                    sale: 1,
                    debt: 1,
                    date: 1,
                    number: 1,
                    visible: 1,
                    account: 1,
                    expense: 1,
                    purchase: 1,
                    reference: 1,
                    description: 1,
                    total_amount: 1,
                    truck_order: 1,
                    quotation_invoice: 1
                }
                const joinForeignKeys: boolean = true
                const sort: string = JSON.stringify({ createdAt: -1 })
                const condition: string = JSON.stringify(initialCondition)
                const parameters: string = `schema=transaction&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

                application.mount({
                    route: `${apiV1}list`,
                    select,
                    joinForeignKeys,
                    fields: ["type", "reference", "description"],
                    condition: "transactions",
                    sort: "time created",
                    order: -1,
                    parameters,
                    schema: "transaction",
                    collection: "transactions"
                })
            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({
                    notification: noAccess
                })
            }

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
    }

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

    // rendering transactions
    const renderList = React.useCallback(() => {
        try {

            return application.state.transactions.map((transaction: any, index: number) => (
                <tr key={transaction._id} onClick={() => application.selectList(transaction._id)}>
                    {/* {
                        can("delete_transaction")
                            ? <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(transaction._id)}
                                    checked={application.state.ids.indexOf(transaction._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    } */}
                    <td>{index + 1}</td>
                    <td data-label={translate("account")} className="sticky">
                        <Link to={{
                            state: { account: transaction.account._id },
                            pathname: can("view_account") ? "/account/view" : "#"
                        }} className=" bold">
                            {/* - ${text.reFormat(transaction.account.type)} ${can("view_account_balance") ? `- ${number.format(transaction.account.balance)}` : null} */}
                            {`${transaction.account.name} - ${text.reFormat(transaction.account.provider)}`}
                        </Link>
                    </td>
                    {/* <td data-label={translate("number")} className="right-align">
                        {transaction.number}
                    </td> */}
                    <td data-label={translate("amount")} className="right-align">
                        {number.format(transaction.total_amount)}
                    </td>
                    <td data-label={translate("fee")} className="right-align text-error">
                        {number.format(transaction.fee)}
                    </td>
                    <td data-label={translate("total amount")} className="right-align text-primary">
                        {number.format(transaction.total_amount + transaction.fee)}
                    </td>
                    <td data-label={translate("reference")} className="text-secondary">
                        {transaction.reference ? transaction.reference : translate("n/a")}
                    </td>
                    <td className="center" data-label={translate("type")}>
                        <span className={`badge ${transaction.type === "deposit" ? "success" : "error"}`} data-tooltip={transaction.description}>
                            {translate(transaction.type)}
                        </span>
                    </td>
                    <td className="center">
                        {getDate(transaction.date)}
                    </td>
                    {
                        can("edit_transaction") || can("view_transaction")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("edit_transaction") &&
                                            !transaction.sale &&
                                            !transaction.debt &&
                                            transaction.visible &&
                                            !transaction.expense &&
                                            !transaction.truck_order &&
                                            !transaction.quotation_invoice &&
                                            !transaction.purchase
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/transaction/form",
                                                    state: { transaction: transaction._id }
                                                }}
                                                icon="edit_note"
                                                type="primary"
                                                position="left"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_transaction")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/transaction/view",
                                                    state: { transaction: transaction._id }
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
                            : null
                    }
                </tr>
            ))

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
        // eslint-disable-next-line
    }, [application.state.ids, application.state.transactions])

    // component view
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
                    {/* {
                        application.state.ids.length > 0 &&
                            can("delete_transaction") &&
                            !application.state.condition.includes("sale") &&
                            !application.state.condition.includes("debt") &&
                            !application.state.condition.includes("expense") &&
                            !application.state.condition.includes("purchase") &&
                            application.state.condition !== "transactions"
                            ?
                            <>
                                {
                                    can("delete_transaction") && (application.state.condition !== "deleted")
                                        ?
                                        <ActionButton
                                            icon="delete"
                                            to="#"
                                            type="error"
                                            tooltip={`Delete`}
                                            position="left"
                                            onClick={() => application.openDialog("deleted")}
                                        />
                                        : null

                                }
                            </>
                            : null
                    } */}
                </Search>
                <div className="card-content">
                    <table>
                        <thead>
                            <tr onClick={() => application.selectList()}>
                                {/* {
                                    can("delete_transaction")
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state[application.state.collection]?.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null

                                } */}
                                <th>{translate("#")}</th>
                                <th className="sticky">{translate("Account")}</th>
                                {/* <th>{translate("number")}</th> */}
                                <th className="right-align">{translate("amount")}</th>
                                <th className="right-align">{translate("fee")}</th>
                                <th className="right-align">{translate("total amount")}</th>
                                <th>{translate("reference")}</th>
                                <th className="center">{translate("type")}</th>
                                <th className="center">{translate("date")}</th>
                                {
                                    (can("view_transaction"))
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
                                <td className="bold" colSpan={2}>
                                    {translate("total")}
                                </td>
                                <td className="bold right-align" data-label={translate("amount")}>
                                    {
                                        number.format(
                                            array.computeMathOperation(application.state.transactions.map((transaction: any) => transaction.total_amount), "+")
                                        )
                                    }
                                </td>
                                <td className="text-error bold right-align" data-label={translate("fee")}>
                                    {
                                        number.format(
                                            array.computeMathOperation(application.state.transactions.map((transaction: any) => transaction.fee), "+")
                                        )
                                    }
                                </td>
                                <td className="bold right-align text-primary" data-label={translate("total amount")}>
                                    {
                                        number.format(
                                            array.computeMathOperation(application.state.transactions.map((transaction: any) => transaction.fee + transaction.total_amount), "+")
                                        )
                                    }
                                </td>
                                <td colSpan={4}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            {
                can("create_transaction")
                    ?
                    <FloatingButton
                        icon="add_circle"
                        to="/transaction/form"
                        tooltip="create transaction"
                    />
                    : null
            }
        </>
    )

})

export default TransactionList