// dependencies
import { moduleMenuOnView } from "../../../types"
import { can } from "../../../helpers/permissions"

/*
customer related module
1. quotation
2. quotation invoice
3. truck order
4. sale
5. order
6. profoma invoice
7. device
8. message
9. report
11. service

*/

// customer menu on view
const customerMenuView: moduleMenuOnView[] = [

     // new account
     {
        name: "new account",
        visible: can("create_account"),
        link: "/transaction/account-form",
    },

    // listing account
    {
        name: "list accounts",
        visible: can("list_account"),
        link: "/transaction/account-list",
    },

    // new quotation
    {
        name: "new quotation",
        link: "/quotation/form",
        visible: can("create_quotation")
    },

    // listing quotation
    {
        name: "list quotations",
        link: "/quotation/list",
        visible: can("list_quotation")
    },

    // new quotation invoice
    {
        name: "new quotation invoice",
        link: "/quotation/invoice-form",
        visible: can("create_quotation_invoice")
    },

    // listing quotation invoice
    {
        name: "list quotation invoices",
        link: "/quotation/invoice-list",
        visible: can("list_quotation_invoice")
    },

    // new truck invoice
    {
        name: "new truck order",
        link: "/truck/order-form",
        visible: can("create_truck_order")
    },

    // listing truck order
    {
        name: "list truck orders",
        link: "/truck/order-list",
        visible: can("list_truck_order")
    },

    // new sale
    {
        name: "new sale",
        link: "/sale/form",
        visible: can("create_sale")
    },

    // listing sale
    {
        name: "list sales",
        link: "/sale/list",
        visible: can("list_sale")
    },

    // new order
    {
        name: "new order",
        link: "/sale/order-form",
        visible: can("create_order")
    },

    // listing order
    {
        name: "list orders",
        link: "/sale/order-list",
        visible: can("list_order")
    },

    // new order
    {
        name: "new proforma invoice",
        link: "/sale/proforma-invoice-form",
        visible: can("create_proforma_invoice")
    },

    // listing proforma_invoice
    {
        name: "list proforma_invoices",
        link: "/sale/proforma-invoice-list",
        visible: can("list_proforma_invoice")
    },

    // new device
    {
        name: "new device",
        link: "/device/form",
        visible: can("create_device")
    },

    // listing device
    {
        name: "list devices",
        link: "/device/list",
        visible: can("list_device")
    },

    // new service
    {
        name: "new service",
        link: "/service/form",
        visible: can("create_service")
    },

    // listing service
    {
        name: "list services",
        link: "/service/list",
        visible: can("list_service")
    },

    // new message
    {
        name: "new message",
        link: "/message/form",
        visible: can("create_message")
    },

    // new report
    {
        name: "new report",
        link: "/report/form",
        visible: can("create_report")
    },

    // new debt
    {
        name: "new debt",
        link: "/debt/form",
        visible: can("create_debt")
    },

    // listing debt
    {
        name: "list debts",
        link: "/debt/list",
        visible: can("list_debt")
    },

    // listing debt history
    {
        name: "list debt histories",
        link: "/debt/history-list",
        visible: can("list_debt_history")
    },
]

// exporting customer menu
export default customerMenuView