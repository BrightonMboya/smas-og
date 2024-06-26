// dependencies
import React from "react"
import { Option, Select } from "./form"
import { ApplicationContext } from "../context"
import { apiV1, commonCondition, number, text } from "../helpers"
import { readOrDelete, serverResponse } from "../types"
import { can } from "../helpers/permissions"
import { array, string } from "fast-web-kit"

// account list memorized function component
const AccountListComponent: React.FunctionComponent = React.memo(() => {

    // component context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    React.useEffect(() => {
        if (string.isNotEmpty(application.state.account)) {
            const accountData = application.state.accounts.filter((account: any) => account._id === application.state.account)[0]
            if (accountData) {
                application.dispatch({ accountData })
                if ((accountData.type === "customer") || (accountData.type === "supplier")) {
                    application.dispatch({
                        customers: accountData.customer ? [accountData.customer] : [],
                        suppliers: accountData.supplier ? [accountData.supplier] : [],
                        customerId: accountData.customer ? accountData.customer._id : "",
                        supplierId: accountData.supplier ? accountData.supplier._id : "",
                        customerName: accountData.customer ? `${text.reFormat(accountData.customer.name)} - ${accountData.customer.phone_number}` : "",
                        supplierName: accountData.supplier ? `${text.reFormat(accountData.supplier.name)} - ${accountData.supplier.phone_number}` : "",
                    })
                }
            }
        }
        // eslint-disable-next-line
    }, [application.state.account])

    async function onMount(): Promise<void> {
        try {

            const joinForeignKeys: boolean = true
            const sort: string = JSON.stringify({ name: 1 })
            const condition: string = JSON.stringify({ ...commonCondition(), disabled: false })
            const select: string = JSON.stringify({ name: 1, type: 1, balance: 1, provider: 1, supplier: 1, customer: 1 })
            const parameters: string = `schema=account&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}&sort=${sort}`

            // request options
            const options: readOrDelete = {
                parameters,
                method: "GET",
                loading: true,
                disabled: false,
                route: apiV1 + "list-all"
            }

            // api request
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success)
                application.dispatch({
                    accounts: response.message
                })
            else
                application.dispatch({
                    notification: response.message
                })

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
    }

    // rendering accounts
    const renderList = React.useCallback(() => {
        try {

            return application.state.accounts.map((account: any) => (
                <Option
                    key={account._id}
                    value={account._id}
                    label={`${account.name} - ${account.provider} - ${account.type} ${can("view_account_balance") ? `(${number.format(account.balance)})` : null}`}
                />
            ))

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
        // eslint-disable-next-line
    }, [application.state.accounts])

    return (
        <Select
            name="account"
            label="account"
            value={application.state.account}
            disabled={application.state.edit}
            error={application.state.accountError}
            onChange={application.handleInputChange}
            onClick={() => array.isEmpty(application.state.accounts) ? onMount() : null}
        >
            <Option label={"select account"} value={""} />
            {renderList()}
        </Select>
    )

})

export default AccountListComponent