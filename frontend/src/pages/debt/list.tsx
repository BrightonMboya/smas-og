// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../components/button"
import Pagination from "../../components/pagination"
import Search from "../../components/search"
import { apiV1, commonCondition, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { routerProps } from "../../types"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { ApplicationContext } from "../../context"
import { number } from "fast-web-kit"
import ListComponentFilter from "../../components/reusable/list-component-filter"

// debt list memorized functional component
const DebtList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application isContext
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("list_debt")) {
            // defining document title
            setPageTitle("debts")
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
            let initialCondition: any = commonCondition(true)

            // checking if condition has been passed from other components
            if (props.location.state) {
                const { propsCondition }: any = props.location.state
                if (propsCondition) {
                    initialCondition = { ...initialCondition, ...propsCondition }
                    application.dispatch({ propsCondition })
                }
            }

            // parameters, sort, condition, select and foreign key
            const order = -1
            const joinForeignKeys: boolean = true
            const sort: string = JSON.stringify({ date: order })
            const select: object = { branch: 0, created_by: 0, updated_by: 0, createdAt: 0, product: 0, updatedAt: 0, __v: 0 }
            const condition: string = JSON.stringify({ ...initialCondition, $expr: { $and: [{ $ne: ["$total_amount", "$paid_amount"] }, initialCondition?.$expr] } })
            const parameters: string = `schema=debt&condition=${condition}&select=${JSON.stringify(select)}&sort=${sort}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            // making api request
            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "unpaid",
                sort: "date",
                order,
                collection: "debts",
                schema: "debt",
                select,
                joinForeignKeys,
                fields: ["description", "type"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering debts
    const renderList = React.useCallback(() => {
        try {
            return application.state.debts.map((data: any, index: number) => (
                <tr key={index}>

                    <td data-label="#">
                        {index + 1}
                    </td>
                    <td data-label={translate("debtor / creditor")} className="sticky">
                        {
                            text.reFormat(
                                data.customer ? data.customer?.name :
                                    data.expense ? data.expense?.name :
                                        data.supplier ? data.supplier?.name : "n/a"
                            )
                        }
                    </td>
                    <td data-label={translate("type")} className="center">
                        {
                        translate(
                            data.sale ? "sale debt" :
                            data.expense ? "expense debt" :
                            data.truck_order ? "truck order debt" :
                            data.purchase || data.supplier ? "supplier debt" :
                            data.quotation_invoice ? "quotation invoice debt" : "customer debt")}&nbsp;-&nbsp;
                        <span className={`semibold text-${data.type === "debtor" ? "primary" : "error"}`}>
                        {translate(data.type)}
                    </span>
                    </td>
                    <td data-label={translate("total amount")} className="right-align text-success">
                        {number.format(data.total_amount)}
                    </td>
                    <td data-label={translate("paid amount")} className="right-align text-primary">
                        {number.format(data.paid_amount)}
                    </td>
                    <td data-label={translate("remain amount")} className="right-align text-error">
                        {number.format(data.total_amount - data.paid_amount)}
                    </td>
                    <td data-label={translate("status")} className="center">
                        <span data-tooltip={data.description} className={`badge
                        ${!data.visible ? "error" : data.status === "paid" ? "success" : "error"}
                        `}>
                            {translate(data.visible ? data.status : "deleted")}
                        </span>
                    </td>
                    <td className="center" data-label={translate("date")}>
                        {getDate(data.date)}
                    </td>
                    {
                        can("edit_debt") || can("view_debt")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("edit_debt") &&
                                            data.visible &&
                                            !data.sale &&
                                            !data.expense &&
                                            !data.truck_order &&
                                            !data.quotation_invoice &&
                                            !data.purchase
                                            ?
                                            <ActionButton
                                                type="primary"
                                                to={{
                                                    pathname: "/debt/form",
                                                    state: { debt: data._id }
                                                }}
                                                tooltip="edit"
                                                icon="edit_note"
                                                position="left"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_debt")
                                            ?
                                            <ActionButton
                                                type="info"
                                                to={{
                                                    pathname: "/debt/view",
                                                    state: { debt: data._id }
                                                }}
                                                tooltip="view"
                                                icon="visibility"
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
    }, [application.state.debts, application.state.ids])


    // component view
    return (
        <>
            <ListComponentFilter />
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
                            <tr>
                                <th>#</th>
                                <th className="sticky">{translate("debtor / creditor")}</th>
                                <th className="center" >{translate("type")}</th>
                                <th className="right-align">{translate("total amount")}</th>
                                <th className="right-align">{translate("paid amount")}</th>
                                <th className="right-align">{translate("remain amount")}</th>
                                <th className="center">{translate("status")}</th>
                                <th className="center">{translate("date")}</th>
                                {
                                    can("edit_debt") || can("view_debt")
                                        ? <th className="center sticky-right">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderList()}
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
                                                application.state.debts
                                                    .map((debt: any) => debt.total_amount)
                                                    .reduce((a: number, b: number) => a + b, 0)
                                            )
                                        }
                                    </span>
                                </td>
                                <td className="right-align" data-label={translate("paid amount")}>
                                    <span className="text-primary bold">
                                        {
                                            number.format(
                                                application.state.debts
                                                    .map((debt: any) => debt.paid_amount)
                                                    .reduce((a: number, b: number) => a + b, 0)
                                            )
                                        }
                                    </span>
                                </td>
                                <td className="right-align" data-label={translate("remain amount")}>
                                    <span className="text-error bold">
                                        {
                                            number.format(
                                                application.state.debts
                                                    .map((debt: any) => debt.total_amount - debt.paid_amount)
                                                    .reduce((a: number, b: number) => a + b, 0)
                                            )
                                        }
                                    </span>
                                </td>
                                <td colSpan={4}></td>
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
                can("create_debt")
                    ?
                    <FloatingButton to="/debt/form" tooltip="new debt" />
                    : null
            }
        </>
    )

})

// exporting component
export default DebtList