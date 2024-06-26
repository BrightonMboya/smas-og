// dependencies
import numeral from "numeral"
import React from "react"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Checkbox, Option, Select, Textarea } from "../../components/form"
import { apiV1, commonCondition, emessageApiKey, emessageDomain, isAdmin, noAccess, number, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { array, string } from "fast-web-kit"
import { ApplicationContext } from "../../context"
import NumberComponent from "../../components/reusable/number-component"

// message form memorized function component
const MessageForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // check permission
        if (can("create_message")) {
            setPageTitle("new message")
            getUserVendors()
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    React.useEffect(() => {
        onMount()
        // eslint-disable-next-line
    }, [application.state.receivers])

    // fetch component data
    async function onMount(): Promise<void> {
        try {

            application.dispatch({ list: [], ids: [] })
            const schema: string = application.state.receivers === "system users" ? "user" : application.state.receivers === "branches" ? "branch" : application.state.receivers === "customers" ? "customer" : ""

            if (string.isNotEmpty(schema)) {
                application.dispatch({ collection: "list" })
                const select: string = JSON.stringify({ username: 1, name: 1, phone_number: 1 })
                const sort: string = JSON.stringify(schema === "user" ? { username: 1 } : { name: 1 })
                const condition: string = JSON.stringify(schema === "user" ? { ...commonCondition(), phone_number_verified: true } : commonCondition())
                const parameters: string = `schema=${schema}&condition=${condition}&select=${select}&sort=${sort}&joinForeignKeys=${false}`

                // request options
                const options: readOrDelete = {
                    parameters,
                    method: "GET",
                    loading: true,
                    disabled: false,
                    route: apiV1 + "list-all"

                }

                // api request
                const response: serverResponse = await application.readOrDelete(options)

                if (response.success)
                    application.dispatch({ ids: [], list: response.message })
                else
                    application.dispatch({ notification: response.message })

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    async function getUserVendors(): Promise<void> {
        try {
            if ((application.user?.branch?.vendor && application.user?.branch?.api_key) || ((application.user.account_type === "smasapp"))) {
                application.dispatch({ loading: true })
                const vendor: string = application.user.branch?.vendor || "Smas App"
                const apiKey: string = application.user.branch?.api_key || emessageApiKey
                const parameters: string = `vendor-info?apiKey=${apiKey}`
                const response: serverResponse = await (await fetch(`${emessageDomain}/${parameters}`, {
                    mode: "cors",
                    method: "GET"
                })).json()

                if (response.success) {
                    const balance = response.message.filter((vendorData: any) => vendorData.name === vendor)[0]?.balance?.toString()
                    application.dispatch({
                        vendor,
                        apiKey,
                        balance,
                        vendors: response.message
                    })
                }
                application.dispatch({ loading: false })
            }
        } catch (error) {
            application.dispatch({ loading: false })
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // render profiles
    const renderUser = React.useCallback(() => {
        try {
            return application.state.list.map((user: any, index: number) =>
                <tr key={index} onClick={() => application.selectList(user._id)}>
                    <td data-label="select">
                        <Checkbox
                            onChange={() => application.selectList(user._id)}
                            checked={application.state.ids.indexOf(user._id) >= 0}
                            onTable
                        />
                    </td>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")}>
                        {text.reFormat(user.username)}
                    </td>
                    <td data-label={translate("phone number")} className="center text-primary">
                        {user.phone_number}
                    </td>
                </tr>
            )
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.list, application.state.ids, application.state.receivers])

    // render users
    const renderCustomers = React.useCallback(() => {
        try {
            return application.state.list.map((customer: any, index: number) =>
                <tr key={index} onClick={() => application.selectList(customer._id)}>
                    <td data-label="select">
                        <Checkbox
                            onChange={() => application.selectList(customer._id)}
                            checked={application.state.ids.indexOf(customer._id) >= 0}
                            onTable
                        />
                    </td>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")}>
                        {text.reFormat(customer.name)}
                    </td>
                    <td data-label={translate("phone number")} className="center text-primary">
                        +{customer.phone_number}
                    </td>
                </tr>
            )
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.list, application.state.ids, application.state.receivers])

    const renderBranches = React.useCallback(() => {
        try {
            return application.state.list.map((branch: any, index: number) =>
                <tr key={index} onClick={() => application.selectList(branch._id)}>
                    <td data-label="select">
                        <Checkbox
                            onChange={() => application.selectList(branch._id)}
                            checked={application.state.ids.indexOf(branch._id) >= 0}
                            onTable
                        />
                    </td>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")}>
                        {text.reFormat(branch.name)}
                    </td>
                    <td data-label={translate("phone number")} className="center text-primary">
                        +{branch.phone_number}
                    </td>
                </tr>
            )
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.list, application.state.ids, application.state.receivers])

    // form validation and submission
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // prevent form default submit
            event.preventDefault()

            // errors store
            const errors: string[] = []
            const balance = number.reFormat(application.state.balance)

            // validating form fields
            if (application.state.receivers.trim() === "") {
                errors.push("")
                application.dispatch({ receiversError: "required" })
            }

            if (application.state.description.trim() === "") {
                errors.push("")
                application.dispatch({ descriptionError: "required" })
            }

            if (application.state.ids.length === 0) {
                errors.push("")
                application.dispatch({ notification: "Select atleast 1 receiver" })
            }

            if (Number(balance) < Number(application.state.messageCost)) {
                errors.push("")
                application.dispatch({ balanceError: "You don't have enough balance" })
            }

            // no errors
            if (errors.length === 0) {

                application.dispatch({ loading: true })

                const receivers: string[] = []

                for (const id of application.state.ids) {
                    const userExist = application.state.list.filter((user: any) => user._id === id)[0].phone_number
                    if (userExist) {
                        if (string.getLength(userExist) === 10)
                            receivers.push(`+255${userExist.substring(1)}`)
                        else
                            receivers.push(`+${userExist}`)
                    }
                }

                const body = {
                    receivers,
                    vendor: application.state.vendor,
                    apiKey: application.state.apiKey,
                    message: application.state.description
                }

                const response = (await (await fetch(`${emessageDomain}/send-message`, {
                    mode: "cors",
                    method: "POST",
                    body: JSON.stringify(body),
                    headers: application.headers
                })).json())

                if (response.success) {
                    application.dispatch({ ids: [] })
                    application.dispatch({ list: [] })
                    application.dispatch({ receivers: "" })
                    application.dispatch({ description: "" })
                    application.dispatch({ notification: "message has been sent" })
                }
                else
                    application.dispatch({ notification: response.message })

                application.dispatch({ loading: false })

            }

        } catch (error) {
            application.dispatch({ loading: false })
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // getting message cost
    const getMessageCost = (): void => {
        try {

            // checking if message has been entered
            if (application.state.description.trim() !== "") {
                const oneMessageCharacter: number = 160
                const userMessageCharacter: number = application.state.description.length
                const totalUserMessages: number = userMessageCharacter <= 160 ? 1 : Math.ceil(userMessageCharacter / oneMessageCharacter)
                const messageCost: number = application.state.costPerMessage * totalUserMessages
                application.dispatch({ messageCost })
            }
            else
                application.dispatch({ descriptionError: "required" })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderVendors = React.useCallback(() => {
        try {
            return array.sort(application.state.vendors, "asc", "name").map((vendor: any, index: number) => (
                <Option key={index} label={vendor.name} value={vendor.name} />
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.vendors])

    React.useEffect(() => {
        application.dispatch({ balance: "" })
        if (string.isNotEmpty(application.state.vendor)) {
            const vendor = application.state.vendors.filter((vendor: any) => vendor.name.toLowerCase() === application.state.vendor.toLowerCase())[0]

            if (vendor)
                application.dispatch({ balance: vendor.balance.toString() })

        }
        // eslint-disable-next-line
    }, [application.state.vendor])

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="card">
                        <CardTitle title="New message" />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <Select
                                            name="vendor"
                                            label="vendor name"
                                            value={application.state.vendor}
                                            error={application.state.vendorError}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option label={"select vendor name"} value={""} />
                                            {renderVendors()}
                                        </Select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Select
                                            label="receivers"
                                            name="receivers"
                                            value={application.state.receivers}
                                            error={application.state.receiversError}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option value="" label={translate("select receiver type")} />
                                            {
                                                isAdmin
                                                    ? <Option value="branches" label={translate("branches")} />
                                                    : <Option value="customers" label={translate("customers")} />
                                            }
                                            <Option value="system users" label={translate("system users")} />
                                        </Select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <NumberComponent
                                            name="balance"
                                            label="balance"
                                            placeholder="balance"
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Textarea
                                            label={`message ${application.state.description.trim() !== "" ? ` - cost / message: ${application.state.messageCost} TZS` : ""}`}
                                            name="description"
                                            value={application.state.description}
                                            error={application.state.descriptionError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter message"
                                            onKeyDown={getMessageCost}
                                            onBlur={getMessageCost}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 center">
                                        <Button
                                            title="send message"
                                            loading={application.state.loading}
                                            disabled={application.state.disabled}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="col s12 m7 l8">
                    <div className="card">
                        <div className="card-title">
                            {application.state.receivers}&nbsp;{application.state.ids.length > 0 ? `- ${application.state.ids.length}` : ""}
                            {
                                application.state.ids.length > 0
                                    ? <div className={`badge right primary `}>
                                        {translate("Cost")}: {numeral(application.state.messageCost * application.state.ids.length).format("0,0")}
                                    </div>
                                    : null
                            }
                        </div>
                        <div className="card-content">
                            <table>
                                <thead>
                                    <tr onClick={() => application.selectList()}>
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state[application.state.collection]?.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        <th>#</th>
                                        <th>{translate("name")}</th>
                                        <th className="center">{translate("phone number")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        application.state.receivers === "system users"
                                            ?
                                            renderUser()
                                            : application.state.receivers === "customers"
                                                ? renderCustomers()
                                                : application.state.receivers === "branches"
                                                    ? renderBranches()
                                                    : null
                                    }
                                </tbody>
                            </table>
                        </div>
                        <div className="row">
                            <div className="col s12 center">
                                <Button
                                    loading={application.state.loading}
                                    disabled={false}
                                    title="Refresh balance"
                                    onClick={getUserVendors}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_message") && !isAdmin
                    ? <FloatingButton to="/message/list" tooltip="list messages" icon="list_alt" />
                    : null
            }
        </>
    )

})

// export component
export default MessageForm