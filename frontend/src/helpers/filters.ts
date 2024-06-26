// transaction filter
export const transactionFilters: string[] = [
    "supplier_transactions", "customer_transactions", /* "user_transactions", */ "sale_transactions", "purchase_transactions", "expense_transactions", "debt_transactions", "customer_deposit_transactions", "customer_withdraw_transactions", "supplier_deposit_transactions", "supplier_withdraw_transactions",/*  "user_deposit_transactions", */ /* "user_withdraw_transactions", */ "deposit_transactions", "withdraw_transactions", "manual_transactions", "manual_deposit_transactions", "manual_withdraw_transactions", "automatic_transactions", "automatic_deposit_transactions", "automatic_withdraw_transactions"
]

// account filter
export const accountFilters: string[] = [
    "bank_accounts",
    // "user_accounts",
    "branch_accounts",
    "mobile_accounts",
    "disabled_accounts",
    "customer_accounts",
    "supplier_accounts",
    "cash_in_hand_accounts",
    "accounts_with_balance",
    "accounts_without_balance"
]

// product filters
export const productFilters: string[] = [
    "products",
    "in_stock",
    "out_of_stock",
    "almost_out_of_stock"
]

// adjustment filters
export const adjustmentFilters: string[] = [
    "sale",
    "manual",
    "service",
    "increase",
    "decrease",
    "purchase",
    "automatically",
    "point_of_sale",
]

// purchase filters
export const purchaseFilters: string[] = [
    "paid",
    "unpaid",
    "today",
    "partial_paid"
]