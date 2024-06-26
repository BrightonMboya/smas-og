/* requiring dependencies */
import React from "react"
import { apiV1, setPageTitle } from "../../helpers"
import { createOrUpdate, routerProps, serverResponse } from "../../types"
import { Input } from "../../components/form"
import { Button } from "../../components/button"
import { CardTitle } from "../../components/card"
import Contact from "./contact"
import { ApplicationContext } from "../../context"

/* creating memorized change password functional component */
const ChangePassword: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // defining document page title
        setPageTitle("Change password")

        // checking page validity
        if (!props.location.state)
            props.history.goBack()

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    // function for submiting form to the server
    const submitForm = async (): Promise<void> => {
        try {

            let documentId;

            if (props.location.state) {
                const { user }: any = props.location.state
                documentId = user
            }

            // request options
            const options: createOrUpdate = {
                route: apiV1 + "change-field-encryption",
                method: "PUT",
                loading: true,
                body: {
                    schema: "user",
                    documentId,
                    fieldWithEncryption: "password",
                    newValueToEncrypt: application.state.password
                }
            }

            // make api request
            const response: serverResponse = await application.createOrUpdate(options)

            if (response.success)
                application.authenticate("login", response.message)
            else
                application.dispatch({ notification: response.message })


        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // function for validating form fields
    const validateForm = (event: React.ChangeEvent<HTMLFormElement>): void => {
        try {

            // prevent form default submit
            event.preventDefault()

            // errors store
            const errors: string[] = []

            // validating form fields
            if (application.state.password === "") {
                errors.push("")
                application.dispatch({ passwordError: "required" })
            }
            else if (application.state.password.length < 8) {
                errors.push("")
                application.dispatch({ passwordError: "password must have atleast 8 characters" })
            }

            if (application.state.password.length >= 8) {
                if (application.state.passwordConfirmation === "") {
                    errors.push("")
                    application.dispatch({ passwordConfirmationError: "required" })
                }
                else if (application.state.passwordConfirmation.length < 8) {
                    errors.push("")
                    application.dispatch({ passwordConfirmationError: "Password confirmation must have atleast 8 characters" })
                }
                else if (application.state.password !== application.state.passwordConfirmation) {
                    errors.push("")
                    application.dispatch({ passwordConfirmationError: "Password does not match" })
                }
            }

            // verifying there is no error
            if (errors.length === 0)
                submitForm()

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // returning component view
    return (
        <div className="guest">
            <div className="card">
                <CardTitle title="change password" />
                <div className="card-content">
                    <form onSubmit={validateForm}>
                        <div className="row">
                            <div className="col s12">
                                <Input
                                    label="Password"
                                    type="password"
                                    name="password"
                                    value={application.state.password}
                                    error={application.state.passwordError}
                                    onChange={application.handleInputChange}
                                    placeholder="Enter password"
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col s12">
                                <Input
                                    label="Confirm password"
                                    type="password"
                                    name="passwordConfirmation"
                                    value={application.state.passwordConfirmation}
                                    error={application.state.passwordConfirmationError}
                                    onChange={application.handleInputChange}
                                    placeholder="Confirm password"
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col s12 center">
                                <Button
                                    title="Update"
                                    loading={application.state.loading}
                                    disabled={application.state.disabled}
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <Contact />
        </div>
    )

})

/* exporting component */
export default ChangePassword