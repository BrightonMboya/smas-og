// dependencies
import { Document, ObjectId } from "mongoose"

// common schema interface
export interface commonInterface extends Document {
    to: string
    date: Date
    fee: number
    tin: string
    type: string
    name: string
    from: string
    stock: number
    email: string
    module: string
    profit: number
    user: ObjectId
    sale: ObjectId
    status: string
    truck: ObjectId
    store: ObjectId
    barcode: string
    settings: object
    discount: number
    visible: boolean
    branch: ObjectId
    quantity: number
    reference: string
    editable: boolean
    account: ObjectId
    disabled: boolean
    isGlobal: boolean
    product: ObjectId
    customer: ObjectId
    category: ObjectId
    supplier: ObjectId
    description: string
    paid_amount: number
    stock_after: number
    stock_before: number
    phone_number: string
    created_by: ObjectId
    updated_by: ObjectId
    total_amount: number
    buying_price: number
    attraction: ObjectId
    selling_price: number
    number: string | number
    address: {
        street: string
        region: string
        location: string
    }
    contacts: {
        email: string
        website: string
        phone_number: string
    }
    is_store_product: boolean
    reorder_stock_level: number
    altenative_phone_number: string
    use_customer_account: boolean
}

// Activity schema interface
export interface activity extends commonInterface {
    data: object
}

// Branch schema interface
export interface branch extends commonInterface {
    days: number
    image: string
    vendor: string
    api_key: string
    website: string
}

// Debt history schema interface
export interface debt_history extends commonInterface {
    debt: ObjectId
    account: ObjectId
    expense: ObjectId
    supplier: ObjectId
}

// Debt schema interface
export interface debt extends commonInterface {
    sale: ObjectId
    expense: ObjectId
    editable: boolean
    purchase: ObjectId
    truck_order: ObjectId
    quotation_invoice: ObjectId
}

// Expense schema interface
export interface expense extends commonInterface {
    truck: ObjectId
    account: ObjectId
    customer: ObjectId
    has_receipt: boolean
    expense_type: ObjectId
    quotation_invoice: ObjectId
}

// Order schema interface
export interface order extends commonInterface {
    sales: ObjectId[]
    reference: string
}

// Role schema interface
export interface role extends commonInterface {
    permissions: string[]
}

// Store product schema interface
export interface store_product extends commonInterface {
    store: ObjectId
}

// User schema interface
export interface user extends commonInterface {
    username: string
    role: ObjectId
    password: string
    stores: ObjectId[]
    account_type: string
    branches: ObjectId[]
    phone_number_verified: boolean
    two_factor_authentication_enabled: boolean
}

// Adjustment schema interface
export interface adjustment extends commonInterface {
    purchase: ObjectId
    adjustment: number
    store_product: ObjectId
    after_adjustment: number
    before_adjustment: number
}

// Truck schema interface
export interface truck extends commonInterface {
    plate_number: string
    details: { key: string, value: string }[]
}

// Route interface schema
export interface route extends commonInterface {
    cost: number
    distance: number
}

// Truck order schema interface
export interface truck_order extends commonInterface {
    route: ObjectId
    distance: number
    editable: boolean
    route_name: String
    status_after: string
    status_before: string
}

// Device schema interface
export interface device extends commonInterface {
    imei: string
    brand: string
    model: string
    features: { key: string, value: string }[]
}

// Service schema interface
export interface service extends commonInterface {
    service: string
    device: ObjectId
    service_cost: number
    product_cost: number
}

// Account schema interface
export interface account extends commonInterface {
    name: string
    type: string
    number: string
    balance: number
    provider: string
    customer: ObjectId
    supplier: ObjectId
    monthly_fee: number
}

// Transaction schema interface
export interface transaction extends commonInterface {
    date: Date
    type: string
    cause: string
    number: string
    sale: ObjectId
    impact: boolean
    account: ObjectId
    expense: ObjectId
    reference: string
    purchase: ObjectId
    customer: ObjectId
    supplier: ObjectId
    total_amount: number
    account_type: string
    debt_history: ObjectId
    truck_order: ObjectId
    quotation_invoice: ObjectId
    account_to_impact: ObjectId
}

// Purchase schema interface
export interface purchase extends commonInterface {
    store: ObjectId,
    for_store_product: boolean
    use_supplier_account: boolean
}

// Sale schema interface
export interface sale extends commonInterface {
    buying_price: number
}

// Hotel schema interface
export interface hotel extends commonInterface {
    category: string
    rooms: { type: string, price: number }[]
}

// Attraction schema interface
export interface attraction extends commonInterface {
    category: string
    hotels: ObjectId[]
}

// Attraction item schema interface
export interface item extends commonInterface {
    prices: {
        expatriate: number
        east_africa: number
        non_resident: number
    }
}

// Attraction activity interface
export interface attraction_activity extends commonInterface {
    items: ObjectId[]
}

// Attraction quotation schema interface
export interface quotation extends commonInterface {
    trips: object[]
    total_margin: number
}

// Quotation invoice schema interface
export interface quotation_invoice extends commonInterface {
    quotation: ObjectId
}

// Customer schema interface
export interface customer extends commonInterface {
    email: string
    country: string
    identification: string
}