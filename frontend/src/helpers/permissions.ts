// dependencies
import { isAdmin, user } from "."

export type permissionName =
    "view_dashboard_menu" | "view_dashboard" | "list_activity" | "do_stock_taking" | "view_profit" | "view_discount" | "restore_deleted" |
    "view_product_menu" | "view_product" | "create_product" | "edit_product" | "list_product" | "delete_product" | "view_category" | "create_category" | "edit_category" | "list_category" | "delete_category" |
    "view_expense_menu" | "view_expense" | "create_expense" | "edit_expense" | "list_expense" | "delete_expense" |
    "view_sale_menu" | "view_sale" | "create_sale" | "list_sale" | "delete_sale" |
    "view_expense_type" | "create_expense_type" | "edit_expense_type" | "list_expense_type" | "delete_expense_type" |
    "view_purchase_menu" | "view_purchase" | "create_purchase" | "edit_purchase" | "list_purchase" | "delete_purchase" |
    "view_customer_menu" | "view_customer" | "create_customer" | "edit_customer" | "list_customer" | "delete_customer" |
    "view_debt_menu" | "view_debt" | "create_debt" | "edit_debt" | "list_debt" | "delete_debt" |
    "view_role_menu" | "view_role" | "create_role" | "edit_role" | "list_role" | "delete_role" |
    "view_user_menu" | "view_user" | "create_user" | "edit_user" | "list_user" | "delete_user" |
    "view_message_menu" | "create_message" | "list_message" |
    "view_branch_menu" | "view_branch" | "create_branch" | "edit_branch" | "list_branch" | "delete_branch" |
    "view_account_menu" | "view_account" | "create_account" | "edit_account" | "list_account" | "delete_account" | "view_account_balance" | "view_account_dashboard" | "disable_account" | "enable_account" |
    "view_transaction_menu" | "view_transaction" | "create_transaction" | "edit_transaction" | "list_transaction" | "delete_transaction" |
    "view_payment_menu" | "view_payment" | "create_payment" | "edit_payment" | "list_payment" | "delete_payment" |
    "view_store_menu" | "view_store" | "create_store" | "edit_store" | "list_store" | "delete_store" |
    "view_store_product" | "create_store_product" | "edit_store_product" | "list_store_product" | "delete_store_product" |
    "view_order" | "create_order" | "list_order" | "delete_order" |
    "view_proforma_invoice" | "create_proforma_invoice" | "list_proforma_invoice" | "delete_proforma_invoice" |
    "create_report" | "view_income_statement" | "view_report_statistics" | "view_report_menu" |
    "list_stock_adjustment" | "adjust_stock" | "create_debt_payment" | "view_debt_history" | "list_debt_history" | "delete_debt_history" | "switch_branch" | "print_report" | "view_deleted_data_report" | "list_deleted" | "cancel_payment" | "view_buying_price" | "view_stock" | "adjust_stock" | "view_stock_adjustment" | "view_loss" | "change_branch_settings" | "download_report" | "view_branch_data" | "list_stolen_product" | "view_selling_price" |
    "view_supplier_menu" | "view_supplier" | "create_supplier" | "edit_supplier" | "list_supplier" | "delete_supplier" |
    "view_truck_menu" | "view_truck" | "create_truck" | "edit_truck" | "list_truck" | "delete_truck" |
    "view_truck_order_menu" | "view_truck_order" | "create_truck_order" | "edit_truck_order" | "list_truck_order" | "delete_truck_order" |
    "view_route_menu" | "view_route" | "create_route" | "edit_route" | "list_route" | "delete_route" |
    "view_device_menu" | "view_device" | "create_device" | "edit_device" | "list_device" | "delete_device" |
    "view_service_menu" | "view_service" | "create_service" | "list_service" | "delete_service" | "reset_branch" | "change_user_branch_access" |
    "view_freight_menu" | "view_freight" | "create_freight" | "edit_freight" | "list_freight" | "delete_freight" | "adjust_selling_price" | "back_date_sale" |
    "view_hotel_menu" | "view_hotel" | "create_hotel" | "edit_hotel" | "list_hotel" | "delete_hotel" |
    "view_attraction_menu" | "view_attraction" | "create_attraction" | "edit_attraction" | "list_attraction" | "delete_attraction" |
    "view_item_menu" | "view_item" | "create_item" | "edit_item" | "list_item" | "delete_item" |
    "view_quotation_menu" | "view_quotation" | "create_quotation" | "edit_quotation" | "list_quotation" | "delete_quotation" |
    "view_quotation_invoice_menu" | "view_quotation_invoice" | "create_quotation_invoice" | "edit_quotation_invoice" | "list_quotation_invoice" | "delete_quotation_invoice" | "list_customer_count" | "list_stock" | "view_truck_on_expense" | "view_quotation_on_expense" | "view_reference_on_sale" | "view_discount_on_report" | "change_user_store_access" | "download_branch_data"


// type
export type permission = {
    module: string
    permissions: permissionName[]
}

//permissions
export const permissions: permission[] = [
    {
        module: "debt_history",
        permissions: ["view_debt_history", "create_debt_payment", "delete_debt_history", "list_debt_history"]
    },

    {
        module: "proforma_invoice",
        permissions: ["view_proforma_invoice", "create_proforma_invoice", "delete_proforma_invoice", "list_proforma_invoice"]
    },

    {
        module: "store_product",
        permissions: ["view_store_product", "create_store_product", "edit_store_product", "delete_store_product", "list_store_product"]
    },

    {
        module: "order",
        permissions: ["view_order", "create_order", "list_order", "delete_order"]
    },

    {
        module: "store",
        permissions: ["view_store_menu", "view_store", "create_store", "edit_store", "delete_store", "list_store"]
    },

    {
        module: "freight",
        permissions: ["view_freight_menu", "view_freight", "create_freight", "edit_freight", "delete_freight", "list_freight"]
    },

    {
        module: "debt",
        permissions: ["view_debt_menu", "view_debt", "create_debt", "edit_debt", "delete_debt", "list_debt"]
    },
    {
        module: "role",
        permissions: ["view_role_menu", "view_role", "create_role", "edit_role", "delete_role", "list_role"]
    },
    {
        module: "device",
        permissions: ["view_device_menu", "view_device", "create_device", "edit_device", "delete_device", "list_device"]
    },
    {
        module: "hotel",
        permissions: ["view_hotel_menu", "view_hotel", "create_hotel", "edit_hotel", "delete_hotel", "list_hotel"]
    },
    {
        module: "quotation",
        permissions: ["view_quotation_menu", "view_quotation", "create_quotation", "edit_quotation", "delete_quotation", "list_quotation"]
    },
    {
        module: "quotation_invoice",
        permissions: ["view_quotation_invoice_menu", "view_quotation_invoice", "create_quotation_invoice", "edit_quotation_invoice", "delete_quotation_invoice", "list_quotation_invoice", "view_quotation_on_expense"]
    },
    {
        module: "attraction",
        permissions: ["view_attraction_menu", "view_attraction", "create_attraction", "edit_attraction", "delete_attraction", "list_attraction"]
    },
    {
        module: "item",
        permissions: ["view_item_menu", "view_item", "create_item", "edit_item", "delete_item", "list_item"]
    },
    {
        module: "service",
        permissions: ["view_service_menu", "view_service", "create_service", "delete_service", "list_service"]
    },
    {
        module: "customer",
        permissions: ["view_customer_menu", "view_customer", "create_customer", "edit_customer", "delete_customer", "list_customer", "list_customer_count"]
    },
    {
        module: "category",
        permissions: ["view_category", "create_category", "edit_category", "delete_category", "list_category"]
    },
    {
        module: "purchase",
        permissions: ["view_purchase_menu", "view_purchase", "create_purchase", "edit_purchase", "delete_purchase", "list_purchase"]
    },

    {
        module: "truck",
        permissions: ["view_truck_menu", "view_truck", "create_truck", "edit_truck", "delete_truck", "list_truck", "view_truck_on_expense"]
    },

    {
        module: "route",
        permissions: ["view_route_menu", "view_route", "create_route", "edit_route", "delete_route", "list_route"]
    },

    {
        module: "truck_order",
        permissions: ["view_truck_order_menu", "view_truck_order", "create_truck_order", "edit_truck_order", "delete_truck_order", "list_truck_order"]
    },

    {
        module: "supplier",
        permissions: ["view_supplier_menu", "view_supplier", "create_supplier", "edit_supplier", "delete_supplier", "list_supplier"]
    },

    {
        module: "sale",
        permissions: ["view_sale_menu", "view_sale", "create_sale", "delete_sale", "list_sale", "view_profit", "view_discount", "view_loss", "adjust_selling_price", "back_date_sale", "view_reference_on_sale"]
    },

    {
        module: "product",
        permissions: ["view_product_menu", "view_product", "create_product", "edit_product", "delete_product", "list_product", "view_buying_price", "list_stolen_product", "view_selling_price"]
    },

    {
        module: "stock",
        permissions: ["adjust_stock", "list_stock_adjustment", "view_stock_adjustment", "view_stock", "do_stock_taking", "list_stock"]
    },

    {
        module: "expense",
        permissions: ["view_expense_menu", "view_expense", "create_expense", "edit_expense", "delete_expense", "list_expense"]
    },

    {
        module: "account",
        permissions: ["view_account_menu", "view_account", "create_account", "edit_account", "delete_account", "list_account", "view_account_balance", "view_account_dashboard", "disable_account", "enable_account"]
    },

    {
        module: "transaction",
        permissions: ["view_transaction_menu", "view_transaction", "create_transaction", "edit_transaction", "delete_transaction", "list_transaction"]
    },

    {
        module: "expense_type",
        permissions: ["view_expense_type", "create_expense_type", "edit_expense_type", "delete_expense_type", "list_expense_type"]
    },

    {
        module: "user",
        permissions: ["view_user_menu", "view_user", "create_user", "edit_user", "delete_user", "list_user", "change_user_branch_access", "change_user_store_access"]
    },

    {
        module: "dashboard",
        permissions: [
            "view_dashboard_menu", "view_dashboard"
        ]
    },

    {
        module: "message",
        permissions: [
            "view_message_menu", "create_message", "list_message"
        ]
    },

    {
        module: "report",
        permissions: [
            "view_report_menu", "create_report", "view_report_statistics", "print_report", "view_deleted_data_report", "view_income_statement", "download_report", "view_discount_on_report"
        ]
    },

    {
        module: "general",
        permissions: [
            "restore_deleted", "list_deleted",
        ]
    },
    {
        module: "branch",
        permissions: ["view_branch_menu", "view_branch", "create_branch", "edit_branch", "delete_branch", "list_branch", "switch_branch", "list_activity", "change_branch_settings", "view_branch_data", "reset_branch", "download_branch_data"]
    },
    {
        module: "payment",
        permissions: ["view_payment_menu", "view_payment", "create_payment", "cancel_payment", "list_payment"]
    }
]

/* function for checking user permission */
export function can(permission: permissionName): boolean {
    try {

        if (isAdmin && user) {
            if (user.role === null)
                return true
            else if (user.role.permissions.includes(permission))
                return true
            return false
        }
        else if (user && user.role.permissions.includes(permission))
            return true
        return false

    } catch (error) {
        console.log((error as Error).message)
        return false
    }
}

// get all permissions in array of string
export const getPermissions = (): string[] => {
    try {

        const allPermissions: string[] = []

        for (const module of permissions)
            for (const permission of module.permissions)
                allPermissions.push(permission)

        return allPermissions

    } catch (error) {
        console.log(`getting all permissions error ${(error as Error).message}`)
        return []
    }
}