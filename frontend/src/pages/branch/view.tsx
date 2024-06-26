// dependencies
import numeral from "numeral"
import pluralize from "pluralize"
import React from "react"
import { Link } from "react-router-dom"
import { ActionButton, FloatingButton } from "../../components/button"
import { Checkbox } from "../../components/form"
import Modal from "../../components/modal"
import { apiV1, dashboardCollections, formatTin, isAdmin, noAccess, pageNotFound, setPageTitle, socketURL, storage, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, moduleMenuOnView, readOrDelete, routerProps, serverResponse, stateKey } from "../../types"
import { ApplicationContext } from "../../context"
import { array } from "fast-web-kit"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"
import branchViewMenu from "./helper/branch-view-menu"

// branch view memorized function component
const BranchView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("view_branch")) {
            if (props.location.state) {
                const { branch }: any = props.location.state
                if (branch) {
                    application.dispatch({
                        ids: [branch],
                        schema: "branch",
                        collection: "branches"
                    })
                    onMount(branch)
                    setPageTitle("view branch")
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
            const joinForeignKeys: boolean = true
            const select: string = JSON.stringify({})
            const condition: string = JSON.stringify({ _id })
            const parameters: string = `schema=branch&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
            const options: readOrDelete = {
                parameters,
                method: "GET",
                loading: true,
                disabled: false,
                route: apiV1 + "read"
            }

            const response: serverResponse = await application.readOrDelete(options)

            if (response.success)
                application.dispatch({ branch: response.message })
            else
                application.dispatch({ notification: application.successMessage })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // switching branch
    const switchBranch = async (action: "out" | "in"): Promise<void> => {
        try {

            const options: createOrUpdate = {
                route: apiV1 + "update",
                method: "PUT",
                loading: true,
                body: {
                    schema: "user",
                    condition: { _id: application.user._id },
                    newDocumentData: {
                        $set: {
                            branch: action === "in" ? application.state.branch._id : null
                        }
                    }
                }
            }
            const response: serverResponse = await application.createOrUpdate(options)

            if (response.success) {
                storage.store("user", response.message)
                application.dispatch({ notification: `you have been switched ${action}` })
                window.location.reload()
            }
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const resetBranch = async (): Promise<void> => {
        try {

            if (!array.isEmpty(application.state.list)) {
                const branch: string = application.state.ids[0]
                const body = application.state.list.filter((module) => module !== "branches").map((module) => ({
                    condition: { branch },
                    schema: pluralize.singular(module),
                    newDocumentData: { $set: { visible: false } }
                }))
                const options: createOrUpdate = {
                    body,
                    method: "PUT",
                    loading: true,
                    route: apiV1 + "bulk-update-many"
                }
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    const { failedQueries } = response.message
                    if (failedQueries.length === 0)
                        application.dispatch({ notification: "Operation was successful" })

                    application.dispatch({ list: [] })
                    application.toggleComponent("modal")
                }
                else
                    application.dispatch({ notification: response.message })
            }
            else
                application.dispatch({ notification: "Nothing has been selected" })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const selectModule = (module?: stateKey): void => {
        try {

            if (module) {

                const moduleIndex: number = application.state.list.indexOf(module)

                if (moduleIndex >= 0) {
                    application.dispatch({ list: application.state.list.filter((name) => name !== module) })
                }
                else
                    application.dispatch({ list: [...application.state.list, module] })

            }
            else {
                if ((application.state.list.length > 0) && (application.state.list.length === dashboardCollections.length))
                    application.dispatch({ list: [] })
                else {
                    application.dispatch({ list: dashboardCollections })
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderModules = React.useCallback(() => {
        try {
            return dashboardCollections.sort().map((module: stateKey, index: number) => {
                return (
                    <tr key={index} onClick={() => selectModule(module)}>
                        <td data-label={translate("select")}>
                            <Checkbox
                                onChange={() => selectModule(module)}
                                checked={application.state.list.indexOf(module) >= 0}
                                onTable
                            />
                        </td>
                        <td data-label="#">{index + 1}</td>
                        <td data-label={translate("module")}>{translate(module)}</td>
                    </tr>
                )
            })
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.list])

    return (
        <>
            <Modal
                title={`reset branch data`}
                buttonTitle="reset"
                buttonAction={resetBranch}
                toggleComponent={application.toggleComponent}
            >
                <div className="row show-on-medium-and-down">
                    <div className="col s12 center">
                        <div className="action-button">
                            <ActionButton to="#" icon="checklist" type="primary" tooltip={translate("select all")} position="left" onClick={() => selectModule()} />
                        </div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>
                                <Checkbox
                                    onChange={() => selectModule()}
                                    checked={(application.state.list.length > 0) && (application.state.list.length === dashboardCollections.length)}
                                    onTable
                                />
                            </th>
                            <th>#</th>
                            <th>{translate("module")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderModules()}
                    </tbody>
                </table>
            </Modal>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="img" style={{
                                backgroundImage: application.state?.branch?.image ? `url("${socketURL}/uploads/branch/${application.state?.branch?.image}")` : `url("/logo.svg")`
                            }} />
                            <div className="view-title">
                                <span>
                                    {text.reFormat(application.state.branch?.name)}
                                </span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("branch menu & action")}</div>
                            </div>
                            {
                            branchViewMenu.map((menu: moduleMenuOnView, index: number) => {
                                    if (menu.visible && application.state.branch?.visible)
                                        return (
                                            <Link
                                                to={{
                                                    pathname: `${menu.link}`,
                                                    state: {
                                                        propsCondition: { branch: application.state.branch?._id },
                                                        branch: application.state[application.state.schema]
                                                    }
                                                }}
                                                className="view-item"
                                                key={index}
                                            >
                                                <Icon name="chevron_right" />
                                                <div className="title">{translate(menu.name)}</div>
                                            </Link>
                                        )
                                    return null
                                })
                            }
                            {
                                can("switch_branch") && (application.user.branch?._id !== application.state.branch?._id) && application.state.branch?.visible
                                    ?
                                    <Link to="#" className="view-item" onClick={() => switchBranch("in")}>
                                        <Icon name="swap_horizontal_circle" />
                                        <div className="title semibold">{translate("switch in this branch")}</div>
                                    </Link>
                                    : isAdmin
                                        ?
                                        <Link to="#" className="view-item" onClick={() => switchBranch("out")}>
                                            <Icon name="swap_horizontal_circle" />
                                            <div className="title semibold">{translate("switch out of this branch")}</div>
                                        </Link>
                                        : null

                            }
                            {
                                application.state.branch?.visible && (can("edit_branch") || can("delete_branch") || can("reset_branch"))
                                    ?
                                    <>
                                        {
                                            can("edit_branch")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/branch/form`,
                                                        state: { branch: application.state.branch?._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_branch")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.openDialog("deleted")}
                                                >
                                                    <Icon name="delete" type="rounded text-error" />
                                                    <div className="title semibold">{translate("delete")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("reset_branch")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.toggleComponent("modal")}
                                                >
                                                    <Icon name="warning" type="rounded text-warning" />
                                                    <div className="title semibold">{translate("reset")}</div>
                                                </Link>
                                                : null
                                        }
                                    </>
                                    : !application.state.branch?.visible && can("restore_deleted") && !application.state.loading
                                        ?
                                        <Link
                                            to="#"
                                            className="view-item"
                                            onClick={() => application.openDialog("restored")}
                                        >
                                            <Icon name="restore_from_trash" type="rounded text-warning" />
                                            <div className="title semibold">{translate("restore")}</div>
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
                                            {translate("user")}:
                                        </div>
                                        <div className="title text-primary bold">
                                            {application.state.branch?.user ? text.reFormat(application.state.branch?.user.username) : translate("n/a")}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("country")}:
                                        </div>
                                        <div className="title">
                                            {application.state.branch?.address?.country ? text.reFormat(application.state.branch?.address?.country) : translate("n/a")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("email")}:
                                        </div>
                                        <div className="title">
                                            {
                                                application.state.branch?.email ?
                                                    <a href={`mailto:${application.state.branch?.email}`} className="lowercase">
                                                        {application.state.branch?.email}
                                                    </a>
                                                    : translate("n/a")
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("website")}:
                                        </div>
                                        <div className="title">
                                            {
                                                application.state.branch?.website ?
                                                    <a href={`${application.state.branch?.website}`} className="lowercase" target="blank">
                                                        {application.state.branch?.website}
                                                    </a>
                                                    : translate("n/a")
                                            }
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
                                        <div className="title">
                                            <a href={`tel:+${application.state.branch?.phone_number}`} className="text-primary">
                                                +{application.state.branch?.phone_number}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("tin")}:
                                        </div>
                                        <div className="title">
                                            {formatTin(application.state.branch?.tin)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("region")}:
                                        </div>
                                        <div className="title">
                                            {text.reFormat(application.state.branch?.address?.region)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("location")}:
                                        </div>
                                        <div className="title">
                                            {text.reFormat(application.state.branch?.address?.location)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("street")}:
                                        </div>
                                        <div className="title">
                                            {text.reFormat(application.state.branch?.address?.street)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("status")}:
                                        </div>
                                        <div className={`title ${!application.state.branch?.visible ? "text-error" : "text-success"}`}>
                                            {translate(!application.state.branch?.visible ? "deleted" : "active")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("vendor")}:
                                        </div>
                                        <div className="title">
                                            {application.state.branch?.vendor ? application.state.branch?.vendor : translate("n/a")}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("api key")}:
                                        </div>
                                        <div className="title">
                                            {application.state.branch?.api_key ? application.state.branch?.api_key : translate("n/a")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("monthly fee")}:
                                        </div>
                                        <div className="title">
                                            {application.state.branch?.fee ? numeral(application.state.branch?.fee).format("0,0") : translate("n/a")}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("remain days")}:
                                        </div>
                                        <div className={`title bold ${(application.state.branch?.days <= 10) && application.state.branch?.days > 0 ? "text-warning" : application.state.branch?.days > 10 ? "text-primary" : "text-error"}`}>
                                            {application.state.branch?.days}
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
                can("list_branch")
                    ? < FloatingButton to="/branch/list" tooltip="list branches" />
                    : null
            }
        </>
    )

})

export default BranchView