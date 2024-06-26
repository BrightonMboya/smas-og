/* dependencies */
import React from "react"
import { Button } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Input } from "../../components/form"
import { apiV1, setPageTitle } from "../../helpers"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"

/* user password memorized functional component */
const UserPassword: React.FunctionComponent<routerProps> = React.memo(() => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // defining document title
        setPageTitle("change password")

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    // validating old password
    const validateOldPassword = async (): Promise<void> => {
        try {

            // checking if password has 8 or more characters
            if ((string.getLength(application.state.oldPassword) >= 4) && string.isEmpty(application.state.oldPasswordError)) {

                const user: string = application.user._id
                const field: string = "password"
                const value: string = application.state.oldPassword
                const parameters: string = `schema=user&documentId=${user}&fieldWithEncryption=${field}&valueToCompareWithEncryption=${value}`

                // request options
                const options: readOrDelete = {
                    parameters,
                    method: "GET",
                    loading: false,
                    disabled: true,
                    route: apiV1 + `validate-field-encryption`
                }

                // making api request
                const response: serverResponse = await application.readOrDelete(options)

                if (!response.success)
                    application.dispatch({ oldPasswordError: "Old password is not correct" })

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // form submission
    const submitForm = async (): Promise<void> => {
        try {

            // request options
            const options: createOrUpdate = {
                route: apiV1 + "change-field-encryption",
                method: "PUT",
                loading: true,
                body: {
                    schema: "user",
                    documentId: application.user._id,
                    fieldWithEncryption: "password",
                    newValueToEncrypt: application.state.password
                }
            }

            // make api request
            const response: serverResponse = await application.createOrUpdate(options)

            if (response.success) {
                application.unMount()
                application.dispatch({ notification: application.successMessage })
            }
            else
                application.dispatch({ notification: response.message })


        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // form validation
    const validateForm = (event: React.ChangeEvent<HTMLFormElement>): void => {
        try {

            // preventing form default submit
            event.preventDefault()

            // errors store
            const errors: string[] = []

            // validating form fields
            if (application.state.oldPassword === "") {
                errors.push("")
                application.dispatch({ oldPasswordError: "required" })
            }
            else if (string.getLength(application.state.oldPassword) < 4) {
                errors.push("")
                application.dispatch({ oldPasswordError: "Old password must have atleast 4 characters" })
            }
            if (application.state.password === "") {
                errors.push("")
                application.dispatch({ passwordError: "required" })
            }
            else if (string.getLength(application.state.password) < 8) {
                errors.push("")
                application.dispatch({ passwordError: "New password must have atleast 8 characters" })
            }

            if (string.getLength(application.state.password) >= 8) {
                if (application.state.passwordConfirmation === "") {
                    errors.push("")
                    application.dispatch({ passwordConfirmationError: "required" })
                }
                else if (string.getLength(application.state.passwordConfirmation) < 8) {
                    errors.push("")
                    application.dispatch({ passwordConfirmationError: "Password confirmation must have atleast 8 characters" })
                }
                else if (application.state.password !== application.state.passwordConfirmation) {
                    errors.push("")
                    application.dispatch({ passwordConfirmationError: "Password does not match" })
                }
            }

            // checking if there's no error occured
            if (array.isEmpty(errors) && string.isEmpty(application.state.oldPasswordError))
                submitForm()

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // returning component view
    return (
        <>
            <div className="row">
                <div className="col s12 m8 l6 offset-m2 offset-l3">
                    <div className="card">
                        <CardTitle title="change password" />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            type="password"
                                            label="old password"
                                            name="oldPassword"
                                            value={application.state.oldPassword}
                                            error={application.state.oldPasswordError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter old password"
                                            onKeyUp={validateOldPassword}
                                        />
                                    </div>
                                </div>
                                {
                                    string.getLength(application.state.oldPassword) >= 4
                                        ?
                                        <>
                                            <div className="row">
                                                <div className="col s12">
                                                    <Input
                                                        type="password"
                                                        label="new password"
                                                        name="password"
                                                        value={application.state.password}
                                                        error={application.state.passwordError}
                                                        onChange={application.handleInputChange}
                                                        placeholder="Enter new password"
                                                    />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col s12">
                                                    <Input
                                                        type="password"
                                                        label="Confirm new password"
                                                        name="passwordConfirmation"
                                                        value={application.state.passwordConfirmation}
                                                        error={application.state.passwordConfirmationError}
                                                        onChange={application.handleInputChange}
                                                        placeholder="Confirm new password"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                        : null
                                }
                                <div className="row">
                                    <div className="col s12 center">
                                        <Button
                                            loading={application.state.loading}
                                            disabled={application.state.disabled}
                                            title="update"
                                            onClick={validateForm}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )

})

/* exporting component */
export default UserPassword