// dependencies
import React from "react"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Input, Option, Select, Textarea } from "../../components/form"
import { apiV1, debtTypes, noAccess, number, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"
import NumberComponent from "../../components/reusable/number-component"
import DatalistReusableComponent from "../../components/reusable/datalist"

// debt memorized functional component
const DebtForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // destructuring global variables
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user access
        if (can("create_debt") || can("edit_debt")) {
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

            setPageTitle("new debt")
            if (props.location.state) {
                const { debt, customer }: any = props.location.state
                if (debt) {

                    // parameters, condition and select
                    const joinForeignKeys: boolean = true
                    const select: string = JSON.stringify({
                        type: 1,
                        date: 1,
                        status: 1,
                        customer: 1,
                        paid_amount: 1,
                        description: 1,
                        total_amount: 1,
                    })
                    const condition: string = JSON.stringify({
                        _id: debt,
                        sale: { $eq: null },
                        expense: { $eq: null },
                        purchase: { $eq: null },
                        quotation_invoice: { $eq: null },
                    })
                    const parameters: string = `schema=debt&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                        setPageTitle("edit debt")
                        application.dispatch({
                            edit: true,
                            id: response.message._id,
                            debtType: response.message.type,
                            status: response.message.status,
                            customers: [response.message.customer],
                            description: response.message.description,
                            customerId: response.message.customer?._id,
                            date: response.message.date.substring(0, 10),
                            paidAmount: response.message.paid_amount.toString(),
                            totalAmount: response.message.total_amount.toString(),
                            customerName: text.reFormat(response.message.customer?.name)
                        })
                    }
                    else
                        application.dispatch({ notification: response.message })
                }
                else if (customer) {
                    application.dispatch({
                        customers: [customer],
                        customerId: customer._id,
                        customerName: text.reFormat(customer.name)
                    })
                }
            }
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering debt types
    const renderDebtTypes = React.useCallback(() => {
        try {
            return debtTypes.map((type: string, index: number) => (
                <Option key={index} value={text.format(type)} label={translate(type)} />
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.debtType])

    // form validation
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // preventing form default submit
            event.preventDefault()
            const total_amount = number.reFormat(application.state.totalAmount)
            const paid_amount = number.reFormat(application.state.paidAmount)

            // errors store
            const errors: string[] = []

            // validating form fields
            if (string.isEmpty(application.state.customerName)) {
                errors.push("")
                application.dispatch({ customerNameError: "required" })
            }
            else if (string.isEmpty(application.state.customerId)) {
                errors.push("")
                application.dispatch({ customerNameError: "Customer does not exist" })
            }

            if (string.isEmpty(application.state.debtType)) {
                errors.push("")
                application.dispatch({ debtTypeError: "required" })
            }

            if (string.isEmpty(application.state.totalAmount)) {
                errors.push("")
                application.dispatch({ totalAmountError: "required" })
            }
            else if (total_amount <= 0) {
                errors.push("")
                application.dispatch({ totalAmountError: "can't be less or equal to zero" })
            }

            if (string.isEmpty(application.state.date)) {
                errors.push("")
                application.dispatch({ dateError: "required" })
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "required" })
            }

            if (array.isEmpty(errors)) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const debt = {
                    total_amount,
                    ...creatorOrModifier,
                    date: application.state.date,
                    type: application.state.debtType,
                    customer: application.state.customerId,
                    description: application.state.description,
                    status: !application.state.edit ? "unpaid" : total_amount !== paid_amount ? "unpaid" : application.state.status,
                }

                // request options
                const options: createOrUpdate = {
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    method: application.state.edit ? "PUT" : "POST",
                    loading: true,
                    body: {
                        schema: "debt",
                        documentData: debt,
                        newDocumentData: { $set: debt },
                        condition: application.condition,
                    }
                }

                // api request
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.dispatch({
                        date: "",
                        debtType: "",
                        customerId: "",
                        totalAmount: "",
                        description: "",
                        customerName: "",
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

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-m1 offset-l2">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} debt`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <DatalistReusableComponent for="customer" />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Select
                                            label="type"
                                            name="debtType"
                                            value={application.state.debtType}
                                            error={application.state.debtTypeError}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option label={translate("Select type")} value="" />
                                            {renderDebtTypes()}
                                        </Select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="totalAmount"
                                            label="total amount"
                                            placeholder="Enter total amount"
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
                can("list_debt")
                    ?
                    <FloatingButton
                        to="/debt/list"
                        tooltip="list debts"
                    />
                    : null
            }
        </>
    )
})

// exporting component
export default DebtForm