import React from "react"
import { routerProps } from "../../../types"
import { ApplicationContext } from "../../../context"
import { can } from "../../../helpers/permissions"
import { ActionButton, FloatingButton } from "../../../components/button"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import Filter from "../../../components/filter"
import Search from "../../../components/search"
import Pagination from "../../../components/pagination"
import translate from "../../../helpers/translator"
import { Checkbox } from "../../../components/form"
import { array, number } from "fast-web-kit"
import TripComponent from "./components/trip"
import PrintQuotation from "./components/print"

const QuotationList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            if (can("list_quotation")) {

                setPageTitle("quotations")
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

                const order = 1
                const joinForeignKeys: boolean = true
                const sort: string = JSON.stringify({ createdAt: -1 })
                const condition: string = JSON.stringify(initialCondition)
                const select: object = { customer: 1, number: 1, total_amount: 1, trips: 1, visible: 1, profit: 1, createdAt: 1 }
                const parameters: string = `schema=quotation&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

                application.mount({
                    order,
                    select,
                    parameters,
                    joinForeignKeys,
                    sort: "created Time",
                    schema: "quotation",
                    route: `${apiV1}list`,
                    condition: "quotations",
                    collection: "quotations",
                    fields: ["number", "trips"]
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

    const handleTripSelect = (quotationId: string): void => {
        try {
            const quotationExist = application.state.quotations.filter((quotation: any) => quotation._id === quotationId)[0]
            if (quotationExist) {
                application.toggleComponent("modal")
                application.dispatch({ trips: quotationExist.trips })
            }
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderList = React.useCallback(() => {
        try {
            return application.state.quotations.map((quotation: any, index: number) => (
                <tr key={index} /* onClick={() => application.selectList(quotation._id)} */>
                    {
                        can("delete_quotation") || can("restore_deleted")
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(quotation._id)}
                                    checked={application.state.ids.indexOf(quotation._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">{index + 1}</td>
                    <td className="bold sticky" data-label={translate("customer")}>
                        {text.reFormat(quotation.customer.name)}
                    </td>
                    <td className="right-align" data-label={translate("number")}>
                        {quotation.number}
                    </td>
                    <td className="right-align text-primary" data-label={translate("total amount")}>
                        {number.format(quotation.total_amount)}
                    </td>
                    {
                        can("view_profit")
                            ?
                            <td className="right-align text-success" data-label={translate("profit")}>
                                {number.format(quotation.profit)}
                            </td>
                            : null
                    }
                    <td className="center" data-label={translate("trips")}>
                        <span className="badge primary" onClick={() => handleTripSelect(quotation._id)}>
                            {array.getLength(quotation.trips)}
                        </span>
                    </td>
                    <td className="center sticky-right">
                        <div className="action-button">

                            <ActionButton
                                to="#"
                                type="success"
                                icon="print"
                                tooltip="print"
                                position="left"
                                onClick={() => {
                                    application.dispatch({ quotation })
                                    setTimeout(() => window.print(), 1000)
                                }}
                            />
                            {
                                can("edit_quotation") && quotation.visible
                                    ?
                                    <ActionButton
                                        to={{
                                            pathname: "/quotation/form",
                                            state: { quotation: quotation._id }
                                        }}
                                        type="primary"
                                        icon="edit_note"
                                        tooltip="edit"
                                        position="left"
                                    />
                                    : null
                            }
                            {
                                can("view_quotation")
                                    ?
                                    <ActionButton
                                        to={{
                                            pathname: "/quotation/view",
                                            state: { quotation: quotation._id }
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
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.ids, application.state.quotations])

    return (
        <>
            <div className="hide-on-print">
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
                            (application.state.ids.length > 0) && (can("delete_quotation") || can("restore_deleted"))
                                ?
                                <>
                                    {
                                        can("delete_quotation") && (application.state.condition !== "deleted")
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
                                        can("delete_quotation") && (application.state.condition === "deleted")
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
                                        can("delete_quotation") || can("restore_deleted")
                                            ?
                                            <th>
                                                <Checkbox
                                                    onChange={() => application.selectList()}
                                                    checked={(application.state.ids.length > 0) && (application.state.quotations.length === application.state.ids.length)}
                                                    onTable
                                                />
                                            </th>
                                            : null
                                    }
                                    <th>#</th>
                                    <th className="sticky">{translate("customer")}</th>
                                    <th className="right-align">{translate("number")}</th>
                                    <th className="right-align">{translate("total amount")}</th>
                                    {
                                        can("view_profit")
                                            ?
                                            <th className="right-align">{translate("profit")}</th>
                                            : null
                                    }
                                    <th className="center">{translate("trips")}</th>
                                    <th className="center sticky-right">{translate("options")}</th>
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
                <TripComponent />
            </div>
            {
                can("create_quotation")
                    ?
                    <FloatingButton
                        to="/quotation/form"
                        tooltip="create quotation"
                    />
                    : null
            }
            {
                application.state.quotation
                    ?
                    <PrintQuotation data={application.state.quotation} type="quotation" />
                    : null
            }
        </>
    )
})

export default QuotationList