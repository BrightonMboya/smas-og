// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { ActionButton, Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Input, Option, Select, Textarea } from "../../components/form"
import Modal from "../../components/modal"
import { apiV1, deviceTypes, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"
import DataListComponent from "../../components/reusable/datalist"

// device form memorized function component
const DeviceForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("create_device") || can("edit_device"))
            onMount()
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
            setPageTitle("new device")
            if (props.location.state) {

                const { device, customer }: any = props.location.state

                if (device) {
                    const joinForeignKeys: boolean = true
                    const condition: string = JSON.stringify({ _id: device })
                    const parameters: string = `schema=device&condition=${condition}&joinForeignKeys=${joinForeignKeys}&select=`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read"
                    }
                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        setPageTitle("edit device")
                        application.dispatch({
                            edit: true,
                            id: response.message._id,
                            type: response.message.type,
                            features: response.message.features,
                            customers: [response.message?.customer],
                            description: response.message.description,
                            customerId: response.message?.customer?._id,
                            deviceName: text.reFormat(response.message.name),
                            imei: response.message.imei ? response.message.imei : "",
                            brand: response.message.brand ? response.message.brand : "",
                            model: response.message.model ? response.message.model : "",
                            customerName: `${text.reFormat(response.message?.customer?.name)} - ${response.message?.customer?.phone_number}`,
                        })
                    }
                    else
                        application.dispatch({ notification: response.message })

                }
                else if (customer) {
                    application.dispatch({
                        customers: [customer],
                        customerId: customer._id,
                        customerName: `${text.reFormat(customer.name)} - ${customer.phone_number}`,
                    })
                }

            }
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }


    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            event.preventDefault()
            const errors: string[] = []

            if (string.isEmpty(application.state.customerName)) {
                errors.push("")
                application.dispatch({ customerNameError: "required" })
            }
            else if (string.isEmpty(application.state.customerId)) {
                errors.push()
                application.dispatch({ customerNameError: "customer does not exist" })
            }

            if (string.isEmpty(application.state.deviceName)) {
                errors.push("")
                application.dispatch({ deviceNameError: "required" })
            }

            if (string.isEmpty(application.state.type)) {
                errors.push("")
                application.dispatch({ typeError: "required" })
            }

            if (application.state.type === "mobile_phone") {

                if (string.isEmpty(application.state.brand)) {
                    errors.push("")
                    application.dispatch({ brandError: "required" })
                }

                if (string.isEmpty(application.state.model)) {
                    errors.push("")
                    application.dispatch({ modelError: "required" })
                }

                if (string.isEmpty(application.state.imei)) {
                    errors.push("")
                    application.dispatch({ imeiError: "required" })
                }
                else if (string.getLength(application.state.imei) !== 15) {
                    errors.push("")
                    application.dispatch({ imeiError: "imei number must have 15 characters" })
                }
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "required" })
            }

            if (array.isEmpty(errors) && (string.isEmpty(application.state.imeiError))) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const device = {
                    ...creatorOrModifier,
                    features: application.state.features,
                    customer: application.state.customerId,
                    type: text.format(application.state.type),
                    description: application.state.description,
                    name: text.format(application.state.deviceName),
                    imei: application.state.type === "mobile_phone" ? text.format(application.state.imei) : null,
                    model: application.state.type === "mobile_phone" ? text.format(application.state.model) : null,
                    brand: application.state.type === "mobile_phone" ? text.format(application.state.brand) : null,
                }

                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "device",
                        documentData: device,
                        condition: application.condition,
                        newDocumentData: { $set: device }
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

    const addFeature = (event: React.ChangeEvent<HTMLFormElement>): void => {
        try {

            event.preventDefault()
            const errors: string[] = []

            if (string.isEmpty(application.state.key)) {
                errors.push("")
                // application.dispatch({ keyError: "required" })
            }

            if (string.isEmpty(application.state.value)) {
                errors.push("")
                // application.dispatch({ valueError: "required" })
            }

            if (array.isEmpty(errors)) {
                const newFeature = {
                    key: text.format(application.state.key),
                    value: text.format(application.state.value),
                }
                const features = [newFeature, ...application.state.features]
                application.dispatch({
                    key: "",
                    features,
                    value: ""
                })
            }
            else
                application.toggleComponent("modal")

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const removeFeature = (index: number): void => {
        try {
            application.state.features.splice(index, 1)
            application.dispatch({ notification: "feature has been removed" })
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderFeatures = React.useCallback(() => {
        try {
            return application.state.features.map((feature, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("feature")}>{text.reFormat(feature.key)}</td>
                    <td data-label={translate("value")}>{text.reFormat(feature.value)}</td>
                    <td className="center">
                        <div className="action-button">
                            <ActionButton
                                to="#"
                                icon="delete"
                                tooltip="remove"
                                type="error"
                                onClick={() => removeFeature(index)}
                            />
                        </div>
                    </td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.features])

    return (
        <>
            <Modal
                title="add device features"
                buttonTitle="Add feature"
                toggleComponent={application.toggleComponent}
                buttonAction={addFeature}
            >
                <div className="row">
                    <div className="col s12">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{translate("feature")}</th>
                                    <th>{translate("value")}</th>
                                    <th className="center">{translate("remove")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderFeatures()}
                            </tbody>
                        </table>
                    </div>
                    <div className="col s12">
                        <form action="#" onSubmit={addFeature}>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <Input
                                        name="key"
                                        type="text"
                                        label="feature"
                                        placeholder="Enter key"
                                        value={application.state.key}
                                        error={application.state.keyError}
                                        onChange={application.handleInputChange}
                                    />
                                </div>
                                <div className="col s12 m6 l6">
                                    <Input
                                        type="text"
                                        name="value"
                                        label="value"
                                        placeholder="Enter value"
                                        value={application.state.value}
                                        error={application.state.valueError}
                                        onChange={application.handleInputChange}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
            <div className="row">
                <div className="col s12 m10 l8 offset-l2 offset-m1">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} device`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <DataListComponent
                                            for="customer"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            label="name"
                                            type="text"
                                            name="deviceName"
                                            value={application.state.deviceName}
                                            error={application.state.deviceNameError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter name"
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Select
                                            label="type"
                                            name="type"
                                            value={application.state.type}
                                            error={application.state.typeError}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option label={"select type"} value="" />
                                            {
                                                deviceTypes.sort().map((type: string, index: number) => (
                                                    <Option key={index} label={type} value={type} />
                                                ))
                                            }
                                        </Select>
                                    </div>
                                </div>
                                {
                                    application.state.type === "mobile_phone"
                                        ?
                                        <>
                                            <div className="row">
                                                <div className="col s12 m6 l6">
                                                    <Input
                                                        label="brand"
                                                        type="text"
                                                        name="brand"
                                                        value={application.state.brand}
                                                        error={application.state.brandError}
                                                        onChange={application.handleInputChange}
                                                        placeholder="Enter brand"
                                                    />
                                                </div>
                                                <div className="col s12 m6 l6">
                                                    <Input
                                                        label="model"
                                                        type="text"
                                                        name="model"
                                                        value={application.state.model}
                                                        error={application.state.modelError}
                                                        onChange={application.handleInputChange}
                                                        placeholder="Enter model"
                                                    />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col s12">
                                                    <Input
                                                        label="imei"
                                                        type="number"
                                                        name="imei"
                                                        value={application.state.imei}
                                                        error={application.state.imeiError}
                                                        onChange={application.handleInputChange}
                                                        placeholder="Enter imei"
                                                    />
                                                </div>
                                            </div>
                                        </>
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
                                <div className="col s12 right-align">
                                    <Link to="#" className="guest-link right-link" onClick={() => application.toggleComponent("modal")}>
                                        {translate("Add device features")}
                                    </Link>
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
                can("list_device")
                    ? <FloatingButton to="/device/list" tooltip="list devices" />
                    : null
            }
        </>
    )
})

// exporting component for global use
export default DeviceForm