// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../components/button"
import { Checkbox } from "../../components/form"
import Search from "../../components/search"
import { apiV1, commonCondition, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { routerProps } from "../../types"
import Pagination from "../../components/pagination"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { ApplicationContext } from "../../context"
import { number } from "fast-web-kit"
import ListComponentFilter from "../../components/reusable/list-component-filter"

// freight list memorized functional component
const FreightList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("list_freight")) {
            setPageTitle("freights")
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
            const select: object = {
                name: 1,
                date: 1,
                visible: 1,
                paid_amount: 1,
                total_amount: 1,
            }
            const joinForeignKeys: boolean = false
            const parameters: string = `schema=freight&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            application.mount({
                route: `${apiV1}list`,
                select,
                joinForeignKeys,
                fields: ["name", "description", "reference"],
                condition: "freights",
                sort: "time created",
                order: -1,
                parameters,
                schema: "freight",
                collection: "freights"
            })


        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderfreights = React.useCallback(() => {
        try {
            return application.state.freights.map((data: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(data._id)}>
                    {
                        can("delete_freight") || can("restore_deleted")
                            ? <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(data._id)}
                                    checked={application.state.ids.indexOf(data._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#"> {index + 1}</td>
                    <td data-label={translate("name")} className="sticky bold"> {text.reFormat(data.name)}</td>
                    <td data-label={translate("total amount")} className="right-align text-success">
                        {number.format(data.total_amount)}
                    </td>
                    <td data-label={translate("paid amount")} className="right-align text-primary">
                        {number.format(data.paid_amount)}
                    </td>
                    <td data-label={translate("remain amount")} className="right-align text-error">
                        {number.format(data.total_amount - data.paid_amount)}
                    </td>
                    <td data-label={translate("date")} className="center">
                        {getDate(data.date)}
                    </td>
                    {
                        can("edit_freight") || can("view_freight")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("edit_freight") && data.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/freight/form",
                                                    state: { freight: data._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                position="left"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_freight")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/freight/view",
                                                    state: { freight: data._id }
                                                }}
                                                type="info"
                                                icon="visibility"
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
    }, [application.state.freights, application.state.ids])

    // component view
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
                        application.state.ids.length > 0 && (can("delete_freight") || can("restore_deleted"))
                            ?
                            <>
                                {
                                    can("delete_freight") && (application.state.condition !== "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="error"
                                            icon="delete"
                                            tooltip="delete"
                                            position="left"
                                            onClick={() => application.openDialog("deleted")}
                                        />
                                        : null
                                }
                                {
                                    can("restore_deleted") && (application.state.condition === "deleted")
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
                                    (can("delete_freight") || can("restore_deleted"))
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
                                <th className="sticky">{translate("name")}</th>
                                <th className="right-align">{translate("total amount")}</th>
                                <th className="right-align">{translate("paid amount")}</th>
                                <th className="right-align">{translate("remain amount")}</th>
                                <th className="center">{translate("date")}</th>
                                {
                                    can("edit_freight") || can("view_freight")
                                        ?
                                        <th className="center sticky-right">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderfreights()}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3}>
                                    <span className="text-primary uppercase bold">
                                        {translate("total")}
                                    </span>
                                </td>
                                <td className="right-align" data-label={translate("total amount")}>
                                    <span className="text-success bold">
                                        {
                                            number.format(
                                                application.state.freights
                                                    .map((freight: any) => freight.total_amount)
                                                    .reduce((a: number, b: number) => a + b, 0)
                                            )
                                        }
                                    </span>
                                </td>
                                <td className="right-align" data-label={translate("paid amount")}>
                                    <span className="text-primary bold">
                                        {
                                            number.format(
                                                application.state.freights
                                                    .map((freight: any) => freight.paid_amount)
                                                    .reduce((a: number, b: number) => a + b, 0)
                                            )
                                        }
                                    </span>
                                </td>
                                <td className="right-align" data-label={translate("remain amount")}>
                                    <span className="text-error bold">
                                        {
                                            number.format(
                                                application.state.freights
                                                    .map((freight: any) => freight.total_amount - freight.paid_amount)
                                                    .reduce((a: number, b: number) => a + b, 0)
                                            )
                                        }
                                    </span>
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
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
                can("create_freight")
                    ?
                    <FloatingButton
                        to="/freight/form"
                        tooltip="new freight"
                    />
                    : null
            }
        </>
    )

})

// export component
export default FreightList