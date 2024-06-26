// component dependencies
import React from "react"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { CardTitle } from "../../components/card"
import { can } from "../../helpers/permissions"
import { apiV1, noAccess, pageNotFound, setPageTitle, storage, text } from "../../helpers"
import { Button, FloatingButton } from "../../components/button"
import { Input } from "../../components/form"
import CountriesCompoent from "../../components/reusable/countries"
import PhoneNumberComponent from "../../components/reusable/phone-number"
import TanzaniaRegions from "../../components/reusable/tz-regions"
import { array, string } from "fast-web-kit"

// branch memorized functional component
const BranchForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    // component opening
    async function onMount(): Promise<void> {
        try {

            // checking user permission
            if (can("create_branch") || can("edit_branch")) {

                // setting page title
                setPageTitle("new branch")

                if (props.location.state) {
                    const { branch }: any = props.location.state

                    if (branch) {
                        const select: string = JSON.stringify({
                            tin: 1,
                            name: 1,
                            email: 1,
                            image: 1,
                            address: 1,
                            website: 1,
                            phone_number: 1,
                        })
                        const condition: string = JSON.stringify({ _id: branch })
                        const parameters: string = `schema=branch&condition=${condition}&joinForeignKeys=${false}&select=${select}`

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

                            setPageTitle("edit branch")
                            application.dispatch({
                                edit: true,
                                id: response.message._id,
                                branch: response.message,
                                phoneNumber: response.message.phone_number,
                                branchName: text.reFormat(response.message.name),
                                tin: response.message.tin ? response.message.tin : "",
                                email: response.message.email ? response.message.email : "",
                                image: response.message.image ? response.message.image : "",
                                oldImage: response.message.image ? response.message.image : "",
                                website: response.message.website ? response.message.website : "",
                                country: response.message.address?.country ? response.message.address.country : "tanzania",
                                street: response.message.address?.street ? text.reFormat(response.message.address.street) : "",
                                region: response.message.address?.region ? text.reFormat(response.message.address.region) : "",
                                location: response.message.address?.location ? text.reFormat(response.message.address.location) : "",
                            })
                        }
                        else
                            application.dispatch({ notification: response.message })
                    }
                }
            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({ notification: noAccess })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // function that\ validate form
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            event.preventDefault()
            const errors: string[] = []

            if (string.isEmpty(application.state.branchName)) {
                errors.push("")
                application.dispatch({ branchNameError: "required" })
            }

            if (string.isEmpty(application.state.country)) {
                errors.push("")
                application.dispatch({ countryError: "required" })
            }
            else if (string.isEmpty(application.state.phoneCode)) {
                errors.push("")
                application.dispatch({ countryError: "required" })
            }

            if (string.isEmpty(application.state.phoneNumber)) {
                errors.push("")
                application.dispatch({ phoneNumberError: "required" })
            }

            if (application.state.country === "tanzania") {
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
            }

            if (string.isNotEmpty(application.state.tin) && (string.getLength(application.state.tin) !== 9)) {
                errors.push("")
                application.dispatch({ tinError: "tin number must have 9 digits" })
            }

            if (array.isEmpty(errors)) {
                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const branch = {
                    ...creatorOrModifier,
                    branch: null,
                    image: application.state.image,
                    phone_number: application.state.phoneNumber,
                    name: text.format(application.state.branchName),
                    tin: string.isNotEmpty(application.state.tin) ? application.state.tin : null,
                    email: string.isNotEmpty(application.state.email) ? application.state.email : "",
                    website: string.isNotEmpty(application.state.website) ? application.state.website : "",
                    address: {
                        country: application.state.country,
                        region: string.isNotEmpty(application.state.region) ? text.format(application.state.region) : "",
                        street: string.isNotEmpty(application.state.street) ? text.format(application.state.street) : "",
                        location: string.isNotEmpty(application.state.location) ? text.format(application.state.location) : "",
                    },
                }

                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "branch",
                        documentData: branch,
                        condition: application.condition,
                        newDocumentData: { $set: branch }
                    }
                }

                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    if (response.message._id === application.user.branch?._id) {
                        storage.store("user", { ...application.user, branch: response.message })
                    }

                    // upload new file
                    if (application.state.file && application.state.image)
                        application.uploadFile("branch")

                    // delete old file
                    if ((application.state.oldImage) && (application.state.image !== application.state.oldImage)) {

                        const options: readOrDelete = {
                            loading: true,
                            disabled: false,
                            method: "DELETE",
                            route: apiV1 + "delete-file",
                            parameters: `folderName=branch&fileName=${application.state.oldImage}`
                        }
                        const deleteResponse: serverResponse = await application.readOrDelete(options)

                        if (deleteResponse.success)
                            application.dispatch({ notification: deleteResponse.message })
                        else
                            application.dispatch({ notification: deleteResponse.message })
                    }

                    if (!application.state.edit) {
                        const newOptions: createOrUpdate = {
                            loading: true,
                            method: "PUT",
                            route: apiV1 + "update",
                            body: {
                                schema: "user",
                                condition: { _id: application.user._id },
                                newDocumentData: {
                                    $push: { branches: response.message._id }
                                }
                            }
                        }
                        const newResponse = await application.createOrUpdate(newOptions)

                        if (newResponse.success) {
                            storage.store("user", newResponse.message)
                        }
                        else
                            application.dispatch({ notification: response.message })
                    }

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
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} branch`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            label="name"
                                            name="branchName"
                                            placeholder="enter name"
                                            value={application.state.branchName}
                                            onChange={application.handleInputChange}
                                            error={application.state.branchNameError}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="file"
                                            label="Logo"
                                            name="files"
                                            accept="image/*"
                                            error={application.state.filesError}
                                            onChange={application.handleFileChange}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <CountriesCompoent />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <PhoneNumberComponent
                                            name="phoneNumber"
                                            label="phone number"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="email"
                                            name="email"
                                            label="email (optional)"
                                            placeholder="enter email"
                                            value={application.state.email}
                                            error={application.state.emailError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="url"
                                            name="website"
                                            label="website (optional)"
                                            placeholder="enter website"
                                            value={application.state.website}
                                            error={application.state.websiteError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                </div>
                                {
                                    application.state.country === "tanzania"
                                        ?
                                        <>
                                            <div className="row">
                                                <div className="col s12 m6 l6">
                                                    <TanzaniaRegions name="region" label="region" />
                                                </div>
                                                <div className="col s12 m6 l6">
                                                    <Input
                                                        label="location"
                                                        type="text"
                                                        name="location"
                                                        placeholder="Enter location"
                                                        value={application.state.location}
                                                        error={application.state.locationError}
                                                        onChange={application.handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col s12 m6 l6">
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
                                                <div className="col s12 m6 l6">
                                                    <Input
                                                        label="TIN (optional)"
                                                        type="number"
                                                        name="tin"
                                                        value={application.state.tin}
                                                        error={application.state.tinError}
                                                        onChange={application.handleInputChange}
                                                        placeholder="Enter TIN"
                                                    />
                                                </div>
                                            </div>
                                        </>
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
                can("list_branch")
                    ?
                    <FloatingButton
                        to="/branch/list"
                        tooltip="list branches"
                    />
                    : null
            }
        </>
    )
})

export default BranchForm