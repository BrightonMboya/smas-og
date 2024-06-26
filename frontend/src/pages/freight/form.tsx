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
import NumberComponent from "../../components/reusable/number-component"

// freight form memorized functional compoent
const FreightForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // aplication context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("create_freight") || can("edit_freight")) {
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

            setPageTitle("new freight")

            if (props.location.state) {
                const { freight }: any = props.location.state
                if (freight) {

                    // parameters, condition and select
                    const joinForeignKeys: boolean = false
                    const select: string = JSON.stringify({
                        name: 1,
                        date: 1,
                        account: 1,
                        reference: 1,
                        paid_amount: 1,
                        description: 1,
                        total_amount: 1,
                    })
                    const condition: string = JSON.stringify({ _id: freight })
                    const parameters: string = `schema=freight&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                        setPageTitle("edit freight")
                        application.dispatch({
                            edit: true,
                            id: response.message._id,
                            description: response.message.description,
                            date: response.message.date.substring(0, 10),
                            freightName: text.reFormat(response.message.name),
                            paidAmount: response.message.paid_amount.toString(),
                            totalAmount: response.message.total_amount.toString()
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

    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // prevent form default submit
            event.preventDefault()

            // error store
            const errors: string[] = []
            const total_amount = number.reFormat(application.state.totalAmount)
            const paid_amount = number.reFormat(application.state.paidAmount)

            if (string.isEmpty(application.state.freightName)) {
                errors.push("")
                application.dispatch({ freightNameError: "required " })
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "required " })
            }

            if (string.isEmpty(application.state.date)) {
                errors.push("")
                application.dispatch({ dateError: "required " })
            }

            if (string.isEmpty(application.state.totalAmount)) {
                errors.push("")
                application.dispatch({ totalAmountError: "required" })
            }
            else if (total_amount <= 0) {
                errors.push("")
                application.dispatch({ totalAmountError: "can't be less or equal to zero" })
            }

            if (paid_amount > total_amount) {
                errors.push("")
                application.dispatch({ paidAmountError: "can't br greater than total amount" })
            }
            else if (paid_amount < 0) {
                errors.push("")
                application.dispatch({ paidAmountError: "can't be less than 0" })
            }


            // checking if there is no error occured
            if (array.isEmpty(errors)) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const freight = {
                    paid_amount,
                    total_amount,
                    ...creatorOrModifier,
                    date: application.state.date,
                    description: application.state.description,
                    name: text.format(application.state.freightName),
                }

                // request options
                const options: createOrUpdate = {
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    method: application.state.edit ? "PUT" : "POST",
                    loading: true,
                    body: {
                        schema: "freight",
                        documentData: freight,
                        newDocumentData: { $set: freight },
                        condition: application.condition,
                    }
                }

                // api request
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
                        <CardTitle title={` ${application.state.edit ? "edit" : "new"} freight`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            label="name"
                                            name="freightName"
                                            placeholder="Enter name"
                                            value={application.state.freightName}
                                            error={application.state.freightNameError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            label="Date"
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
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="totalAmount"
                                            label="total amount"
                                            placeholder="Enter total amount"
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="paidAmount"
                                            label="paid amount"
                                            placeholder="Enter paid amount"
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
                can("list_freight")
                    ?
                    <FloatingButton
                        to="/freight/list"
                        tooltip="list freights"
                    />
                    : null
            }
        </>
    )

})

// export component
export default FreightForm