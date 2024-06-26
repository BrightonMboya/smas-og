import React from "react"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../../../types"
import { can } from "../../../../helpers/permissions"
import { Button, FloatingButton } from "../../../../components/button"
import { ApplicationContext } from "../../../../context"
import { CardTitle } from "../../../../components/card"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../../../helpers"
import { Checkbox, Input } from "../../../../components/form"
import { array, number, string } from "fast-web-kit"
import DepositOrWithdraw from "../../../../components/deposit_withdraw"
import DataListComponent from "../../../../components/reusable/datalist"
import NumberComponent from "../../../../components/reusable/number-component"

const QuotationInvoiceForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            // checking if user has access
            if (can("create_quotation_invoice") || can("edit_quotation_invoice")) {

                // setting initial page title
                setPageTitle("new quotation invoice")

                // chekcing if location state has data
                if (props.location.state) {

                    // destructuring quotation_invoice data from location state
                    const { quotation_invoice, customer }: any = props.location.state

                    // checking if quotation_invoice data has been provided
                    if (quotation_invoice) {

                        // backend data for fetching quotation_invoice data
                        const joinForeignKeys: boolean = true
                        const select: string = JSON.stringify({})
                        const condition: string = JSON.stringify({ _id: quotation_invoice })

                        // parameter
                        const parameters: string = `schema=quotation_invoice&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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

                            // quotation_invoice data
                            const quotation_invoiceData = response.message

                            // updating page title
                            setPageTitle("edit quotation_invoice")

                            // updating state
                            application.dispatch({
                                edit: true,
                                id: quotation_invoiceData._id,
                                customers: [quotation_invoiceData.customer],
                                quotationNumber: quotation_invoiceData.number,
                                customerId: quotation_invoiceData.customer._id,
                                date: quotation_invoiceData.date.substring(0, 10),
                                paidAmount: quotation_invoiceData.paid_amount.toString(),
                                totalAmount: quotation_invoiceData.total_amount.toString(),
                                customerName: text.reFormat(quotation_invoiceData.customer.name),
                                useCustomerAccount: quotation_invoiceData.use_customer_account ? "yes" : "no",
                            })

                            if (quotation_invoiceData.account) {
                                application.dispatch({
                                    secondAccounts: [quotation_invoiceData.account],
                                    secondAccount: quotation_invoiceData.account._id,
                                    secondAccountData: quotation_invoiceData.account,
                                })
                            }

                        }
                        else
                            application.dispatch({ notification: response.message })

                    }
                    else if (customer) {
                        application.dispatch({
                            customer: true,
                            customers: [customer],
                            customerId: customer._id,
                            customerName: `${text.reFormat(customer.name)} - ${customer.phone_number}`
                        })
                    }

                }

            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({ notification: noAccess })
            }

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
    }

    React.useEffect(() => {
        if (string.isEmpty(application.state.customerId)) {
            application.dispatch({
                date: "",
                reference: "",
                paidAmount: "",
                totalAmount: "",
                secondAccount: "",
                quotationNumber: "",
                secondAccountData: null,
                customerName: application.state.customerName
            })
        }
        // eslint-disable-next-line
    }, [application.state.customerId])

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
            const select: object = { total_amount: 1 }
            const queries: string = JSON.stringify([
                {

                    select,
                    condition,
                    joinForeignKeys,
                    schema: "quotation"
                },
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
                const { passedQueries: { quotation, quotation_invoice } } = response.message

                if (quotation) {
                    application.dispatch({
                        quotationId: quotation._id,
                        totalAmount: quotation.total_amount.toString(),
                    })
                }

                if (quotation_invoice) {
                    application.dispatch({
                        quotationNumberError: "invoice already exist"
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

    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            event.preventDefault()
            const errors: string[] = []
            const account = application.state.secondAccountData

            if (string.isEmpty(application.state.customerName)) {
                errors.push("")
                application.dispatch({ customerNameError: "required" })
            }
            else if (string.isEmpty(application.state.customerId)) {
                errors.push("")
                application.dispatch({ customerNameError: "customer does not exist" })
            }

            if (string.isEmpty(application.state.quotationNumber)) {
                errors.push("")
                application.dispatch({ quotationNumberError: "required" })
            }
            else if (string.isEmpty(application.state.quotationId) && !application.state.edit) {
                errors.push("")
                application.dispatch({ quotationNumberError: "quotation number does not exist" })
            }

            if (string.isEmpty(application.state.paidAmount)) {
                errors.push("")
                application.dispatch({ paidAmountError: "required" })
            }
            else if (number.reFormat(application.state.paidAmount) <= 0) {
                errors.push("")
                application.dispatch({ paidAmountError: "can't be less or equal to 0" })
            }
            else if (number.reFormat(application.state.paidAmount) > number.reFormat(application.state.totalAmount)) {
                errors.push("")
                application.dispatch({ paidAmountError: "paid amount can't be greater that total amount" })
            }

            if (string.isEmpty(application.state.date)) {
                errors.push("")
                application.dispatch({ dateError: "required" })
            }

            if (account) {

                if (account.type !== "cash_in_hand") {
                    if (string.isEmpty(application.state.reference)) {
                        errors.push("")
                        application.dispatch({ referenceError: "required" })
                    }
                }

            }

            if (array.isEmpty(errors) && string.isEmpty(application.state.quotationNumberError)) {

                const createOrUpdate = application.state.edit ? application.onUpdate : application.onCreate
                const invoice = {
                    ...createOrUpdate,
                    date: new Date(application.state.date).getTime(),
                    reference: string.isNotEmpty(application.state.reference) ? application.state.reference.toUpperCase() : null
                }
                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "quotation_invoice",
                        condition: application.condition,
                        newDocumentData: { $set: invoice },
                        documentData: {
                            ...invoice,
                            customer: application.state.customerId,
                            quotation: application.state.quotationId,
                            number: application.state.quotationNumber,
                            paid_amount: number.reFormat(application.state.paidAmount),
                            total_amount: number.reFormat(application.state.totalAmount),
                            account: account && (application.state.useCustomerAccount === "no") ? account._id : null,
                            use_customer_account: application.state.useCustomerAccount === "yes" && !account ? true : false,
                        }
                    }
                }

                console.log(options.body)
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.unMount()
                    application.dispatch({ notification: application.successMessage })
                }
                else
                    application.dispatch({ notification: response.message })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-l2 offset-m1">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "create"} quotation invoice`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
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
                                            label="quotation number"
                                            name="quotationNumber"
                                            placeholder="enter quotation number"
                                            onChange={application.handleInputChange}
                                            value={application.state.quotationNumber}
                                            error={application.state.quotationNumberError}
                                            disabled={application.state.edit || string.isEmpty(application.state.customerId)}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            disabled
                                            name="totalAmount"
                                            label="total amount"
                                            placeholder="enter total amount"
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="paidAmount"
                                            label="paid amount"
                                            placeholder="enter paid amount"
                                            disabled={application.state.edit}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="date"
                                            name="date"
                                            label="date"
                                            placeholder="Enter date"
                                            value={application.state.date}
                                            error={application.state.dateError}
                                            onChange={application.handleInputChange}
                                            max={new Date().toISOString().substring(0, 10)}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <DepositOrWithdraw type="deposit" />
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
                                {
                                    string.isNotEmpty(application.state.customerId) && string.isEmpty(application.state.secondAccount)
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <Checkbox
                                                    name="useCustomerAccount"
                                                    label="use customer account"
                                                    onChange={application.handleInputChange}
                                                    checked={application.state.useCustomerAccount === "yes"}
                                                    value={application.state.useCustomerAccount === "yes" ? "no" : "yes"}
                                                />
                                            </div>
                                        </div>
                                        : null
                                }
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
                can("list_quotation_invoice")
                    ?
                    <FloatingButton
                        tooltip="list quotation invoices"
                        to="/quotation/invoice-list"
                    />
                    : null
            }
        </>
    )
})

export default QuotationInvoiceForm