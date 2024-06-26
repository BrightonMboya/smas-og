// dependencies
import React from "react"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Datalist, Input, Option, } from "../../components/form"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import regions from "../../helpers/regions"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"

// supplier form memorized functional component
const SupplierForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    //component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("create_supplier") || can("edit_supplier")) {
            onMount()
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {
            setPageTitle("new supplier")
            if (props.location.state) {
                const { supplier }: any = props.location.state
                if (supplier) {

                    // parameters, condition, select
                    const select: string = JSON.stringify({
                        tin: 1,
                        name: 1,
                        address: 1,
                        phone_number: 1
                    })
                    const condition: string = JSON.stringify({ _id: supplier })
                    const parameters: string = `schema=supplier&condition=${condition}&select=${select}&joinForeignKeys=`

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
                        setPageTitle("edit supplier")
                        application.dispatch({ edit: true })
                        application.dispatch({ id: response.message._id })
                        application.dispatch({ supplierName: text.reFormat(response.message.name) })
                        application.dispatch({ phoneNumber: response.message.phone_number })
                        application.dispatch({ street: response.message.address ? text.reFormat(response.message.address.street) : "" })
                        application.dispatch({ region: response.message.address ? text.format(response.message.address.region) : "" })
                        application.dispatch({ location: response.message.address ? text.reFormat(response.message.address.location) : "" })
                    }
                    else
                        application.dispatch({ notification: response.message })
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

            if (string.isEmpty(application.state.supplierName)) {
                errors.push("")
                application.dispatch({ supplierNameError: "required" })
            }

            if (string.isEmpty(application.state.location)) {
                errors.push("")
                application.dispatch({ locationError: "required" })
            }

            if (string.isEmpty(application.state.phoneNumber)) {
                errors.push("")
                application.dispatch({ phoneNumberError: "required" })
            }
            else if (string.getLength(application.state.phoneNumber) !== 10) {
                errors.push("")
                application.dispatch({ phoneNumberError: "Phone number must have 10 digits" })
            }

            if (string.isEmpty(application.state.region)) {
                errors.push("")
                application.dispatch({ regionError: "required" })
            }

            if (string.isEmpty(application.state.location)) {
                errors.push("")
                application.dispatch({ locationError: "required" })
            }

            if (string.isEmpty(application.state.street)) {
                errors.push("")
                application.dispatch({ streetError: "required" })
            }

            if (array.isEmpty(errors) && string.isEmpty(application.state.nameError)) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const supplier = {
                    ...creatorOrModifier,
                    name: text.format(application.state.supplierName),
                    phone_number: application.state.phoneNumber,
                    location: text.format(application.state.location),
                    address: {
                        street: text.format(application.state.street),
                        region: text.format(application.state.region),
                        location: text.format(application.state.location)
                    }
                }

                // request options
                const options: createOrUpdate = {
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    method: application.state.edit ? "PUT" : "POST",
                    loading: true,
                    body: {
                        schema: "supplier",
                        documentData: supplier,
                        condition: application.condition,
                        newDocumentData: { $set: supplier }
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

    // rendering regions
    const renderRegions = React.useCallback(() => {
        try {
            return regions.sort().map((region: string) => (
                <Option key={region} value={text.reFormat(region)} label={region} />
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.region])

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-m1 offset-l2">
                    <div className="card">
                        <CardTitle title={application.state.edit ? "edit supplier" : "new supplier"} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            label="name"
                                            type="text"
                                            name="supplierName"
                                            value={application.state.supplierName}
                                            error={application.state.supplierNameError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter name"
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            label="phone number"
                                            type="number"
                                            name="phoneNumber"
                                            value={application.state.phoneNumber}
                                            error={application.state.phoneNumberError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter phone number"
                                            onKeyUp={() => application.validate({
                                                schema: "supplier",
                                                errorKey: "phoneNumberError",
                                                condition: { phone_number: application.state.phoneNumber, ...commonCondition(true) }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Datalist
                                            type="text"
                                            name="region"
                                            list="regions"
                                            label="region"
                                            placeholder="Enter region"
                                            value={application.state.region}
                                            error={application.state.regionError}
                                            onChange={application.handleInputChange}
                                        >
                                            {renderRegions()}
                                        </Datalist>
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            label="location"
                                            type="text"
                                            name="location"
                                            value={application.state.location}
                                            error={application.state.locationError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter location"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            label="street"
                                            type="text"
                                            name="street"
                                            value={application.state.street}
                                            error={application.state.streetError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter street"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 center">
                                        <Button
                                            loading={application.state.loading}
                                            disabled={application.state.disabled}
                                            title={application.state.edit ? "update" : "create"}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_supplier")
                    ?
                    <FloatingButton
                        to="/supplier/list"
                        tooltip="list suppliers"
                        icon="list_alt"
                    />
                    : null
            }
        </>
    )

})

// export component
export default SupplierForm