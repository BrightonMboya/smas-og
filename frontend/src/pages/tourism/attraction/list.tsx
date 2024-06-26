import React from "react"
import { routerProps } from "../../../types"
import { can } from "../../../helpers/permissions"
import { ActionButton, FloatingButton } from "../../../components/button"
import { ApplicationContext } from "../../../context"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import Search from "../../../components/search"
import translate from "../../../helpers/translator"
import { Checkbox } from "../../../components/form"
import Pagination from "../../../components/pagination"
import ListComponentFilter from "../../../components/reusable/list-component-filter"
import { array, number } from "fast-web-kit"

const AttractionList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            if (can("list_attraction")) {

                setPageTitle("attractions")
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

                const order = 1
                const joinForeignKeys: boolean = false
                const sort: string = JSON.stringify({ name: order })
                const condition: string = JSON.stringify(initialCondition)
                const select: object = { name: order, address: order, visible: order, category: order, hotels: order }
                const parameters: string = `schema=attraction&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

                application.mount({
                    order,
                    select,
                    parameters,
                    sort: "name",
                    joinForeignKeys,
                    schema: "attraction",
                    route: `${apiV1}list`,
                    condition: "attractions",
                    collection: "attractions",
                    fields: ["name", "category", "address.region"]
                })

            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({ notification: noAccess })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderList = React.useCallback(() => {
        try {
            return application.state.attractions.map((attraction: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(attraction._id)} >
                    {
                        can("delete_attraction") || can("restore_deleted")
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(attraction._id)}
                                    checked={application.state.ids.indexOf(attraction._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")} className="bold">{text.reFormat(attraction.name)}</td>
                    <td data-label={translate("category")}>{text.reFormat(attraction.category)}</td>
                    <td data-label={translate("region")}>
                        {text.reFormat(attraction.address?.region)}
                    </td>
                    <td data-label={translate("near by hotels")} className="center">
                        <span className="badge success uppercase">
                            {number.toWord(array.getLength(attraction.hotels))}
                        </span>
                    </td>
                    {
                        can("edit_attraction") || can("view_attraction")
                            ?
                            <td className="center">
                                <div className="action-button">
                                    {
                                        can("edit_attraction") && attraction.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/attraction/form",
                                                    state: { attraction: attraction._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                tooltip="edit"
                                                position="left"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_attraction")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/attraction/view",
                                                    state: { attraction: attraction._id }
                                                }}
                                                type="info"
                                                icon="visibility"
                                                tooltip="view"
                                                position="left"
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
    }, [application.state.attractions, application.state.ids])


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
                        (application.state.ids.length > 0) && (can("delete_attraction") || can("restore_deleted"))
                            ?
                            <>
                                {
                                    can("delete_attraction") && (application.state.condition !== "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="error"
                                            icon="delete"
                                            tooltip="delele"
                                            position="left"
                                            onClick={() => application.openDialog("deleted")}
                                        />
                                        : null
                                }
                                {
                                    can("delete_attraction") && (application.state.condition === "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="primary"
                                            icon="restore_from_trash"
                                            tooltip="restore"
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
                                    can("delete_attraction") || can("restore_deleted")
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state.attractions.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null
                                }
                                <th>#</th>
                                <th>{translate("name")}</th>
                                <th>{translate("category")}</th>
                                <th>{translate("region")}</th>
                                <th className="center">{translate("near by hotels")}</th>
                                {
                                    can("edit_attraction") || can("view_attraction")
                                        ?
                                        <th className="center">{translate("options")}</th>
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
                can("create_attraction")
                    ?
                    <FloatingButton
                        icon="add_circle"
                        to="/attraction/form"
                        tooltip="new attraction"
                    />
                    : null
            }
        </>
    )
})

export default AttractionList