// dependencies
import pluralize from "pluralize"
import React from "react"
import { ActionButton, Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Checkbox, Input, Option, Select } from "../../components/form"
import { apiV1, getDate, isAdmin, isUser, noAccess, pageNotFound, paymentTypes, setPageTitle, text, } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, routerProps, serverResponse, stateKey } from "../../types"
import { Adjustment, CargoOrder, CustomerCount, Debt, DebtHistory, Expense, Order, Payment, Purchase, QuotationInvoice, Sale, Service, Stocks, TruckOrder } from "./components"
import Report from "./components/report"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"
import DataListComponent from "../../components/reusable/datalist"
import ReportTypeComponent from "../../components/reusable/report-component"
import aggregationPipeline from "./helper/aggregation"
import reportTypes from "./helper/types"

// report form memorized function component
const ReportForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        if (can("create_report")) {

            application.dispatch({ status: "" })

            setPageTitle("new report")

            const user = application.user
            const { branch }: any = user

            if (branch) {
                application.dispatch({
                    branch,
                    branches: [branch],
                    branchId: branch._id,
                    branchName: `${text.reFormat(branch.name)} - ${branch.phone_number}`
                })
            }

            if (isUser) {
                application.dispatch({
                    user,
                    users: [user],
                    userId: user._id,
                    userName: `${text.reFormat(user.username)} - ${user.phone_number}`
                })
            }

            if (props.location.state) {

                const { branch, product, customer, user, device, expense_type, truck }: any = props.location.state

                if (branch)
                    application.dispatch({
                        branch,
                        branches: [branch],
                        branchId: branch._id,
                        branchName: `${text.reFormat(branch.name)} - ${branch.phone_number}`
                    })
                else if (customer)
                    application.dispatch({
                        customer,
                        customers: [customer],
                        customerId: customer._id,
                        customerName: `${text.reFormat(customer.name)} - ${customer.phone_number}`
                    })
                else if (product)
                    application.dispatch({
                        product,
                        products: [product],
                        productId: product._id,
                        productName: text.reFormat(product.name)
                    })
                else if (user)
                    application.dispatch({
                        user,
                        users: [user],
                        userId: user._id,
                        userName: `${text.reFormat(user.username)} - ${user.phone_number}`
                    })
                else if (device)
                    application.dispatch({
                        device,
                        devices: [device],
                        deviceId: device._id,
                        reportType: "services",
                        deviceName: text.reFormat(device.name)
                    })
                else if (expense_type)
                    application.dispatch({
                        expense_type,
                        reportType: "expenses",
                        expense_types: [expense_type],
                        expense_typeId: expense_type._id,
                        expense_typeName: text.reFormat(expense_type.name)
                    })
                else if (truck)
                    application.dispatch({
                        truck,
                        trucks: [truck],
                        truckId: truck._id,
                        reportType: "truck_orders",
                        truckName: text.reFormat(truck.name)
                    })
            }

        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    React.useEffect(() => {
        for (const report of reportTypes)
            if (report)
                application.dispatch({
                    [report.type]: []
                })
        // eslint-disable-next-line
    }, [application.state.reportType])

    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            event.preventDefault()
            const errors: string[] = []

            if (string.isEmpty(application.state.reportType) || (application.state.reportType.trim() === "unMount")) {
                errors.push("")
                application.dispatch({ reportTypeError: "required" })
            }

            if (string.isEmpty(application.state.date)) {
                errors.push("")
                application.dispatch({ dateError: "required" })
            }

            if (string.isEmpty(application.state.dateTo)) {
                errors.push("")
                application.dispatch({ dateToError: "required" })
            }

            if (array.isEmpty(errors)) {

                // backend schema
                const schema = pluralize.singular(application.state.reportType) as stateKey

                // load deleted or visible data
                const visible: boolean = application.state.viewDeletedReport === "no" ? true : false

                // get date keyword according to current schema name, ie: date or createdAt
                const periodKey: string =
                    (application.state.reportType === "sales") ||
                        (application.state.reportType === "stocks") ||
                        (application.state.reportType === "services") ||
                        (application.state.reportType === "payments") ||
                        (application.state.reportType === "adjustments") ||
                        (application.state.reportType === "customer_counts") ||
                        (application.state.reportType === "orders") ? "createdAt" : "date"

                // start and end date
                const startDate: number = new Date(application.state.date).setHours(0, 0, 0, 0)
                const endDate: number = new Date(application.state.dateTo).setHours(23, 59, 59, 999)

                // get values from state
                const type = application.state.type
                const user = application.state.userId
                const truck = application.state.truckId
                const status = application.state.status
                const device = application.state.deviceId
                const branch = application.state.branchId
                const product = application.state.productId
                const customer = application.state.customerId
                const category = application.state.categoryId
                const supplier = application.state.supplierId
                const paymentType = application.state.paymentType
                const expense_type = application.state.expense_typeId

                // unpaid, paid and partial apaid condition
                const statusObject = status === "paid" ?
                    { $eq: ["$total_amount", "$paid_amount"] } : status === "unpaid" ?
                        { $eq: ["$paid_amount", 0] } : status === "partial_paid" ?
                            {
                                $and: [
                                    { $ne: ["$paid_amount", 0] },
                                    { $ne: ["$paid_amount", "$total_amount"] }
                                ]
                            }
                            : null

                let $and: any[] = []

                // expense, purchase, truck orders and freight conditions
                if ((schema === "expense") || (schema === "purchase") || (schema === "freight") || (schema === "truck_order") || (schema === "cargo")) {

                    // all
                    if (statusObject)
                        $and = [statusObject]

                    // expense condition
                    if (schema === "expense") {

                        if (string.isNotEmpty(expense_type))
                            $and = [...$and, { $eq: ["$expense_type", { $toObjectId: expense_type }] }]

                        if (string.isNotEmpty(truck))
                            $and = [...$and, { $eq: ["$truck", { $toObjectId: truck }] }]
                    }

                    // purchase conditions
                    if (schema === "purchase") {

                        if (string.isNotEmpty(product))
                            $and = [...$and, { $eq: ["$product", { $toObjectId: product }] }]

                        if (string.isNotEmpty(supplier))
                            $and = [...$and, { $eq: ["$supplier", { $toObjectId: supplier }] }]

                        if (string.isNotEmpty(type))
                            if (application.state.type.includes("store"))
                                $and = [{ $eq: ["$for_store_product", application.state.type === "store"] }]

                    }

                    // truck condition
                    if ((schema === "truck_order") || (schema === "cargo")) {
                        if (string.isNotEmpty(truck))
                            $and = [...$and, { $eq: ["$truck", { $toObjectId: truck }] }]

                        if (string.isNotEmpty(customer))
                            $and = [...$and, { $eq: ["$customer", { $toObjectId: customer }] }]
                    }

                }

                // adjustment conditions
                else if (schema === "adjustment") {

                    $and = [{ $ne: ["$from", "sale_cart"] }]

                    if (string.isNotEmpty(type))
                        $and = [...$and, { $eq: ["$type", type] }]

                    if (string.isNotEmpty(product))
                        $and = [...$and, { $eq: ["$product", { $toObjectId: product }] }]
                }

                // debts, debt history and order conditions
                else if ((schema === "debt_history") || (schema === "debt") || (schema === "order")) {

                    // debts condition
                    if (schema === "debt" && statusObject)
                        $and = [...$and, statusObject]

                    // order conditions
                    if (schema === "order")
                        $and = [{ $eq: ["$type", "order"] }]

                    // condition for all if customer has been selected
                    if (string.isNotEmpty(customer))
                        $and = [...$and, { $eq: ["$customer", { $toObjectId: customer }] }]

                }

                // payment conditions
                else if (schema === "payment") {
                    $and = [{ $eq: ["$status", "active"] }]

                    if (string.isNotEmpty(paymentType))
                        $and = [...$and, { $eq: ["$type", paymentType] }]
                }

                // customer count
                else if (schema === "customer_count") {
                    $and = [{ $gt: ["$number", 0] }]
                }

                // sale conditions
                else if (schema === "sale") {

                    $and = [
                        { $eq: ["$type", "sale"] },
                        { $ne: ["$status", "invoice"] }
                    ]

                    if (string.isNotEmpty(status))
                        $and = [...$and, { $eq: ["$status", status] }]

                    if (string.isNotEmpty(product))
                        $and = [...$and, { $eq: ["$product", { $toObjectId: product }] }]

                    if (string.isNotEmpty(customer))
                        $and = [...$and, { $eq: ["$customer", { $toObjectId: customer }] }]

                    if (string.isNotEmpty(category))
                        $and = [...$and, { $eq: ["$category", { $toObjectId: category }] }]
                }

                // stock conditions
                else if (schema === "stock") {
                    if (string.isNotEmpty(product))
                        $and = [{ $eq: ["$product", { $toObjectId: product }] }]
                    else if (string.isNotEmpty(type))
                        if (application.state.type.includes("store"))
                            $and = [{ $eq: ["$is_store_product", application.state.type === "store"] }]
                }

                // services conditions
                else if (schema === "service") {

                    if (string.isNotEmpty(status))
                        $and = [{ $eq: ["$status", status] }]

                    if (string.isNotEmpty(product))
                        $and = [...$and, { $eq: ["$product", { $toObjectId: product }] }]

                    if (string.isNotEmpty(device))
                        $and = [...$and, { $eq: ["$device", { $toObjectId: device }] }]

                    if (string.isNotEmpty(customer))
                        $and = [...$and, { $eq: ["$customer", { $toObjectId: customer }] }]

                }

                // if branch has been selected
                if (branch) {
                    $and = [
                        ...$and,
                        { $eq: ["$branch", { $toObjectId: branch }] }
                    ]
                }

                // if user has been selected
                if (user) {
                    $and = [
                        ...$and,
                        { $eq: ["$created_by", { $toObjectId: user }] }
                    ]
                }

                // request option
                const options: createOrUpdate = {
                    loading: true,
                    method: "POST",
                    route: apiV1 + "aggregation",
                    body: {
                        schema,
                        aggregation: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            ...$and,
                                            { $eq: ["$visible", visible] },
                                            { $lte: [`$${periodKey}`, { $toDate: endDate }] },
                                            { $gte: [`$${periodKey}`, { $toDate: startDate }] },
                                        ]
                                    }
                                }
                            },
                            ...aggregationPipeline[schema]
                        ]
                    },
                }

                // api request
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    const title = `${text.reFormat(application.state.reportType)} report from ${new Date(application.state.date).toDateString()} to ${new Date(application.state.dateTo).toDateString()}`
                    application.dispatch({ [application.state.reportType]: response.message, title })
                }
                else {
                    const message = string.isValid(response.message) ? response.message : `No data has been found`
                    application.dispatch({ notification: message, [application.state.reportType]: [] })
                }

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // printing report
    const printReport = (): void => {
        try {
            setPageTitle(application.state.title)
            window.print()
            setPageTitle("new report")
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // downloading excel
    const downloadExcel = (): void => {
        try {

            const collection: stateKey = application.state.reportType as stateKey
            const collectionData: any[] = application.state[collection]
            const newCollectionData: any[] = []

            for (const data of collectionData) {
                let newData: any = {}
                for (const dataKey in data) {
                    if (data[dataKey]) {
                        if (dataKey === "createdAt")
                            newData["DATE"] = getDate(data[dataKey])
                        else if (dataKey === "created_by")
                            newData["USER"] = text.reFormat(data[dataKey]?.username)
                        else {
                            if (typeof data[dataKey] === "object")
                                newData[text.reFormat(dataKey).toUpperCase()] = text.reFormat(data[dataKey]?.username ? data[dataKey]?.username : data[dataKey]?.name)
                            else
                                newData[text.reFormat(dataKey).toUpperCase()] = data[dataKey]
                        }
                    }
                }
                newCollectionData.push(newData)
            }

            application.arrayToExcel(newCollectionData, application.state.title)

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    return (
        <>
            <div className="row hide-on-print">
                <div className="col s12 m4 l4">
                    <div className="card">
                        <CardTitle title="new report" />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <ReportTypeComponent />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            type="date"
                                            name="date"
                                            label="start date (from)"
                                            value={application.state.date}
                                            error={application.state.dateError}
                                            onChange={application.handleInputChange}
                                            max={new Date().toISOString().substring(0, 10)}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            type="date"
                                            name="dateTo"
                                            label="end date (to)"
                                            min={application.state.date}
                                            value={application.state.dateTo}
                                            error={application.state.dateToError}
                                            onChange={application.handleInputChange}
                                            max={new Date().toISOString().substring(0, 10)}
                                            disabled={string.isEmpty(application.state.date)}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <DataListComponent for="branch" disabled={!isAdmin} />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <DataListComponent
                                            for="user"
                                            disabled={isUser}
                                        />
                                    </div>
                                </div>
                                {
                                    (application.state.reportType === "truck_orders") || (application.state.reportType === "cargos") || ((application.state.reportType === "expenses") && can("view_truck_on_expense"))
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <DataListComponent for="truck" />
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    application.state.reportType === "adjustments"
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <Select
                                                    name="type"
                                                    label="adjustment type"
                                                    value={application.state.type}
                                                    error={application.state.typeError}
                                                    onChange={application.handleInputChange}
                                                >
                                                    <Option value={""} label={translate("select adjustment type")} />
                                                    <Option value={"decrease"} label={translate("decreased adjustments")} />
                                                    <Option value={"increase"} label={translate("increased adjustments")} />
                                                </Select>
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    (application.state.reportType === "expenses") || (application.state.reportType === "purchases") || (application.state.reportType === "debts") || (application.state.reportType === "truck_orders") || (application.state.reportType === "cargos")
                                        ?
                                        <>
                                            {
                                                application.state.reportType === "purchases"
                                                    ?
                                                    <div className="row">
                                                        <div className="col s12">
                                                            <DataListComponent for="supplier" />
                                                        </div>
                                                    </div>
                                                    : null
                                            }
                                            <div className="row">
                                                <div className="col s12">
                                                    <Select
                                                        name="status"
                                                        label="status"
                                                        value={application.state.status}
                                                        error={application.state.statusError}
                                                        onChange={application.handleInputChange}
                                                    >
                                                        <Option value={""} label={translate("select status")} />
                                                        <Option value={"paid"} label={translate("paid")} />
                                                        <Option value={"unpaid"} label={translate("unpaid")} />
                                                        <Option value={"partial_paid"} label={translate("partial paid")} />
                                                    </Select>
                                                </div>
                                            </div>
                                        </>
                                        : null
                                }
                                {
                                    application.state.reportType === "sales"
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <Select
                                                    name="status"
                                                    label="sale status"
                                                    value={application.state.status}
                                                    error={application.state.statusError}
                                                    onChange={application.handleInputChange}
                                                >
                                                    <Option value={""} label={translate("select sale status")} />
                                                    <Option value={"cash"} label={translate("cash sales")} />
                                                    <Option value={"credit"} label={translate("credit sales")} />
                                                </Select>
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    application.state.reportType === "services"
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <Select
                                                    name="status"
                                                    label="status"
                                                    value={application.state.status}
                                                    error={application.state.statusError}
                                                    onChange={application.handleInputChange}
                                                >
                                                    <Option value={""} label={translate("select service status")} />
                                                    <Option value={"completed"} label={translate("completed")} />
                                                    <Option value={"incomplete"} label={translate("incomplete")} />
                                                </Select>
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    (application.state.reportType === "sales") || (application.state.reportType === "purchases") || (application.state.reportType === "adjustments") || (application.state.reportType === "debts") || (application.state.reportType === "debt_histories") || (application.state.reportType === "orders") || (application.state.reportType === "stocks") || (application.state.reportType === "services") || (application.state.reportType === "truck_orders") || (application.state.reportType === "quotation_invoices")
                                        ?
                                        <>
                                            {
                                                (application.state.reportType === "sales") || (application.state.reportType === "purchases") || (application.state.reportType === "adjustments") || (application.state.reportType === "stocks") || (application.state.reportType === "services")
                                                    ?
                                                    <>
                                                        <div className="row">
                                                            <div className="col s12">
                                                                <DataListComponent for="product" />
                                                            </div>
                                                        </div>
                                                        {
                                                            (application.state.reportType === "purchases") || (application.state.reportType === "stocks")
                                                                ?
                                                                <div className="row">
                                                                    <div className="col s12">
                                                                        <Select
                                                                            name="type"
                                                                            label="product type"
                                                                            value={application.state.type}
                                                                            error={application.state.typeError}
                                                                            onChange={application.handleInputChange}
                                                                        >
                                                                            <Option label={"select product type"} value="" />
                                                                            <Option label={"store products"} value="store" />
                                                                            <Option label={"no store products"} value="no_store" />
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                                : null
                                                        }
                                                    </>
                                                    : null
                                            }
                                            {
                                                application.state.reportType === "services"
                                                    ? <div className="row">
                                                        <div className="col s12">
                                                            <DataListComponent for="device" />
                                                        </div>
                                                    </div>
                                                    : null
                                            }
                                            {
                                                (application.state.reportType === "sales") || (application.state.reportType === "debts") || (application.state.reportType === "debt_histories") || (application.state.reportType === "orders") || (application.state.reportType === "truck_orders") || (application.state.reportType === "quotation_invoices")
                                                    ?
                                                    <div className="row">
                                                        <div className="col s12">
                                                            <DataListComponent for="customer" />
                                                        </div>
                                                    </div>
                                                    : null
                                            }
                                            {
                                                application.state.reportType === "sales"
                                                    ?
                                                    <div className="row">
                                                        <div className="col s12">
                                                            <DataListComponent for="category" />
                                                        </div>
                                                    </div>
                                                    : null
                                            }
                                        </>
                                        : null
                                }
                                {
                                    application.state.reportType === "expenses"
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <DataListComponent for="expense_type" />
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    application.state.reportType === "payments"
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <Select
                                                    name="paymentType"
                                                    label="payment type"
                                                    value={application.state.paymentType}
                                                    error={application.state.paymentTypeError}
                                                    onChange={application.handleInputChange}
                                                >
                                                    <Option value={""} label={translate("select payment type")} />
                                                    {
                                                        paymentTypes.sort().map((paymentType: string, index: number) => (
                                                            <Option value={paymentType} key={index} label={translate(text.reFormat(paymentType))} />
                                                        ))
                                                    }
                                                </Select>
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    can("view_deleted_data_report")
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <Checkbox
                                                    name="viewDeletedReport"
                                                    label={`deleted data report`}
                                                    onChange={application.handleInputChange}
                                                    value={application.state.viewDeletedReport === "no" ? "yes" : "no"}
                                                    checked={application.state.viewDeletedReport === "yes"}
                                                />
                                            </div>
                                        </div>
                                        : null
                                }
                                <div className="row">
                                    <div className="col s12 center">
                                        <Button
                                            title={application.buttonTitle}
                                            loading={application.state.loading}
                                            disabled={application.state.disabled}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="col s12 m8 l8">
                    <div className="card">
                        <CardTitle title={`${application.state.viewDeletedReport === "yes" ? "deleted" : ""} ${application.state.reportType !== "unMount" ? `${application.state.reportType} report` : "report"}`} />
                        <div className="card-content">
                            {
                                application.state.reportType === "adjustments"
                                    ? <Adjustment data={application.state.adjustments} />
                                    : application.state.reportType === "debt_histories"
                                        ? <DebtHistory data={application.state.debt_histories} />
                                        : application.state.reportType === "debts"
                                            ? <Debt data={application.state.debts} />
                                            : application.state.reportType === "expenses" || application.state.reportType === "freights"
                                                ? <Expense data={application.state[application.state.reportType]} />
                                                : application.state.reportType === "orders"
                                                    ? <Order data={application.state.orders} />
                                                    : application.state.reportType === "payments"
                                                        ? <Payment data={application.state.payments} />
                                                        : application.state.reportType === "purchases"
                                                            ? <Purchase data={application.state.purchases} />
                                                            : application.state.reportType === "sales"
                                                                ? <Sale data={application.state.sales} />
                                                                : application.state.reportType === "customer_counts"
                                                                    ? <CustomerCount data={application.state.customer_counts} />
                                                                    : application.state.reportType === "truck_orders"
                                                                        ? <TruckOrder data={application.state[application.state.reportType]} />
                                                                        : application.state.reportType === "stocks"
                                                                            ? <Stocks data={application.state.stocks} />
                                                                            : application.state.reportType === "services"
                                                                                ? <Service data={application.state.services} />
                                                                                : application.state.reportType === "cargos"
                                                                                    ? <CargoOrder data={application.state.cargos} />
                                                                                    : application.state.reportType === "quotation_invoices"
                                                                                        ? <QuotationInvoice data={application.state.quotation_invoices} />
                                                                                        : null
                            }
                        </div>
                        {
                            can("print_report") && (
                                array.hasElements(application.state.debts) ||
                                array.hasElements(application.state.sales) ||
                                array.hasElements(application.state.orders) ||
                                array.hasElements(application.state.stocks) ||
                                array.hasElements(application.state.cargos) ||
                                array.hasElements(application.state.payments) ||
                                array.hasElements(application.state.freights) ||
                                array.hasElements(application.state.expenses) ||
                                array.hasElements(application.state.services) ||
                                array.hasElements(application.state.purchases) ||
                                array.hasElements(application.state.adjustments) ||
                                array.hasElements(application.state.truck_orders) ||
                                array.hasElements(application.state.debt_histories) ||
                                array.hasElements(application.state.customer_counts) ||
                                array.hasElements(application.state.quotation_invoices)
                            )
                                ?
                                <div className="action-button">
                                    <ActionButton
                                        to="#"
                                        icon="print"
                                        tooltip="print report"
                                        type="success"
                                        onClick={printReport}
                                    />
                                    <ActionButton
                                        to="#"
                                        icon="calculate"
                                        tooltip="download excel"
                                        type="primary"
                                        onClick={downloadExcel}
                                    />
                                </div>
                                : null
                        }
                    </div>
                </div>
            </div>
            {
                can("view_income_statement")
                    ? <FloatingButton to="/report/income-statement" tooltip="income statement" icon="add_circle" />
                    : null
            }
            <Report
                type="report"
                title={application.state.title}
                report={application.state.reportType}
                branch={string.isNotEmpty(application.state.branchId) ? application.state.branch : null}
                customer={string.isNotEmpty(application.state.customerId) ? application.state.customer : null}
            >
                {
                    application.state.reportType === "adjustments"
                        ? <Adjustment data={application.state.adjustments} />
                        : application.state.reportType === "debt_histories"
                            ? <DebtHistory data={application.state.debt_histories} />
                            : application.state.reportType === "debts"
                                ? <Debt data={application.state.debts} />
                                : application.state.reportType === "expenses" || application.state.reportType === "freights"
                                    ? <Expense data={application.state[application.state.reportType]} />
                                    : application.state.reportType === "orders"
                                        ? <Order data={application.state.orders} />
                                        : application.state.reportType === "payments"
                                            ? <Payment data={application.state.payments} />
                                            : application.state.reportType === "purchases"
                                                ? <Purchase data={application.state.purchases} />
                                                : application.state.reportType === "sales"
                                                    ? <Sale data={application.state.sales} />
                                                    : application.state.reportType === "customer_counts"
                                                        ? <CustomerCount data={application.state.customer_counts} />
                                                        : application.state.reportType === "truck_orders"
                                                            ? <TruckOrder data={application.state.truck_orders} />
                                                            : application.state.reportType === "stocks"
                                                                ? <Stocks data={application.state.stocks} />
                                                                : application.state.reportType === "services"
                                                                    ? <Service data={application.state.services} />
                                                                    : application.state.reportType === "cargos"
                                                                        ? <CargoOrder data={application.state.cargos} />
                                                                        : application.state.reportType === "quotation_invoices"
                                                                            ? <QuotationInvoice data={application.state.quotation_invoices} />
                                                                            : null
                }
            </Report>
        </>
    )

})

export default ReportForm