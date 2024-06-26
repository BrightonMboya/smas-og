/* require dependencies */
import { lazy } from "react"
import { routerProps } from "../types";

// route
export type route = {
    path: string,
    guest: boolean,
    component: React.LazyExoticComponent<React.FunctionComponent<routerProps>>
}

/* array of routes */
const routes: route[] = [

    // user routes (unauthenticated)
    {
        path: "/login",
        component: lazy(() => import("../pages/user/login")),
        guest: true
    },
    {
        path: "/forgot-password",
        component: lazy(() => import("../pages/user/forgot-password")),
        guest: true
    },
    {
        path: "/verification-code",
        component: lazy(() => import("../pages/user/verification-code")),
        guest: true
    },
    {
        path: "/change-password",
        component: lazy(() => import("../pages/user/change-password")),
        guest: true
    },

    // authenticated routes
    // user routes
    {
        path: "/user/form",
        component: lazy(() => import("../pages/user/form")),
        guest: false
    },
    {
        path: "/user/list",
        component: lazy(() => import("../pages/user/list")),
        guest: false
    },
    {
        path: "/user/view",
        component: lazy(() => import("../pages/user/view")),
        guest: false
    },
    {
        path: "/profile/edit",
        component: lazy(() => import("../pages/user/form")),
        guest: false
    },
    {
        path: "/profile/view",
        component: lazy(() => import("../pages/user/view")),
        guest: false
    },

    {
        path: "/profile/password",
        component: lazy(() => import("../pages/user/password")),
        guest: false
    },

    // product route
    {
        path: "/product/form",
        component: lazy(() => import("../pages/product/form")),
        guest: false
    },
    {
        path: "/product/list",
        component: lazy(() => import("../pages/product/list")),
        guest: false
    },
    {
        path: "/product/stock-taking",
        component: lazy(() => import("../pages/product/list")),
        guest: false
    },
    {
        path: "/product/view",
        component: lazy(() => import("../pages/product/view")),
        guest: false
    },
    {
        path: "/product/adjustment-form",
        guest: false,
        component: lazy(() => import("../pages/product/adjustment/form"))
    },
    {
        path: "/product/adjustment-list",
        guest: false,
        component: lazy(() => import("../pages/product/adjustment/list"))
    },
    {
        path: "/product/adjustment-view",
        guest: false,
        component: lazy(() => import("../pages/product/adjustment/view"))
    },


    // expense
    {
        path: "/expense/type-form",
        component: lazy(() => import("../pages/expense/type/form")),
        guest: false
    },
    {
        path: "/expense/type-list",
        component: lazy(() => import("../pages/expense/type/list")),
        guest: false
    },
    {
        path: "/expense/type-view",
        component: lazy(() => import("../pages/expense/type/view")),
        guest: false
    },
    {
        path: "/expense/form",
        component: lazy(() => import("../pages/expense/form")),
        guest: false
    },
    {
        path: "/expense/list",
        component: lazy(() => import("../pages/expense/list")),
        guest: false
    },
    {
        path: "/expense/view",
        component: lazy(() => import("../pages/expense/view")),
        guest: false
    },

    // customer
    {
        path: "/customer/form",
        component: lazy(() => import("../pages/customer/form")),
        guest: false
    },
    {
        path: "/customer/list",
        component: lazy(() => import("../pages/customer/list")),
        guest: false
    },
    {
        path: "/customer/view",
        component: lazy(() => import("../pages/customer/view")),
        guest: false
    },

    // purchase
    {
        path: "/purchase/form",
        component: lazy(() => import("../pages/purchase/form")),
        guest: false
    },
    {
        path: "/purchase/list",
        component: lazy(() => import("../pages/purchase/list")),
        guest: false
    },
    {
        path: "/purchase/view",
        component: lazy(() => import("../pages/purchase/view")),
        guest: false
    },
    {
        path: "/purchase/bulk",
        component: lazy(() => import("../pages/purchase/bulk")),
        guest: false
    },

    // debt routes
    {
        path: "/debt/form",
        guest: false,
        component: lazy(() => import("../pages/debt/form"))
    },
    {
        path: "/debt/list",
        guest: false,
        component: lazy(() => import("../pages/debt/list"))
    }
    ,
    {
        path: "/debt/view",
        guest: false,
        component: lazy(() => import("../pages/debt/view"))
    },
    {
        path: "/debt/history-form",
        guest: false,
        component: lazy(() => import("../pages/debt/history/form"))
    },
    {
        path: "/debt/history-list",
        guest: false,
        component: lazy(() => import("../pages/debt/history/list"))
    },
    {
        path: "/debt/history-view",
        guest: false,
        component: lazy(() => import("../pages/debt/history/view"))
    },

    // sale route
    {
        path: "/sale/form",
        guest: false,
        component: lazy(() => import("../pages/sale/form"))
    },
    {
        path: "/sale/list",
        guest: false,
        component: lazy(() => import("../pages/sale/list"))
    },
    {
        path: "/sale/view",
        guest: false,
        component: lazy(() => import("../pages/sale/view"))
    },
    {
        path: "/sale/order-form",
        guest: false,
        component: lazy(() => import("../pages/sale/form"))
    },
    {
        path: "/sale/order-list",
        guest: false,
        component: lazy(() => import("../pages/sale/order/list"))
    },
    {
        path: "/sale/order-view",
        guest: false,
        component: lazy(() => import("../pages/sale/order/view"))
    },
    {
        path: "/sale/proforma-invoice-form",
        guest: false,
        component: lazy(() => import("../pages/sale/form"))
    },
    {
        path: "/sale/proforma-invoice-list",
        guest: false,
        component: lazy(() => import("../pages/sale/order/list"))
    },
    {
        path: "/sale/proforma-invoice-view",
        guest: false,
        component: lazy(() => import("../pages/sale/order/view"))
    },

    // role routes
    {
        path: "/role/form",
        guest: false,
        component: lazy(() => import("../pages/role/form"))
    },
    {
        path: "/role/list",
        guest: false,
        component: lazy(() => import("../pages/role/list"))
    },
    {
        path: "/role/view",
        guest: false,
        component: lazy(() => import("../pages/role/view"))
    },

    // branch routes
    {
        path: "/branch/form",
        guest: false,
        component: lazy(() => import("../pages/branch/form"))
    },
    {
        path: "/branch/list",
        guest: false,
        component: lazy(() => import("../pages/branch/list"))
    },
    {
        path: "/branch/view",
        guest: false,
        component: lazy(() => import("../pages/branch/view"))
    },
    {
        path: "/branch/data",
        guest: false,
        component: lazy(() => import("../pages/branch/data"))
    },
    {
        path: "/branch/settings",
        guest: false,
        component: lazy(() => import("../pages/branch/settings"))
    },
    {
        path: "/branch/activity-list",
        guest: false,
        component: lazy(() => import("../pages/activity/list"))
    },

    {
        path: "/payment/form",
        guest: false,
        component: lazy(() => import("../pages/payment/form"))
    },
    {
        path: "/payment/list",
        guest: false,
        component: lazy(() => import("../pages/payment/list"))
    },
    {
        path: "/payment/view",
        guest: false,
        component: lazy(() => import("../pages/payment/view"))
    },

    // message
    {
        path: "/message/form",
        guest: false,
        component: lazy(() => import("../pages/message/form"))
    },
    {
        path: "/message/list",
        guest: false,
        component: lazy(() => import("../pages/message/list"))
    },

    // store
    {
        path: "/store/form",
        guest: false,
        component: lazy(() => import("../pages/store/form"))
    },
    {
        path: "/store/list",
        guest: false,
        component: lazy(() => import("../pages/store/list"))
    },
    {
        path: "/store/view",
        guest: false,
        component: lazy(() => import("../pages/store/view"))
    },

    // store product route
    {
        path: "/store/product-form",
        guest: false,
        component: lazy(() => import("../pages/product/form"))
    },
    {
        path: "/store/product-list",
        guest: false,
        component: lazy(() => import("../pages/product/list"))
    },
    {
        path: "/store/product-view",
        guest: false,
        component: lazy(() => import("../pages/product/view"))
    },
    {
        path: "/store/adjustment-form",
        guest: false,
        component: lazy(() => import("../pages/product/adjustment/form"))
    },
    {
        path: "/store/adjustment-list",
        guest: false,
        component: lazy(() => import("../pages/product/adjustment/list"))
    },
    {
        path: "/store/adjustment-view",
        guest: false,
        component: lazy(() => import("../pages/product/adjustment/view"))
    },

    // store product purchase route
    {
        path: "/store/purchase-form",
        component: lazy(() => import("../pages/purchase/form")),
        guest: false
    },
    {
        path: "/store/purchase-list",
        component: lazy(() => import("../pages/purchase/list")),
        guest: false
    },
    {
        path: "/store/purchase-view",
        component: lazy(() => import("../pages/purchase/view")),
        guest: false
    },
    {
        path: "/store/bulk-purchase",
        component: lazy(() => import("../pages/purchase/bulk")),
        guest: false
    },

    // report routes
    {
        path: "/report/form",
        guest: false,
        component: lazy(() => import("../pages/report/form"))
    },
    // {
    //     path: "/report/statistics",
    //     guest: false,
    //     component: lazy(() => import("../pages/report/statistics"))
    // },
    {
        path: "/report/income-statement",
        guest: false,
        component: lazy(() => import("../pages/report/income-statement"))
    },

    {
        path: "/dashboard",
        component: lazy(() => import("../pages/dashboard/dashboard")),
        guest: false
    },

    {
        path: "/",
        component: lazy(() => import("../pages/dashboard/dashboard")),
        guest: false
    },

    // supplier
    {
        path: "/supplier/form",
        guest: false,
        component: lazy(() => import("../pages/supplier/form"))
    },
    {
        path: "/supplier/list",
        guest: false,
        component: lazy(() => import("../pages/supplier/list"))
    },
    {
        path: "/supplier/view",
        guest: false,
        component: lazy(() => import("../pages/supplier/view"))
    },

    // routes routes
    {
        path: "/route/form",
        guest: false,
        component: lazy(() => import("../pages/truck/route/form"))
    },
    {
        path: "/route/list",
        guest: false,
        component: lazy(() => import("../pages/truck/route/list"))
    },
    {
        path: "/route/view",
        guest: false,
        component: lazy(() => import("../pages/truck/route/view"))
    },

    // truck routes
    {
        path: "/truck/form",
        guest: false,
        component: lazy(() => import("../pages/truck/form"))
    },
    {
        path: "/truck/list",
        guest: false,
        component: lazy(() => import("../pages/truck/list"))
    },
    {
        path: "/truck/view",
        guest: false,
        component: lazy(() => import("../pages/truck/view"))
    },

    // truck order route
    {
        path: "/truck/order-form",
        guest: false,
        component: lazy(() => import("../pages/truck/truck-order/form"))
    },
    {
        path: "/truck/order-list",
        guest: false,
        component: lazy(() => import("../pages/truck/truck-order/list"))
    },
    {
        path: "/truck/order-view",
        guest: false,
        component: lazy(() => import("../pages/truck/truck-order/view"))
    },

    // device routes
    {
        path: "/device/form",
        guest: false,
        component: lazy(() => import("../pages/device/form"))
    },
    {
        path: "/device/list",
        guest: false,
        component: lazy(() => import("../pages/device/list"))
    },
    {
        path: "/device/view",
        guest: false,
        component: lazy(() => import("../pages/device/view"))
    },

    // service routes
    {
        path: "/service/form",
        guest: false,
        component: lazy(() => import("../pages/service/form"))
    },
    {
        path: "/service/list",
        guest: false,
        component: lazy(() => import("../pages/service/list"))
    },
    {
        path: "/service/view",
        guest: false,
        component: lazy(() => import("../pages/service/view"))
    },

    // freight route
    {
        path: "/freight/form",
        component: lazy(() => import("../pages/freight/form")),
        guest: false
    },
    {
        path: "/freight/list",
        component: lazy(() => import("../pages/freight/list")),
        guest: false
    },
    {
        path: "/freight/view",
        component: lazy(() => import("../pages/freight/view")),
        guest: false
    },

    // account routes
    {
        guest: false,
        path: "/transaction/account-form",
        component: lazy(() => import("../pages/transaction/account/form"))
    },
    {
        guest: false,
        path: "/transaction/account-list",
        component: lazy(() => import("../pages/transaction/account/list"))
    },
    {
        guest: false,
        path: "/transaction/account-view",
        component: lazy(() => import("../pages/transaction/account/view"))
    },

    // transaction routes
    {
        guest: false,
        path: "/transaction/form",
        component: lazy(() => import("../pages/transaction/form"))
    },
    {
        guest: false,
        path: "/transaction/list",
        component: lazy(() => import("../pages/transaction/list"))
    },
    {
        guest: false,
        path: "/transaction/view",
        component: lazy(() => import("../pages/transaction/view"))
    },

    // hotel routes
    {
        guest: false,
        path: "/hotel/form",
        component: lazy(() => import("../pages/tourism/hotel/form"))
    },
    {
        guest: false,
        path: "/hotel/list",
        component: lazy(() => import("../pages/tourism/hotel/list"))
    },
    {
        guest: false,
        path: "/hotel/view",
        component: lazy(() => import("../pages/tourism/hotel/view"))
    },

    // attraction route
    {
        guest: false,
        path: "/attraction/form",
        component: lazy(() => import("../pages/tourism/attraction/form"))
    },
    {
        guest: false,
        path: "/attraction/list",
        component: lazy(() => import("../pages/tourism/attraction/list"))
    },
    {
        guest: false,
        path: "/attraction/view",
        component: lazy(() => import("../pages/tourism/attraction/view"))
    },
    {
        guest: false,
        path: "/attraction/item-form",
        component: lazy(() => import("../pages/tourism/attraction/item/form"))
    },
    {
        guest: false,
        path: "/attraction/item-list",
        component: lazy(() => import("../pages/tourism/attraction/item/list"))
    },
    {
        guest: false,
        path: "/attraction/item-view",
        component: lazy(() => import("../pages/tourism/attraction/item/view"))
    },

    // quotation routes
    {
        guest: false,
        path: "/quotation/form",
        component: lazy(() => import("../pages/tourism/quotation/form"))
    },
    {
        guest: false,
        path: "/quotation/list",
        component: lazy(() => import("../pages/tourism/quotation/list"))
    },
    {
        guest: false,
        path: "/quotation/view",
        component: lazy(() => import("../pages/tourism/quotation/view"))
    },
    {
        guest: false,
        path: "/quotation/invoice-form",
        component: lazy(() => import("../pages/tourism/quotation/invoice/form"))
    },
    {
        guest: false,
        path: "/quotation/invoice-list",
        component: lazy(() => import("../pages/tourism/quotation/invoice/list"))
    },
    {
        guest: false,
        path: "/quotation/invoice-view",
        component: lazy(() => import("../pages/tourism/quotation/invoice/view"))
    },

    // category routes
    {
        path: "/product/category-form",
        guest: false,
        component: lazy(() => import("../pages/product/category/form"))
    },
    {
        path: "/product/category-list",
        guest: false,
        component: lazy(() => import("../pages/product/category/list"))
    },
    {
        path: "/product/category-view",
        guest: false,
        component: lazy(() => import("../pages/product/category/view"))
    },

    // should be at the bottom always
    {
        path: "*",
        guest: false,
        component: lazy(() => import("../pages/404/page-not-found"))
    },
    {
        path: "*",
        component: lazy(() => import("../pages/user/login")),
        guest: true
    },

]

export default routes;