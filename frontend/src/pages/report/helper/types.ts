// dependencies
import { array } from "fast-web-kit"
import { stateKey } from "../../../types"
import { can } from "../../../helpers/permissions"

type reportType = {
    type: stateKey,
    visible: boolean
}

const reportTypes: reportType[] =
    [
        {
            type: "adjustments",
            visible: can("list_stock_adjustment")
        },
        {
            type: "sales",
            visible: can("list_sale")
        },
        {
            type: "purchases",
            visible: can("list_purchase")
        },
        {
            type: "payments",
            visible: can("list_payment")
        },
        {
            type: "orders",
            visible: can("list_order")
        },
        {
            type: "customer_counts",
            visible: can("list_customer_count")
        },
        {
            type: "stocks",
            visible: can("list_stock")
        },
        {
            type: "services",
            visible: can("list_service")
        },
        {
            type: "freights",
            visible: can("list_freight")
        },
        {
            type: "debts",
            visible: can("list_debt")
        },
        {
            type: "debt_histories",
            visible: can("list_debt_history")
        },
        {
            type: "expenses",
            visible: can("list_expense")
        },
        {
            type: "truck_orders",
            visible: can("list_truck_order")
        },
        {
            type: "quotation_invoices",
            visible: can("list_quotation_invoice")
        },
        {
            type: "transactions",
            visible: can("list_transaction")
        },
    ]

export default array.sort(reportTypes, "asc", "type")