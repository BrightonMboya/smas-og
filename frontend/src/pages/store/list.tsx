// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../components/button"
import Filter from "../../components/filter"
import { Checkbox } from "../../components/form"
import Pagination from "../../components/pagination"
import Search from "../../components/search"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { routerProps } from "../../types"
import { ApplicationContext } from "../../context"
import { Link } from "react-router-dom"

// store list memorized function component
const StoreList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("list_store")) {
            setPageTitle("stores")
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

            // creating initial condition
            let initialCondition: object = commonCondition(true)

            // checking if condition has been passed from other components
            if (props.location.state) {
                const { propsCondition }: any = props.location.state
                if (propsCondition) {
                    initialCondition = { ...initialCondition, ...propsCondition }
                    application.dispatch({ propsCondition })
                }
            }

            const condition: string = JSON.stringify(initialCondition)
            const order = 1
            const sort: string = JSON.stringify({ name: order })
            const select: object = {}
            const joinForeignKeys: boolean = true
            const parameters: string = `schema=store&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "stores",
                sort: "name",
                order,
                schema: "store",
                collection: "stores",
                select,
                joinForeignKeys,
                fields: ["name"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderList = React.useCallback(() => {
        try {

            return application.state.stores.map((store: any, index: number) => (
                <tr key={store._id} onClick={() => application.selectList(store._id)}>
                    {
                        can("delete_store") || can("restore_deleted")
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(store._id)}
                                    checked={application.state.ids.indexOf(store._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label={translate("#")}>{index + 1}</td>
                    <td data-label={translate("name")} className="sticky bold">{text.reFormat(store.name)}</td>
                    <td data-label={translate("branch")}>
                        <Link to={can("view_branch") ? {} : "#"}>
                            {text.reFormat(store.branch.name)}
                        </Link>
                    </td>
                    <td data-label={translate("user")}>
                        <Link to={can("view_user") ? {} : "#"}>
                            {text.reFormat(store.user.username)}
                        </Link>
                    </td>
                    {
                        can("edit_store") || can("view_store")
                            ?
                            <td>
                                <div className="action-button">
                                    {
                                        can("edit_store") && store.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/store/form",
                                                    state: { store: store._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_store")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/store/view",
                                                    state: { store: store._id }
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
    }, [application.state.ids, application.state.stores])

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
                        (application.state.ids.length >= 1) && (can("restore_deleted") || can("delete_store"))
                            ?
                            <>
                                {
                                    can("delete_store") && (application.state.condition !== "deleted")
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
                                    can("delete_store") || can("restore_deleted")
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state.stores.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null
                                }
                                <th> {translate("#")} </th>
                                <th className="sticky"> {translate("name")} </th>
                                <th> {translate("branch")} </th>
                                <th> {translate("user")} </th>
                                {
                                    can("edit_store") || can("view_store")
                                        ?
                                        <th className="center"> {translate("options")} </th>
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
                can("create_store")
                    ? <FloatingButton to="/store/form" tooltip="new store" icon="add_circle" />
                    : null
            }
        </>
    )
})

export default StoreList