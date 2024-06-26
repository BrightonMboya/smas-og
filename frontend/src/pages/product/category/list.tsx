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
import ListComponentFilter from "../../../components/reusable/list-component-filter"

// category list memorized functional component
const CategoryList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        // checking user permission
        if (can("list_category")) {
            onMount()
            setPageTitle("categories")
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
            const joinForeignKeys: boolean = false
            const sort: string = JSON.stringify({ name: 1 })
            const select: object = { name: 1, type: 1, visible: 1 }
            const condition: string = JSON.stringify(initialCondition)
            const parameters: string = `schema=category&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            application.mount({
                route: `${apiV1}list`,
                select,
                joinForeignKeys,
                fields: ["name"],
                condition: "categories",
                sort: "name",
                order: 1,
                parameters,
                schema: "category",
                collection: "categories"
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderCategories = React.useCallback(() => {
        try {
            return application.state.categories.map((data: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(data._id)}>
                    {
                        can("delete_category") || can("restore_deleted")
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
                    <td data-label={translate("name")} className="bold">{text.reFormat(data.name)}</td>
                    {
                        can("edit_category") || can("view_category")
                            ?
                            <td>
                                <div className="action-button">
                                    {
                                        can("edit_category") && data.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/product/category-form",
                                                    state: { category: data._id }
                                                }}
                                                icon="edit_note"
                                                type="primary"
                                                position="left"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_category")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/product/category-view",
                                                    state: { category: data._id }
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
    }, [application.state.categories, application.state.ids])

    return (
        <>
            <ListComponentFilter />
            <div className="card list">
                <Search
                    refresh={onMount}
                    select={application.selectList}
                    onClick={application.searchData}
                    onChange={application.handleInputChange}
                    value={application.state.searchKeyword}
                >
                    {
                        application.state.ids.length > 0 && (can("delete_category") || can("restore_deleted"))
                            ?
                            <>
                                {
                                    can("delete_category") && (application.state.condition !== "deleted")
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
                                    can("delete_category") || can("restore_deleted")
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
                                <th className="">{translate("name")}</th>
                                {
                                    can("edit_category") || (can("view_category"))
                                        ? <th className="center">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderCategories()}
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
                can("create_category")
                    ?
                    <FloatingButton
                        to="/product/category-form"
                        tooltip="new category"
                    />
                    : null
            }
        </>
    )
})

export default CategoryList