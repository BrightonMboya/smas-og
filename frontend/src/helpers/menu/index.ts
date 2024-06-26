import { adminHasSwitched, getInfo, isAdmin, text } from ".."
import { can } from "../permissions"
import { menu } from "../../components/sidebar"
import { object, string } from "fast-web-kit"

// menu
const generalMenu: menu[] = [
    // dashboard menu
    {
        rank: 1,
        title: "Dashboard",
        link: "/dashboard",
        icon: "dashboard",
        visible: can("view_dashboard_menu")
    },

    // expense menu
    {
        rank: 10,
        title: "expense",
        link: "#",
        icon: "money",
        visible: (can("view_expense_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new expense",
                link: "/expense/form",
                visible: can("create_expense")
            },
            {
                title: "list expenses",
                link: "/expense/list",
                visible: can("list_expense")
            },
            {
                title: "new expense type",
                link: "/expense/type-form",
                visible: can("create_expense_type")
            },
            {
                title: "list expense types",
                link: "/expense/type-list",
                visible: can("list_expense_type")
            },
        ]
    },

    // customer menu
    {
        rank: 13,
        title: "customer",
        link: "#",
        icon: "groups",
        visible: (can("view_customer_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new customer",
                link: "/customer/form",
                visible: can("create_customer")
            },
            {
                title: "list customers",
                link: "/customer/list",
                visible: can("list_customer")
            }
        ]
    },
    // debt menu
    {
        rank: 16,
        title: "debt",
        link: "#",
        icon: "request_quote",
        visible: (can("view_debt_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new debt",
                link: "/debt/form",
                visible: can("create_debt")
            },
            {
                title: "list debts",
                link: "/debt/list",
                visible: can("list_debt")
            },
            {
                title: "list debt history",
                link: "/debt/history-list",
                visible: can("list_debt_history")
            }
        ]
    },

    // message menu
    {
        rank: 17,
        title: "message",
        link: "#",
        icon: "sms",
        visible: can("view_message_menu"),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new message",
                link: "/message/form",
                visible: can("create_message")
            },
            {
                title: "list messages",
                link: "/message/list",
                visible: can("list_message")
            }
        ]
    },

    // transaction menu
    {
        rank: 18,
        title: "transaction",
        link: "#",
        icon: "finance_chip",
        visible: ((
            can("view_account_menu") ||
            can("view_transaction_menu")
        ) && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new transaction",
                link: "/transaction/form",
                visible: can("create_transaction")
            },
            {
                title: "list transactions",
                link: "/transaction/list",
                visible: can("list_transaction")
            },
            {
                title: "new account",
                link: "/transaction/account-form",
                visible: can("create_account")
            },
            {
                title: "list accounts",
                link: "/transaction/account-list",
                visible: can("list_account")
            }
        ]
    },

    // report menu
    {
        rank: 19,
        title: "report",
        link: "#",
        icon: "receipt",
        visible: can("view_report_menu"),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new report",
                link: "/report/form",
                visible: can("create_report")
            },
            {
                title: "income statement",
                link: "/report/income-statement",
                visible: can("view_income_statement")
            }
        ]
    },

    // role menu
    {
        rank: 20,
        title: "role",
        link: "#",
        icon: "task",
        visible: can("create_role"),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new role",
                link: "/role/form",
                visible: can("create_role")
            },
            {
                title: "list roles",
                link: "/role/list",
                visible: can("list_role")
            }
        ]
    },

    // user menu
    {
        rank: 21,
        title: "user",
        link: "#",
        icon: "group",
        visible: can("view_user_menu"),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new user",
                link: "/user/form",
                visible: can("create_user")
            },
            {
                title: "list users",
                link: "/user/list",
                visible: can("list_user")
            }
        ]
    },

    // payment menu
    {
        rank: 24,
        title: "payment",
        link: "#",
        icon: "payment",
        visible: can("view_payment_menu"),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new payment",
                link: "/payment/form",
                visible: can("create_payment")
            },
            {
                title: "list payments",
                link: "/payment/list",
                visible: can("list_payment")
            }
        ]
    },

    // branch menu
    {
        rank: 23,
        title: "branch",
        link: "#",
        icon: "storefront",
        visible: can("view_branch_menu"),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new branch",
                link: "/branch/form",
                visible: can("create_branch")
            },
            {
                title: "list branches",
                link: "/branch/list",
                visible: can("list_branch")
            },
            {
                title: "data",
                link: "/branch/data",
                visible: can("view_branch_data")
            },
            {
                title: "activities",
                link: "/branch/activity-list",
                visible: can("list_activity")
            },
            {
                title: "settings",
                link: "/branch/settings",
                visible: (can("change_branch_settings") && !isAdmin) || (isAdmin && adminHasSwitched())
            }
        ]
    },

    {
        rank: 25,
        title: "profile",
        link: "#",
        icon: "settings",
        visible: true,
        hasSubMenu: true,
        subMenu: [
            {
                title: "view profile",
                link: "/profile/view",
                visible: true
            },
            {
                title: "edit profile",
                link: "/profile/edit",
                visible: true
            },
            {
                title: "change password",
                link: "/profile/password",
                visible: true
            }
        ]
    },
]

// tourism menu
const tourism: menu[] = [

    ...generalMenu,
    // hotel menu
    {
        rank: 2,
        title: "hotel",
        link: "#",
        icon: "hotel",
        visible: (can("view_hotel_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new hotel",
                link: "/hotel/form",
                visible: can("create_hotel")
            },
            {
                title: "list hotels",
                link: "/hotel/list",
                visible: can("list_hotel")
            }
        ]
    },

    {
        rank: 3,
        title: "attraction",
        link: "#",
        icon: "museum",
        visible: ((
            can("view_item_menu") ||
            can("view_attraction_menu")
        ) && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new attraction",
                link: "/attraction/form",
                visible: can("create_attraction")
            },
            {
                title: "list attractions",
                link: "/attraction/list",
                visible: can("list_attraction")
            },
            {
                title: "new attraction item",
                link: "/attraction/item-form",
                visible: can("create_item")
            },
            {
                title: "list attraction items",
                link: "/attraction/item-list",
                visible: can("list_item")
            }
        ]
    },

    // quotation menu
    {
        rank: 4,
        title: "quotation",
        link: "#",
        icon: "request_quote",
        visible: ((
            can("view_quotation_menu") ||
            can("view_quotation_invoice_menu")
        ) && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new quotation",
                link: "/quotation/form",
                visible: can("create_quotation")
            },
            {
                title: "list quotations",
                link: "/quotation/list",
                visible: can("list_quotation")
            },
            {
                title: "new quotation invoice",
                link: "/quotation/invoice-form",
                visible: can("create_quotation_invoice")
            },
            {
                title: "list quotation invoices",
                link: "/quotation/invoice-list",
                visible: can("list_quotation_invoice")
            }
        ]
    },

]

// logistics menu
const logistics: menu[] = [
    ...generalMenu,
    // route menu
    {
        rank: 5,
        link: "#",
        title: "route",
        icon: "route",
        hasSubMenu: true,
        visible: (can("view_route_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        subMenu: [
            {
                title: "new route",
                link: "/route/form",
                visible: can("create_route")
            },
            {
                title: "list routes",
                link: "/route/list",
                visible: can("list_route")
            },
        ]
    },
    {
        rank: 6,
        title: "truck",
        link: "#",
        hasSubMenu: true,
        icon: "car_rental",
        visible: ((
            can("view_truck_menu") ||
            can("view_truck_order_menu")
        ) && (!isAdmin)) || (isAdmin && adminHasSwitched()),
        subMenu: [
            {
                title: "new truck",
                link: "/truck/form",
                visible: can("create_truck")
            },
            {
                title: "list trucks",
                link: "/truck/list",
                visible: can("list_truck")
            },
            {
                title: "new truck_order",
                link: "/truck/order-form",
                visible: can("create_truck_order")
            },
            {
                title: "list truck_orders",
                link: "/truck/order-list",
                visible: can("list_truck_order")
            },

        ]
    },
]

// other menu
const other: menu[] = [
    ...generalMenu,
    // product menu
    {
        rank: 8,
        title: "product",
        link: "#",
        icon: "inventory_2",
        visible: (can("view_product_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new product",
                link: "/product/form",
                visible: can("create_product")
            },
            {
                title: "list products",
                link: "/product/list",
                visible: can("list_product")
            },
            {
                title: "stock taking",
                link: "/product/stock-taking",
                visible: can("do_stock_taking")
            },
            {
                title: "adjust stock",
                link: "/product/adjustment-form",
                visible: can("adjust_stock")
            },
            {
                title: "list adjustments",
                link: "/product/adjustment-list",
                visible: can("list_stock_adjustment")
            },
            {
                title: "new category",
                link: "/product/category-form",
                visible: can("create_category")
            },
            {
                title: "list categories",
                link: "/product/category-list",
                visible: can("list_category")
            }
        ]
    },

    // sale menu
    {
        rank: 9,
        title: "sale",
        link: "#",
        icon: "shopping_cart",
        visible: (can("view_sale_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new sale",
                link: "/sale/form",
                visible: can("create_sale")
            },
            {
                title: "list sales",
                link: "/sale/list",
                visible: can("list_sale")
            },
            {
                title: "new order",
                link: "/sale/order-form",
                visible: can("create_order")
            },
            {
                title: "list orders",
                link: "/sale/order-list",
                visible: can("list_order")
            },
            {
                title: "new proforma invoice",
                link: "/sale/proforma-invoice-form",
                visible: can("create_proforma_invoice")
            },
            {
                title: "list proforma invoice",
                link: "/sale/proforma-invoice-list",
                visible: can("list_proforma_invoice")
            },
        ]
    },



    // purchase menu
    {
        rank: 11,
        title: "purchase",
        link: "#",
        icon: "local_shipping",
        visible: (can("view_purchase_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "bulk purchase",
                link: "/purchase/bulk",
                visible: can("create_purchase")
            },
            {
                title: "new purchase",
                link: "/purchase/form",
                visible: can("create_purchase")
            },
            {
                title: "list purchases",
                link: "/purchase/list",
                visible: can("list_purchase")
            },
            {
                title: "new supplier",
                link: "/supplier/form",
                visible: can("create_supplier")
            },
            {
                title: "list suppliers",
                link: "/supplier/list",
                visible: can("list_supplier")
            }
        ]
    },

    // freight menu
    {
        rank: 12,
        title: "freight",
        link: "#",
        icon: "directions_car",
        visible: (can("view_freight_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new freight",
                link: "/freight/form",
                visible: can("create_freight")
            },
            {
                title: "list freights",
                link: "/freight/list",
                visible: can("list_freight")
            }
        ]
    },



    {
        rank: 14,
        title: "device",
        link: "#",
        icon: "devices",
        visible: (can("view_device_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new device",
                link: "/device/form",
                visible: can("create_device")
            },
            {
                title: "list devices",
                link: "/device/list",
                visible: can("list_device")
            }
        ]
    },

    {
        rank: 15,
        title: "service",
        link: "#",
        icon: "build",
        visible: (can("view_service_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new service",
                link: "/service/form",
                visible: can("create_service")
            },
            {
                title: "list services",
                link: "/service/list",
                visible: can("list_service")
            }
        ]
    },
    {
        rank: 16,
        title: "store",
        link: "#",
        icon: "store",
        visible: (can("view_store_menu") && !isAdmin) || (isAdmin && adminHasSwitched()),
        hasSubMenu: true,
        subMenu: [
            {
                title: "new store",
                link: "/store/form",
                visible: can("create_store")
            },
            {
                title: "list stores",
                link: "/store/list",
                visible: can("list_store")
            },
            {
                title: "new product",
                link: "/store/product-form",
                visible: can("create_store_product")
            },
            {
                title: "list products",
                link: "/store/product-list",
                visible: can("list_store_product")
            },
            {
                title: "new purchase",
                link: "/store/purchase-form",
                visible: can("create_purchase")
            },
            {
                title: "bulk purchase",
                link: "/store/bulk-purchase",
                visible: can("create_purchase")
            },
            {
                title: "list purchases",
                link: "/store/purchase-list",
                visible: can("list_purchase")
            },
            {
                title: "new adjustment",
                link: "/store/adjustment-form",
                visible: can("adjust_stock")
            },
            {
                title: "list adjustments",
                link: "/store/adjustment-list",
                visible: can("list_stock_adjustment")
            },
        ]
    },
]

// returning menu accourding to branch
const getMenu = (): menu[] => {
    try {

        const menuObject: any = {
            tourism,
            logistics,
        }

        const branchType = getInfo("user", "branch")?.type

        if (string.isNotEmpty(branchType)) {
            const type = text.format(branchType)
            if (object.keyExist(menuObject, type))
                return menuObject[type]
            return other
        }

        return other

    } catch (error) {
        console.log((error as Error).message)
        return other
    }
}

export default getMenu