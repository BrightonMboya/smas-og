// dependencies
import React from "react"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../../types"
import { ApplicationContext } from "../../../context"
import { accountProviders, accountProvidersTypes, apiV1, noAccess, number, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import { CardTitle } from "../../../components/card"
import { Button, FloatingButton } from "../../../components/button"
import { Input, Option, Select } from "../../../components/form"
import { array, string } from "fast-web-kit"
import translate from "../../../helpers/translator"
import NumberComponent from "../../../components/reusable/number-component"
import DataListComponent from "../../../components/reusable/datalist"

// account memorized function component
const AccountForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        onMount()
        // component unmounting
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    // on component opening
    async function onMount(): Promise<void> {
        try {

            // checking user permission
            if (can("create_account") || can("edit_account")) {

                // setting provider and balance
                application.dispatch({ provider: "none", balance: "0" })

                setPageTitle("new account")

                // cheking if account id has been passed from route state for editing
                if (props.location.state) {

                    // destructuring account
                    const { account, customer, supplier }: any = props.location.state

                    // verifying account is has been passed
                    if (account) {

                        const joinForeignKeys: boolean = true
                        const condition: string = JSON.stringify({ _id: account })
                        const select: string = JSON.stringify({
                            branch: 0,
                            created_by: 0,
                            updated_by: 0
                        })

                        // request parameter
                        const parameters: string = `schema=account&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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

                            setPageTitle("edit account")
                            const account = response.message

                            application.dispatch({
                                edit: true,
                                id: account._id,
                                name: account.name,
                                type: account.type,
                                provider: account.provider,
                                accountNumber: account.number,
                                fee: account.monthly_fee.toString(),
                                balance: account.balance?.toString(),
                                customerId: account.customer ? account.customer._id : "",
                                supplierId: account.supplier ? account.supplier._id : "",
                                supplierName: account.supplier ? `${text.reFormat(account.supplier.name)} - ${account.supplier.phone_number}` : "",
                                customerName: account.customer ? `${text.reFormat(account.customer.name)} - ${account.customer.phone_number}` : "",
                            })
                        }
                        else
                            application.dispatch({ notification: response.message })

                    }
                    else if (customer) {
                        application.dispatch({
                            type: "customer",
                            customers: [customer],
                            customerId: customer ? customer._id : "",
                            customerName: customer ? `${text.reFormat(customer.name)} - ${customer.phone_number}` : "",
                        })
                    }
                    else if (supplier) {
                        application.dispatch({
                            type: "supplier",
                            suppliers: [supplier],
                            supplierId: supplier ? supplier._id : "",
                            supplierName: supplier ? `${text.reFormat(supplier.name)} - ${supplier.phone_number}` : "",
                        })
                    }
                }
            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({
                    notification: noAccess
                })
            }

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
    }

    // rendering providers
    const renderProviders = React.useCallback((type: string) => {
        try {

            return array.sort(type === "provider" ? accountProviders : accountProvidersTypes, "asc").map((provider: string, index: number) => (
                <Option label={provider} value={text.format(provider)} key={index} />
            ))

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
        // eslint-disable-next-line
    }, [accountProviders, accountProvidersTypes])

    // form validation function
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // preventing default form submit
            event.preventDefault()

            const fee = number.reFormat(application.state.fee)
            const balance = number.reFormat(application.state.balance)

            // errors store
            const errors: string[] = []

            if (string.isEmpty(application.state.name)) {
                errors.push("")
                application.dispatch({ nameError: "required" })
            }

            if (string.isEmpty(application.state.provider)) {
                errors.push("")
                application.dispatch({ providerError: "required" })
            }

            if (string.isEmpty(application.state.type)) {
                errors.push("")
                application.dispatch({ typeError: "required" })
            }

            if (string.isEmpty(application.state.balance)) {
                errors.push("")
                application.dispatch({ balanceError: "required" })
            }

            if (string.isNotEmpty(application.state.type)) {
                if ((application.state.type === "bank") || (application.state.type === "mobile")) {
                    if (string.isEmpty(application.state.accountNumber)) {
                        errors.push("")
                        application.dispatch({ accountNumberError: "required" })
                    }

                    if (application.state.type === "bank") {
                        if (string.isEmpty(application.state.fee)) {
                            errors.push("")
                            application.dispatch({ feeError: "required" })
                        }
                        else if (fee < 0) {
                            errors.push("")
                            application.dispatch({ feeError: "can't be less than 0" })
                        }
                    }
                }
                else if ((application.state.type === "customer") || (application.state.type === "supplier")) {
                    if (string.isEmpty(application.state[`${application.state.type}Name`])) {
                        errors.push("")
                        application.dispatch({
                            [`${application.state.type}NameError`]: "required"
                        })
                    }
                    else if (string.isEmpty(application.state[`${application.state.type}Id`])) {
                        errors.push("")
                        application.dispatch({
                            [`${application.state.type}NameError`]: `${application.state.type} does not exist`
                        })
                    }
                }
            }

            if (array.isEmpty(errors)) {

                const account = {
                    monthly_fee: fee ? fee : 0,
                    type: application.state.type.trim(),
                    provider: application.state.provider.trim(),
                    name: application.state.name.trim().toUpperCase(),
                    number: (application.state.type === "bank") || application.state.type === "mobile" ? application.state.accountNumber.trim().toUpperCase() : null,
                }

                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "account",
                        condition: application.condition,
                        newDocumentData: { $set: account, ...application.onUpdate },
                        documentData: {
                            ...account,
                            ...application.onCreate,
                            balance: balance ? balance : 0,
                            user: application.state.type === "user" ? application.state.userId : null,
                            customer: application.state.type === "customer" ? application.state.customerId : null,
                            supplier: application.state.type === "supplier" ? application.state.supplierId : null,
                        }
                    }
                }

                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.unMount()
                    application.dispatch({ notification: application.successMessage })
                }
                else
                    application.dispatch({ notification: response.message })

            }

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
    }

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-m1 offset-l2">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} account`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            name="name"
                                            label="name"
                                            placeholder="enter account name"
                                            error={application.state.nameError}
                                            onChange={application.handleInputChange}
                                            value={application.state.name.toUpperCase()}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Select
                                            name="type"
                                            label="type"
                                            value={application.state.type}
                                            error={application.state.typeError}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option label={translate("select account type")} value={""} />
                                            {renderProviders("type")}
                                        </Select>
                                    </div>
                                </div>
                                <div className="row">

                                    <div className="col s12 m6 l6">
                                        <Select
                                            name="provider"
                                            label="provider"
                                            value={application.state.provider}
                                            error={application.state.providerError}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option label={"select account provider"} value={""} />
                                            {renderProviders("provider")}
                                        </Select>
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="balance"
                                            label="balance"
                                            disabled={application.state.edit}
                                            placeholder="enter account balance"
                                        />
                                    </div>
                                </div>
                                {
                                    application.state.type === "mobile" || application.state.type === "bank"
                                        ?
                                        <div className="row">
                                            <div className="col s12 m6 l6">
                                                <Input
                                                    type="text"
                                                    label="number"
                                                    name="accountNumber"
                                                    placeholder="enter account number"
                                                    onChange={application.handleInputChange}
                                                    error={application.state.accountNumberError}
                                                    value={application.state.accountNumber.toUpperCase()}
                                                    disabled={application.state.type !== "mobile" && application.state.type !== "bank"}
                                                />
                                            </div>
                                            <div className="col s12 m6 l6">
                                                <NumberComponent
                                                    name="fee"
                                                    label="monthly fee"
                                                    placeholder="enter account monthly fee"
                                                    disabled={application.state.type !== "bank"}
                                                />
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    application.state.type === "customer" || application.state.type === "supplier"
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <DataListComponent for={application.state.type} />
                                            </div>
                                        </div>
                                        : null
                                }
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
                can("list_account")
                    ?
                    <FloatingButton
                        to="/transaction/account-list"
                        tooltip="list accounts"
                    />
                    : null
            }
        </>
    )

})

// exporting component for global accessibilit
export default AccountForm