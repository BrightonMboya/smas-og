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

const SupplierList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {

        if (can("list_supplier")) {
            setPageTitle("suppliers")
            onMount()
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

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
            const order: 1 | -1 = 1
            const sort: string = JSON.stringify({ name: order })
            const select: object = { name: order, phone_number: order, location: order, tin: order, visible: order, address: order }
            const joinForeignKeys: boolean = false
            const parameters: string = `schema=supplier&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "suppliers",
                sort: "name",
                order,
                schema: "supplier",
                collection: "suppliers",
                select,
                joinForeignKeys,
                fields: ["name", "phone_number", "tin", "address.location", "address.region", "address.street"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const rendersuppliers = React.useCallback(() => {
        try {
            return application.state.suppliers.map((data: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(data._id)}>
                    {
                        can("delete_supplier") || can("restore_deleted")
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(data._id)}
                                    checked={application.state.ids.indexOf(data._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")} className="sticky bold">{text.reFormat(data.name)}</td>
                    <td data-label={translate("phone number")} className="center">{data.phone_number}</td>
                    {
                        can("edit_supplier") || can("view_supplier") || can("create_order") || can("create_proforma_invoice")
                            ?
                            <td>
                                <div className="action-button">
                                    {
                                        can("edit_supplier") && data.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/supplier/form",
                                                    state: { supplier: data._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                tooltip="edit"
                                                position="left"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_supplier")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/supplier/view",
                                                    state: { supplier: data._id }
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
    }, [application.state.suppliers, application.state.ids])

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
                    onChange={application.handleInputChange}
                    onClick={application.searchData}
                    value={application.state.searchKeyword}
                    refresh={onMount}
                    select={application.selectList}
                >
                    {
                        (application.state.ids.length > 0) && (can("delete_supplier") || can("restore_deleted"))
                            ?
                            <>
                                {
                                    can("delete_supplier") && (application.state.condition !== "deleted")
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
                                    can("delete_supplier") && (application.state.condition === "deleted")
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
                                    can("delete_supplier") || can("restore_deleted")
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state.suppliers.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null
                                }
                                <th>#</th>
                                <th className="sticky">{translate("name")}</th>
                                <th className="center">{translate("phone number")}</th>
                                {
                                    can("edit_supplier") || can("view_supplier")
                                        ?
                                        <th className="center">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {rendersuppliers()}
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
                can("create_supplier")
                    ?
                    <FloatingButton
                        to="/supplier/form"
                        tooltip="new supplier"
                        icon="add_circle"
                    />
                    : null
            }
        </>
    )

})

export default SupplierList