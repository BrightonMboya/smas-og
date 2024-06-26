// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../components/button"
import Filter from "../../components/filter"
import { Checkbox } from "../../components/form"
import Pagination from "../../components/pagination"
import Search from "../../components/search"
import { apiV1, commonCondition, isAdmin, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { routerProps } from "../../types"
import { ApplicationContext } from "../../context"
import { Link } from "react-router-dom"

// role list memorized functional component
const RoleList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // check user access
        if (can("list_role")) {
            setPageTitle("roles")
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

    // fetching component data
    async function onMount(): Promise<void> {
        try {
            // creating initial condition
            let initialCondition: object = commonCondition()

            // checking if condition has been passed from other components
            if (props.location.state) {
                const { propsCondition }: any = props.location.state
                if (propsCondition) {
                    initialCondition = { ...initialCondition, ...propsCondition }
                    application.dispatch({ propsCondition })
                }
            }

            const condition: string = JSON.stringify(initialCondition)
            const order = -1
            const sort: string = JSON.stringify({ createdAt: order })
            const select: object = { created_by: 0, updated_by: 0, __v: 0, createdAt: 0, updatedAt: 0 }
            const joinForeignKeys: boolean = true
            const parameters: string = `schema=role&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "roles",
                sort: "created time",
                order,
                schema: "role",
                collection: "roles",
                select,
                joinForeignKeys,
                fields: ["name", "description"]
            })
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // render list
    const renderList = React.useCallback(() => {
        try {
            return application.state.roles.map((role: any, index: number) => (
                <tr key={role._id} onClick={() => application.selectList(role._id)}>
                    {
                        can("delete_role") || can("restore_deleted")
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(role._id)}
                                    checked={application.state.ids.indexOf(role._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label={translate("#")}>{index + 1}</td>
                    <td data-label={translate("name")} className="sticky bold">{text.reFormat(role.name)}</td>
                    {
                        isAdmin
                            ?
                            <td data-label={translate("branch")}>
                                <Link to={can("view_branch") && role.branch ? {
                                    pathname: "/branch/view",
                                    state: { branch: role.branch._id }
                                } : "#"}>
                                    {role.branch ? text.reFormat(role.branch.name) : translate("n/a")}
                                </Link>
                            </td>
                            : null
                    }
                    <td data-label={translate("description")}>{role.description}</td>
                    <td data-label={translate("permissions")} className="center">{role.permissions.length}</td>
                    {
                        can("edit_role") || can("view_role")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("edit_role") && role.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/role/form",
                                                    state: { role: role._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_role")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/role/view",
                                                    state: { role: role._id }
                                                }}
                                                type="info"
                                                icon="visibility"
                                                tooltip="view"
                                            />
                                            : null
                                    }
                                </div>
                            </td>
                            : null
                    }
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.ids, application.state.roles])

    const renderFilter = React.useCallback(() => {
        return (
            <Filter
                sort={application.state.sort}
                order={application.state.order}
                limit={application.state.limit}
                filter={application.filterData}
                limits={application.state.limits}
                condition={application.state.condition}
                sorts={application.getSortOrCondition("sort")}
                conditions={application.getSortOrCondition("condition")}
            />
        )
        // eslint-disable-next-line
    }, [
        application.state.sort,
        application.state.order,
        application.state.limit,
        application.state.limits,
        application.state.condition,
    ])

    // component view
    return (
        <>
            {renderFilter()}
            <div className="card list">
                <Search
                    refresh={onMount}
                    select={application.selectList}
                    onClick={application.searchData}
                    value={application.state.searchKeyword}
                    onChange={application.handleInputChange}
                >
                    {
                        (application.state.ids.length >= 1) && (can("restore_deleted") || can("delete_role"))
                            ?
                            <>
                                {
                                    can("delete_role") && (application.state.condition !== "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="error"
                                            icon="delete"
                                            tooltip="delete"
                                            onClick={() => application.openDialog("deleted")}
                                        />
                                        : null
                                }
                                {
                                    can("restore_deleted") && (application.state.condition === "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="warning"
                                            icon="restore_from_trash"
                                            tooltip="restore"
                                            onClick={() => application.openDialog("restored")}
                                        />
                                        : null
                                }
                            </>
                            : null
                    }
                </Search>
                <div className="card-content">
                    <table>
                        <thead>
                            <tr onClick={() => application.selectList()}>
                                {
                                    can("delete_role") || can("restore_deleted")
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state.roles.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null
                                }
                                <th>#</th>
                                <th className="sticky">{translate("name")}</th>
                                {
                                    isAdmin
                                        ?
                                        <th>{translate("branch")}</th>
                                        : null
                                }
                                <th>{translate("description")}</th>
                                <th className="center">{translate("permissions")}</th>
                                {
                                    can("edit_role") || can("view_role")
                                        ? <th className="center sticky-right">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderList()}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    paginate={application.paginateData}
                    currentPage={application.state.page}
                    nextPage={application.state.nextPage}
                    pageNumbers={application.state.pageNumbers}
                    previousPage={application.state.previousPage}
                />
            </div>
            {
                can("create_role")
                    ? <FloatingButton to="/role/form" tooltip="new role" icon="add_circle" />
                    : null
            }
        </>
    )


})

// export component
export default RoleList