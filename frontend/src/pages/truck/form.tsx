// dependencies
import React from "react"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Input, Option, Select, Textarea } from "../../components/form"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"

//
const TruckForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("create_truck") || can("edit_truck"))
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

            setPageTitle("new truck")

            if (props.location.state) {
                const { truck }: any = props.location.state
                if (truck) {
                    const condition: string = JSON.stringify({ _id: truck })
                    const select: string = JSON.stringify({ name: 1, status: 1, description: 1 })
                    const parameters: string = `schema=truck&condition=${condition}&select=${select}&joinForeignKeys=`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read"
                    }
                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        setPageTitle("edit truck")
                        application.dispatch({
                            edit: true,
                            id: response.message._id,
                            status: response.message.status,
                            description: response.message.description,
                            name: text.reFormat(response.message.name)
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

    // form validation and submission
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // prevent form default submit
            event.preventDefault()

            // errors store
            const errors: string[] = []

            if (string.isEmpty(application.state.name)) {
                errors.push("")
                application.dispatch({ nameError: "required" })
            }

            if (string.isEmpty(application.state.status) || (application.state.status === "cash")) {
                errors.push("")
                application.dispatch({ statusError: "required" })
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "required" })
            }

            if (array.isEmpty(errors)) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const truck = {
                    ...creatorOrModifier,
                    name: text.format(application.state.name),
                    description: application.state.description,
                    status: text.format(application.state.status)
                }
                // request options
                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "truck",
                        documentData: truck,
                        newDocumentData: { $set: truck },
                        condition: application.condition,
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

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-m1 offset-l2">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} truck`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            type="text"
                                            name="name"
                                            label="name"
                                            placeholder="Enter name"
                                            value={application.state.name}
                                            error={application.state.nameError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Select
                                            name="status"
                                            label="status"
                                            value={application.state.status}
                                            error={application.state.statusError}
                                            onChange={application.handleInputChange}
                                            disabled={application.state.edit && (application.state.status === "rented")}
                                        >
                                            <Option value="" label={translate("select status")} />
                                            <Option value="available" label={translate("available")} />
                                            <Option value="rented" label={translate("rented")} />
                                            <Option value="unavailable" label={translate("unavailable")} />
                                        </Select>
                                    </div>
                                </div>
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
                can("list_truck")
                    ? <FloatingButton to="/truck/list" tooltip="list trucks" />
                    : null
            }
        </>
    )
})

export default TruckForm