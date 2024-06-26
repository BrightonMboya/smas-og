// dependencies
import React from "react"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Checkbox, Input, Textarea } from "../../components/form"
import { apiV1, noAccess, number, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"
import DepositOrWithdraw from "../../components/deposit_withdraw"
import DataListComponent from "../../components/reusable/datalist"
import NumberComponent from "../../components/reusable/number-component"

// expense form memorized functional compoent
const ExpenseForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("create_expense") || can("edit_expense")) {
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

            setPageTitle("new expense")

            if (props.location.state) {
                const { expense, quotation_invoice }: any = props.location.state

                if (expense) {

                    // parameters, condition and select
                    const joinForeignKeys: boolean = true
                    const select: string = JSON.stringify({})
                    const condition: string = JSON.stringify({ _id: expense })
                    const parameters: string = `schema=expense&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

                    // request options
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read"
                    }

                    // api request
                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        setPageTitle("edit expense")
                        application.dispatch({
                            edit: true,
                            id: response.message._id,
                            expense: response.message,
                            description: response.message.description,
                            date: response.message.date.substring(0, 10),
                            expense_types: [response.message.expense_type],
                            expense_typeId: response.message.expense_type._id,
                            expenseName: text.reFormat(response.message.name),
                            paidAmount: response.message.paid_amount?.toString(),
                            totalAmount: response.message.total_amount.toString(),
                            hasReceipt: response.message.has_receipt ? "yes" : "no",
                            expense_typeName: text.reFormat(response.message.expense_type?.name),
                            reference: response.message.reference ? response.message.reference : ""
                        })

                        if (response.message.account) {
                            application.dispatch({
                                secondAccounts: [response.message.account],
                                secondAccount: response.message.account._id,
                                secondAccountData: response.message.account,
                                fee: response.message.fee ? response.message.fee.toString() : ""
                            })
                        }

                        if (response.message.truck) {
                            application.dispatch({
                                trucks: [response.message.truck],
                                truckId: response.message.truck._id,
                                truckName: text.reFormat(response.message.truck.name),
                            })
                        }

                        if (response.message.customer) {
                            application.dispatch({
                                customers: [response.message.customer],
                                customerId: response.message.customer._id,
                                customerName: text.reFormat(response.message.customer.name),
                            })
                        }

                        if (response.message.quotation_invoice) {
                            application.dispatch({
                                quotation_invoices: [response.message.quotation_invoice],
                                quotationNumber: response.message.quotation_invoice.number,
                            })
                        }
                    }
                    else
                        application.dispatch({ notification: response.message })
                }

                else if (quotation_invoice) {
                    application.dispatch({
                        quotationNumber: quotation_invoice.number,
                        customers: [quotation_invoice.customer],
                        customerId: quotation_invoice?.cusomer?._id,
                        customerName: `${text.reFormat(quotation_invoice.customer.name)} - ${quotation_invoice.customer?.phone_number}`
                    })
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // prevent form default submit
            event.preventDefault()

            // error store
            const errors: string[] = []
            const fee = number.reFormat(application.state.fee)
            const account = application.state.secondAccountData
            const total_amount = number.reFormat(application.state.totalAmount)
            const paid_amount = number.reFormat(application.state.paidAmount) || 0

            // validating form fields
            if (string.isEmpty(application.state.expense_typeName)) {
                errors.push("")
                application.dispatch({ expense_typeNameError: "required " })
            }
            else if (string.isEmpty(application.state.expense_typeId)) {
                errors.push("")
                application.dispatch({ expense_typeNameError: "expense type does not exist" })
            }

            if (string.isEmpty(application.state.expenseName)) {
                errors.push("")
                application.dispatch({ expenseNameError: "required " })
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "required " })
            }

            if (string.isEmpty(application.state.date)) {
                errors.push("")
                application.dispatch({ dateError: "required " })
            }

            if (string.isEmpty(application.state.totalAmount)) {
                errors.push("")
                application.dispatch({ totalAmountError: "required" })
            }
            else if (total_amount <= 0) {
                errors.push("")
                application.dispatch({ totalAmountError: "can't be less or equal to zero" })
            }

            if (paid_amount > total_amount) {
                errors.push("")
                application.dispatch({ paidAmountError: "can't br greater than total amount" })
            }
            else if (paid_amount < 0) {
                errors.push("")
                application.dispatch({ paidAmountError: "can't be less than 0" })
            }

            if (account) {

                if (!application.state.edit) {

                    if (paid_amount && (account.balance < (paid_amount + fee || 0))) {
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

            // checking if there is no error occured
            if (array.isEmpty(errors)) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const expense = {
                    paid_amount,
                    total_amount,
                    ...creatorOrModifier,
                    date: application.state.date,
                    description: application.state.description,
                    expense_type: application.state.expense_typeId,
                    name: text.format(application.state.expenseName),
                    has_receipt: application.state.hasReceipt === "yes",
                    truck: string.isNotEmpty(application.state.truckId) ? application.state.truckId : null,
                    reference: string.isNotEmpty(application.state.reference) ? application.state.reference.toUpperCase() : null,
                    quotation_invoice: string.isNotEmpty(application.state.quotationId) ? application.state.quotationId : null,
                    customer: string.isNotEmpty(application.state.customerId) ? application.state.customerId : null,
                }

                // request options
                const options: createOrUpdate = {
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    method: application.state.edit ? "PUT" : "POST",
                    loading: true,
                    body: {
                        schema: "expense",
                        documentData: {
                            ...expense,
                            fee: fee ? fee : 0,
                            account: account ? account._id : null,
                        },
                        condition: application.condition,
                        newDocumentData: { $set: expense }
                    }
                }

                // api request
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.unMount()
                    application.dispatch({
                        notification: application.successMessage
                    })
                }
                else
                    application.dispatch({ notification: response.message })

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    React.useEffect(() => {
        if (!application.state.edit) {
            if (string.isNotEmpty(application.state.quotationNumber)) {
                fetchQuotationAndValidateInvoice()
            }
            application.dispatch({ totalAmount: "", quotationId: "" })
        }
        // eslint-disable-next-line
    }, [application.state.quotationNumber])

    // fetch quotation
    async function fetchQuotationAndValidateInvoice(): Promise<void> {
        try {

            const joinForeignKeys: boolean = false
            const condition: object = {
                visible: true,
                customer: application.state.customerId,
                number: application.state.quotationNumber,
            }
            const select: object = { _id: 1 }
            const queries: string = JSON.stringify([
                // {

                //     select,
                //     condition,
                //     joinForeignKeys,
                //     schema: "quotation"
                // },
                {

                    select,
                    condition,
                    joinForeignKeys,
                    schema: "quotation_invoice"
                }
            ])
            const parameters: string = `queries=${queries}`
            const options: readOrDelete = {
                parameters,
                method: "GET",
                loading: false,
                disabled: true,
                route: apiV1 + "bulk-read"
            }
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success) {
                const { passedQueries: { quotation_invoice } } = response.message

                if (quotation_invoice) {
                    application.dispatch({
                        quotationId: quotation_invoice._id,
                    })
                }

                if (!quotation_invoice) {
                    application.dispatch({
                        quotationNumberError: "invoice does not exist"
                    })
                }

            }
            else
                application.dispatch({
                    quotationId: "",
                    totalAmount: "",
                    paidAmount: "",
                    notification: response.message,
                })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-m1 offset-l2">
                    <div className="card">
                        <CardTitle title={` ${application.state.edit ? "edit" : "new"} expense`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <DataListComponent for="expense_type" />
                                    </div>
                                    <div className="col s12 m6 l6">
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
                                    <div className="col s12 m6 l6">
                                        <Input
                                            label="name"
                                            type="text"
                                            name="expenseName"
                                            placeholder="Enter name"
                                            value={application.state.expenseName}
                                            error={application.state.expenseNameError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            label="Date"
                                            name="date"
                                            type="date"
                                            value={application.state.date}
                                            error={application.state.dateError}
                                            onChange={application.handleInputChange}
                                            max={new Date().toISOString().substring(0, 10)}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="totalAmount"
                                            label="total amount"
                                            placeholder="Enter total amount"
                                            disabled={application.state.edit && application.state.expense?.editable}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="paidAmount"
                                            label="paid amount"
                                            placeholder="Enter paid amount"
                                            disabled={application.state.edit && application.state.expense?.editable}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <DepositOrWithdraw type="withdraw" />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="fee"
                                            label="fee"
                                            placeholder="enter fee"
                                            disabled={application.state.edit || string.isEmpty(application.state.secondAccount) || (application.state.secondAccountData && application.state.secondAccountData.type === "cash_in_hand")}
                                        />
                                    </div>
                                </div>
                                {
                                    can("view_truck_on_expense")
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <DataListComponent for="truck" />
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    can("view_quotation_on_expense")
                                        ?
                                        <div className="row">
                                            <div className="col s12 m6 l6">
                                                <DataListComponent
                                                    for="customer"
                                                    disabled={application.state.edit}
                                                />
                                            </div>
                                            <div className="col s12 m6 l6">
                                                <Input
                                                    type="number"
                                                    label="quotation invoice number"
                                                    name="quotationNumber"
                                                    placeholder="enter quotation number"
                                                    onChange={application.handleInputChange}
                                                    value={application.state.quotationNumber}
                                                    error={application.state.quotationNumberError}
                                                    disabled={application.state.edit || string.isEmpty(application.state.customerId)}
                                                />
                                            </div>
                                        </div>
                                        : null
                                }
                                <div className="row">
                                    <div className="col s12">
                                        <Textarea
                                            name="description"
                                            label="description"
                                            placeholder="Enter description"
                                            value={application.state.description}
                                            error={application.state.descriptionError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Checkbox
                                            name="hasReceipt"
                                            label={`has receipt`}
                                            value={application.state.hasReceipt === "no" ? "yes" : "no"}
                                            onChange={application.handleInputChange}
                                            checked={application.state.hasReceipt === "yes"}
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
                can("list_expense")
                    ?
                    <FloatingButton
                        to="/expense/list"
                        tooltip="list expenses"
                    />
                    : null
            }
        </>
    )

})

// export component
export default ExpenseForm