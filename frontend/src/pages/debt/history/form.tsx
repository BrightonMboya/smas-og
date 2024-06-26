// dependencies
import React from "react"
import { Button, FloatingButton } from "../../../components/button"
import { CardTitle } from "../../../components/card"
import { Input, Textarea } from "../../../components/form"
import { apiV1, noAccess, number, pageNotFound, setPageTitle } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../../types"
import { ApplicationContext } from "../../../context"
import { array, string } from "fast-web-kit"
import NumberComponent from "../../../components/reusable/number-component"
import DepositOrWithdraw from "../../../components/deposit_withdraw"

// debt payment memorized functional component
const DebtHistoryForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("create_debt_payment")) {
            mount()
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function mount(): Promise<void> {
        try {

            if (props.location.state) {
                const { debt }: any = props.location.state
                if (debt) {
                    setPageTitle("debt payment")
                    const joinForeignKeys: boolean = true
                    const select: string = JSON.stringify({})
                    const condition: string = JSON.stringify({ _id: debt, $expr: { $ne: ["$total_amount", "$paid_amount"] } })
                    const parameters: string = `schema=debt&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read",
                    }
                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        const serverDebt = response.message
                        application.dispatch({ debt: serverDebt })
                    }
                    else {
                        props.history.goBack()
                        application.dispatch({ notification: response.message })
                    }
                }
                else
                    props.history.goBack()
            }
            else
                props.history.goBack()

        } catch (error) {
            props.history.goBack()
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // form validation
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // prevent form default submit
            event.preventDefault()

            // error store
            const errors: string[] = []
            const fee = number.reFormat(application.state.fee)
            const account = application.state.secondAccountData
            const total_amount = number.reFormat(application.state.totalAmount)

            // validating form fields
            if (string.isEmpty(application.state.totalAmount)) {
                errors.push("")
                application.dispatch({ totalAmountError: "required" })
            }
            else if (total_amount <= 0) {
                errors.push("")
                application.dispatch({ totalAmountError: "can't be less or equal to zero" })
            }
            else if (total_amount > (application.state.debt.total_amount - application.state.debt.paid_amount)) {
                errors.push("")
                application.dispatch({ totalAmountError: "Amount paid is greater than remain amount" })
            }

            if (string.isEmpty(application.state.date)) {
                errors.push("")
                application.dispatch({ dateError: "required" })
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "required" })
            }

            if (account) {

                if (application.state.debt?.type === "creditor") {

                    if (total_amount && (account.balance < (total_amount + fee || 0))) {
                        errors.push("")
                        application.dispatch({ secondAccountError: "you don't have enough account balance" })
                    }

                    if ((account.type !== "cash_in_hand")) {
                        if (string.isEmpty(application.state.fee)) {
                            errors.push("")
                            application.dispatch({ feeError: "required" })
                        }
                        // else if (fee <= 0) {
                        //     errors.push("")
                        //     application.dispatch({ feeError: "can't be less or equal to 0" })
                        // }
                    }
                }

                if (account.type !== "cash_in_hand") {
                    if (string.isEmpty(application.state.reference)) {
                        errors.push("")
                        application.dispatch({ referenceError: "required" })
                    }
                }

            }

            if (array.isEmpty(errors)) {

                // request options
                const options: createOrUpdate = {
                    route: apiV1 + "create",
                    method: "POST",
                    loading: true,
                    body: {
                        schema: "debt_history",
                        documentData: {
                            total_amount,
                            fee: fee ? fee : 0,
                            ...application.onCreate,
                            date: application.state.date,
                            debt: application.state.debt._id,
                            account: account ? account._id : null,
                            description: application.state.description,
                            expense: application.state.debt.expense ? application.state.debt.expense._id : null,
                            supplier: application.state.debt.supplier ? application.state.debt.supplier._id : null,
                            customer: application.state.debt.customer ? application.state.debt.customer._id : null,
                            reference: string.isNotEmpty(application.state.reference) ? application.state.reference.toUpperCase() : null
                        }
                    }
                }

                // api request
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.unMount()
                    props.history.push({
                        pathname: "/debt/history-list",
                        state: { propsCondition: { debt: response.message.debt._id } }
                    })
                    application.dispatch({ notification: application.successMessage })
                }
                else
                    application.dispatch({ notification: response.message })

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-l2 offset-m1">
                    <div className="card">
                        <CardTitle title="debt payment" />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                {/* <div className="row">
                                    <div className="col s12">
                                        <Input
                                            label="Customer"
                                            type="text"
                                            name="customerName"
                                            value={application.state.debt ? text.reFormat(application.state.debt?.customer?.name) : ""}
                                            error={""}
                                            onChange={() => { }}
                                            disabled
                                        />
                                    </div>
                                </div> */}
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            label="total amount"
                                            type="text"
                                            name=""
                                            value={application.state.debt ? number.format(application.state.debt?.total_amount) : 0}
                                            error={""}
                                            onChange={() => { }}
                                            disabled
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            label="remain amount"
                                            type="text"
                                            name=""
                                            value={application.state.debt ? number.format(application.state.debt?.total_amount - application.state.debt?.paid_amount) : 0}
                                            error={""}
                                            onChange={() => { }}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="totalAmount"
                                            label="amount paid"
                                            placeholder="Enter amount paid"
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            label="date"
                                            type="date"
                                            name="date"
                                            value={application.state.date}
                                            error={application.state.dateError}
                                            onChange={application.handleInputChange}
                                            max={new Date().toISOString().substring(0, 10)}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <DepositOrWithdraw type={application.state.debt?.type === "creditor" ? "withdraw" : "deposit"} />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="fee"
                                            label="fee"
                                            placeholder="enter fee"
                                            disabled={application.state.debt?.type === "debtor"}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            type="text"
                                            label="reference"
                                            name="reference"
                                            placeholder="enter reference"
                                            error={application.state.referenceError}
                                            onChange={application.handleInputChange}
                                            value={application.state.reference.toUpperCase()}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Textarea
                                            name="description"
                                            label="description"
                                            value={application.state.description}
                                            error={application.state.descriptionError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter description"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 center">
                                        <Button
                                            title={application.buttonTitle}
                                            loading={application.state.loading}
                                            disabled={application.state.disabled}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_debt_history")
                    ?
                    <FloatingButton
                        to="/debt/history-list"
                        tooltip="list debt history"
                    />
                    : null
            }
        </>
    )

})

// exporting component
export default DebtHistoryForm