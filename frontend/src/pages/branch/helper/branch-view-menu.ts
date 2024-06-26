import { array } from "fast-web-kit";
import { moduleMenuOnView } from "../../../types";
import { can } from "../../../helpers/permissions";

const branchMenuView: moduleMenuOnView[] = [

    {
        link: "/",
        name: "dashboard",
        visible: can("view_dashboard")
    },

    // hotel listing
    {
        name: "list hotels",
        link: "/hotel/list",
        visible: can("list_hotel")
    },

    // attraction listing
    {
        name: "list attractions",
        link: "/attraction/list",
        visible: can("list_attraction")
    },

    // attraction item listing
    {
        name: "list attraction items",
        link: "/attraction/item-list",
        visible: can("list_item")
    },

    // quotation listing
    {
        name: "list quotations",
        link: "/quotation/list",
        visible: can("list_quotation")
    },

    // quotation_invoice listing
    {
        name: "list quotation invoices",
        link: "/quotation/invoice-list",
        visible: can("list_quotation_invoice")
    },

    // truck listing
    {
        name: "list trucks",
        link: "/truck/list",
        visible: can("list_truck")
    },

    // truck route listing
    {
        name: "list truck routes",
        link: "/truck/route-list",
        visible: can("list_route")
    },

    // truck order listing
    {
        name: "list truck orders",
        link: "/truck/order-list",
        visible: can("list_order")
    },

    // product listing
    {
        name: "list products",
        link: "/product/list",
        visible: can("list_product")
    },

    // product adjustment listing
    {
        name: "list adjustments",
        link: "/product/adjustment-list",
        visible: can("list_stock_adjustment")
    },

    // product stock taking
    {
        name: "stock taking",
        link: "/product/stock-taking",
        visible: can("do_stock_taking")
    },

    // sale listing
    {
        name: "list sales",
        link: "/sale/list",
        visible: can("list_sale")
    },

    // order listing
    {
        name: "list orders",
        link: "/sale/order-list",
        visible: can("list_order")
    },

    // proforma invoice listing
    {
        name: "list proforma_invoices",
        link: "/sale/proforma-invoice-list",
        visible: can("list_proforma_invoice")
    },

    // expense listing
    {
        name: "list expenses",
        link: "/expense/list",
        visible: can("list_expense")
    },

    // expense_type listing
    {
        name: "list expense types",
        link: "/expense/type-list",
        visible: can("list_expense_type")
    },

    // purchase listing
    {
        name: "list purchases",
        link: "/purchase/list",
        visible: can("list_purchase")
    },

    // purchase supplier listing
    {
        name: "list suppliers",
        visible: can("list_supplier"),
        link: "/purchase/supplier-list",
    },

    // freight listing
    {
        name: "list freights",
        link: "/freight/list",
        visible: can("list_freight")
    },

    // customer listing
    {
        name: "list customers",
        link: "/customer/list",
        visible: can("list_customer")
    },

    // device listing
    {
        name: "list devices",
        link: "/device/list",
        visible: can("list_device")
    },

    // service listing
    {
        name: "list services",
        link: "/service/list",
        visible: can("list_service")
    },

    // debt listing
    {
        name: "list debts",
        link: "/debt/list",
        visible: can("list_debt")
    },

    // debt history listing
    {
        name: "list debt histories",
        link: "/debt/history-list",
        visible: can("list_debt_history")
    },

    // transaction listing
    {
        name: "list transactions",
        link: "/transaction/list",
        visible: can("list_transaction")
    },

    // transaction account listing
    {
        name: "list accounts",
        visible: can("list_account"),
        link: "/transaction/account-list",
    },

    // new report
    {
        name: "new report",
        link: "/report/form",
        visible: can("create_report")
    },

    // income statement
    {
        name: "income statement",
        link: "/report/income-statement",
        visible: can("view_income_statement")
    },

    // role listing
    {
        name: "list roles",
        link: "/role/list",
        visible: can("list_role")
    },

    // new user
    {
        name: "new user",
        link: "/user/form",
        visible: can("create_user")
    },

    // user listing
    {
        name: "list users",
        link: "/user/list",
        visible: can("list_user")
    },

    // new payment
    {
        name: "new payment",
        link: "/payment/form",
        visible: can("create_payment")
    },

    // payment listing
    {
        name: "list payments",
        link: "/payment/list",
        visible: can("list_payment")
    },

    // branch data
    {
        name: "total data",
        link: "/branch/data",
        visible: can("view_branch_data")
    },

    // branch data
    {
        name: "settings",
        link: "/branch/settings",
        visible: can("change_branch_settings")
    },

    // branch listing
    {
        name: "list activities",
        link: "/branch/activity-list",
        visible: can("list_activity")
    },

    // new store
    {
        name: "new store",
        link: "/store/form",
        visible: can("create_store")
    },

    // store listing
    {
        name: "list stores",
        link: "/store/list",
        visible: can("list_store")
    },

    // store product listing
    {
        name: "list store products",
        link: "/store/product-list",
        visible: can("list_store_product")
    },

    // store adjustment listing
    {
        name: "list store adjustments",
        link: "/store/adjustment-list",
        visible: can("list_stock_adjustment")
    },

    {
        name: "list store purchases",
        link: "/store/purchase-list",
        visible: can("list_purchase")
    },

]

export default array.sort(branchMenuView, "asc", "name")