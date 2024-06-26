// dependencies
import React from "react"
import { routerProps } from "../../../types"
import { can } from "../../../helpers/permissions"
import { ActionButton, FloatingButton } from "../../../components/button"
import { ApplicationContext } from "../../../context"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import Search from "../../../components/search"
import { Checkbox } from "../../../components/form"
import translate from "../../../helpers/translator"
import { array, number } from "fast-web-kit"
import ListComponentFilter from "../../../components/reusable/list-component-filter"

// account list memorized functional component
const AccountList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        onMount()
        setPageTitle("accounts")

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    // on component opening
    async function onMount(): Promise<void> {
        try {

            if (can("list_account")) {

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

                // request parameter, condition and sort
                const select: object = {
                    name: 1,
                    type: 1,
                    number: 1,
                    visible: 1,
                    balance: 1,
                    disabled: 1,
                    provider: 1,
                    monthly_fee: 1,
                }
                const joinForeignKeys: boolean = false
                const sort: string = JSON.stringify({ createdAt: -1 })
                const condition: string = JSON.stringify(initialCondition)
                const parameters: string = `schema=account&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

                application.mount({
                    route: `${apiV1}list`,
                    select,
                    joinForeignKeys,
                    fields: ["name", "provider", "number", "type"],
                    condition: "accounts",
                    sort: "time created",
                    order: -1,
                    parameters,
                    schema: "account",
                    collection: "accounts"
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

    // rendering componet
    const renderList = React.useCallback(() => {
        try {

            return application.state.accounts.map((account: any, index: number) => (
                <tr key={account._id} onClick={() => application.selectList(account._id)}>
                    {
                        can("delete_account")
                            ? <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(account._id)}
                                    checked={application.state.ids.indexOf(account._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label={"#"}>
                        {index + 1}
                    </td>
                    <td data-label={translate("name")} className="sticky bold">
                        {account.name}
                    </td>
                    <td data-label={translate("provider")} className="text-primary">
                        {text.reFormat(account.provider).toUpperCase()}
                    </td>
                    {
                        can("view_account_balance")
                            ?
                            <td data-label={translate("available balance")} className={`right-align text-${account.balance <= 0 ? "error" : "primary"}`}>
                                {number.format(account.balance)}
                            </td>
                            : null
                    }
                    <td data-label={translate("monthly fee")} className={`right-align text-error`}>
                        {number.format(account.monthly_fee)}
                    </td>
                    <td data-label={translate("account number")} className="center">
                        {(account.number ? account.number : translate("n/a")).toUpperCase()}
                    </td>
                    <td data-label={translate("account type")}>{text.reFormat(account.type)}</td>
                    <td data-label={translate("status")} className="center">
                        <span className={`badge ${account.disabled ? "error" : "success"}`}>
                            {translate(account.disabled ? "diabled" : "active")}
                        </span>
                    </td>
                    {
                        can("edit_account") || can("view_account")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("edit_account") && account.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/transaction/account-form",
                                                    state: { account: account._id }
                                                }}
                                                icon="edit_note"
                                                type="primary"
                                                position="left"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_account")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/transaction/account-view",
                                                    state: { account: account._id }
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
                </tr >
            ))

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
        // eslint-disable-next-line
    }, [application.state.accounts, application.state.ids])

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
                        application.state.ids.length > 0 && can("delete_account")
                            ?
                            <>
                                {
                                    can("delete_account") && (application.state.condition !== "deleted")
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
                    }
                </Search>
                <div className="card-content">
                    <table>
                        <thead>
                            <tr onClick={() => application.selectList()}>
                                {
                                    can("delete_account")
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
                                <th>{translate("provider")}</th>
                                {
                                    can("view_account_balance")
                                        ?
                                        <th className="right-align">{translate("available balance")}</th>
                                        : null
                                }
                                <th className="right-align">{translate("monthly fee")}</th>
                                <th>{translate("account number")}</th>
                                <th>{translate("account type")}</th>
                                <th className="center">{translate("status")}</th>
                                {
                                    can("edit_account") || (can("view_account"))
                                        ? <th className="center sticky-right">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderList()}
                        </tbody>
                        {
                            can("view_account_balance")
                                ?
                                <tfoot>
                                    <tr>
                                        <td className="text-primary bold">
                                            {translate("total")}
                                        </td>
                                        <td colSpan={3}></td>
                                        <td data-label={translate("total")} className="text-primary bold right-align">
                                            {
                                                number.format(
                                                    array.computeMathOperation(application.state.accounts.map((account: any) => account.balance), "+")
                                                )
                                            }
                                        </td>
                                        <td data-label={translate("fee")} className="text-error bold right-align">
                                            {
                                                number.format(
                                                    array.computeMathOperation(application.state.accounts.map((account: any) => account.monthly_fee), "+")
                                                )
                                            }
                                        </td>
                                        <td colSpan={4}></td>
                                    </tr>
                                </tfoot>
                                : null
                        }
                    </table>
                </div>
            </div>
            {
                can("create_account")
                    ?
                    <FloatingButton
                        to="/transaction/account-form"
                        tooltip="create account"
                    />
                    : null
            }
        </>
    )

})

export default AccountList