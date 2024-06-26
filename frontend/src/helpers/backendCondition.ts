import { commonCondition, text } from "."

// backend condition
const getBackendCondition = (name: string): object => {
    try {

        // remove name white space
        name = text.format(name)

        const splitedName: string[] = name.split("_")
        const location: string = window.location.pathname.split("/")[1]

        // user condition
        let condition = commonCondition()
        const conditionExpression = condition.$expr

        // day time
        const todayDate: number = new Date().setHours(0, 0, 0)

        switch (name) {

            // listing deleted data
            case "deleted":
                condition = { ...condition, visible: false }
                break

            // listing paid data
            case "paid":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$total_amount", "$paid_amount"] }
                        ]
                    }
                }
                break

            // listing unpaid data
            case "unpaid":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$paid_amount", 0] }
                        ]
                    }
                }
                break

            // listing partial paid data
            case "partial_paid":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            {
                                $and: [
                                    { $ne: ["$paid_amount", 0] },
                                    { $ne: ["$paid_amount", "$total_amount"] }
                                ]
                            }
                        ]
                    }
                }
                break

            // listing today sales by created at field
            case "today_sales":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$type", "sale"] },
                            { $ne: ["$status", "invoice"] },
                            { $gte: ["$createdAt", todayDate] },
                        ]
                    }
                }
                break

            // listing today data by date field
            case "of_today":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $gte: ["$date", todayDate] }
                        ]
                    }
                }
                break

            case "sales_on_cart":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $ne: ["$status", "invoice"] },
                            {
                                $or: [
                                    { $eq: ["$type", "cart"] },
                                    { $eq: ["$type", "order"] }
                                ]
                            }
                        ]
                    }
                }
                break

            // day cash and sales
            case "today_cash_sales":
            case "today_credit_sales":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$type", "sale"] },
                            { $gte: ["$createdAt", todayDate] },
                            { $eq: ["$status", name.includes("cash") ? "cash" : "credit"] }
                        ]
                    }
                }
                break

            // cash and credit sales
            case "cash_sales":
            case "credit_sales":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$type", "sale"] },
                            { $eq: ["$status", name.includes("credit") ? "credit" : "cash"] }
                        ]
                    }
                }
                break

            // sales
            case "sales":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$type", "sale"] },
                            { $ne: ["$status", "invoice"] }
                        ]
                    }
                }
                break

            case "products":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$is_store_product", location === "store"] }
                        ]
                    }
                }
                break

            // product about to finish
            case "almost_out_of_stock":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $gte: ["$stock", 1] },
                            { $lte: ["$stock", "$reorder_stock_level"] },
                            { $eq: ["$is_store_product", location === "store"] }
                        ]
                    }
                }
                break

            // finished products
            case "out_of_stock":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $lte: ["$stock", 0] },
                            { $eq: ["$is_store_product", location === "store"] }
                        ]
                    }
                }
                break

            // available products
            case "in_stock":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $gt: ["$stock", "$reorder_stock_level"] },
                            { $eq: ["$is_store_product", location === "store"] }
                        ]
                    }
                }
                break

            // tin number
            case "with_tin_number":
            case "without_tin_number":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { [name.includes("without") ? "$eq" : "$ne"]: ["$tin", null] }
                        ]
                    }
                }
                break

            // debts
            case "shop_debts":
            case "customer_debts":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$type", name.includes("customer") ? "customer_is_owed" : "shop_is_owed"] }
                        ]
                    }
                }
                break

            case "sale_debts":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $ne: ["$sale", null] }
                        ]
                    }
                }
                break

            // subscription
            case "with_subscription":
            case "without_subscription":
            case "accounts_with_balance":
            case "accounts_without_balance":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { [name.includes("without") ? "$lte" : "$gt"]: [name.includes("balance") ? "$balance" : "$days", 0] }
                        ]
                    }
                }
                break

            case "other":
            case "user":
            case "creation":
            case "deletion":
            case "computer":
            case "mobile_phone":
            case "sms_purchase":
            case "modification":
            case "system_installation":
            case "monthly_subscription":
            case "vendor_name_registration":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$type", name] }
                        ]
                    }
                }
                break

            // two factor authentication
            case "with_2fa":
            case "without_2fa":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { [name.includes("without") ? "$ne" : "$eq"]: ["$two_factor_authentication_enabled", true] }
                        ]
                    }
                }
                break

            // phone number verification
            case "verified":
            case "not_verified":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { [name.includes("not") ? "$ne" : "$eq"]: ["$phone_number_verified", true] }
                        ]
                    }
                }
                break

            // user account type
            case "admins":
            case "owners":
            case "employee":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$account_type", name === "admins" ? "smasapp" : name === "owners" ? "user" : name] }
                        ]
                    }
                }
                break

            case "active":
            case "rented":
            case "received":
            case "canceled":
            case "completed":
            case "available":
            case "in_transit":
            case "incomplete":
            case "unavailable":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$status", name] }
                        ]
                    }
                }
                break

            // order and proforma invoice
            case "orders":
            case "proforma_invoice":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$type", name.includes("orders") ? "order" : "invoice"] }
                        ]
                    }
                }
                break

            case "today_orders":
            case "today_proforma_invoice":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $gte: ["$createdAt", todayDate] },
                            { $eq: ["$type", name.includes("orders") ? "order" : "invoice"] }
                        ]
                    }
                }
                break

            case "stolen":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$is_store_product", location === "store"] },
                            {
                                $or: [
                                    { $lt: ["$stock", 0] },
                                    { $lt: [0, { $subtract: ["$stock", "$quantity"] }] }
                                ]
                            }
                        ]
                    }
                }
                break

            case "increase":
            case "decrease":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$type", name] },
                            { $eq: ["$module", location] },
                        ]
                    }
                }
                break

            case "adjustments":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$module", location] },
                        ]
                    }
                }
                break

            case "manual":
            case "automatically":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$module", location] },
                            { [name === "manual" ? "$eq" : "$ne"]: ["$from", null] }
                        ]
                    }
                }
                break

            case "sale":
            case "service":
            case "purchase":
            case "point_of_sale":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$module", location] },
                            { $eq: ["$from", name === "point_of_sale" ? "sale_cart" : name] },
                        ]
                    }
                }
                break

            case "disabled":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$disabled", true] }
                        ]
                    }
                }
                break

            case "user_transactions":
            case "debt_transactions":
            case "sale_transactions":
            case "deposit_transactions":
            case "expense_transactions":
            case "withdraw_transactions":
            case "supplier_transactions":
            case "customer_transactions":
            case "purchase_transactions":
            case "user_deposit_transactions":
            case "user_withdraw_transactions":
            case "customer_deposit_transactions":
            case "supplier_deposit_transactions":
            case "customer_withdraw_transactions":
            case "supplier_withdraw_transactions":
            case "manual_transactions":
            case "manual_deposit_transactions":
            case "manual_withdraw_transactions":
            case "automatic_transactions":
            case "automatic_deposit_transactions":
            case "automatic_withdraw_transactions":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            name === "user_transactions" ||
                                name === "sale_transactions" ||
                                name === "debt_transactions" ||
                                name === "expense_transactions" ||
                                name === "supplier_transactions" ||
                                name === "customer_transactions" ||
                                name === "purchase_transactions" ?
                                { $ne: [`$${splitedName[0]}`, null] }
                                :
                                name === "user_deposit_transactions" ||
                                    name === "user_withdraw_transactions" ||
                                    name === "customer_deposit_transactions" ||
                                    name === "supplier_deposit_transactions" ||
                                    name === "customer_withdraw_transactions" ||
                                    name === "supplier_withdraw_transactions" ?
                                    {
                                        $and: [
                                            { $eq: ["$type", splitedName[1]] },
                                            { $ne: [`$${splitedName[0]}`, null] }
                                        ]
                                    }
                                    :
                                    name === "manual_deposit_transactions" ||
                                        name === "manual_withdraw_transactions" ||
                                        name === "automatic_deposit_transactions" ||
                                        name === "automatic_withdraw_transactions" ?
                                        {
                                            $and: [
                                                { $eq: ["$type", splitedName[1]] },
                                                { $eq: ["$cause", splitedName[0]] },
                                            ]
                                        }
                                        :
                                        name === "automatic_transactions" ||
                                            name === "manual_transactions" ?
                                            {
                                                $eq: ["$cause", splitedName[0]]
                                            }
                                            : { $eq: ["$type", splitedName[0]] }
                        ]
                    }
                }
                break

            case "bank_accounts":
            case "user_accounts":
            case "branch_accounts":
            case "mobile_accounts":
            case "disabled_accounts":
            case "customer_accounts":
            case "supplier_accounts":
            case "cash_in_hand_accounts":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            name === "bank_accounts" ||
                                name === "user_accounts" ||
                                name === "mobile_accounts" ||
                                name === "customer_accounts" ||
                                name === "supplier_accounts" ||
                                name === "cash_in_hand_accounts"
                                ?
                                {
                                    $eq: ["$type", name === "cash_in_hand_accounts" ? "cash_in_hand" : splitedName[0]]
                                }
                                :
                                name === "branch_accounts"
                                    ?
                                    {
                                        $and: [
                                            { $ne: ["$type", "user"] },
                                            { $ne: ["$type", "customer"] },
                                            { $ne: ["$type", "supplier"] },
                                        ]
                                    }
                                    :
                                    { $eq: ["$disabled", true] }
                        ]
                    }
                }
                break

            // listing paid data
            case "paid_purchase":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$for_store_product", location === "store"] },
                            { $eq: ["$total_amount", "$paid_amount"] }
                        ]
                    }
                }
                break

            // listing unpaid data
            case "unpaid_purchase":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$for_store_product", location === "store"] },
                            { $eq: ["$paid_amount", 0] }
                        ]
                    }
                }
                break

            case "purchases":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$for_store_product", location === "store"] },
                        ]
                    }
                }
                break

            // listing partial paid data
            case "partial_paid_purchase":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $eq: ["$for_store_product", location === "store"] },
                            {
                                $and: [
                                    { $ne: ["$paid_amount", 0] },
                                    { $ne: ["$paid_amount", "$total_amount"] }
                                ]
                            }
                        ]
                    }
                }
                break

            case "today_purchase":
                condition = {
                    ...condition,
                    $expr: {
                        $and: [
                            conditionExpression,
                            { $gte: ["$date", todayDate] },
                            { $eq: ["$for_store_product", location === "store"] },
                        ]
                    }
                }
                break

                case "today":
                    condition = {
                        ...condition,
                        $expr: {
                            $and: [
                                conditionExpression,
                                { $gte: ["$date", todayDate] },
                                // { $eq: ["$for_store_product", location === "store"] },
                            ]
                        }
                    }
                    break


            // if no match
            default:
                condition = { ...condition }
                break
        }

        return condition

    } catch (error) {
        return { error: (error as Error).message }
    }
}

export default getBackendCondition