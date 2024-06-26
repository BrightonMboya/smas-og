// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../../components/button"
import { Checkbox } from "../../../components/form"
import Pagination from "../../../components/pagination"
import Search from "../../../components/search"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { routerProps } from "../../../types"
import { ApplicationContext } from "../../../context"
import { number } from "fast-web-kit"
import ListComponentFilter from "../../../components/reusable/list-component-filter"

// route list memorized functional component
const RouteList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        // checking user permission
        if (can("list_route")) {
            onMount()
            setPageTitle("routes")
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
            let initialCondition: object = commonCondition()

            // checking if condition has been passed from other components
            if (props.location.state) {
                const { propsCondition }: any = props.location.state
                if (propsCondition) {
                    initialCondition = { ...initialCondition, ...propsCondition }
                    application.dispatch({ propsCondition })
                }
            }

            // request parameter, condition and sort
            const sort: string = JSON.stringify({ createdAt: -1 })
            const condition: string = JSON.stringify(initialCondition)
            const select: object = { from: 1, visible: 1, to: 1, distance: 1, cost: 1 }
            const joinForeignKeys: boolean = false
            const parameters: string = `schema=route&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            application.mount({
                route: `${apiV1}list`,
                select,
                joinForeignKeys,
                fields: ["from", "to", "description"],
                condition: "routes",
                sort: "created time",
                order: -1,
                parameters,
                schema: "route",
                collection: "routes"
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderList = React.useCallback(() => {
        try {
            return application.state.routes.map((data: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(data._id)}>
                    {
                        can("delete_route") || can("restore_deleted")
                            ? <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(data._id)}
                                    checked={application.state.ids.indexOf(data._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("from")}>{text.reFormat(data.from)}</td>
                    <td data-label={translate("to")}>{text.reFormat(data.to)}</td>
                    <td data-label={translate("distance")} className="right-align text-success">{number.format(data.distance)}km</td>
                    <td data-label={translate("cost")} className="right-align text-primary">{number.format(data.cost)}</td>
                    {
                        can("edit_route") || can("view_route")
                            ?
                            <td className="">
                                <div className="action-button">
                                    {
                                        can("edit_route") && data.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/route/form",
                                                    state: { route: data._id }
                                                }}
                                                icon="edit_note"
                                                type="primary"
                                                position="left"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_route")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/route/view",
                                                    state: { route: data._id }
                                                }}
                                                icon="visibility"
                                                type="info"
                                                position="left"
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
    }, [application.state.routes, application.state.ids])

    return (
        <>
            <ListComponentFilter />
            <div className="card list">
                <Search
                    onChange={application.handleInputChange}
                    onClick={application.searchData}
                    value={application.state.searchKeyword}
                    refresh={onMount}
                    select={application.selectList}
                >
                    {
                        application.state.ids.length > 0 && (can("delete_route") || can("restore_deleted"))
                            ?
                            <>
                                {
                                    can("delete_route") && (application.state.condition !== "deleted")
                                        ?
                                        <ActionButton
                                            icon="delete"
                                            to="#"
                                            type="error"
                                            tooltip={`Delete`}
                                            position="left"
                                            onClick={() => application.openDialog("deleted")}
                                        />
                                        : null

                                }

                                {
                                    can("restore_deleted") && (application.state.condition === "deleted")
                                        ?
                                        <ActionButton
                                            icon="restore_from_trash"
                                            to="#"
                                            type="primary"
                                            tooltip={`Restore`}
                                            position="left"
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
                                    can("delete_route") || can("restore_deleted")
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state[application.state.collection]?.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null

                                }
                                <th>#</th>
                                <th>{translate("from")}</th>
                                <th>{translate("to")}</th>
                                <th className="right-align">{translate("distance")}</th>
                                <th className="right-align">{translate("cost")}</th>
                                {
                                    can("edit_route") || (can("view_route"))
                                        ? <th className="center">{translate("options")}</th>
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
                can("create_route")
                    ?
                    <FloatingButton
                        tooltip="new route"
                        to="/route/form"
                    />
                    : null
            }
        </>
    )
})

export default RouteList