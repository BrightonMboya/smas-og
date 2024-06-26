// dependencies
import React from "react"
import { array, number } from "fast-web-kit"
import { getDate, getTon, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { ApplicationContext } from "../../../context"

type componentList = {
    data: any[]
}

type general = {
    cashSales: number
    creditSales: number
    customerPaidDebts: number
    customerUnpaidDebts: number
    revenue: number
    purchaseCost: number
    cogs: number
    grossProfit: number
    totalPayments: number
    paidExpenses: number
    unpaidExpenses: number
    shopPaidDebts: number
    shopUnpaidDebts: number
    totalExpenses: number
    netIncome: number
    paidOrders: number
    unpaidOrders: number
    paidCargos: number
    unpaidCargos: number
    completedServices: number
    incompleteServices: number
    paidFreights: number
    unpaidFreights: number
    paidInvoice: number
    unpaidInvoice: number
    discount: number
}

export const General: React.FunctionComponent<general> = React.memo((props: general) => (
    <>

        <table>
            {
                props.revenue !== 0
                    ?
                    <caption className="text-success bold">{translate("Revenue")}</caption>
                    : null
            }
            <tbody>

                {
                    props.paidOrders !== 0
                        ?
                        <tr>
                            <td>{translate("paid truck Orders")}</td>
                            <td className="right-align semibold">{number.format(props.paidOrders)}</td>
                        </tr>
                        : null
                }
                {
                    props.unpaidOrders !== 0
                        ?
                        <tr>
                            <td>{translate("unpaid truck Orders")}</td>
                            <td className="right-align semibold">{number.format(props.unpaidOrders)}</td>
                        </tr>
                        : null
                }
                {
                    props.paidCargos !== 0
                        ?
                        <tr>
                            <td>{translate("paid Cargos")}</td>
                            <td className="right-align semibold">{number.format(props.paidCargos)}</td>
                        </tr>
                        : null
                }
                {
                    props.unpaidCargos !== 0
                        ?
                        <tr>
                            <td>{translate("unpaid Cargos")}</td>
                            <td className="right-align semibold">{number.format(props.unpaidCargos)}</td>
                        </tr>
                        : null
                }
                {
                    props.cashSales !== 0
                        ?
                        <tr>
                            <td>{translate("cash sales")}</td>
                            <td className="right-align semibold">{number.format(props.cashSales)}</td>
                        </tr>
                        : null
                }
                {
                    props.creditSales !== 0
                        ?
                        <tr>
                            <td>{translate("credit sales")}</td>
                            <td className="right-align semibold">{number.format(props.creditSales)}</td>
                        </tr>
                        : null
                }
                {
                    props.completedServices !== 0
                        ?
                        <tr>
                            <td>{translate("completed services")}</td>
                            <td className="right-align semibold">{number.format(props.completedServices)}</td>
                        </tr>
                        : null
                }
                {
                    props.incompleteServices !== 0
                        ?
                        <tr>
                            <td>{translate("incomplete services")}</td>
                            <td className="right-align semibold">{number.format(props.incompleteServices)}</td>
                        </tr>
                        : null
                }
                {
                props.paidInvoice !== 0
                        ?
                        <tr>
                            <td>{translate("paid quotation invoice")}</td>
                            <td className="right-align semibold">{number.format(props.paidInvoice)}</td>
                        </tr>
                        : null
                }
                {
                    props.unpaidInvoice !== 0
                        ?
                        <tr>
                            <td>{translate("unpaid quotation invoice")}</td>
                            <td className="right-align semibold">{number.format(props.unpaidInvoice)}</td>
                        </tr>
                        : null
                }
                {
                    (props.customerPaidDebts) !== 0
                        ?
                        <tr>
                            <td>{translate("customer paid debts")}</td>
                            <td className="right-align semibold">{number.format(props.customerPaidDebts)}</td>
                        </tr>
                        : null
                }
                {
                    props.customerUnpaidDebts !== 0
                        ?
                        <tr>
                            <td>{translate("customer unpaid debts")}</td>
                            <td className="right-align semibold">{number.format(props.customerUnpaidDebts)}</td>
                        </tr>
                        : null
                }
                {
                    props.revenue !== 0
                        ?
                        <tr>
                            <td className="text-success bold">{translate("total revenue")}</td>
                            <td className="right-align text-success bold">{number.format(props.revenue)}</td>
                        </tr>
                        : null
                }
            </tbody>
        </table>

        <table>
            {
                props.cogs !== 0
                    ?
                    <caption className="text-warning bold">{translate("cost of good sold")}</caption>
                    : null
            }
            <tbody>
                {
                    props.purchaseCost !== 0
                        ?
                        <tr>
                            <td>{translate("cost of goods sold")}</td>
                            <td className="right-align semibold">{number.format(props.purchaseCost)}</td>
                        </tr>
                        : null
                }
                {
                    props.paidFreights !== 0
                        ?
                        <tr>
                            <td>{translate("paid freights")}</td>
                            <td className="right-align semibold">{number.format(props.paidFreights)}</td>
                        </tr>
                        : null
                }
                {
                    props.unpaidFreights !== 0
                        ?
                        <tr>
                            <td>{translate("unpaid freights")}</td>
                            <td className="right-align semibold">{number.format(props.unpaidFreights)}</td>
                        </tr>
                        : null
                }
                {
                    props.cogs !== 0
                        ?
                        <tr>
                            <td className="text-warning bold">{translate("total cost of goods sold")}</td>
                            <td className="right-align text-warning bold">{number.format(props.cogs)}</td>
                        </tr>
                        : null
                }
                <tr>
                    <td>{translate("gross profit")}</td>
                    <td className="right-align semibold">{number.format(props.grossProfit)}</td>
                </tr>
            </tbody>
        </table>

        <table>
            {
                props.totalExpenses !== 0
                    ?
                    <caption className="text-error bold">{translate("Expense")}</caption>
                    : null
            }
            <tbody>

                {
                    props.paidExpenses !== 0
                        ?
                        <tr>
                            <td>{translate("paid expenses")}</td>
                            <td className="right-align semibold">{number.format(props.paidExpenses)}</td>
                        </tr>
                        : null
                }
                {
                    props.unpaidExpenses !== 0
                        ?
                        <tr>
                            <td>{translate("unpaid expenses")}</td>
                            <td className="right-align semibold">{number.format(props.unpaidExpenses)}</td>
                        </tr>
                        : null
                }
                 {
                    props.discount !== 0 && can("view_discount_on_report")
                        ?
                        <tr>
                            <td>{translate("sale discount")}</td>
                            <td className="right-align semibold">{number.format(props.discount)}</td>
                        </tr>
                        : null
                }
                {
                    props.shopPaidDebts !== 0
                        ?
                        <tr>
                            <td>{translate("shop paid debts")}</td>
                            <td className="right-align semibold">{number.format(props.shopPaidDebts)}</td>
                        </tr>
                        : null
                }
                {
                    props.shopUnpaidDebts !== 0
                        ?
                        <tr>
                            <td>{translate("shop unpaid debts")}</td>
                            <td className="right-align semibold">{number.format(props.shopUnpaidDebts)}</td>
                        </tr>
                        : null
                }
                {
                    props.totalPayments !== 0
                        ?
                        <tr>
                            <td>{translate("system payments")}</td>
                            <td className="right-align semibold">{number.format(props.totalPayments)}</td>
                        </tr>
                        : null
                }
                {
                    props.totalExpenses !== 0
                        ?
                        <tr>
                            <td className="text-error bold">{translate("total expenses")}</td>
                            <td className="right-align text-error bold">{number.format(props.totalExpenses)}</td>
                        </tr>
                        : null
                }
                <tr>
                    <td>{translate("net income")}</td>
                    <td className="right-align semibold">{number.format(props.netIncome)}</td>
                </tr>
            </tbody>
        </table>
    </>
))

// adjustment component
export const Adjustment: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    const renderList = React.useCallback(() => {
        try {
            return props.data.map((data: any, index: number) => (
                <tr key={index} >
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("product")} className="bold">{text.reFormat(data.product)}&nbsp;{data.category ? `(${text.reFormat(data.category)})` : null}</td>
                    <td data-label={translate("before adjustment")} className="right-align bold">
                        {number.format(data.before_adjustment)}
                    </td>
                    <td data-label={translate("adjustment")} className={`right-align bold text-${data.type === "increase" ? "success" : "error"}`}>
                        {data.type === "increase" ? "+ " : "- "}{number.format(data.adjustment)}
                    </td>
                    <td data-label={translate("after adjustment")} className="right-align text-primary bold">
                        {number.format(data.after_adjustment)}
                    </td>
                    <td data-label={translate("cause")}>
                        {
                            translate(data?.cause === "sale_cart" ? "POS" :
                                data?.cause === "sale" ? "Sale" :
                                    data?.cause === "service" ? "Service" :
                                        data?.cause === "purchase" ? "Purchase" :
                                            data.description.includes("sale") ? "Sale" :
                                                data.description.includes("service") ? "Service" : "Purchase")
                        }
                    </td>
                    <td className="center" data-label="type">
                        <span className={`capitalized text-${data.type === "increase" ? "success" : "error"}`}>
                            {data.type === "increase" ? "Increased" : "Decreased"}
                        </span>
                    </td>
                    <td data-label={translate("description")}>{data.description}</td>
                    <td className="center" data-label={translate("date")}>{getDate(data.date)}</td>
                </tr>
            ))
        } catch (error) {
            console.log(`Adjustment rendering error: ${(error as Error).message}`)
        }
        // eslint-disable-next-line
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    {/* <th>{translate("user")}</th> */}
                    <th>{translate("product")}</th>
                    <th className="right-align">{translate("before adjustment")}</th>
                    <th className="right-align">{translate("adjustment")}</th>
                    <th className="right-align">{translate("after adjustment")}</th>
                    <th>{translate("cause")}</th>
                    <th className="center">{translate("status")}</th>
                    <th>{translate("description")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
        </table>
    )

})

// debt history component
export const DebtHistory: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    const renderList = React.useCallback(() => {
        try {
            return props.data.map((data: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("debtor / creditor")} className="bold">
                        {text.reFormat(data.customer || data.expense || data.supplier || "Purchase")}
                    </td>
                    <td data-label={translate("debt")} className="right-align text-error">
                        {number.format(data.debt)}
                    </td>
                    <td data-label={translate("paid amount")} className="right-align text-success">
                        {number.format(data.total_amount)}
                    </td>
                    <td data-label={translate("type")} className={`center text-${data.type === "debtor" ? "primary" : "error"}`}>
                        {text.reFormat(data.type)}
                    </td>
                    {/* <td data-label={translate("user")}>{text.reFormat(data.created_by.username)}</td> */}
                    <td className="center" data-label={translate("date")}>{getDate(data.date)}</td>
                </tr>
            ))
        } catch (error) {
            console.log(`Debt history rendering error: ${(error as Error).message}`)
        }
        // eslint-disable-next-line
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("debtor / creditor")}</th>
                    <th className="right-align">{translate("debt")}</th>
                    <th className="right-align">{translate("paid amount")}</th>
                    <th className="center">{translate("type")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={3} className="bold uppercase text-primary">{translate("total")}</td>
                    <td className="right-align bold text-primary">
                        {
                            number.format(
                                props.data.map((data: any) => data.total_amount).reduce((a: number, b: number) => a + b, 0)
                            )
                        }
                    </td>
                    <td colSpan={2}></td>
                </tr>
            </tfoot>
        </table>
    )

})

// debt component
export const Debt: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    const renderList = React.useCallback(() => {
        try {
            return props.data.map((data: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("debtor / creditor")} className="bold">
                        {text.reFormat(data.customer || data.expense || data.supplier || "Purchase")}
                    </td>
                    <td data-label={translate("amount")} className="right-align text-success">
                        {number.format(data.total_amount)}
                    </td>
                    <td data-label={translate("paid amount")} className="right-align text-primary">
                        {number.format(data.paid_amount)}
                    </td>
                    <td data-label={translate("remain amount")} className="right-align text-error">
                        {number.format(data.remain_amount)}
                    </td>
                    <td data-label={translate("type")} className={`center text-${data.type === "debtor" ? "primary" : "error"}`}>
                        {text.reFormat(data.type)}
                    </td>
                    <td className="center" data-label={translate("date")}>
                        {getDate(data.date)}
                    </td>
                </tr>
            ))
        } catch (error) {
            console.log(`Debt rendering error: ${(error as Error).message}`)
        }
        // eslint-disable-next-line
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("debtor / creditor")}</th>
                    <th className="right-align">{translate("amount")}</th>
                    <th className="right-align">{translate("paid amount")}</th>
                    <th className="right-align">{translate("remain amount")}</th>
                    <th className="center">{translate("type")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={2}>
                        <span className="text-primary uppercase bold">
                            {translate(" total")}
                        </span>
                    </td>
                    <td className="right-align">
                        <span className="text-success bold">
                            {
                                number.format(
                                    props.data
                                        .map((debt: any) => debt.total_amount)
                                        .reduce((a: number, b: number) => a + b, 0)
                                )
                            }
                        </span>
                    </td>
                    <td className="right-align">
                        <span className="text-primary bold">
                            {
                                number.format(
                                    props.data
                                        .map((debt: any) => debt.paid_amount)
                                        .reduce((a: number, b: number) => a + b, 0)
                                )
                            }
                        </span>
                    </td>
                    <td className="right-align">
                        <span className="text-error bold">
                            {
                                number.format(
                                    props.data
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
    )

})

// expense component
export const Expense: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    const renderList = React.useCallback(() => {
        try {
            return props.data.map((data: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")} className="bold">
                        {text.reFormat(data.name)}
                    </td>
                    <td data-label={translate("amount")} className="right-align text-success">
                        {number.format(data.total_amount)}
                    </td>
                    <td data-label={translate("paid amount")} className="right-align text-primary">
                        {number.format(data.paid_amount)}
                    </td>
                    <td data-label={translate("remain amount")} className="right-align text-error">
                        {number.format(data.remain_amount)}
                    </td>
                    <td className="center" data-label={translate("date")}>
                        {getDate(data.date)}
                    </td>
                </tr>
            ))
        } catch (error) {
            console.log(`Debt rendering error: ${(error as Error).message}`)
        }
        // eslint-disable-next-line
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("name")}</th>
                    <th className="right-align">{translate("amount")}</th>
                    <th className="right-align">{translate("paid amount")}</th>
                    <th className="right-align">{translate("remain amount")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={2}>
                        <span className="text-primary uppercase bold">
                            {translate(" total")}
                        </span>
                    </td>
                    <td className="right-align">
                        <span className="text-success bold">
                            {
                                number.format(
                                    props.data
                                        .map((expense: any) => expense.total_amount)
                                        .reduce((a: number, b: number) => a + b, 0)
                                )
                            }
                        </span>
                    </td>
                    <td className="right-align">
                        <span className="text-primary bold">
                            {
                                number.format(
                                    props.data
                                        .map((expense: any) => expense.paid_amount)
                                        .reduce((a: number, b: number) => a + b, 0)
                                )
                            }
                        </span>
                    </td>
                    <td className="right-align">
                        <span className="text-error bold">
                            {
                                number.format(
                                    props.data
                                        .map((expense: any) => expense.total_amount - expense.paid_amount)
                                        .reduce((a: number, b: number) => a + b, 0)
                                )
                            }
                        </span>
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    )

})

// order component
export const Order: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    const renderList = React.useCallback(() => {
        try {
            return props.data.map((data: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("customer")} className="bold">{text.reFormat(data.customer)}</td>
                    <td className="right-align" data-label={translate("number")}>{data.number}</td>
                    <td className="right-align" data-label={translate("products")}>{number.format(data.length)}</td>
                    <td className="right-align text-primary" data-label={translate("amount")}>
                        {number.format(data.total_amount)}
                    </td>
                    <td className="center" data-label={translate("date")}>{getDate(data.date)}</td>
                </tr>
            ))
        } catch (error) {
            console.log(`Order rendering error: ${(error as Error).message}`)
        }
        // eslint-disable-next-line
    }, [props.data])
    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("customer")}</th>
                    <th className="right-align">{translate("number")}</th>
                    <th className="right-align">{translate("products")}</th>
                    <th className="right-align">{translate("amount")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td className="text-primary bold" colSpan={4}>
                        {translate("total")}
                    </td>
                    <td className="right-align text-primary bold">
                        {
                            number.format(
                                array.computeMathOperation(props.data.map((order: any) => order.total_amount), "+")
                            )
                        }
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    )

})

// payment component
export const Payment: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    const renderList = React.useCallback(() => {
        try {
            return props.data.map((data: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("branch")} className="bold">{text.reFormat(data.branch)}</td>
                    <td data-label={translate("type")}>{text.reFormat(data.type)}</td>
                    <td data-label={translate("amount")} className="right-align text-primary">{number.format(data.total_amount)}</td>
                    <td data-label={translate("date")} className="center">{getDate(data.date)}</td>
                </tr>
            ))
        } catch (error) {
            console.log(`Payment rendering error: ${(error as Error).message}`)
        }
        // eslint-disable-next-line
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("branch")}</th>
                    <th>{translate("type")}</th>
                    <th className="right-align">{translate("amount")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={3} className="bold uppercase text-primary">
                        {translate("total")}
                    </td>
                    <td className="right-align bold text-primary">
                        {number.format(
                            props.data.map((data: any) => data.total_amount).reduce((a: number, b: number) => a + b, 0)
                        )}
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    )

})

// purchase component
export const Purchase: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    const { application } = React.useContext(ApplicationContext)

    const renderList = React.useCallback(() => {
        try {
            return props.data.map((data: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("product")} className="bold">
                        {text.reFormat(data.product)}&nbsp;{data.category ? `(${text.reFormat(data.category)})` : null}
                    </td>
                    {
                        application.user.branch && application.user.branch?.type === "energy_supplies"
                        ?
                        <td data-label={translate("ton")} className="right-align">
                            {number.format(getTon(data.product, data.quantity))}
                        </td>
                        : null
                    }
                    <td data-label={translate("quantity")} className="right-align">
                        {number.format(data.quantity)}
                    </td>
                    <td data-label={translate("total amount")} className="right-align text-success">
                        {number.format(data.total_amount)}
                    </td>
                    <td data-label={translate("paid amount")} className="right-align text-primary">
                        {number.format(data.paid_amount)}
                    </td>
                    <td data-label={translate("remain amount")} className="right-align text-error">
                        {number.format(data.remain_amount)}
                    </td>
                    <td className="center" data-label={translate("date")}>
                        {getDate(data.date)}
                    </td>
                </tr>
            ))
        } catch (error) {
            console.log(`Debt rendering error: ${(error as Error).message}`)
        }
        // eslint-disable-next-line
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("product")}</th>
                    {
                                    application.user.branch && application.user.branch?.type === "energy_supplies"
                                        ?
                                        <th className="right-align">
                                            {translate("ton")}
                                        </th>
                                        : null
                                }
                    <th className="right-align">{translate("quantity")}</th>
                    <th className="right-align">{translate("total amount")}</th>
                    <th className="right-align">{translate("paid amount")}</th>
                    <th className="right-align">{translate("remain amount")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={2}>
                        <span className="text-primary uppercase bold">
                            {translate(" total")}
                        </span>
                    </td>
                    {
                        application.user.branch && application.user.branch?.type === "energy_supplies"
                            ?
                            <td className="right-align bold ">
                                0
                            </td>
                            : null
                    }
                    <td className="right-align">
                        <span className=" bold">
                            {
                                number.format(
                                    props.data
                                        .map((purchase: any) => purchase.quantity)
                                        .reduce((a: number, b: number) => a + b, 0)
                                )
                            }
                        </span>
                    </td>
                    <td className="right-align">
                        <span className="text-success bold">
                            {
                                number.format(
                                    props.data
                                        .map((purchase: any) => purchase.total_amount)
                                        .reduce((a: number, b: number) => a + b, 0)
                                )
                            }
                        </span>
                    </td>
                    <td className="right-align">
                        <span className="text-primary bold">
                            {
                                number.format(
                                    props.data
                                        .map((purchase: any) => purchase.paid_amount)
                                        .reduce((a: number, b: number) => a + b, 0)
                                )
                            }
                        </span>
                    </td>
                    <td className="right-align">
                        <span className="text-error bold">
                            {
                                number.format(
                                    props.data
                                        .map((purchase: any) => purchase.remain_amount)
                                        .reduce((a: number, b: number) => a + b, 0)
                                )
                            }
                        </span>
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    )

})

// sale component
export const Sale: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    const { application } = React.useContext(ApplicationContext)

    const renderList = React.useCallback(() => {
        try {
            return props.data.map((sale: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("product")} className="bold">{text.reFormat(sale.product)}&nbsp;{sale.category ? `(${text.reFormat(sale.category)})` : null}</td>
                    {
                        application.user.branch && application.user.branch?.type === "energy_supplies"
                        ?
                        <td data-label={translate("ton")} className="right-align">
                            {number.format(getTon(sale.product, sale.quantity))}
                        </td>
                        : null
                    }
                    <td data-label={translate("quantity")} className="right-align">{number.format(sale.quantity)}</td>
                    <td data-label={translate("total amount")} className="right-align text-primary">{number.format(sale.total_amount)}</td>
                    {
                        can("view_profit")
                            ?
                            <td data-label={translate("profit")} className="right-align text-success">
                                {
                                    number.format(
                                        sale.profit >= 0 ? sale.profit : 0
                                    )
                                }
                            </td>
                            : null
                    }
                    {
                        can("view_discount")
                            ? <td data-label={translate("discount")} className="right-align text-warning">
                                {
                                    number.format(
                                        sale.discount >= 0 ? sale.discount : 0
                                    )
                                }
                            </td>
                            : null
                    }
                    {
                        can("view_loss")
                            ?
                            <td data-label={translate("loss")} className="right-align text-error">
                                {number.format(sale.loss * -1)}
                            </td>
                            : null
                    }
                    <td className={`center text-${sale.status === "credit" ? "error" : "success"}`} data-label={translate("status")}>
                        {translate(sale.status)}
                    </td>
                    <td className="center" data-label={translate("date")}>{getDate(sale.date)}</td>
                </tr>
            ))
        } catch (error) {
            console.log(`Sales rendering error: ${(error as Error).message}`)
        }
        // eslint-disable-next-line
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("product")}</th>
                    {
                        application.user.branch && application.user.branch?.type === "energy_supplies"
                            ?
                            <th className="right-align">
                                {translate("ton")}
                            </th>
                            : null
                    }
                    <th className="right-align">{translate("quantity")}</th>
                    <th className="right-align">{translate("total amount")}</th>
                    {
                        can("view_profit")
                            ? <th className="right-align">{translate("profit")}</th>
                            : null
                    }
                    {
                        can("view_discount")
                            ? <th className="right-align">{translate("discount")}</th>
                            : null
                    }
                    {
                        can("view_loss")
                            ? <th className="right-align">{translate("loss")}</th>
                            : null
                    }
                    <th className="center">{translate("status")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={2}>
                        <span className="uppercase bold text-primary">
                            {translate("total")}
                        </span>
                    </td>
                    {
                        application.user.branch && application.user.branch?.type === "energy_supplies"
                            ?
                            <td className="right-align bold ">
                                0
                            </td>
                            : null
                    }
                    <td className="right-align bold ">
                        {
                            number.format(
                                props.data
                                    .map((sale: any) => sale.quantity)
                                    .reduce((a: number, b: number) => a + b, 0)
                            )
                        }
                    </td>
                    <td className="right-align bold text-primary">
                        {
                            number.format(
                                props.data
                                    .map((sale: any) => sale.total_amount)
                                    .reduce((a: number, b: number) => a + b, 0)
                            )
                        }
                    </td>
                    {
                        can("view_profit")
                            ?
                            <td className="right-align bold text-success">
                                {
                                    number.format(
                                        props.data
                                            .map((sale: any) => sale.profit)
                                            .reduce((a: number, b: number) => a + b, 0)
                                    )
                                }
                            </td>
                            : null
                    }
                    {
                        can("view_discount")
                            ?
                            <td className="right-align bold text-warning">
                                {
                                    number.format(
                                        props.data
                                            .filter((sale: any) => sale.discount >= 0)
                                            .map((sale: any) => sale.discount)
                                            .reduce((a: number, b: number) => a + b, 0)
                                    )
                                }
                            </td>
                            : null
                    }
                    {
                        can("view_loss")
                            ?
                            <td className="right-align bold text-error">
                                {
                                    number.format(
                                        props.data
                                            .map((sale: any) => sale.loss * -1)
                                            .reduce((a: number, b: number) => a + b, 0)
                                    )
                                }
                            </td>
                            : null
                    }
                    <td colSpan={3}></td>
                </tr>
            </tfoot>
        </table>
    )
})

// customer count report component
export const CustomerCount: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    const renderList = React.useCallback(() => {
        try {
            return props.data.map((data: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("customers")} className="right-align text-primary">{number.format(data.number)}</td>
                    <td className="center" data-label={translate("date")}>
                        {getDate(data.date)}
                    </td>
                </tr>
            ))
        } catch (error) {
            console.log((error as Error).message)
        }
        // eslint-disable-next-line
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th className="right-align">{translate("customers")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td className="uppercase bold text-primary">
                        {translate("total")}
                    </td>
                    <td className="bold text-primary right-align">
                        {number.format(props.data.map((data: any) => data.number).reduce((a: number, b: number) => a + b, 0))}
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    )
})

// stock report component
export const Stocks: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    const renderList = React.useCallback(() => {
        try {
            return props.data.map((stock: any, index: number) => (
                <tr key={index}>
                    <td data-label={translate("#")}>{index + 1}</td>
                    <td data-label={translate("product")} className="bold">{text.reFormat(stock.product)}</td>
                    <td className="right-align text-primary" data-label={translate("stock")}>
                        {number.format(stock.stock)}
                    </td>
                    <td className="center" data-label={translate("date")}>
                        {getDate(stock.date)}
                    </td>
                </tr>
            ))
        } catch (error) {
            console.log(`rendering stock report error ${(error as Error).message}`)
        }
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("product")}</th>
                    <th className="right-align">{translate("stock")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            {/* <tfoot>
                <tr>
                    <td className="uppercase bold text-primary" colSpan={2}>
                        {translate("total")}
                    </td>
                    <td className="right-align text-primary">
                        {
                            number.format(props.data.map((stock) => stock.stock).reduce((a: number, b: number) => a + b, 0))
                        }
                    </td>
                    <td></td>
                </tr>
            </tfoot> */}
        </table>
    )
})

// service report  component
export const Service: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    // render list
    const renderList = React.useCallback(() => {
        try {
            return props.data.map((data: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td>{text.reFormat(data.service)}</td>
                    <td className="right-align" data-label={translate("number")}>{data.number}</td>
                    <td className="text-primary right-align" data-label={translate("service cost")}>{number.format(data.service_cost)}</td>
                    <td className="right-align" data-label={translate("product cost")}>{number.format(data.product_cost)}</td>
                    <td className="right-align text-success" data-label={translate("total cost")}>{number.format(data.total_cost)}</td>
                    <td className={`center text-${data.status === "completed" ? "success" : "primary"}`} data-label={translate("status")}>{translate(data.status)}</td>
                    <td className="center" data-label={translate("date")}>{getDate(data.date)}</td>
                </tr>
            ))
        } catch (error) {
            console.log(`Service report rendering error: ${(error as Error).message}`)
        }
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("service")}</th>
                    <th className="right-align">{translate("number")}</th>
                    <th className="right-align">{translate("service cost")}</th>
                    <th className="right-align">{translate("product cost")}</th>
                    <th className="right-align">{translate("total cost")}</th>
                    <th className="center">{translate("status")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td className="uppercase bold text-primary" colSpan={3}>
                        {translate("total")}
                    </td>
                    <td className="right-align text-primary bold" data-label={translate("service cost")}>
                        {number.format(props.data.map((data: any) => data.service_cost).reduce((a: number, b: number) => a + b, 0))}
                    </td>
                    <td className="right-align bold" data-label={translate("product cost")}>
                        {number.format(props.data.map((data: any) => data.product_cost).reduce((a: number, b: number) => a + b, 0))}
                    </td>
                    <td className="right-align text-success bold" data-label={translate("total cost")}>
                        {number.format(props.data.map((data: any) => data.total_cost).reduce((a: number, b: number) => a + b, 0))}
                    </td>
                    <td></td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    )
})

// cargo report component
export const CargoOrder: React.FunctionComponent<componentList> = React.memo((props: componentList) => {
    const renderList = React.useCallback(() => {
        try {
            return props.data.map((order: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td className="bold" data-label={translate("customer")}>{text.reFormat(order.customer)}</td>
                    <td data-label={translate("order number")} className="right-align">{order.number}</td>
                    <td data-label={translate("route")}>{text.reFormat(order.route)}</td>
                    <td className="right-align text-primary" data-label={translate("cost")}>{number.format(order.total_amount)}</td>
                    <td className="right-align text-success" data-label={translate("paid amount")}>{number.format(order.paid_amount)}</td>
                    <td className="right-align text-error" data-label={translate("remain amount")}>{number.format(order.remain_amount)}</td>
                    <td data-label={translate("status")} className={order.status === "in_transit" ? "text-primary" : "text-success"}>
                        {text.reFormat(order.status)}
                    </td>
                    <td className="center">
                        {getDate(order.date)}
                    </td>
                </tr>
            ))
        } catch (error) {
            console.log((error as Error).message)
        }
        // eslint-disable-next-line
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("customer")}</th>
                    <th className="right-align">{translate("order number")}</th>
                    <th>{translate("route")}</th>
                    <th className="right-align">{translate("cost")}</th>
                    <th className="right-align">{translate("paid amount")}</th>
                    <th className="right-align">{translate("remain amount")}</th>
                    <th>{translate("status")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td className="uppercase text-primary bold" colSpan={4}>
                        {translate("total")}
                    </td>

                    <td className="right-align bold text-primary">
                        {
                            number.format(
                                props.data.map((order) => order.total_amount).reduce((a: number, b: number) => a + b, 0)
                            )
                        }
                    </td>
                    <td className="right-align text-success bold">
                        {
                            number.format(
                                props.data.map((order) => order.paid_amount).reduce((a: number, b: number) => a + b, 0)
                            )
                        }
                    </td>
                    <td className="right-align text-error bold">
                        {
                            number.format(
                                props.data.map((order) => order.remain_amount).reduce((a: number, b: number) => a + b, 0)
                            )
                        }
                    </td>
                    <td></td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    )
})

// truck order report component
export const TruckOrder: React.FunctionComponent<componentList> = React.memo((props: componentList) => {
    const renderList = React.useCallback(() => {
        try {
            return props.data.map((order: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td className="bold" data-label={translate("customer")}>{text.reFormat(order.customer)}</td>
                    <td data-label={translate("order number")} className="right-align">{order.number}</td>
                    <td data-label={translate("route")}>{text.reFormat(order.route)}</td>
                    <td className="right-align text-secondary" data-label={translate("distance")}>{number.format(order.distance)}km</td>
                    <td className="right-align text-primary" data-label={translate("cost")}>{number.format(order.total_amount)}</td>
                    <td className="right-align text-success" data-label={translate("paid amount")}>{number.format(order.paid_amount)}</td>
                    <td className="right-align text-error" data-label={translate("remain amount")}>{number.format(order.remain_amount)}</td>
                    <td className="center">
                        {getDate(order.date)}
                    </td>
                </tr>
            ))
        } catch (error) {
            console.log((error as Error).message)
        }
        // eslint-disable-next-line
    }, [props.data])

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("customer")}</th>
                    <th className="right-align">{translate("order number")}</th>
                    <th>{translate("route")}</th>
                    <th className="right-align">{translate("distance")}</th>
                    <th className="right-align">{translate("cost")}</th>
                    <th className="right-align">{translate("paid amount")}</th>
                    <th className="right-align">{translate("remain amount")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td className="uppercase text-primary bold" colSpan={4}>
                        {translate("total")}
                    </td>
                    <td className="right-align bold text-secondary">
                        {
                            number.format(
                                props.data.map((order) => order.distance).reduce((a: number, b: number) => a + b, 0)
                            )
                        }km
                    </td>
                    <td className="right-align bold text-primary">
                        {
                            number.format(
                                props.data.map((order) => order.total_amount).reduce((a: number, b: number) => a + b, 0)
                            )
                        }
                    </td>
                    <td className="right-align text-success bold">
                        {
                            number.format(
                                props.data.map((order) => order.paid_amount).reduce((a: number, b: number) => a + b, 0)
                            )
                        }
                    </td>
                    <td className="right-align text-error bold">
                        {
                            number.format(
                                props.data.map((order) => order.remain_amount).reduce((a: number, b: number) => a + b, 0)
                            )
                        }
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    )
})

// quotation invpice report component
export const QuotationInvoice: React.FunctionComponent<componentList> = React.memo((props: componentList) => {

    const renderList = React.useCallback(() => {
        try {
            return props.data.map((data: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("customer")} className="bold">{text.reFormat(data.customer)}</td>
                    <td className="right-align" data-label={translate("number")}>{data.number}</td>
                    <td className="right-align text-success" data-label={translate("total amount")}>
                        {number.format(data.total_amount)}
                    </td>
                    <td className="right-align text-primary" data-label={translate("paid amount")}>
                        {number.format(data.paid_amount)}
                    </td>
                    <td className="right-align text-error" data-label={translate("remain amount")}>
                        {number.format(data.remain_amount)}
                    </td>
                    <td className="center" data-label={translate("date")}>{getDate(data.date)}</td>
                </tr>
            ))
        } catch (error) {
            console.log(`Order rendering error: ${(error as Error).message}`)
        }
        // eslint-disable-next-line
    }, [props.data])
    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{translate("customer")}</th>
                    <th className="right-align">{translate("number")}</th>
                    <th className="right-align">{translate("total amount")}</th>
                    <th className="right-align">{translate("paid amount")}</th>
                    <th className="right-align">{translate("remain amount")}</th>
                    <th className="center">{translate("date")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
            <tfoot>
                <tr>
                    <td className="text-primary bold" colSpan={3}>
                        {translate("total")}
                    </td>
                    <td className="right-align text-success bold">
                        {
                            number.format(
                                array.computeMathOperation(props.data.map((order: any) => order.total_amount), "+")
                            )
                        }
                    </td>
                    <td className="right-align text-primary bold">
                        {
                            number.format(
                                array.computeMathOperation(props.data.map((order: any) => order.paid_amount), "+")
                            )
                        }
                    </td>
                    <td className="right-align text-error bold">
                        {
                            number.format(
                                array.computeMathOperation(props.data.map((order: any) => order.remain_amount), "+")
                            )
                        }
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    )

})