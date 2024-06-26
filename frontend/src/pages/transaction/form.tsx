// dependencies
import React from "react"
import { createOrUpdate, readOrDelete, routerProps, serverResponse, stateKey } from "../../types"
import { can } from "../../helpers/permissions"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { ApplicationContext } from "../../context"
import { apiV1, noAccess, number, pageNotFound, setPageTitle, transactionTypes } from "../../helpers"
import { array, string } from "fast-web-kit"
import { Input, Option, Select, Textarea } from "../../components/form"
import AccountListComponent from "../../components/account-list"
import CustomDatalist from "../../components/datalist"
import pluralize from "pluralize"
import DepositOrWithdraw from "../../components/deposit_withdraw"

// transaction form memorized function component
const TransactionForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        onMount()
        // component unmounting
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    // on page opening
    async function onMount(): Promise<void> {
        try {

            // checking user access
            if (can("create_transaction") || can("edit_transaction")) {
                setPageTitle("new transaction")

                // checking if  location state in provided
                if (props.location.state) {

                    // checking if transaction is available on location state
                    const { transaction, account }: any = props.location.state
                    if (transaction) {

                        const joinForeignKeys: boolean = true
                        const select: string = JSON.stringify({})
                        const condition: string = JSON.stringify({ _id: transaction })
                        const parameters: string = `schema=transaction&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
                        const options: readOrDelete = {
                            parameters,
                            method: "GET",
                            loading: true,
                            disabled: false,
                            route: apiV1 + "read"
                        }

                        const response: serverResponse = await application.readOrDelete(options)

                        if (response.success) {
                            setPageTitle("edit transaction")
                            const transaction = response.message
                            console.log(transaction)
                            application.dispatch({
                                edit: true,
                                id: transaction._id,
                                type: transaction.type,
                                account: transaction.account._id,
                                fee: transaction.fee.toString(),
                                reference: transaction.reference,
                                description: transaction.description,
                                date: transaction.date.substring(0, 10),
                                totalAmount: transaction.total_amount?.toString(),
                                users: transaction.user ? [transaction.user] : [],
                                secondAccountData: transaction.account_to_impact,
                                userId: transaction.user ? transaction.user._id : "",
                                suppliers: transaction.supplier ? [transaction.supplier] : [],
                                customers: transaction.customer ? [transaction.customer] : [],
                                customerId: transaction.customer ? transaction.customer._id : "",
                                supplierId: transaction.supplier ? transaction.supplier._id : "",
                                secondAccount: transaction.account_to_impact ? transaction.account_to_impact._id : "",
                                userName: transaction.user ? `${transaction.user.username} - ${transaction.user.phone_number}` : "",
                                supplierName: transaction.supplier ? `${transaction.supplier.name} - ${transaction.supplier.phone_number}` : "",
                                customerName: transaction.customer ? `${transaction.customer.name} - ${transaction.customer.phone_number}` : "",
                            })
                        }
                        else
                            application.dispatch({ notification: response.message })
                    }
                    else if (account) {
                        application.dispatch({
                            account: account._id,
                            accounts: [account]
                        })
                    }
                }
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

    // rendering transaction type
    const renderTransactions = React.useCallback(() => {
        try {

            return transactionTypes.map((type: string, index: number) => (
                <Option label={type} value={type} key={index} />
            ))
        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
        // eslint-disable-next-line
    }, [transactionTypes])

    // form validation function
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // preventing form default submit
            event.preventDefault()

            // errors store
            const errors: string[] = []

            const account = application.state.accountData
            const fee = number.reFormat(application.state.fee)
            const secondAccount = application.state.secondAccountData
            const total_amount = number.reFormat(application.state.totalAmount)

            // validating form fields
            if (string.isEmpty(application.state.account) || !account) {
                errors.push("")
                application.dispatch({ accountError: "required" })
            }

            if (string.isEmpty(application.state.type)) {
                errors.push("")
                application.dispatch({ typeError: "required" })
            }

            if (string.isEmpty(application.state.totalAmount)) {
                errors.push("")
                application.dispatch({ totalAmountError: "required" })
            }
            else if (total_amount <= 0) {
                errors.push("")
                application.dispatch({ totalAmountError: "can't be less or equal to zero" })
            }
            else if (application.state.type === "withdraw" && account) {
                if (total_amount > account.balance) {
                    errors.push("")
                    application.dispatch({ totalAmountError: "you don't have enough balance" })
                }
            }

            if (string.isEmpty(application.state.date)) {
                errors.push("")
                application.dispatch({ dateError: "Required" })
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "Required" })
            }

            if (account && ((account.type === "mobile") || (account.type === "bank"))) {

                if (string.isEmpty(application.state.reference)) {
                    errors.push("")
                    application.dispatch({ referenceError: "required" })
                }

                if (application.state.type === "withdraw") {
                    if (string.isEmpty(application.state.fee)) {
                        errors.push("")
                        application.dispatch({ feeError: "required" })
                    }
                    // else if (fee <= 0) {
                    //     errors.push("")
                    //     application.dispatch({ feeError: "can't be less or equal to zero" })
                    // }
                }

            }

            if (account && (account.type === "user" || account.type === "customer" || account.type === "supplier")) {
                if (string.isEmpty(application.state[(`${account.type}Name`) as stateKey])) {
                    errors.push("")
                    application.dispatch({
                        [`${account.type}NameError`]: "required"
                    })
                }
                else if (string.isEmpty(application.state[(`${account.type}Id`) as stateKey])) {
                    errors.push("")
                    application.dispatch({
                        [`${account.type}NameError`]: `${account.type} does not exist`
                    })
                }

                // if ((string.isEmpty(application.state.secondAccount) || !secondAccount) &&
                //     (
                //         ((account.type === "supplier") && (application.state.type === "deposit")) ||
                //         ((account.type === "customer") && (application.state.type === "deposit"))
                //     )
                // ) {
                //     errors.push("")
                //     application.dispatch({ secondAccountError: "required" })
                // }
                // else
                 if (secondAccount) {
                    if (
                        (application.state.type === "deposit" && account.type === "supplier" && total_amount > secondAccount.balance) ||
                        (application.state.type === "withdraw" && account.type === "customer" && total_amount > secondAccount.balance)
                    ) {
                        errors.push("")
                        application.dispatch({ secondAccountError: "you don't have enough balance" })
                    }

                    if (account && application.state.type === "deposit" && secondAccount.type !== "cash_in_hand" && account.type !== "customer") {
                        if (string.isEmpty(application.state.fee)) {
                            errors.push("")
                            application.dispatch({ feeError: "required" })
                        }
                        // else if (fee <= 0) {
                        //     errors.push("")
                        //     application.dispatch({ feeError: "can't be less or equal to zero" })
                        // }

                        if (string.isEmpty(application.state.reference)) {
                            errors.push("")
                            application.dispatch({ referenceError: "required" })
                        }
                    }
                }
            }

            // checking if there's no error occured
            if (array.isEmpty(errors)) {

                const otherTransactionData = {
                    account_type: account.type,
                    description: application.state.description,
                    date: new Date(application.state.date).toISOString(),
                    user: account.type === "user" ? application.state.userId : null,
                    customer: account.type === "customer" ? application.state.customerId : null,
                    supplier: account.type === "supplier" ? application.state.supplierId : null,
                    reference: string.isNotEmpty(application.state.reference) ? application.state.reference.trim().toUpperCase() : null,
                }

                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "transaction",
                        condition: application.condition,
                        documentData: {
                            total_amount,
                            cause: "manual",
                            fee: fee ? fee : 0,
                            account: account._id,
                            ...otherTransactionData,
                            ...application.onCreate,
                            type: application.state.type,
                            account_to_impact: secondAccount && (account.type === "user" || account.type === "supplier" || account.type === "customer") ? secondAccount._id : null,
                            impact: (application.state.type === "deposit" && (account.type === "customer")) || (account.type === "supplier") ? true : false,
                        },
                        newDocumentData: {
                            $set: {
                                ...application.onUpdate,
                                ...otherTransactionData,
                            }
                        }
                    }
                }

                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.unMount()
                    application.dispatch({ notification: application.successMessage })
                }
                else
                    application.dispatch({ notification: response.message })

            }

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
    }

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-m1 offset-l2">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} transaction`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Select
                                            name="type"
                                            label="type"
                                            value={application.state.type}
                                            disabled={application.state.edit}
                                            error={application.state.typeError}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option label="select transaction type" value={""} />
                                            {renderTransactions()}
                                        </Select>
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <AccountListComponent />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            name="totalAmount"
                                            label="total amount"
                                            placeholder="enter total amount"
                                            disabled={application.state.edit}
                                            onChange={application.handleInputChange}
                                            error={application.state.totalAmountError}
                                            value={string.isNotEmpty(application.state.totalAmount) ? number.format(application.state.totalAmount) : ""}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            name="fee"
                                            label="fee"
                                            placeholder="enter fee"
                                            error={application.state.feeError}
                                            onChange={application.handleInputChange}
                                            value={string.isNotEmpty(application.state.fee) ? number.format(application.state.fee) : ""}
                                            disabled={application.state.edit}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            label="reference"
                                            name="reference"
                                            placeholder="enter reference number"
                                            error={application.state.referenceError}
                                            onChange={application.handleInputChange}
                                            value={string.isNotEmpty(application.state.reference) ? application.state.reference.toUpperCase() : ""}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="date"
                                            name="date"
                                            label="date"
                                            value={application.state.date}
                                            error={application.state.dateError}
                                            onChange={application.handleInputChange}
                                            max={new Date().toISOString().substring(0, 10)}
                                        />
                                    </div>
                                </div>
                                {
                                    string.isNotEmpty(application.state.type) && (application.state.accountData && (application.state.accountData.type === "customer" || application.state.accountData.type === "user" || application.state.accountData.type === "supplier"))
                                        ?
                                        <div className="row">
                                            <div className="col s12 m6 l6">
                                                <CustomDatalist
                                                    disable={true}
                                                    label={application.state.accountData.type}
                                                    name={(`${application.state.accountData.type}Name`) as stateKey}
                                                    nameId={(`${application.state.accountData.type}Id`) as stateKey}
                                                    placeholder={`enter ${application.state.accountData.type} name`}
                                                    list={pluralize(application.state.accountData.type) as stateKey}
                                                    nameError={(`${application.state.accountData.type}NameError`) as stateKey}
                                                    sort={application.state.accountData.type === "user" ? "username" : "name"}
                                                    fields={[application.state.accountData.type === "user" ? "username" : "name", "phone_number"]}
                                                />
                                            </div>
                                            <div className="col s12 m6 l6">
                                                <DepositOrWithdraw type={
                                                    application.state.accountData?.type === "supplier" && application.state.type === "withdraw"
                                                        ?
                                                        "deposit"
                                                        :
                                                        application.state.accountData?.type === "supplier" && application.state.type === "deposit" ?
                                                            "withdraw"
                                                            : application.state.type
                                                } />
                                            </div>
                                        </div>
                                        : null
                                }
                                <div className="row">
                                    <div className="col s12">
                                        <Textarea
                                            name="description"
                                            label="description"
                                            placeholder="enter description"
                                            value={application.state.description}
                                            onChange={application.handleInputChange}
                                            error={application.state.descriptionError}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 center">
                                        <Button
                                            loading={application.state.loading}
                                            disabled={application.state.disabled}
                                            title={application.state.type ? application.state.type : application.state.edit ? "update" : "create"}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {
                can("list_transaction")
                    ?
                    <FloatingButton
                        icon="list_alt"
                        to="/transaction/list"
                        tooltip="list transactions"
                    />
                    : null
            }
        </>
    )
})

// exporting component for global accessibility
export default TransactionForm