// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../components/button"
import { Checkbox, Textarea } from "../../components/form"
import { apiV1, isAdmin, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can, permission, permissionName, permissions } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"
import { array } from "fast-web-kit"

// role view meorized function component
const RoleView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // check user access
        if (can("view_role")) {
            if (props.location.state) {
                const { role }: any = props.location.state
                if (role) {
                    application.dispatch({
                        ids: [role],
                        schema: "role",
                        collection: "roles",
                    })
                    onMount(role)
                    setPageTitle("view role")
                }
                else
                    props.history.goBack()
            }
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
            const condition: string = JSON.stringify({ _id })
            const select: string = JSON.stringify({})
            const joinForeignKeys: boolean = true
            const parameters: string = `schema=role&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
            const options: readOrDelete = {
                route: apiV1 + "read",
                method: "GET",
                loading: true,
                disabled: false,
                parameters
            }

            const response: serverResponse = await application.readOrDelete(options)

            if (response.success)
                application.dispatch({ role: response.message })
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {text.abbreviate(application.state[application.state.schema]?.name)}
                            </div>
                            <div className="view-title">
                                <span>
                                    {text.reFormat(application.state[application.state.schema]?.name)}
                                </span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <i className="material-icons-round">info</i>
                                <div className="title">{translate(`${text.reFormat(application.state.schema)} information`)}</div>
                            </div>
                            <div className="row">
                                <div className="col s12">
                                    <Textarea
                                        label=""
                                        name="description"
                                        value={translate(application.state[application.state.schema]?.description)}
                                        error=""
                                        onChange={() => { }}
                                        placeholder=""
                                        readOnly
                                    />
                                </div>
                            </div>
                            {
                                application.state[application.state.schema]?.visible && (can("edit_role") || can("delete_role") || can("list_user"))
                                    ?
                                    <>
                                        {
                                            can("list_user")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/user/list`,
                                                        state: { propsCondition: { role: application.state[application.state.schema]?._id } }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <i className="material-icons-round">people</i>
                                                    <div className="title">{translate("list users")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("edit_role")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/role/form`,
                                                        state: { role: application.state[application.state.schema]._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <i className="material-icons-round text-success">edit_note</i>
                                                    <div className="title">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_role")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.openDialog("deleted")}
                                                >
                                                    <i className="material-icons-round text-error">delete</i>
                                                    <div className="title">{translate("delete")}</div>
                                                </Link>
                                                : null
                                        }
                                    </>
                                    : !application.state[application.state.schema]?.visible && can("restore_deleted")
                                        ?
                                        <Link
                                            to="#"
                                            className="view-item"
                                            onClick={() => application.openDialog("restored")}
                                        >
                                            <i className="material-icons-round text-warning">restore_from_trash</i>
                                            <div className="title">{translate("restore")}</div>
                                        </Link>
                                        : null
                            }
                        </div>
                    </div>
                </div>
                <div className="col s12 m7 l8">
                    <div className="view">
                        <div className="view-header">
                            <div className="title">
                                <span>{translate(`${text.reFormat(application.state.schema)} information`)}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("permissions")}:
                                        </div>
                                        <div className="title">
                                            {application.state[application.state.schema]?.permissions?.length}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase bold ${!application.state[application.state.schema]?.visible ? "text-error" : "text-success"}`}>
                                            {translate(!application.state[application.state.schema]?.visible ? "deleted" : "active")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ViewDetail />
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
                                                            <tr>
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
                                                                    if (application.user.role?.permissions?.find((element: string) => element === text.format(permissionName).toLowerCase()) || isAdmin)
                                                                        return (
                                                                            <tr key={i}>
                                                                                <td data-label={translate(array.elementExist(application.state.role?.permissions, permissionName) ? "selected" : "select")}>
                                                                                    <Checkbox
                                                                                        onChange={() => { }}
                                                                                        checked={array.elementExist(application.state.role?.permissions, permissionName)}
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
export default RoleView