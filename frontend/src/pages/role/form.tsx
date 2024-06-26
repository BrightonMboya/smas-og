// dependencies
import React from "react"
import { ActionButton, Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Checkbox, Input, Textarea } from "../../components/form"
import { apiV1, commonCondition, isAdmin, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can, getPermissions, permission, permissionName, permissions } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"

// role form memorized functiona component
const RoleForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user access
        if (can("create_role") || can("edit_role")) {
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
            setPageTitle("new role")
            if (props.location.state) {
                const { role }: any = props.location.state
                if (role) {
                    // parameters, condition and select
                    const select: string = JSON.stringify({
                        name: 1,
                        permissions: 1,
                        description: 1
                    })
                    const condition: string = JSON.stringify({ _id: role })
                    const parameters: string = `schema=role&condition=${condition}&select=${select}&joinForeignKeys=`

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
                        setPageTitle("edit role")
                        application.dispatch({
                            edit: true,
                            id: response.message._id,
                            description: response.message.description,
                            permissions: response.message.permissions,
                            name: text.reFormat(response.message.name),
                        })
                    }
                    else
                        application.dispatch({ notification: response.message })
                }
            }
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // form validation and submission
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // prevent form default submit
            event.preventDefault()

            // errors store
            const errors: string[] = []

            // validating form fields
            if (string.isEmpty(application.state.name)) {
                errors.push("")
                application.dispatch({ nameError: "required" })
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "required" })
            }

            if (array.isEmpty(application.state.permissions)) {
                errors.push("")
                application.dispatch({ notification: "select atleast 1 permission" })
            }

            if (array.isEmpty(errors) && string.isEmpty(application.state.nameError)) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const role = {
                    ...creatorOrModifier,
                    name: text.format(application.state.name),
                    description: application.state.description,
                    permissions: array.removeDuplicates(application.state.permissions.filter((permission: string) => array.elementExist(getPermissions(), permission))),
                }

                // request options
                const options: createOrUpdate = {
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    method: application.state.edit ? "PUT" : "POST",
                    loading: true,
                    body: {
                        schema: "role",
                        documentData: role,
                        newDocumentData: { $set: role },
                        condition: application.condition,
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


    // handle checkbox change
    const handleCheckbox = (name: any): void => {
        try {

            if (string.isValid(name)) {
                let modulePermissions: string[] = []
                const permissionExist: boolean = application.state.permissions.includes(name)

                if (permissionExist)
                    modulePermissions = application.state.permissions.filter((permissionName: string) => permissionName !== name)
                else
                    modulePermissions = [...application.state.permissions, name]

                application.dispatch({ permissions: array.removeDuplicates(modulePermissions) })
            }
            else if (array.isValid(name)) {

                name = !application.user.role ? name : application.user.role.permissions.filter((permission: string) => array.elementExist(name, permission))

                if (array.elementsExist(application.state.permissions, name))
                    application.dispatch({ permissions: array.removeDuplicates(application.state.permissions.filter((permission: string) => !array.elementExist(name, permission))) })
                else
                    application.dispatch({ permissions: array.removeDuplicates([...application.state.permissions, ...name]) })

            }
            else {

                const allPermissions: string[] = application.user.role ? application.user.role.permissions : getPermissions()

                if ((array.getLength(application.state.permissions) === array.getLength(allPermissions)))
                    application.dispatch({ permissions: [] })
                else
                    application.dispatch({ permissions: array.removeDuplicates(allPermissions) })

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="card">
                        <CardTitle title={application.state.edit ? "edit role" : "new role"} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            label="name"
                                            type="text"
                                            name="name"
                                            value={application.state.name}
                                            error={application.state.nameError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter name"
                                            onKeyUp={() => application.validate({
                                                schema: "role",
                                                errorKey: "nameError",
                                                condition: { ...commonCondition(), name: text.format(application.state.name) }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Textarea
                                            name="description"
                                            label="description"
                                            placeholder="Enter description"
                                            value={application.state.description}
                                            error={application.state.descriptionError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 center">
                                        <Button
                                            title={application.state.edit ? "update" : "create"}
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
                        <div className="card-title center">
                            {translate("permissions")} ({application.state.permissions.length})
                        </div>
                        <div className="card-content">
                            <div className="row">
                                <div className="col s12">
                                    <div className="action-button">
                                        <ActionButton to="#" icon="checklist" type="primary" tooltip={translate("select all")} position="left" onClick={() => handleCheckbox(undefined)} />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                {
                                    permissions.sort((a, b) => {
                                        if (a.module < b.module) {
                                            return -1;
                                        }
                                        if (a.module > b.module) {
                                            return 1;
                                        }
                                        return 0;
                                    }).map((permission: permission, index: number) => {
                                        if (application.user.role?.permissions?.find((element: string) => element.includes(text.format(permission.module).toLowerCase())) || (isAdmin && application.user.role === null) || (permission.module === "general"))
                                            return (
                                                <div className="col s12" key={index} style={{ marginBottom: "1rem" }}>
                                                    <table>
                                                        <thead>
                                                            <tr onClick={() => handleCheckbox(permission.permissions)}>
                                                                {/* <th>
                                                                    <Checkbox
                                                                        onChange={() => handleCheckbox(permission.permissions)}
                                                                        checked={array.elementsExist(application.state.permissions, permission.permissions)}
                                                                        onTable
                                                                    />
                                                                </th> */}
                                                                <th colSpan={2}>{translate(text.reFormat(permission.module))} - {index + 1}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {
                                                                permission.permissions.sort((a, b) => {
                                                                    if (a.length < b.length) {
                                                                        return -1;
                                                                    }
                                                                    if (a.length > b.length) {
                                                                        return 1;
                                                                    }
                                                                    return 0;
                                                                }).map((permissionName: permissionName, i: number) => {
                                                                    if (application.user.role?.permissions?.find((element: string) => element === text.format(permissionName).toLowerCase()) || (isAdmin && application.user.role === null))
                                                                        return (

                                                                            <tr onClick={() => handleCheckbox(permissionName)} key={i}>
                                                                                <td data-label={translate(application.state.permissions.includes(permissionName) ? "selected" : "select")}>
                                                                                    <Checkbox
                                                                                        onChange={() => handleCheckbox(permissionName)}
                                                                                        checked={application.state.permissions.includes(permissionName)}
                                                                                        onTable
                                                                                    />
                                                                                </td>
                                                                                <td data-label={translate(text.reFormat(permission.module))} key={i}>
                                                                                    <span className={`${permissionName.includes("delete") ? "text-error" : permissionName.includes("edit") ? "text-primary" : ""}`}>
                                                                                        {translate(text.reFormat(permissionName))}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        )
                                                                    else
                                                                        return null
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )
                                        else
                                            return null
                                    })
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_role")
                    ? <FloatingButton to="/role/list" tooltip="list roles" icon="list_alt" />
                    : null
            }
        </>
    )

})

// export component
export default RoleForm