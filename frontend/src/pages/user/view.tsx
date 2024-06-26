// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../components/button"
import { Checkbox } from "../../components/form"
import Modal from "../../components/modal"
import { apiV1, commonCondition, setPageTitle, storage, text, userListView } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, listView, readOrDelete, routerProps, serverResponse, stateKey } from "../../types"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"
import pluralize from "pluralize"

// user view memorized functional component
const UserView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // check access
        let userId = application.user._id
        if (props.location.state) {
            const { user }: any = props.location.state
            userId = user
        }
        onMount(userId)
        application.dispatch({
            ids: [userId],
            schema: "user",
            collection: "users"
        })
        setPageTitle("view user")

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
            const parameters: string = `schema=user&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
            const options: readOrDelete = {
                route: apiV1 + "read",
                method: "GET",
                loading: true,
                disabled: false,
                parameters
            }

            const response: serverResponse = await application.readOrDelete(options)

            if (response.success)
                application.dispatch({ user: response.message })
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const getBranches = async (schema: stateKey): Promise<void> => {
        try {

            const collection = (pluralize(schema)) as stateKey
            const sortAndSelect = { name: 1 }
            const sort: string = JSON.stringify(sortAndSelect)
            const select: string = JSON.stringify(sortAndSelect)
            const condition: string = JSON.stringify(commonCondition())
            const parameters: string = `schema=${schema}&condition=${condition}&select=${select}&sort=${sort}&joinForeignKeys=`
            const options: readOrDelete = {
                parameters,
                method: "GET",
                loading: true,
                disabled: false,
                route: apiV1 + "list-all"
            }
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success) {
                application.toggleComponent("modal")
                application.dispatch({ branches: response.message })
                application.dispatch({
                    [schema]: true,
                    list: application.state.user[collection] ? application.state.user[collection] : []
                })
            }
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const selectBranch = (id?: string): void => {
        try {

            if (id) {
                const idIndex: number = application.state.list.indexOf(id)

                if (idIndex >= 0)
                    application.dispatch({ list: application.state.list.filter((branchId: string) => branchId !== id) })
                else
                    application.dispatch({ list: [...application.state.list, id] })

            }
            else {
                if ((application.state.list.length > 0) && (application.state.list.length === application.state.branches.length))
                    application.dispatch({ list: [] })
                else {
                    application.dispatch({ list: application.state.branches.map((branch: any) => branch._id) })
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering branches
    const renderBranches = React.useCallback(() => {
        try {
            return application.state.branches.map((branch: any, index: number) => (
                <tr key={branch._id} onClick={() => selectBranch(branch._id)}>
                    <td data-label={translate("select")}>
                        <Checkbox
                            onChange={() => selectBranch(branch._id)}
                            checked={application.state.list.indexOf(branch._id) >= 0}
                            onTable
                        />
                    </td>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")} >{text.reFormat(branch.name)}</td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.branches, application.state.list])

    const changeBranchAccess = async (): Promise<void> => {
        try {

            const collection: stateKey = application.state.branch ? "branches" : "stores"
            const options: createOrUpdate = {
                loading: true,
                method: "PUT",
                route: apiV1 + "update",
                body: {
                    schema: "user",
                    condition: { _id: application.state.user._id },
                    newDocumentData: {
                        $set: { [collection]: application.state.list }
                    }
                }
            }

            const response: serverResponse = await application.createOrUpdate(options)

            if (response.success) {
                application.toggleComponent("modal")
                application.dispatch({
                    list: [],
                    branches: [],
                    store: null,
                    branch: null,
                    notification: `user ${collection} access has been changed`
                })
                if (application.user._id === application.state.user._id) {
                    storage.store("user", response.message)
                    application.dispatch({ user: response.message })
                }
            }
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // component view
    return (
        <>
            <Modal
                buttonTitle="change access"
                title="change user access"
                buttonAction={changeBranchAccess}
                toggleComponent={application.toggleComponent}
            >
                <table>
                    <thead>
                        <tr>
                            <th>
                                <Checkbox
                                    onChange={() => selectBranch()}
                                    checked={(application.state.list.length > 0) && (application.state.list.length === application.state.branches.length)}
                                    onTable
                                />
                            </th>
                            <th>#</th>
                            <th>{translate("name")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderBranches()}
                    </tbody>
                </table>
            </Modal>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {text.abbreviate(application.state[application.state.schema]?.username)}
                            </div>
                            <div className="view-title">
                                <span>
                                    {text.reFormat(application.state[application.state.schema]?.username)}
                                </span>
                                {
                                    application.state[application.state.schema]?.phone_number_verified && !application.state.onlineUsers.includes(application.state.user?._id)
                                        ? <Icon name="verified" type="rounded text-success" />
                                        :
                                        application.state.onlineUsers.includes(application.state.user?._id)
                                            ? <Icon name="online_prediction" type="rounded text-success" />
                                            : null
                                }
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="info" />
                                <div className="title">{translate(`${text.reFormat(application.state.schema)} information`)}</div>
                            </div>
                            {
                                userListView.sort((a, b) => {
                                    if (a.name.length < b.name.length) {
                                        return -1;
                                    }
                                    if (a.name.length > b.name.length) {
                                        return 1;
                                    }
                                    return 0;
                                }).map((listView: listView, index: number) => {
                                    if (listView.visible && application.state[application.state.schema]?.visible)
                                        return (
                                            <Link
                                                to={{
                                                    pathname: `${listView.link}`,
                                                    state: {
                                                        propsCondition: { [listView.name.includes("activities") ? "user" : "created_by"]: application.state[application.state.schema]?._id },
                                                        user: application.state[application.state.schema]
                                                    }
                                                }}
                                                className="view-item"
                                                key={index}
                                            >
                                                <Icon name="chevron_right" />
                                                <div className="title">{translate(listView.name)}</div>
                                            </Link>
                                        )
                                    return null
                                })
                            }
                            {
                                application.state[application.state.schema]?.visible && (can("edit_user") || can("delete_user") || can("change_user_branch_access") || can("change_user_store_access"))
                                    ?
                                    <>
                                        {
                                            can("edit_user") && (application.user._id !== application.state.user?._id)
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/user/form`,
                                                        state: { user: application.state[application.state.schema]._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-primary" />
                                                    <div className="title">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_user") && (application.user._id !== application.state.user?._id)
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.openDialog("deleted")}
                                                >
                                                    <Icon name="delete" type="rounded text-error" />
                                                    <div className="title">{translate("delete")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("change_user_branch_access")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => {
                                                        getBranches("branch")
                                                    }}
                                                >
                                                    <Icon name="warning" type="rounded text-warning" />
                                                    <div className="title">{translate("change branch access")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("change_user_store_access")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => {
                                                        getBranches("store")
                                                    }}
                                                >
                                                    <Icon name="warning" type="rounded text-warning" />
                                                    <div className="title">{translate("change store access")}</div>
                                                </Link>
                                                : null
                                        }
                                    </>
                                    : can("restore_deleted") && !application.state[application.state.schema]?.visible
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
                                            {translate("role")}:
                                        </div>
                                        <div className="title">
                                            {
                                                application.state[application.state.schema]?.role ? text.reFormat(application.state[application.state.schema]?.role?.name) : translate("n/a")
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("account type")}:
                                        </div>
                                        <div className="title">
                                            {translate(application.state[application.state.schema]?.account_type)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("phone number")}:
                                        </div>
                                        <div className="title text-primary">
                                            <a href={`tel:+255${application.state[application.state.schema]?.phone_number?.substring(1)}`} className="text-primary">
                                                {application.state[application.state.schema]?.phone_number}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("verified")}:
                                        </div>
                                        <div className={`title ${application.state[application.state.schema]?.phone_number_verified ? "text-success" : "text-error"}`}>
                                            {translate(application.state[application.state.schema]?.phone_number_verified ? "yes" : "no")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("2FA enabled")}:
                                        </div>
                                        <div className={`title ${application.state[application.state.schema]?.two_factor_authentication_enabled ? "text-primary" : "text-warning"}`}>
                                            {translate(application.state[application.state.schema]?.two_factor_authentication_enabled ? "yes" : "no")}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("status")}:
                                        </div>
                                        <div className={`title ${!application.state[application.state.schema]?.visible ? "text-error" : "text-success"}`}>
                                            {translate(!application.state[application.state.schema]?.visible ? "deleted" : "active")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ViewDetail />
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_user")
                    ? <FloatingButton to="/user/list" tooltip="list users" icon="list_alt" />
                    : null
            }
        </>
    )

})

// export component
export default UserView