
// common values
const limit = { $limit: 10000 }
const sort = { $sort: { date: 1 } }

// aggregations pipeline
const adjustmentPipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            type: { $first: "$type" },
            cause: { $first: "$from" },
            date: { $first: "$createdAt" },
            product: { $first: "$product" },
            category: { $first: "$category" },
            adjustment: { $first: "$adjustment" },
            description: { $first: "$description" },
            after_adjustment: { $first: "$after_adjustment" },
            before_adjustment: { $first: "$before_adjustment" },
        }
    },
    {
        $lookup: {
            as: "product",
            from: "products",
            foreignField: "_id",
            localField: "product",
        }
    },
    {
        $lookup: {
            as: "category",
            from: "categories",
            foreignField: "_id",
            localField: "category"
        }
    },
    {
        $project: {
            _id: 1,
            date: 1,
            type: 1,
            description: 1,
            adjustment: 1,
            after_adjustment: 1,
            before_adjustment: 1,
            product: { $arrayElemAt: ["$product.name", 0] },
            category: { $arrayElemAt: ["$category.name", 0] }
        }
    },
    limit,
    sort
]

// debt history pipelines
const debtHistoryPipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            debt: { $first: "$debt" },
            date: { $first: "$date" },
            expense: { $first: "$expense" },
            customer: { $first: "$customer" },
            supplier: { $first: "$supplier" },
            paid_amount: { $first: "$paid_amount" },
            total_amount: { $first: "$total_amount" },
        },
    },

    {
        $lookup: {
            as: "customer",
            from: "customers",
            foreignField: "_id",
            localField: "customer",
        }
    },

    {
        $lookup: {
            as: "supplier",
            from: "suppliers",
            foreignField: "_id",
            localField: "supplier",
        }
    },
    {
        $lookup: {
            as: "expense",
            from: "expenses",
            foreignField: "_id",
            localField: "expense",
        }
    },
    {
        $lookup: {
            as: "debt",
            from: "debts",
            foreignField: "_id",
            localField: "debt",
        }
    },
    {
        $project: {
            _id: 1,
            date: 1,
            paid_amount: 1,
            total_amount: 1,
            type: { $arrayElemAt: ["$debt.type", 0] },
            expense: { $arrayElemAt: ["$expense.name", 0] },
            customer: { $arrayElemAt: ["$customer.name", 0] },
            supplier: { $arrayElemAt: ["$supplier.name", 0] },
            debt: { $arrayElemAt: ["$debt.total_amount", 0] },
        },
    },
    limit,
    sort
]

// debt pipeline
const debtPipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            date: { $first: "$date" },
            type: { $first: "$type" },
            expense: { $first: "$expense" },
            customer: { $first: "$customer" },
            supplier: { $first: "$supplier" },
            paid_amount: { $first: "$paid_amount" },
            total_amount: { $first: "$total_amount" },
        },
    },

    {
        $lookup: {
            as: "customer",
            from: "customers",
            foreignField: "_id",
            localField: "customer",
        }
    },

    {
        $lookup: {
            as: "supplier",
            from: "suppliers",
            foreignField: "_id",
            localField: "supplier",
        }
    },
    {
        $lookup: {
            as: "expense",
            from: "expenses",
            foreignField: "_id",
            localField: "expense",
        }
    },
    {
        $project: {
            _id: 1,
            type: 1,
            date: 1,
            paid_amount: 1,
            total_amount: 1,
            expense: { $arrayElemAt: ["$expense.name", 0] },
            customer: { $arrayElemAt: ["$customer.name", 0] },
            supplier: { $arrayElemAt: ["$supplier.name", 0] },
            remain_amount: { $subtract: ["$total_amount", "$paid_amount"] }
        },
    },
    limit,
    sort
]

// expense pipeline
const expensePipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            date: { $first: "$date" },
            name: { $first: "$name" },
            paid_amount: { $first: "$paid_amount" },
            total_amount: { $first: "$total_amount" },
        },
    },
    {
        $project: {
            _id: 1,
            date: 1,
            name: 1,
            paid_amount: 1,
            total_amount: 1,
            remain_amount: { $subtract: ["$total_amount", "$paid_amount"] }
        }
    },
    limit,
    sort
]

// order pipeline
const orderPipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            sales: { $first: "$sales" },
            number: { $first: "$number" },
            date: { $first: "$createdAt" },
            customer: { $first: "$customer" },
        },
    },
    {
        $lookup: {
            as: "customer",
            from: "customers",
            foreignField: "_id",
            localField: "customer",
        }
    },
    {
        $lookup: {
            as: "sales",
            from: "sales",
            foreignField: "_id",
            localField: "sales",
        }
    },
    {
        $project: {
            _id: 1,
            date: 1,
            number: 1,
            length: { $size: "$sales" },
            total_amount: { $sum: "$sales.total_amount" },
            customer: { $arrayElemAt: ["$customer.name", 0] }
        }
    },
    limit,
    sort
]

// payment pipeline
const paymentPipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            type: { $first: "$type" },
            branch: { $first: "$branch" },
            date: { $first: "$createdAt" },
            total_amount: { $first: "$total_amount" }
        }
    },
    {
        $lookup: {
            as: "branch",
            from: "branches",
            foreignField: "_id",
            localField: "branch",
        }
    },
    {
        $project: {
            type: 1,
            date: 1,
            total_amount: 1,
            branch: { $arrayElemAt: ["$branch.name", 0] }
        }
    },
    limit,
    sort
]

// purchase pipeline
const purchasePipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            date: { $first: "$date" },
            product: { $first: "$product" },
            category: { $first: "$category" },
            quantity: { $first: "$quantity" },
            paid_amount: { $first: "$paid_amount" },
            total_amount: { $first: "$total_amount" },
        }
    },
    {
        $lookup: {
            as: "product",
            from: "products",
            foreignField: "_id",
            localField: "product"
        }
    },
    {
        $lookup: {
            as: "category",
            from: "categories",
            foreignField: "_id",
            localField: "category"
        }
    },
    {
        $project: {
            _id: 1,
            date: 1,
            quantity: 1,
            paid_amount: 1,
            total_amount: 1,
            product: { $arrayElemAt: ["$product.name", 0] },
            category: { $arrayElemAt: ["$category.name", 0] },
            remain_amount: { $subtract: ["$total_amount", "$paid_amount"] }
        }
    },
    limit,
    sort,
]

// sale pipeline
const salePipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            status: { $first: "$status" },
            profit: { $first: "$profit" },
            date: { $first: "$createdAt" },
            product: { $first: "$product" },
            category: { $first: "$category" },
            quantity: { $first: "$quantity" },
            discount: { $first: "$discount" },
            total_amount: { $first: "$total_amount" },
        }
    },
    {
        $lookup: {
            as: "product",
            from: "products",
            foreignField: "_id",
            localField: "product"
        }
    },
    {
        $lookup: {
            as: "category",
            from: "categories",
            foreignField: "_id",
            localField: "category"
        }
    },
    {
        $project: {
            _id: 1,
            date: 1,
            status: 1,
            profit: 1,
            discount: 1,
            quantity: 1,
            total_amount: 1,
            product: { $arrayElemAt: ["$product.name", 0] },
            category: { $arrayElemAt: ["$category.name", 0] },
            loss: {
                $cond: {
                    if: { $lt: ["$profit", 0] },
                    then: "$profit",
                    else: 0
                }
            }
        }
    },
    limit,
    sort,
]

// customer count pipeline
const customerCountPipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            number: { $first: "$number" },
            date: { $first: "$createdAt" },
        }
    },
    limit,
    sort
]

// stock pipelime
const stockPipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            stock: { $first: "$stock" },
            date: { $first: "$createdAt" },
            product: { $first: "$product" },
        }
    },
    {
        $lookup: {
            as: "product",
            from: "products",
            foreignField: "_id",
            localField: "product"
        }
    },
    {
        $project: {
            _id: 1,
            date: 1,
            stock: 1,
            product: { $arrayElemAt: ["$product.name", 0] }
        }
    },
    limit,
    sort
]

// service pipeline
const servicePipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            status: { $first: "$status" },
            number: { $first: "$number" },
            date: { $first: "$createdAt" },
            service: { $first: "$service" },
            service_cost: { $first: "$service_cost" },
            product_cost: { $first: "$product_cost" },
        }
    },
    {
        $project: {
            _id: 1,
            date: 1,
            status: 1,
            number: 1,
            service: 1,
            service_cost: 1,
            product_cost: 1,
            total_cost: { $add: ["$service_cost", "$product_cost"] }
        }
    },
    limit,
    sort
]

// truck order pipeline
const truckOrderPipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            date: { $first: "$date" },
            number: { $first: "$number" },
            status: { $first: "$status" },
            distance: { $first: "$distance" },
            route: { $first: "$route_name" },
            customer: { $first: "$customer" },
            paid_amount: { $first: "$paid_amount" },
            total_amount: { $first: "$total_amount" },
        }
    },
    {
        $lookup: {
            as: "customer",
            from: "customers",
            foreignField: "_id",
            localField: "customer"
        }
    },
    {
        $project: {
            _id: 1,
            date: 1,
            route: 1,
            status: 1,
            number: 1,
            distance: 1,
            paid_amount: 1,
            total_amount: 1,
            customer: { $arrayElemAt: ["$customer.name", 0] },
            remain_amount: { $subtract: ["$total_amount", "$paid_amount"] }
        }
    },
    limit,
    sort
]

// quotation invoice pipeline
const quotationInvoicePipeline: object[] = [
    {
        $group: {
            _id: "$_id",
            date: { $first: "$date" },
            number: { $first: "$number" },
            customer: { $first: "$customer" },
            paid_amount: { $first: "$paid_amount" },
            total_amount: { $first: "$total_amount" },
        }
    },
    {
        $lookup: {
            as: "customer",
            from: "customers",
            foreignField: "_id",
            localField: "customer"
        }
    },
    {
        $project: {
            _id: 1,
            date: 1,
            number: 1,
            paid_amount: 1,
            total_amount: 1,
            customer: { $arrayElemAt: ["$customer.name", 0] },
            remain_amount: { $subtract: ["$total_amount", "$paid_amount"] }
        }
    },
    limit,
    sort
]


// pipeline object
const aggregationPipeline: any = {
    sale: salePipeline,
    debt: debtPipeline,
    order: orderPipeline,
    stock: stockPipeline,
    expense: expensePipeline,
    service: servicePipeline,
    freight: expensePipeline,
    payment: paymentPipeline,
    purchase: purchasePipeline,
    adjustment: adjustmentPipeline,
    truck_order: truckOrderPipeline,
    debt_history: debtHistoryPipeline,
    customer_count: customerCountPipeline,
    quotation_invoice: quotationInvoicePipeline
}

export default aggregationPipeline