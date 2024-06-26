// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Input } from "../../components/form"
import Modal from "../../components/modal"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { array, email, string } from "fast-web-kit"
import CountriesCompoent from "../../components/reusable/countries"
import PhoneNumberComponent from "../../components/reusable/phone-number"
import customerImportTemplate from "./helpers/customer-import-template"
import TanzaniaRegions from "../../components/reusable/tz-regions"

// customer form memorized functional component
const CustomerForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    //component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("create_customer") || can("edit_customer")) {
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

            setPageTitle("new customer")

            if (props.location.state) {

                const { customer }: any = props.location.state

                if (customer) {

                    // parameters, condition, select
                    const joinForeignKeys: boolean = false
                    const select: string = JSON.stringify({
                        name: 1,
                        tin: 1,
                        email: 1,
                        region: 1,
                        address: 1,
                        phone_number: 1,
                        identification: 1,
                    })
                    const condition: string = JSON.stringify({ _id: customer })
                    const parameters: string = `schema=customer&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                        setPageTitle("edit customer")
                        application.dispatch({
                            edit: true,
                            id: response.message._id,
                            customerName: text.reFormat(response.message.name),
                            tin: response.message.tin ? response.message.tin : "",
                            email: response.message.email ? response.message.email : "",
                            country: response.message.address ? response.message.address.country : "",
                            region: response.message.address ? text.reFormat(response.message.address.region) : "",
                            identificationNumber: response.message.identification ? response.message.identification : "",
                            phoneNumber: response.message.phone_number ? response.message.phone_number : "",
                        })
                    }
                    else
                        application.dispatch({ notification: response.message })
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const uploadCustomers = async (): Promise<void> => {
        try {

            if (application.state.list.length > 0) {

                // close modal
                application.toggleComponent("modal")

                const validCustomers: any[] = []
                const invalidCustomers: any[] = []

                for (const customer of application.state.list) {
                    if (customer["NAME"] === undefined)
                        invalidCustomers.push({ ...customer, ERROR: "Name is required" })
                    if (customer["COUNTRY"] === undefined)
                        invalidCustomers.push({ ...customer, ERROR: "Country is required" })
                    else if (customer["PHONE NUMBER"] === undefined)
                        invalidCustomers.push({ ...customer, "PHONE NUMBER": "", ERROR: "Phone number is required" })
                    else
                        validCustomers.push(customer)
                }

                // clear customer list
                application.dispatch({ list: [] })

                if (invalidCustomers.length === 0) {

                    // request options
                    const options: createOrUpdate = {
                        route: apiV1 + "bulk-create",
                        method: "POST",
                        loading: true,
                        body: validCustomers.map((customer: any) => ({
                            schema: "customer",
                            documentData: {
                                ...application.onCreate,
                                name: text.format(customer["NAME"]),
                                identification: customer["IDENTIFICATION"] ? text.format(customer["IDENTIFICATION"]) : null,
                                email: customer["EMAIL"] ? text.format(customer["EMAIL"]) : null,
                                phone_number: customer["PHONE NUMBER"],
                                address: {
                                    region: customer["REGION"] ? text.format(customer["REGION"]) : null,
                                    country: text.format(customer["COUNTRY"]) ? text.format(customer["COUNTRY"]) : null,
                                },
                                tin: customer["TIN NUMBER"] ? customer["TIN NUMBER"] : null
                            }
                        }))
                    }

                    // api request
                    const response: serverResponse = await application.createOrUpdate(options)

                    if (response.success) {

                        application.unMount()
                        const { failedQueries, passedQueries } = response.message

                        if (failedQueries.length === 0) {
                            application.dispatch({ notification: `${passedQueries.length} ${passedQueries.length > 1 ? "customers have" : "customer has"} created` })
                        }
                        else {
                            application.dispatch({ notification: `${passedQueries.length} customer(s) have been created, while ${failedQueries.length} customer(s) failed to create` })
                            application.arrayToExcel(failedQueries, "customer(s) failed to create")
                        }

                    }
                    else {
                        application.dispatch({ notification: response.message })
                    }
                }
                else
                    application.arrayToExcel([...invalidCustomers, validCustomers], "customer validation error")

            }
            else
                application.dispatch({ filesError: "File is required or file has no customer(s)" })

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

            if (application.user.branch && application.user.branch.type !== "tourism") {
                if (string.isEmpty(application.state.phoneNumber)) {
                    errors.push("")
                    application.dispatch({ phoneNumberError: "required" })
                }
            }

            if (string.isEmpty(application.state.country)) {
                errors.push("")
                application.dispatch({ countryError: "required" })
            }

            if (string.isEmpty(application.state.region) && (application.state.country === "tanzania")) {
                errors.push("")
                application.dispatch({ regionError: "required" })
            }

            if (string.isNotEmpty(application.state.email) && !email.isValid(application.state.email)) {
                errors.push("")
                application.dispatch({ email: "email is invalid" })
            }

            if (array.isEmpty(errors) && string.isEmpty(application.state.phoneNumberError) && string.isEmpty(application.state.emailError) && string.isEmpty(application.state.identificationNumberError)) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const customer = {
                    ...creatorOrModifier,
                    name: text.format(application.state.customerName),
                    email: application.state.email ? application.state.email.toLowerCase() : null,
                    phone_number: application.state.phoneNumber ? application.state.phoneNumber : null,
                    identification: application.state.identificationNumber ? application.state.identificationNumber.toLowerCase() : null,
                    address: {
                        country_code: application.state.phoneCode,
                        region: text.format(application.state.region),
                        country: text.format(application.state.country),
                    },
                    tin: application.state.tin.trim() !== "" ? application.state.tin : null,
                }

                // request options
                const options: createOrUpdate = {
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    method: application.state.edit ? "PUT" : "POST",
                    loading: true,
                    body: {
                        schema: "customer",
                        documentData: customer,
                        condition: application.condition,
                        newDocumentData: { $set: customer }
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
            {/* modal for customer import */}
            <Modal
                buttonTitle="Import"
                buttonAction={uploadCustomers}
                title="Import customers from excel"
                toggleComponent={application.toggleComponent}
            >
                <form action="#">
                    <div className="row">
                        <div className="col s12">
                            <Input
                                type="file"
                                label="Choose file"
                                name="files"
                                error={application.state.filesError}
                                onChange={application.handleFileChange}
                                accept=".xls,.xlsx"
                            />
                        </div>
                    </div>
                </form>
                <div className="col s12 right-align">
                    <Link to="#" className="guest-link right-link" onClick={() => application.arrayToExcel(customerImportTemplate.data, customerImportTemplate.name)}>
                        {translate("Download sample customer template")}
                    </Link>
                </div>
            </Modal>

            {/* customer form view */}
            <div className="row">
                <div className="col s12 m10 l8 offset-m1 offset-l2">
                    <div className="card">
                        <CardTitle title={application.state.edit ? "edit customer" : "new customer"} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            label="name"
                                            name="customerName"
                                            placeholder="Enter name"
                                            value={application.state.customerName}
                                            error={application.state.customerNameError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <CountriesCompoent />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <PhoneNumberComponent
                                            name="phoneNumber"
                                            label="phone number"
                                            validateSchema="customer"
                                            validatingBackendField="phone_number"
                                            validatingCondition={commonCondition()}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="email"
                                            name="email"
                                            label="email (optional)"
                                            placeholder="enter email"
                                            value={application.state.email}
                                            error={application.state.emailError}
                                            onChange={application.handleInputChange}
                                            onKeyUp={() => application.validate({
                                                schema: "customer",
                                                errorKey: "emailError",
                                                condition: { email: (application.state.email).toLowerCase(), ...commonCondition(true) }
                                            })}
                                        />
                                    </div>
                                </div>
                                {
                                    application.state.country === "tanzania"
                                        ?
                                        <>
                                            <div className="row">
                                                <div className="col s12 m6 l6">
                                                    <TanzaniaRegions
                                                        name="region"
                                                        label="region"
                                                    />
                                                </div>
                                                <div className="col s12 m6 l6">
                                                    <Input
                                                        label="TIN number (optional)"
                                                        type="number"
                                                        name="tin"
                                                        value={application.state.tin}
                                                        error={application.state.tinError}
                                                        onChange={application.handleInputChange}
                                                        placeholder="Enter TIN number"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                        : null
                                }
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            type="text"
                                            name="identificationNumber"
                                            label="identification (optional)"
                                            onChange={application.handleInputChange}
                                            placeholder="enter identification number"
                                            value={application.state.identificationNumber}
                                            error={application.state.identificationNumberError}
                                            onKeyUp={() => application.validate({
                                                schema: "customer",
                                                errorKey: "identificationNumberError",
                                                condition: { identification: text.format(application.state.identificationNumber), ...commonCondition() }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="col s12 right-align">
                                    <Link to="#" className="guest-link right-link" onClick={() => application.toggleComponent("modal")}>
                                        {translate("Upload or Import from Excel")}
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
                can("list_customer")
                    ?
                    <FloatingButton
                        to="/customer/list"
                        tooltip="list customers"
                    />
                    : null
            }
        </>
    )

})

// export component
export default CustomerForm