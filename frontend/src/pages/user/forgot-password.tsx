/* requiring dependencies */
import React from "react"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { apiV1, emessageApiKey, emessageDomain, encrypt, getVendorName, setPageTitle, text } from "../../helpers"
import { Input } from "../../components/form"
import { Button } from "../../components/button"
import { Link } from "react-router-dom"
import { CardTitle } from "../../components/card"
import Contact from "./contact"
import translate from "../../helpers/translator"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"

/* creating memorized forgot password functional component */
const ForgotPassword: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // defining document page title
        setPageTitle("Forgot password")

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])


    // function for submiting form to the server
    const submitForm = async (): Promise<void> => {
        try {

            const documentId = ""
            const joinForeignKeys: boolean = true
            const select: string = JSON.stringify({ _id: 1, phone_number: 1, branch: 1 })
            const condition: string = JSON.stringify({ $or: [{ username: text.format(application.state.account) }, { phone_number: application.state.account, visible: true }] })
            const parameters: string = `schema=user&condition=${condition}&validationType=onCreate&select=${select}&joinForeignKeys=${joinForeignKeys}&documentId=${documentId}`

            // validation options
            const readOptions: readOrDelete = {
                parameters,
                method: "GET",
                loading: true,
                disabled: false,
                route: apiV1 + "validate"
            }

            // validate api request
            const response: serverResponse = await application.readOrDelete(readOptions)


            if (response.success) {

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


                // verifying wether verification code has been send
                if (newResponse.success) {

                    // redirect user to verification page
                    props.history.push({
                        pathname: "/verification-code",
                        state: { user: encrypt(response.message) }
                    })

                    application.dispatch({ notification: "Verification code has been sent to your phone number" })

                }
                else
                    application.dispatch({ accountError: newResponse.message })
            }
            else
                application.dispatch({ accountError: response.message })

        } catch (error) {
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

            // verifying there is no error
            if (array.isEmpty(errors))
                submitForm()

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // returning component view
    return (
        <div className="guest">
            <div className="card">
                <CardTitle title="forgot password?" />
                <div className="card-content">
                    <form onSubmit={validateForm}>
                        <div className="row">
                            <div className="col s12">
                                <Input
                                    label="Account"
                                    name="account"
                                    type="text"
                                    error={application.state.accountError}
                                    onChange={application.handleInputChange}
                                    placeholder="Enter username or phone number"
                                    value={text.format(application.state.account)}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col s12 right-align">
                                <Link to="/login" className="guest-link right-link">
                                    {translate("Already have an account")}
                                </Link>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col s12 center">
                                <Button
                                    title="Send code"
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
export default ForgotPassword