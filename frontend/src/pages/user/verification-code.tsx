/* requiring dependencies */
import React from "react"
import { Button } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Input } from "../../components/form"
import { apiV1, decrypt, emessageDomain, setPageTitle } from "../../helpers"
import { createOrUpdate, routerProps, serverResponse } from "../../types"
import Contact from "./contact"
import { ApplicationContext } from "../../context"
import { string } from "fast-web-kit"

/* creating memorized verification code functional component */
const VerificationCode: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // defining document title
        setPageTitle("Verification code")

        // validating page validity
        if (!props.location.state)
            props.history.goBack()

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    const verifyPhoneNumber = async (_id: any, auth: boolean): Promise<void> => {
        try {

            // request options
            const options: createOrUpdate = {
                route: apiV1 + "update",
                loading: true,
                method: "PUT",
                body: {
                    schema: "user",
                    condition: { _id },
                    newDocumentData: {
                        $set: {
                            updated_by: _id,
                            phone_number_verified: true
                        }
                    }
                }
            }

            // making api request
            const response = await application.createOrUpdate(options)

            if (response.success)
                if (auth)
                    application.authenticate("login", response.message)
                else
                    props.history.push({
                        pathname: "/change-password",
                        state: { user: _id }
                    })
            else
                props.history.goBack()

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }


    // function for validating form fields
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            let userData;
            let auth;

            if (props.location.state) {
                const { user, authenticate }: any = props.location.state
                userData = decrypt(user)
                auth = authenticate
            }

            // preventing default form submit
            event.preventDefault()

            if (string.isEmpty(application.state.code))
                application.dispatch({ codeError: "required" })


            else if (string.getLength(application.state.code) !== 6)
                application.dispatch({ codeError: "code must have 6 digits" })
            else {
                const parameters: string = `otp=${application.state.code}&phoneNumber=${`255${userData.phone_number.substring(1)}`}`
                application.dispatch({ loading: true })
                const response: serverResponse = await (await fetch(`${emessageDomain}/verify-otp?${parameters}`)).json()
                application.dispatch({ loading: false })

                if (response.success)
                    verifyPhoneNumber(userData._id, auth)
                else
                    application.dispatch({ codeError: response.message })
            }

        } catch (error) {

            application.dispatch({ notification: (error as Error).message, loading: false })
        }
    }

    // returning component view
    return (
        <div className="guest">
            <div className="card">
                <CardTitle title="verification code" />
                <div className="card-content">
                    <form onSubmit={validateForm}>
                        <div className="row">
                            <div className="col s12">
                                <Input
                                    label="Code"
                                    type="number"
                                    name="code"
                                    value={application.state.code}
                                    error={application.state.codeError}
                                    onChange={application.handleInputChange}
                                    placeholder="Enter code sent to your phone number"
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col s12 center">
                                <Button
                                    title="Verify"
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
    )

})

// exporting component
export default VerificationCode