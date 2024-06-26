// dependencies
import React from "react"
import { Button, FloatingButton } from "../../../components/button"
import { CardTitle } from "../../../components/card"
import { Input, Textarea } from "../../../components/form"
import { apiV1, commonCondition, noAccess, number, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../../types"
import { ApplicationContext } from "../../../context"
import { array, string } from "fast-web-kit"
import DataListComponent from "../../../components/reusable/datalist"
import NumberComponent from "../../../components/reusable/number-component"
import DepositOrWithdraw from "../../../components/deposit_withdraw"

// truck order memorized function component
const TruckOrderForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("create_truck_order") || can("edit_truck_order")) {
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
            getOrderNumber()
            setPageTitle("new truck order")

            if (props.location.state) {
                const { truck_order, customer, truck, route }: any = props.location.state
                if (truck_order) {
                    const joinForeignKeys: boolean = true
                    const condition: string = JSON.stringify({ _id: truck_order })
                    const parameters: string = `schema=truck_order&condition=${condition}&joinForeignKeys=${joinForeignKeys}&select={}`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read"
                    }
                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        setPageTitle("edit truck order")
                        application.dispatch({
                            edit: true,
                            id: response.message._id,
                            truck_order: response.message,
                            truckId: response.message?.truck?._id,
                            routeId: response.message?.route?._id,
                            description: response.message.description,
                            customerId: response.message?.customer?._id,
                            date: response.message.date.substring(0, 10),
                            distance: response.message.distance.toString(),
                            paidAmount: response.message.paid_amount.toString(),
                            totalAmount: response.message.total_amount.toString(),
                            truckName: text.reFormat(response.message?.truck?.name),
                            reference: response.message.reference ? response.message.reference : "",
                            routeName: `${text.reFormat(response.message?.route?.from)} - ${text.reFormat(response.message?.route?.to)}`,
                            customerName: text.reFormat(`${response.message?.customer?.name} - ${response.message?.customer?.phone_number}`),
                        })

                        if (response.message.account) {
                            application.dispatch({
                                secondAccounts: [response.message.account],
                                secondAccount: response.message.account._id,
                                secondAccountData: response.message.account,
                            })
                        }
                    }
                    else
                        application.dispatch({ notification: response.message })
                }
                else if (route) {
                    application.dispatch({
                        route,
                        routes: [route],
                        routeId: route._id,
                        cost: route.cost.toString(),
                        distance: route.distance.toString(),
                        routeName: `${text.reFormat(route.from)} - ${text.reFormat(route.to)}`
                    })
                }
                else if (customer) {
                    application.dispatch({
                        customer,
                        customers: [customer],
                        customerId: customer._id,
                        customerName: `${text.reFormat(customer.name)} - ${customer.phone_number}`
                    })
                }
                else if (truck) {
                    application.dispatch({
                        truck,
                        trucks: [truck],
                        truckId: truck._id,
                        truckName: text.reFormat(truck.name)
                    })
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    async function getOrderNumber(): Promise<void> {
        try {
            if (!application.state.edit) {
                const condition: string = JSON.stringify({ branch: application.user.branch._id })
                const parameters: string = `schema=truck_order&condition=${condition}&select={}&joinForeignKeys=${false}`
                const options: readOrDelete = {
                    route: apiV1 + "count",
                    method: "GET",
                    loading: true,
                    disabled: false,
                    parameters
                }
                const response: serverResponse = await application.readOrDelete(options)
                application.dispatch({ orderNumber: response.message + 1 })
            }
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })

        }
    }

    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            event.preventDefault()
            const errors: string[] = []
            const account = application.state.secondAccountData
            const distance = number.reFormat(application.state.distance)
            const paidAmount = number.reFormat(application.state.paidAmount)
            const totalAmount = number.reFormat(application.state.totalAmount)

            if (string.isEmpty(application.state.customerName)) {
                errors.push("")
                application.dispatch({ customerNameError: "required" })
            }
            if (string.isEmpty(application.state.customerId)) {
                errors.push("")
                application.dispatch({ customerIdError: "customer does not exist" })
            }

            if (string.isEmpty(application.state.truckName)) {
                errors.push("")
                application.dispatch({ truckNameError: "required" })
            }
            if (string.isEmpty(application.state.truckId)) {
                errors.push("")
                application.dispatch({ truckIdError: "truck does not exist" })
            }

            if (string.isEmpty(application.state.routeName)) {
                errors.push("")
                application.dispatch({ routeNameError: "required" })
            }
            if (string.isEmpty(application.state.routeId)) {
                errors.push("")
                application.dispatch({ routeIdError: "route does not exist" })
            }

            if (totalAmount < 0) {
                errors.push("")
                application.dispatch({ totalAmountError: "can't be less than zero" })
            }

            if (string.isEmpty(application.state.totalAmount)) {
                errors.push("")
                application.dispatch({ totalAmountError: "required" })
            }

            if (paidAmount > totalAmount) {
                errors.push("")
                application.dispatch({ paidAmountError: "can't be greater than total amount" })
            }


            if (string.isEmpty(application.state.date)) {
                errors.push("")
                application.dispatch({ dateError: "require" })
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "require" })
            }

            if (account && (account.type !== "cash_in_hand")) {
                if (string.isEmpty(application.state.reference)) {
                    errors.push("")
                    application.dispatch({ referenceError: "required" })
                }
            }

            if (array.isEmpty(errors)) {

                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "truck_order",
                        condition: application.condition,
                        documentData: {
                            distance,
                            ...application.onCreate,
                            date: application.state.date,
                            truck: application.state.truckId,
                            route: application.state.routeId,
                            account: account ? account._id : null,
                            customer: application.state.customerId,
                            paid_amount: paidAmount ? paidAmount : 0,
                            description: application.state.description,
                            total_amount: totalAmount ? totalAmount : 0,
                            number: Number(application.state.orderNumber),
                            route_name: text.format(application.state.routeName),
                            reference: string.isNotEmpty(application.state.reference) ? application.state.reference.toUpperCase() : null
                        },
                        newDocumentData: {
                            $set: {
                                ...application.onUpdate,
                                date: application.state.date,
                                description: application.state.description,
                                reference: string.isNotEmpty(application.state.reference) ? application.state.reference.toUpperCase() : null
                            }
                        }
                    }
                }

                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.unMount()
                    getOrderNumber()
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

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-m1 offset-l2">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} truck order`} />
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
                                        <DataListComponent
                                            for="truck"
                                            disabled={application.state.edit}
                                            condition={{ ...commonCondition(true), status: { $eq: "available" } }}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <DataListComponent
                                            for="route"
                                            disabled={application.state.edit}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            disabled
                                            name="distance"
                                            label="distance"
                                            placeholder="Enter distance"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="totalAmount"
                                            label="total amount"
                                            placeholder="Enter total amount"
                                            disabled={application.state.edit && application.state.truck_order.editable}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="paidAmount"
                                            label="paid amount"
                                            placeholder="Enter paid amount"
                                            disabled={application.state.edit && application.state.truck_order.editable}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="date"
                                            name="date"
                                            label="Date"
                                            value={application.state.date}
                                            error={application.state.dateError}
                                            onChange={application.handleInputChange}
                                            max={new Date().toISOString().substring(0, 10)}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            name="reference"
                                            label="reference"
                                            placeholder="enter reference"
                                            error={application.state.referenceError}
                                            onChange={application.handleInputChange}
                                            value={application.state.reference.toUpperCase()}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <DepositOrWithdraw type="deposit" />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Textarea
                                            label="description"
                                            name="description"
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
                can("list_truck_order")
                    ? <FloatingButton to="/truck/order-list" tooltip="list truck orders" />
                    : null
            }
        </>
    )

})

export default TruckOrderForm