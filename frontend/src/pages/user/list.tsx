// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../components/button"
import Filter from "../../components/filter"
// import { Checkbox } from "../../components/form"
import Pagination from "../../components/pagination"
import Search from "../../components/search"
import { apiV1, commonCondition, isAdmin, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { routerProps } from "../../types"
import { ApplicationContext } from "../../context"
import { Link } from "react-router-dom"

// user list memorized functinal component
const UserList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // check access
        if (can("list_user")) {
            setPageTitle("users")
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
            const select: object = { created_by: 0, updated_by: 0, createdAt: 0, updatedAt: 0, password: 0, __v: 0 }
            const joinForeignKeys: boolean = true
            const parameters: string = `schema=user&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "users",
                sort: "createdAt",
                order,
                schema: "user",
                collection: "users",
                select,
                joinForeignKeys,
                fields: ["username", "phone_number", "account_type"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // render list
    const renderList = React.useCallback(() => {
        try {
            return application.state.users.map((user: any, index: number) => (
                <tr key={user._id} /* onClick={() => application.selectList(user._id)} */>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")} className="sticky bold">{text.reFormat(user.username)}</td>
                    {
                        isAdmin
                            ?
                            <td data-label={translate("branch")}>
                                <Link to={can("view_branch") && user.branch ? {
                                    pathname: "/branch/view",
                                    state: { branch: user.branch._id }
                                } : "#"}>
                                    {user.branch ? text.reFormat(user.branch.name) : translate("n/a")}
                                </Link>
                            </td>
                            : null
                    }
                    <td data-label={translate("role")}>
                        <Link to={can("view_role") && isAdmin && user.role ? {
                            pathname: "/role/view",
                            state: { role: user.role._id }
                        } : "#"}>
                            {text.reFormat(user.role?.name)}
                        </Link>
                    </td>
                    <td data-label={translate("account type")} className="center">{translate(user.account_type === "user" ? "owner" : user.account_type)}</td>
                    <td data-label={translate("phone number")} className="center">
                        <a href={`tel:+255${user.phone_number.substring(1)}`} className="text-primary">
                            {user.phone_number}
                        </a>
                    </td>
                    <td data-label={translate("verified")} className="center">
                        <span className={`${user.phone_number_verified ? "text-primary" : "text-error"}`}>
                            {translate(user.phone_number_verified ? "yes" : "no")}
                        </span>
                    </td>
                    <td data-label={translate("secured")} className="center">
                        <span className={`${user.two_factor_authentication_enabled ? "text-success" : "text-error"}`}>
                            {translate(user.two_factor_authentication_enabled ? "yes" : "no")}
                        </span>
                    </td>
                    {
                        application.state.onlineUsers.includes(user._id.toString())
                            ?
                            <td data-label={translate("status")} className="center">
                                <span className={`badge primary`}>
                                    <i className="material-icons-round blink">online_prediction</i>
                                    {translate("online")}
                                </span>
                            </td>
                            :
                            <td data-label={translate("status")} className="center">
                                <span className={`badge ${user.visible ? "success" : "error"}`}>
                                    {translate(!user.visible ? "deleted" : "active")}
                                </span>
                            </td>
                    }
                    {
                        can("edit_user") || can("view_user")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("edit_user") && user.visible && (user._id !== application.user._id)
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/user/form",
                                                    state: { user: user._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_user")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/user/view",
                                                    state: { user: user._id }
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
    }, [application.state.ids, application.state.users, application.state.onlineUsers])

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
                </Search>
                <div className="card-content">
                    <table>
                        <thead>
                            <tr onClick={() => application.selectList()}>
                                <th>#</th>
                                <th className="sticky">{translate("name")}</th>
                                {
                                    isAdmin
                                        ?
                                        <th>{translate("branch")}</th>
                                        : null
                                }
                                <th>{translate("role")}</th>
                                <th className="center">{translate("account type")}</th>
                                <th className="center">{translate("phone number")}</th>
                                <th className="center">{translate("verified")}</th>
                                <th className="center">{translate("secured")}</th>
                                <th className="center">{translate("status")}</th>
                                {
                                    can("edit_user") || can("view_user")
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
                can("create_user")
                    ? <FloatingButton to="/user/form" tooltip="new user" icon="add_circle" />
                    : null
            }
        </>
    )

})

// export component
export default UserList