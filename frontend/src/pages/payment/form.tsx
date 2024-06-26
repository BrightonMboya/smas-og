// dependencies
import React from "react"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Option, Select } from "../../components/form"
import { apiV1, noAccess, number, pageNotFound, paymentTypes, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import { createOrUpdate, routerProps, serverResponse } from "../../types"
import { string } from "fast-web-kit"
import { ApplicationContext } from "../../context"
import DataListComponent from "../../components/reusable/datalist"
import NumberComponent from "../../components/reusable/number-component"

// payment form memorized function component
const PaymentForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // check permission
        if (can("create_payment")) {
            if (props.location.state) {
                const { branch }: any = props.location.state
                if (branch) {
                    setPageTitle("New payment")
                    application.dispatch({
                        branchId: branch._id,
                        branchName: text.reFormat(branch.name),
                        totalAmount: branch.fee ? branch.fee.toString() : ""
                    })
                }
            }
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    // form validation and submission
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // prevent form default submit
            event.preventDefault()

            // errors store
            const errors: string[] = []

            const paidAmount = number.reFormat(application.state.paidAmount)

            // validating form fields
            if (string.isEmpty(application.state.branchName)) {
                errors.push("")
                application.dispatch({ branchNameError: "required" })
            }
            else if (string.isEmpty(application.state.branchId)) {
                errors.push("")
                application.dispatch({ branchNameError: "branch does not exist" })
            }

            if (string.isEmpty(application.state.paymentType)) {
                errors.push("")
                application.dispatch({ paymentTypeError: "required" })
            }

            if (string.isEmpty(application.state.paidAmount)) {
                errors.push("")
                application.dispatch({ paidAmountError: "required" })
            }
            else if (paidAmount <= 0) {
                errors.push("")
                application.dispatch({ paidAmountError: "can't be less or equal to zero" })
            }
            else if ((application.state.paymentType === "monthly_subscription") && (paidAmount < Number(application.state.totalAmount))) {
                errors.push("")
                application.dispatch({ paidAmountError: "invalid monthly support and maintenance fee" })
            }

            // no errors
            if (errors.length === 0) {
                // request options
                const options: createOrUpdate = {
                    route: apiV1 + "create",
                    method: "POST",
                    loading: true,
                    body: {
                        schema: "payment",
                        documentData: {
                            ...application.onCreate,
                            total_amount: paidAmount,
                            branch: application.state.branchId,
                            type: application.state.paymentType,
                        }
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
                <div className="col s12 m10 l6 offset-l3 offset-m1">
                    <div className="card">
                        <CardTitle title="new payment" />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                       <DataListComponent for="branch" />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Select
                                            label="type"
                                            name="paymentType"
                                            value={application.state.paymentType}
                                            error={application.state.paymentTypeError}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option value="" label="Select type" />
                                            {
                                                paymentTypes.sort().map((paymentType: string, index: number) => (
                                                    <Option key={index} label={text.reFormat(paymentType)} value={text.format(paymentType)} />
                                                ))
                                            }
                                        </Select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <NumberComponent
                                            label="amount"
                                            name="paidAmount"
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 center">
                                        <Button
                                            title="create"
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
                can("list_payment")
                    ? <FloatingButton to="/payment/list" tooltip="list payments" icon="list_alt" />
                    : null
            }
        </>
    )

})

// export component
export default PaymentForm