import { array } from "fast-web-kit";
import { can } from "../../../../helpers/permissions";
import { moduleMenuOnView } from "../../../../types";

const accountViewMenu: moduleMenuOnView[] = [

    // transaction
    {
        name: "new transaction",
        link: "/transaction-form",
        visible: can("create_transaction")
    },
    {
        name: "list transactions",
        link: "/transaction/list",
        visible: can("list_transaction")
    },

    // expense listing
    {
        name: "list expenses",
        link: "/expense/list",
        visible: can("list_expense")
    },

    // purchase listing
    {
        name: "list purchases",
        link: "/purchase/list",
        visible: can("list_purchase")
    },

    // debt listing
    {
        name: "list debt histories",
        link: "/debt/history-list",
        visible: can("list_debt_history")
    },

    // expense listing
    {
        name: "list expenses",
        link: "/expense/list",
        visible: can("list_expense")
    },

    // quotation invoice listing
    {
        name: "list quotation invoices",
        link: "/quotation/invoice-list",
        visible: can("list_quotation_invoice")
    },

]

export default array.sort(accountViewMenu, "asc", "name")