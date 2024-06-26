// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { ActionButton, Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Checkbox, Input, Option, Select, Textarea } from "../../components/form"
import Modal from "../../components/modal"
import { apiV1, noAccess, notificationTypes, pageNotFound, accountProviders, setPageTitle, storage, text, isAdmin, number } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { array, object, string } from "fast-web-kit"
import NumberComponent from "../../components/reusable/number-component"
import DataListComponent from "../../components/reusable/datalist"
import branchTypes from "./helper/types"

// setting memorized function component
const BranchSetting: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("change_branch_settings")) {

            setPageTitle("branch settings")

            let branchId = application.user.branch?._id

            if (props.location.state) {
                const { branch }: any = props.location.state
                if (branch)
                    branchId = string.isValid(branch) ? branch : object.isValid(branch) ? branch._id : undefined
            }

            if (branchId)
                onMount(branchId)
            else
                props.history.goBack()
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    async function onMount(_id: string): Promise<void> {
        try {

            // parameters, condition, select, join foreign keys
            const joinForeignKeys: boolean = true
            const condition: string = JSON.stringify({ _id })
            const select: string = JSON.stringify({
                fee: 1,
                name: 1,
                days: 1,
                user: 1,
                type: 1,
                vendor: 1,
                api_key: 1,
                settings: 1,
                created_by: 0,
                updated_by: 0,
            })
            const parameters: string = `schema=branch&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                const branch = response.message

                application.dispatch({
                    branch,
                    edit: true,
                    id: branch._id,
                    days: branch.days?.toString(),
                    fee: branch.fee?.toString(),
                    pobox: branch.settings?.pobox || "",
                    saleNote: branch.settings?.sale_note || "",
                    openingTime: branch.settings?.opening_time || "",
                    closingTime: branch.settings?.closing_time || "",
                    invoiceNote: branch.settings?.invoice_note || "",
                    notifications: branch.settings?.notifications || [],
                    paymentMethods: branch.settings?.payment_methods || [],
                    type: string.isNotEmpty(branch.type) ? branch.type : "",
                    vendor: string.isNotEmpty(branch.vendor) ? branch.vendor : "",
                    apiKey: string.isNotEmpty(branch.api_key) ? branch.api_key : "",
                    primaryColor: branch.settings?.primary_color || "#0066CC",
                    fontFamily: branch.settings?.font_family || "Google Sans",
                })

                if (object.isValid(branch.user)) {
                    application.dispatch({
                        users: [branch.user],
                        userId: branch.user._id,
                        userName: `${text.reFormat(branch.user.username)} - ${branch.user.phone_number}`
                    })
                }
            }
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const handleCheckbox = (notification: string): void => {
        try {

            const notifications = application.state.notifications
            const notificationExist = notifications.includes(notification)

            if (notificationExist)
                application.dispatch({ notifications: notifications.filter((data: string) => data !== notification) })
            else
                application.dispatch({ notifications: [...notifications, notification] })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const togglePaymentMethod = (index?: number): void => {
        try {

            if (!(typeof index === "number")) {

                const errors: string[] = []
                const name = application.state.name.toUpperCase()
                const provider = application.state.provider.toUpperCase()
                const account = application.state.account.toUpperCase()
                const index = application.state.paymentMethods.length + 1

                if (string.isEmpty(provider)) {
                    errors.push("")
                    application.dispatch({ providerError: "required" })
                }

                if (string.isEmpty(name)) {
                    errors.push("")
                    application.dispatch({ nameError: "required" })
                }

                if (string.isEmpty(account)) {
                    errors.push("")
                    application.dispatch({ accountError: "required" })
                }

                if (array.isEmpty(errors)) {
                    application.toggleComponent("modal")
                    const newMethod = { vendor: provider, account, name, index, type: provider.includes("Bank") ? "bank_method" : "mobile_method" }
                    const paymentMethods = [newMethod, ...application.state.paymentMethods]
                    application.dispatch({
                        name: "",
                        provider: "",
                        account: "",
                        paymentMethods
                    })
                }

            }
            else {
                const paymentMethods = application.state.paymentMethods.filter((method: any) => method.index !== index)
                application.dispatch({ paymentMethods })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            event.preventDefault()
            const errors: string[] = []
            const fee = number.reFormat(application.state.fee) || 0

            if (string.isNotEmpty(application.state.fee) && fee < 0) {
                errors.push("")
                application.dispatch({ feeError: "can't be less than 0" })
            }

            if (string.isNotEmpty(application.state.vendor)) {
                if (string.getLength(application.state.vendor) > 11) {
                    errors.push("")
                    application.dispatch({ vendorError: "vendor name must have characters less or equal to 11" })
                }

                if (string.isEmpty(application.state.apiKey)) {
                    errors.push("")
                    application.dispatch({ apiKeyError: "required" })
                }
            }

            if (string.isNotEmpty(application.state.apiKey)) {
                if (string.getLength(application.state.apiKey) !== 30) {
                    errors.push("")
                    application.dispatch({ apiKeyError: "api key must have 30 characters" })
                }

                if (string.isEmpty(application.state.vendor)) {
                    errors.push("")
                    application.dispatch({ vendorError: "required" })
                }
            }

            if (string.isEmpty(application.state.type)) {
                errors.push("")
                application.dispatch({ typeError: "required" })
            }

            if (string.isEmpty(application.state.userId)) {
                errors.push("")
                application.dispatch({ userNameError: "required" })
            }

            if (array.isEmpty(errors)) {

                const settings = {
                    pobox: application.state.pobox,
                    sale_note: application.state.saleNote,
                    font_family: application.state.fontFamily,
                    opening_time: application.state.openingTime,
                    closing_time: application.state.closingTime,
                    invoice_note: application.state.invoiceNote,
                    primary_color: application.state.primaryColor,
                    notifications: application.state.notifications,
                    payment_methods: application.state.paymentMethods,
                }

                const branch = {
                    fee,
                    settings,
                    ...application.onUpdate,
                    branch: null,
                    user: application.state.userId,
                    days: Number(application.state.days),
                    type: text.format(application.state.type),
                    vendor: string.isNotEmpty(application.state.vendor) ? application.state.vendor : "",
                    api_key: string.isNotEmpty(application.state.apiKey) ? application.state.apiKey : "",
                }

                const options: createOrUpdate = {
                    route: apiV1 + "update",
                    method: "PUT",
                    loading: true,
                    body: {
                        schema: "branch",
                        condition: application.condition,
                        newDocumentData: { $set: branch },
                    }
                }

                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.dispatch({ notification: application.successMessage })
                    if (application.user.branch?._id === response.message._id)
                        storage.store("user", { ...application.user, branch: response.message })
                }
                else
                    application.dispatch({ notification: response.message })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering types
    const renderTypes = React.useCallback(() => {
        try {
            return branchTypes.sort().map((type: string) => (
                <Option key={type} value={type} label={type} />
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.type])


    return (
        <>
            <div className="row">
                <div className="col s12 m7 l8">
                    <div className="card">
                        <CardTitle title={`${text.reFormat(application.state.branch?.name)} payment methods`} />
                        <div className="card-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{translate("provider")}</th>
                                        <th>{translate("account name")}</th>
                                        <th>{translate("account number")}</th>
                                        <th className="center">{translate("remove")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        application.state.paymentMethods.map((method: any) => (
                                            <tr key={method.index}>
                                                <td data-label="#">{method.index}</td>
                                                <td data-label={translate("provider")}>{method.vendor}</td>
                                                <td data-label={translate("account name")}>{method.name}</td>
                                                <td data-label={translate("account number")}>{method.account}</td>
                                                <td className="center">
                                                    <div className="action-button">
                                                        <ActionButton
                                                            to="#"
                                                            type="error"
                                                            tooltip=""
                                                            icon="cancel"
                                                            onClick={() => togglePaymentMethod(method.index)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                            <div className="row">
                                <div className="col s12 right-align" style={{ marginTop: "1rem" }}>
                                    <Link to="#" className="text-primary" onClick={() => application.toggleComponent("modal")} >
                                        {translate("add new payment method")}
                                    </Link>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 center">
                                    <Button
                                        onClick={validateForm}
                                        title={application.buttonTitle}
                                        loading={application.state.loading}
                                        disabled={application.state.disabled}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col s12">
                            <div className="card">
                                <div className="card-title center">
                                    {text.reFormat(application.state.branch?.name)}
                                </div>
                                <div className="card-content">
                                    <form action="#" onSubmit={validateForm}>
                                        <div className="row">
                                            <div className="col s12">
                                                <Input
                                                    label="P.o Box"
                                                    type="number"
                                                    name="pobox"
                                                    value={application.state.pobox}
                                                    error={application.state.poboxError}
                                                    onChange={application.handleInputChange}
                                                    placeholder="enter p.o box"
                                                />
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col s12 m6 l6">
                                                <Input
                                                    type="color"
                                                    name="primaryColor"
                                                    label="primary color"
                                                    placeholder="enter primary color"
                                                    value={application.state.primaryColor}
                                                    onChange={application.handleInputChange}
                                                    error={application.state.primaryColorError}
                                                />
                                            </div>
                                            <div className="col s12 m6 l6">
                                                <Input
                                                    type="text"
                                                    name="fontFamily"
                                                    label="font family"
                                                    placeholder="enter font family"
                                                    value={application.state.fontFamily}
                                                    onChange={application.handleInputChange}
                                                    error={application.state.fontFamilyError}
                                                />
                                            </div>
                                        </div>
                                        {
                                            isAdmin
                                                ?
                                                <>
                                                    <div className="row">
                                                        <div className="col s12 m6 l6">
                                                            <DataListComponent
                                                                for="user"
                                                            />
                                                        </div>
                                                        <div className="col s12 m6 l6">
                                                            <NumberComponent
                                                                name="fee"
                                                                label="monthly fee (optional)"
                                                                placeholder="Enter monthly fee"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col s12 m6 l6">
                                                            <Input
                                                                type="text"
                                                                name="vendor"
                                                                placeholder="Enter vendor"
                                                                label="Emessage vendor (optional)"
                                                                value={application.state.vendor}
                                                                error={application.state.vendorError}
                                                                onChange={application.handleInputChange}
                                                            />
                                                        </div>
                                                        <div className="col s12 m6 l6">
                                                            <Input
                                                                type="text"
                                                                name="apiKey"
                                                                placeholder="Enter api Key"
                                                                value={application.state.apiKey}
                                                                label="Emessage API Key (optional)"
                                                                error={application.state.apiKeyError}
                                                                onChange={application.handleInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col s12 m6 l6">
                                                            <Select
                                                                label="type"
                                                                name="type"
                                                                value={application.state.type}
                                                                error={application.state.typeError}
                                                                onChange={application.handleInputChange}
                                                            >
                                                                <Option value="" label={translate("select type")} />
                                                                {renderTypes()}
                                                            </Select>
                                                        </div>
                                                        <div className="col s12 m6 l6">
                                                            <Input
                                                                name="days"
                                                                label="days"
                                                                type="number"
                                                                placeholder="Enter days"
                                                                value={application.state.days}
                                                                error={application.state.daysError}
                                                                onChange={application.handleInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                                : null
                                        }
                                        <div className="row">
                                            <div className="col s12 m6 l6">
                                                <Input
                                                    label="opening time"
                                                    type="time"
                                                    name="openingTime"
                                                    value={application.state.openingTime}
                                                    error={application.state.openingTimeError}
                                                    onChange={application.handleInputChange}
                                                />
                                            </div>
                                            <div className="col s12 m6 l6">
                                                <Input
                                                    label="closing time"
                                                    type="time"
                                                    name="closingTime"
                                                    value={application.state.closingTime}
                                                    error={application.state.closingTimeError}
                                                    onChange={application.handleInputChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col s12 m6 l6">
                                                <Textarea
                                                    label="sale / order note on receipts"
                                                    placeholder="Enter sale or order note"
                                                    name="saleNote"
                                                    value={application.state.saleNote}
                                                    error={application.state.saleNoteError}
                                                    onChange={application.handleInputChange}
                                                />
                                            </div>
                                            <div className="col s12 m6 l6">
                                                <Textarea
                                                    label="proforma invoice note"
                                                    placeholder="Enter proforma invoice note"
                                                    name="invoiceNote"
                                                    value={application.state.invoiceNote}
                                                    error={application.state.invoiceNoteError}
                                                    onChange={application.handleInputChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col s12 center">
                                                <Button
                                                    onClick={validateForm}
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
                </div>
                <div className="col s12 m5 l4">
                    <div className="card">
                        <div className="card-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th colSpan={2}>{translate("sms notifications")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        notificationTypes.sort().map((notification: string, index: number) => (
                                            <tr key={index} onClick={() => handleCheckbox(notification)}>
                                                <td data-label={translate("sms notifications")}>
                                                    <Checkbox
                                                        onTable
                                                        onChange={() => handleCheckbox(notification)}
                                                        name=""
                                                        checked={application.state.notifications.includes(notification)}
                                                    />
                                                </td>
                                                <td>
                                                    {translate(notification)}
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>

                        </div>
                        <div className="row">
                            <div className="col s12 center">
                                <Button
                                    onClick={validateForm}
                                    title={application.buttonTitle}
                                    loading={application.state.loading}
                                    disabled={application.state.disabled}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                buttonTitle="Add method"
                buttonAction={() => togglePaymentMethod()}
                toggleComponent={application.toggleComponent}
                title={`new ${text.reFormat(application.state.branch?.name)} payment method`}
            >
                <form action="#">
                    <div className="row">
                        <div className="col s12">
                            <Select
                                name="provider"
                                label="provider"
                                value={application.state.provider}
                                error={application.state.providerError}
                                onChange={application.handleInputChange}
                            >
                                <Option value="" label="select provider" />
                                {
                                    accountProviders.map((provider: string, index: number) => (
                                        <Option value={provider} key={index} label={provider} />
                                    ))
                                }
                            </Select>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col s12">
                            <Input
                                type="text"
                                name="name"
                                label="account name"
                                placeholder="enter account name"
                                error={application.state.nameError}
                                onChange={application.handleInputChange}
                                value={application.state.name.toUpperCase()}
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col s12">
                            <Input
                                type="text"
                                name="account"
                                label="account number"
                                placeholder="enter account number"
                                error={application.state.accountError}
                                onChange={application.handleInputChange}
                                value={application.state.account.toUpperCase()}
                            />
                        </div>
                    </div>
                </form>
            </Modal>
            {
                can("list_branch")
                    ?
                    <FloatingButton
                        to="/branch/list"
                        tooltip="list branches"
                    />
                    : null
            }
        </>
    )
})

export default BranchSetting