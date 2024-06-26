/* dependencies */
import React from "react"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Checkbox, Input, Option, Select } from "../../components/form"
import { apiV1, isAdmin, noAccess, pageNotFound, setPageTitle, storage, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, routerProps, serverResponse, readOrDelete } from "../../types"
import { ApplicationContext } from "../../context"
import CustomDatalist from "../../components/datalist"
import { array, string } from "fast-web-kit"

/* user form memorized functional component */
const UserForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // get current pathname
        const pathname: string = props.location.pathname

        if (can("create_user") || can("edit_user") || (pathname === "/profile/edit")) {
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

            // get current user id
            let userId = application.user._id

            setPageTitle("new user")
            if (props.location.state || (window.location.pathname === "/profile/edit")) {
                if (props.location.state) {

                    const { user, branch, role }: any = props.location.state

                    if (user) {
                        userId = user
                    }
                    else if (branch) {
                        userId = ""
                        application.dispatch({
                            branch,
                            branches: [branch],
                            branchId: branch._id,
                            branchName: `${text.reFormat(branch.name)} - ${branch.phone_number}`
                        })
                    }
                    else if (role) {
                        userId = ""
                        application.dispatch({
                            role,
                            roles: [role],
                            roleId: role._id,
                            roleName: text.reFormat(role.name)
                        })
                    }

                }
                else
                    application.dispatch({ user: true })

                if (string.isNotEmpty(userId)) {
                    const joinForeignKeys: boolean = true
                    const select: string = JSON.stringify({})
                    const condition: string = JSON.stringify({ _id: userId })
                    const parameters: string = `schema=user&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read"
                    }
                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        setPageTitle("edit user")
                        const user = response.message
                        const role = user.role
                        const branch = user.branch

                        application.dispatch({
                            edit: true,
                            id: user._id,
                            phoneNumber: user.phone_number,
                            accountType: user.account_type,
                            language: user.settings.language,
                            oldPhoneNumber: user.phone_number,
                            theme: user.settings.theme || "auto",
                            userName: text.reFormat(user.username),
                            phoneNumberVerified: user.phonenumber_verified,
                            twoFactorAuthenticationEnabled: user.two_factor_authentication_enabled ? "true" : "false",
                        })

                        if (branch) {
                            application.dispatch({
                                branches: [branch],
                                branchId: branch._id,
                                branchName: `${text.reFormat(branch.name)} - ${branch.phone_number}`
                            })
                        }

                        if (role) {
                            application.dispatch({
                                roles: [role],
                                roleId: role._id,
                                roleName: text.reFormat(role.name)
                            })
                        }

                    }
                    else
                        application.dispatch({ notification: response.message })

                }
            }
            else {
                if (application.user.branch) {
                    application.dispatch({
                        branches: [application.user.branch],
                        branchId: application.user.branch._id,
                        branchName: `${text.reFormat(application.user.branch.name)} - ${application.user.branch.phone_number}`
                    })
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // form submission
    const submitForm = async (): Promise<void> => {
        try {

            const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
            const user = {
                ...creatorOrModifier,
                phone_number: application.state.phoneNumber,
                username: text.format(application.state.userName),
                account_type: text.format(application.state.accountType),
                role: string.isNotEmpty(application.state.roleId) ? application.state.roleId : null,
                branch: string.isNotEmpty(application.state.branchId) ? application.state.branchId : null,
                two_factor_authentication_enabled: application.state.twoFactorAuthenticationEnabled === "true" ? true : false,
                settings: {
                    theme: application.state.theme,
                    language: application.state.language,
                    system_loading: application.state.systemLoading
                },
                phone_number_verified: (application.state.oldPhoneNumber !== application.state.phoneNumber) || !application.state.edit ? false : application.state.phoneNumberVerified,
            }

            // reqeust options
            const options: createOrUpdate = {
                route: `${apiV1}${application.state.edit ? "update" : "create-field-encryption"}`,
                method: application.state.edit ? "PUT" : "POST",
                loading: true,
                body: {
                    schema: "user",
                    fieldToEncrypt: "password",
                    documentData: {
                        ...user,
                        password: application.state.phoneNumber,
                    },
                    condition: application.condition,
                    newDocumentData: { $set: user }
                }
            }

            // making api request
            const response: serverResponse = await application.createOrUpdate(options)

            // checking if request was processed successful
            if (response.success) {

                const user = response.message

                if (user._id === application.user._id) {
                    if (application.state.oldPhoneNumber !== application.state.phoneNumber) {
                        storage.remove("user")
                        window.location.reload()
                    }
                    else {
                        storage.store("user", user)
                        props.history.push("/profile/view")
                    }
                }

                application.unMount()
                application.dispatch({ notification: application.successMessage })
            }
            else
                if (response.message.toString().includes("phoneNumber"))
                    application.dispatch({ phoneNumberError: "Phone number already exist" })
                else if (response.message.toString().includes("userName"))
                    application.dispatch({ userNameError: "Username already exist" })
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
            if (string.isEmpty(application.state.accountType)) {
                errors.push("error")
                application.dispatch({ accountTypeError: "required" })
            }

            if (string.isEmpty(application.state.branchName) && !application.state.user) {
                if ((application.state.accountType === "employee") || (application.state.accountType === "user")) {
                    errors.push("error")
                    application.dispatch({ branchNameError: "required" })
                }
            }
            else if (string.isEmpty(application.state.branchId) && !application.state.user) {
                if ((application.state.accountType === "employee") || (application.state.accountType === "user")) {
                    errors.push("error")
                    application.dispatch({ branchNameError: "branch does not exist" })
                }
            }

            if (string.isEmpty(application.state.roleName) && !application.state.user) {
                errors.push("error")
                application.dispatch({ roleNameError: "required" })
            }
            else if (string.isEmpty(application.state.roleId) && !application.state.user) {
                errors.push("error")
                application.dispatch({ roleNameError: "role does not exist" })
            }

            if (string.isEmpty(application.state.userName)) {
                errors.push("error")
                application.dispatch({ userNameError: "required" })
            }

            if (string.isEmpty(application.state.phoneNumber)) {
                errors.push("error")
                application.dispatch({ phoneNumberError: "required" })
            }
            else if (string.getLength(application.state.phoneNumber) !== 10) {
                errors.push("error")
                application.dispatch({ phoneNumberError: "phone number must have 10 digits" })
            }

            // checking if there's no error occured
            if (array.isEmpty(errors) && string.isEmpty(application.state.userNameError) && string.isEmpty(application.state.phoneNumberError))
                submitForm()

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // returning component view
    return (
        <>
            <div className="row">
                <div className="col s12 m10 offset-m1 l8 offset-l2">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} user`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <CustomDatalist
                                            sort="name"
                                            list="branches"
                                            nameId="branchId"
                                            name="branchName"
                                            label="branch"
                                            placeholder="enter branch"
                                            nameError="branchNameError"
                                            fields={["name", "phone_number"]}
                                            disable={application.state.user || !isAdmin}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <CustomDatalist
                                            sort="name"
                                            list="roles"
                                            nameId="roleId"
                                            name="roleName"
                                            label="role"
                                            placeholder="enter role"
                                            nameError="roleNameError"
                                            fields={["name"]}
                                            disable={application.state.user}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Select
                                            name="accountType"
                                            label="account type"
                                            disabled={application.state.user}
                                            value={application.state.accountType}
                                            onChange={application.handleInputChange}
                                            error={application.state.accountTypeError}
                                        >
                                            <Option value="" label={translate("Select account type")} defaultValue="" />
                                            {
                                                isAdmin
                                                    ?
                                                    <>
                                                        <Option value="user" label={translate("owner")} />
                                                        {
                                                            isAdmin
                                                                ?
                                                                <>
                                                                    <Option value="smasapp" label={translate("system account")} />
                                                                    <Option value="employee" label={translate("employee")} />
                                                                </>
                                                                : null
                                                        }
                                                    </>
                                                    :
                                                    <>
                                                        <Option value="user" label={translate("owner")} />
                                                        <Option value="employee" label={translate("employee")} />
                                                    </>
                                            }
                                        </Select>
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Select
                                            name="language"
                                            label="language"
                                            error={application.state.languageError}
                                            value={application.state.language}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option value="english" label={translate("english")} />
                                            <Option value="swahili" label={translate("swahili")} />
                                        </Select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            label="username"
                                            name="userName"
                                            value={application.state.userName}
                                            error={application.state.userNameError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter username"
                                            onKeyUp={() => application.validate({
                                                schema: "user",
                                                errorKey: "userNameError",
                                                condition: { username: text.format(application.state.userName) }
                                            })}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="number"
                                            label="phone number"
                                            name="phoneNumber"
                                            value={application.state.phoneNumber}
                                            error={application.state.phoneNumberError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter phone number"
                                            onKeyUp={() => application.validate({
                                                schema: "user",
                                                errorKey: "phoneNumberError",
                                                condition: { phone_number: application.state.phoneNumber }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Select
                                            name="theme"
                                            label="theme"
                                            error={application.state.themeError}
                                            value={application.state.theme}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option value="auto" label={translate("auto")} />
                                            <Option value="dark" label={translate("dark")} />
                                            <Option value="light" label={translate("light")} />
                                        </Select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Checkbox
                                            name="twoFactorAuthenticationEnabled"
                                            label={`two factor authentication ${application.state.twoFactorAuthenticationEnabled === "true" ? "enabled" : "disabled"}`}
                                            value={application.state.twoFactorAuthenticationEnabled === "false" ? "true" : "false"}
                                            onChange={application.handleInputChange}
                                            checked={application.state.twoFactorAuthenticationEnabled === "true"}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 center">
                                        <Button
                                            loading={application.state.loading}
                                            disabled={application.state.disabled}
                                            title={application.state.edit ? "update" : "create"}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_user")
                    ?
                    <FloatingButton to="/user/list" icon="list_alt" tooltip="List users" />
                    : null
            }
        </>
    )

})

/* exporting component */
export default UserForm