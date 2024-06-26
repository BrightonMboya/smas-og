// dependencies
import React from "react"
import { Button, FloatingButton } from "../../../components/button"
import { CardTitle } from "../../../components/card"
import { Textarea } from "../../../components/form"
import { apiV1, isInvalid, noAccess, number, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../../types"
import { ApplicationContext } from "../../../context"
import { array, string } from "fast-web-kit"
import TanzaniaRegions from "../../../components/reusable/tz-regions"
import NumberComponent from "../../../components/reusable/number-component"

// route form memorized function component
const RouteForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("create_route") || can("edit_route")) {
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

            setPageTitle("new route")

            if (props.location.state) {
                const { route }: any = props.location.state
                if (route) {
                    const condition: string = JSON.stringify({ _id: route })
                    const select: string = JSON.stringify({ from: 1, to: 1, cost: 1, distance: 1, description: 1 })
                    const parameters: string = `schema=route&condition=${condition}&select=${select}&joinForeignKeys=`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read",
                    }

                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        setPageTitle("edit route")
                        application.dispatch({
                            edit: true,
                            id: response.message._id,
                            to: text.reFormat(response.message.to),
                            from: text.reFormat(response.message.from),
                            cost: response.message.cost.toString(),
                            description: response.message.description,
                            distance: response.message.distance.toString(),
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


    // validate form
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // prevent form default submit
            event.preventDefault()

            // errors store
            const errors: string[] = []
            const cost = number.reFormat(application.state.cost)
            const distance = number.reFormat(application.state.distance)

            if (string.isEmpty(application.state.from)) {
                errors.push("")
                application.dispatch({ fromError: "required" })
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "required" })
            }

            if (string.isEmpty(application.state.to)) {
                errors.push("")
                application.dispatch({ toError: "required" })
            }

            if (string.isEmpty(application.state.distance)) {
                errors.push("")
                application.dispatch({ distanceError: "required" })
            }
            else if (distance <= 0) {
                errors.push("")
                application.dispatch({ distanceError: "can't be less or equal to zero" })
            }
            else if (isInvalid(distance)) {
                errors.push("")
                application.dispatch({ distanceError: "invalid value" })
            }

            if (string.isEmpty(application.state.cost)) {
                errors.push("")
                application.dispatch({ costError: "required" })
            }
            else if (cost <= 0) {
                errors.push("")
                application.dispatch({ costError: "can't be less or equal to zero" })
            }
            else if (isInvalid(cost)) {
                errors.push("")
                application.dispatch({ costError: "invalid value" })
            }

            if (array.isEmpty(errors)) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const route = {
                    cost,
                    distance,
                    ...creatorOrModifier,
                    to: text.format(application.state.to),
                    from: text.format(application.state.from),
                    description: application.state.description,
                }

                // request options
                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "route",
                        documentData: route,
                        newDocumentData: { $set: route },
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
                else {
                    application.dispatch({ notification: response.message })
                }
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
                        <CardTitle title={application.state.edit ? "edit route" : " new route"} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <TanzaniaRegions
                                            name="from"
                                            label="from"
                                            placeholder="enter from"
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <TanzaniaRegions
                                            name="to"
                                            label="to"
                                            placeholder="enter to"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="distance"
                                            label="distance (km)"
                                            placeholder="Enter distance in km"
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="cost"
                                            label="cost"
                                            placeholder="Enter cost"
                                        />
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
                can("list_route")
                    ? <FloatingButton to="/route/list" tooltip="list routes" />
                    : null
            }
        </>
    )

})

// exporting component
export default RouteForm