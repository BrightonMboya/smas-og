// dependencies
import React from "react"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Input, Textarea } from "../../components/form"
import { apiV1, noAccess, number, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"
import DataListComponent from "../../components/reusable/datalist"
import NumberComponent from "../../components/reusable/number-component"

// service form memorized function component
const ServiceForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("create_service")) {

            setPageTitle("new service")
            getOrderNumber()

            if (props.location.state) {
                const { customer, device, product }: any = props.location.state

                if (customer)
                    application.dispatch({
                        customers: [customer],
                        customerId: customer._id,
                        customerName: `${text.reFormat(customer.name)} - ${customer.phone_number}`
                    })
                else if (device) {
                    const customer = device.customer
                    application.dispatch({
                        devices: [device],
                        deviceId: device._id,
                        customers: [customer],
                        customerId: customer._id,
                        deviceName: text.reFormat(device.name),
                        customerName: `${text.reFormat(customer.name)} - ${customer.phone_number}`
                    })
                }
                else if (product)
                    application.dispatch({
                        products: [product],
                        stock: product.stock,
                        productId: product._id,
                        buyingPrice: product.buying_price,
                        sellingPrice: product.selling_price,
                        productName: text.reFormat(product.name),
                        productCost: product.selling_price?.toString(),
                    })
            }
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function getOrderNumber(): Promise<void> {
        try {
            const condition: string = JSON.stringify({ branch: application.user.branch._id, })
            const parameters: string = `schema=service&condition=${condition}`
            const options: readOrDelete = {
                route: apiV1 + "count",
                method: "GET",
                loading: false,
                disabled: false,
                parameters
            }
            const response: serverResponse = await application.readOrDelete(options)

            application.dispatch({ orderNumber: Number(response.message) <= 0 ? 1 : response.message + 1 })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })

        }
    }

    // getting total amount
    React.useEffect(() => {
        const productCost = number.reFormat(application.state.productCost) || 0
        const serviceCost = number.reFormat(application.state.serviceCost) || 0
        const totalAmount = number.format(productCost + serviceCost)
        application.dispatch({ totalAmount })
        // eslint-disable-next-line
    }, [application.state.serviceCost, application.state.productCost, application.state.productId])

    // form validation and submission
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            event.preventDefault()
            const errors: string[] = []
            const serviceCost = number.reFormat(application.state.serviceCost)
            const productCost = number.reFormat(application.state.productCost)

            if (string.isEmpty(application.state.customerName)) {
                errors.push("")
                application.dispatch({ customerNameError: "required" })
            }
            else if (string.isEmpty(application.state.customerId)) {
                errors.push("")
                application.dispatch({ customerNameError: "customer does not exist" })
            }

            if (string.isEmpty(application.state.deviceName)) {
                errors.push("")
                application.dispatch({ deviceNameError: "required" })
            }
            else if (string.isEmpty(application.state.deviceId)) {
                errors.push("")
                application.dispatch({ deviceNameError: "device does not exist" })
            }

            if (string.isEmpty(application.state.serviceName)) {
                errors.push("")
                application.dispatch({ serviceNameError: "required" })
            }

            if (string.isEmpty(application.state.serviceCost)) {
                errors.push("")
                application.dispatch({ serviceCostError: "required" })
            }
            else if (serviceCost <= 0) {
                errors.push("")
                application.dispatch({ serviceCostError: "can't be less or equal to zero" })
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "required" })
            }

            if (string.isNotEmpty(application.state.productId) && (Number(application.state.stock) <= 0)) {
                errors.push("")
                application.dispatch({ productNameError: "no enough stock" })
            }

            if (array.isEmpty(errors)) {

                const sellingPrice = Number(application.state.sellingPrice)
                const discount = sellingPrice > 0 ? (sellingPrice - productCost) : 0
                const profit = (productCost - Number(application.state.buyingPrice)) + serviceCost
                const options: createOrUpdate = {
                    loading: true,
                    method: "POST",
                    route: apiV1 + "create",
                    body: {
                        schema: "service",
                        condition: application.condition,
                        documentData: {
                            profit,
                            discount,
                            ...application.onCreate,
                            product_cost: productCost,
                            service_cost: serviceCost,
                            device: application.state.deviceId,
                            number: application.state.orderNumber,
                            customer: application.state.customerId,
                            description: application.state.description,
                            service: text.format(application.state.serviceName),
                            product: application.state.productId ? application.state.productId : null,
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
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-m1 offset-l2">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} service`} />
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
                                            for="device"
                                            condition={{ customer: application.state.customerId }}
                                            disabled={application.state.edit || string.isEmpty(application.state.customerId)}
                                        />

                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            label="service"
                                            name="serviceName"
                                            placeholder="Enter service"
                                            value={application.state.serviceName}
                                            error={application.state.serviceNameError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="serviceCost"
                                            label="service cost"
                                            placeholder="Enter service cost"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <DataListComponent
                                            for="product"
                                            disabled={application.state.edit}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="productCost"
                                            label="product cost"
                                            placeholder="Enter product cost"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <NumberComponent
                                            disabled
                                            name="totalAmount"
                                            label="total amount"
                                            placeholder="Enter total amount"
                                        />
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
                can("list_service")
                    ? <FloatingButton to="/service/list" tooltip="list services" />
                    : null
            }
        </>
    )
})

// exporting component for global use
export default ServiceForm