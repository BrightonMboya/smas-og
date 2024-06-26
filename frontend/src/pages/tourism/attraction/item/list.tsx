import React from "react"
import { routerProps } from "../../../../types"
import { can } from "../../../../helpers/permissions"
import { ActionButton, FloatingButton } from "../../../../components/button"
import { ApplicationContext } from "../../../../context"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../../../helpers"
import Search from "../../../../components/search"
import translate from "../../../../helpers/translator"
import { Checkbox } from "../../../../components/form"
import Pagination from "../../../../components/pagination"
import ListComponentFilter from "../../../../components/reusable/list-component-filter"
import { array, number } from "fast-web-kit"
import { itemExportTemplate } from "./helpers"

const ItemList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            if (can("list_item")) {

                setPageTitle("items")
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
                const joinForeignKeys: boolean = true
                const sort: string = JSON.stringify({ name: order })
                const condition: string = JSON.stringify(initialCondition)
                const select: object = { name: order, prices: order, attraction: order, visible: order, branch: 0, created_by: 0, updated_by: 0 }
                const parameters: string = `schema=item&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

                application.mount({
                    order,
                    select,
                    parameters,
                    sort: "name",
                    joinForeignKeys,
                    schema: "item",
                    route: `${apiV1}list`,
                    condition: "items",
                    collection: "items",
                    fields: ["name"]
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
            return application.state.items.map((item: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(item._id)} >
                    {
                        can("delete_item") || can("restore_deleted")
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(item._id)}
                                    checked={application.state.ids.indexOf(item._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label={"#"}>{index + 1}</td>
                    <td data-label={translate("name")} className="sticky bold">{text.reFormat(item.name)}</td>
                    <td data-label={translate("attraction")}>{text.reFormat(item.attraction?.name)}</td>
                    <td className="right-align text-success" data-label={translate("expatriate price")}>{number.format(item.prices.expatriate)}</td>
                    <td className="right-align text-primary" data-label={translate("non resident price")}>{number.format(item.prices.non_resident)}</td>
                    <td className="right-align text-secondary" data-label={translate("east africa price")}>{number.format(item.prices.east_africa)}</td>
                    {
                        can("edit_item") || can("view_item")
                            ?
                            <td className="center sticky-right">
                                <div className="action-button">
                                    {
                                        can("edit_item") && item.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/attraction/item-form",
                                                    state: { item: item._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                tooltip="edit"
                                                position="left"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_item")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/attraction/item-view",
                                                    state: { item: item._id }
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
    }, [application.state.ids, application.state.items])

    const exportToExcel = (): void => {
        try {

            const items = application.state[application.state.collection].filter((data: any) => application.state.ids.some((id: any) => data._id === id))
            application.dispatch({ ids: [] })
            const newItems: itemExportTemplate[] = []

            if (array.getLength(items) > 0) {

                for (const item of items) {
                    newItems.push({
                        ATTRACTION: text.reFormat(item.attraction.name),
                        NAME: text.reFormat(item.name),
                        EXPATRIATE: item.prices.expatriate,
                        "NON RESIDENT": item.prices.non_resident,
                        "EAST AFRICAN": item.prices.east_africa,
                    })
                }
                application.arrayToExcel(array.sort(newItems, "asc", "ATTRACTION"), "attraction items")
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

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
                        array.getLength(application.state.ids) >= 1
                            ?
                            <ActionButton
                                to="#"
                                type="primary"
                                icon="download"
                                position="left"
                                tooltip="export to excel"
                                onClick={exportToExcel}
                            />
                            : null
                    }
                    {
                        (application.state.ids.length > 0) && (can("delete_item") || can("restore_deleted"))
                            ?
                            <>
                                {
                                    can("delete_item") && (application.state.condition !== "deleted")
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
                                    can("delete_item") && (application.state.condition === "deleted")
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
                                    can("delete_item") || can("restore_deleted")
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state.items.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null
                                }
                                <th>#</th>
                                <th className="sticky">{translate("name")}</th>
                                <th>{translate("attraction")}</th>
                                <th className="right-align">{translate("expatriate price")}</th>
                                <th className="right-align">{translate("non resident price")}</th>
                                <th className="right-align">{translate("east africa price")}</th>
                                {
                                    can("edit_item") || can("view_item")
                                        ?
                                        <th className="center sticky-right">{translate("options")}</th>
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
                can("create_item")
                    ?
                    <FloatingButton
                        icon="add_circle"
                        tooltip="new item"
                        to="/attraction/item-form"
                    />
                    : null
            }
        </>
    )
})

export default ItemList