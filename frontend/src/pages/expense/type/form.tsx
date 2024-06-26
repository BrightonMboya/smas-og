// dependencies
import React from "react"
import { Button, FloatingButton } from "../../../components/button"
import { CardTitle } from "../../../components/card"
import { Input } from "../../../components/form"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import { createOrUpdate, routerProps, serverResponse, readOrDelete } from "../../../types"
import { ApplicationContext } from "../../../context"
import { array, string } from "fast-web-kit"

// expense type form memorized functional component
const ExpenseTypeForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("create_expense_type") || can("edit_expense_type")) {
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
            setPageTitle("new expense type")
            if (props.location.state) {
                const { expenseType }: any = props.location.state
                if (expenseType) {

                    // parameters, condition and select
                    const select: string = JSON.stringify({ name: 1 })
                    const condition: string = JSON.stringify({ _id: expenseType })
                    const parameters: string = `schema=expense_type&condition=${condition}&select=${select}&joinForeignKeys=`

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
                        setPageTitle("edit expense type")
                        application.dispatch({
                            edit: true,
                            id: response.message._id,
                            expense_typeName: text.reFormat(response.message.name)
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

    // form validation function
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // prevent form default submit
            event.preventDefault()

            // error store
            const errors: string[] = []

            // validating form fields
            if (string.isEmpty(application.state.expense_typeName)) {
                errors.push("")
                application.dispatch({ expense_typeNameError: "required" })
            }

            // checking if there is no error occured
            if (array.isEmpty(errors)) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const expenseType = {
                    ...creatorOrModifier,
                    name: text.format(application.state.expense_typeName)
                }

                // request options
                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "expense_type",
                        documentData: expenseType,
                        condition: application.condition,
                        newDocumentData: { $set: expenseType }
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

    // returning component view
    return (
        <>
            <div className="row">
                <div className="col s12 10 l6 offset-l3 offset-m1">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} expense type`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            label="name"
                                            type="text"
                                            name="expense_typeName"
                                            value={application.state.expense_typeName}
                                            error={application.state.expense_typeNameError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter name"
                                            onKeyUp={() => application.validate({
                                                schema: "expense_type",
                                                errorKey: "expense_typeNameError",
                                                condition: { ...commonCondition(true), name: text.format(application.state.expense_typeName) }
                                            })}
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
                can("list_expense_type")
                    ?
                    <FloatingButton
                        to="/expense/type-list"
                        tooltip="list expense types"
                    />
                    : null
            }
        </>
    )

})

// exporting component
export default ExpenseTypeForm