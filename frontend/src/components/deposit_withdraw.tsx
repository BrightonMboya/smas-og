// dependencies
import React from "react"
import { Option, Select } from "./form"
import { ApplicationContext } from "../context"
import { apiV1, commonCondition, number } from "../helpers"
import { readOrDelete, serverResponse } from "../types"
import { can } from "../helpers/permissions"
import { array, string } from "fast-web-kit"

type depositOrWithdraw = {
    type: string
}

// account list memorized function component
const DepositOrWithdraw: React.FunctionComponent<depositOrWithdraw> = React.memo((props: depositOrWithdraw) => {

    // component context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        onMount()
        // component unmounting
        // return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    React.useEffect(() => {
        if (string.isNotEmpty(application.state.secondAccount)) {
            const secondAccountData = application.state.secondAccounts.filter((account: any) => account._id === application.state.secondAccount)[0]
            if (secondAccountData)
                application.dispatch({ secondAccountData })
        }
        // eslint-disable-next-line
    }, [application.state.secondAccount])

    async function onMount(): Promise<void> {
        try {

            const joinForeignKeys: boolean = false
            const sort: string = JSON.stringify({ name: 1 })
            const select: string = JSON.stringify({ name: 1, type: 1, balance: 1, provider: 1 })
            const initialCondition = commonCondition()
            const conditionExpression = initialCondition.$expr
            const condition: string = JSON.stringify({
                ...initialCondition,
                $expr: {
                    $and: [
                        conditionExpression,
                        { $ne: ["$type", "user"] },
                        { $ne: ["$type", "supplier"] },
                        { $ne: ["$type", "customer"] },
                    ]
                }
            })
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
                    secondAccounts: response.message
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

            return application.state.secondAccounts.map((account: any) => (
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
    }, [application.state.secondAccounts])

    if (can("view_account"))
        return (
            <Select
                name="secondAccount"
                value={application.state.secondAccount}
                onChange={application.handleInputChange}
                error={application.state.secondAccountError}
                label={`${props.type} ${props.type === "deposit" ? "to" : "from"}`}
                onClick={() => array.isEmpty(application.state.secondAccounts) ? onMount() : null}
                disabled={application.state.edit || (props.type === "withdraw" && application.state.accountData?.type === "customer")}
            >
                <Option label={"select account"} value={""} />
                {renderList()}
            </Select>
        )

    return null

})

export default DepositOrWithdraw