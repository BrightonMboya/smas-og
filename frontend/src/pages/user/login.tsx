/* requiring dependencies */
import React from 'react'
import { createOrUpdate, routerProps, serverResponse } from "../../types"
import { Input } from "../../components/form"
import { Button } from "../../components/button"
import { apiV1, emessageApiKey, emessageDomain, encrypt, getVendorName, setPageTitle, text } from "../../helpers"
import { Link } from "react-router-dom"
import { CardTitle } from "../../components/card"
import translate from "../../helpers/translator"
import Contact from "./contact"
import { ApplicationContext } from "../../context"
import { string } from "fast-web-kit"

/* creating login memorized functional component */
const Login: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // defining document title
        setPageTitle("login")

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])


    // function for submiting form to the server
    const submitForm = async (): Promise<void> => {
        try {

            // request options
            const options: createOrUpdate = {
                route: apiV1 + "authenticate",
                method: "POST",
                loading: true,
                body: {
                    select: {},
                    schema: "user",
                    joinForeignKeys: true,
                    fieldWithEncryption: "password",
                    valueToCompareWithEncryption: application.state.password,
                    condition: { $or: [{ username: text.format(application.state.account) }, { phone_number: application.state.account }], visible: true },
                }
            }

            // making a request
            const response: serverResponse = await application.createOrUpdate(options)

            // verifying wether response has been processed successifully
            if (response.success) {

                // check wether user has enabled two factor authentication
                if (!response.message.phone_number_verified || response.message.two_factor_authentication_enabled) {

                    application.dispatch({ loading: true })
                    const newResponse: serverResponse = await (await (fetch(`${emessageDomain}/send-otp`, {
                        mode: "cors",
                        method: "POST",
                        body: JSON.stringify({
                            apiKey: emessageApiKey,
                            vendor: getVendorName(),
                            receiver: `+255${response.message.phone_number.substring(1)}`
                        }),
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }))).json()
                    application.dispatch({ loading: false })

                    if (newResponse.success) {
                        props.history.push({
                            pathname: "/verification-code",
                            state: { user: encrypt(response.message), authenticate: true }
                        })
                        application.dispatch({ notification: "Verification code has been sent to your phone number" })
                    }
                    else
                        application.dispatch({ notification: newResponse.message })
                }
                else
                    application.authenticate("login", response.message)

            }
            else
                if (response.message?.toString()?.includes("has been found"))
                    application.dispatch({ accountError: "Account does not exist" })
                else if (response.message?.toString()?.includes("not correct"))
                    application.dispatch({ passwordError: "password is not correct" })
                else
                    application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ loading: false })
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // function for validating form
    const validateForm = (event: React.ChangeEvent<HTMLFormElement>): void => {
        try {

            // prevent form default submit
            event.preventDefault()

            // errors store
            const errors: string[] = []

            // validating form fields
            if (string.isEmpty(application.state.account)) {
                errors.push("error")
                application.dispatch({ accountError: "required" })
            }

            if (application.state.password === "") {
                errors.push("error")
                application.dispatch({ passwordError: "required" })
            }
            else if (string.getLength(application.state.password) < 4) {
                errors.push("error")
                application.dispatch({ passwordError: "password must have atleast 4 characters" })
            }

            // verifying there is no error
            if (errors.length === 0)
                submitForm()

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // returning login view
    return (
        <>
            <div className="guest">
                <div className="card">
                    <CardTitle title="welcome back!" />
                    <div className="card-content">
                        <form onSubmit={validateForm}>
                            <div className="row">
                                <div className="col s12">
                                    <Input
                                        label="Account"
                                        name="account"
                                        type="text"
                                        value={application.state.account}
                                        error={application.state.accountError}
                                        onChange={application.handleInputChange}
                                        placeholder="Enter username or phone number"
                                    />
                                </div>
                            </div>
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
                                <div className="col s12 right-align">
                                    <Link to="/forgot-password" className="guest-link right-link">
                                        {translate("Forgot password?")}
                                    </Link>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 center">
                                    <Button
                                        title="Login"
                                        loading={application.state.loading}
                                        disabled={application.state.disabled}
                                        onClick={validateForm}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                <Contact />
            </div>
        </>
    )

})

/* exporting component */
export default Login