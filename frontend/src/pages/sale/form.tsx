// dependencies
import React from "react"
import { createOrUpdate, readOrDelete, routerProps, sendMessage, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { CardTitle } from "../../components/card"
import { ActionButton, Button, FloatingButton } from "../../components/button"
import DataListComponent from "../../components/reusable/datalist"
import NumberComponent from "../../components/reusable/number-component"
import { can } from "../../helpers/permissions"
import { Checkbox, Input, Option, Select } from "../../components/form"
import DepositOrWithdraw from "../../components/deposit_withdraw"
import { array, number, string } from "fast-web-kit"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import translate from "../../helpers/translator"
import Report from "../report/components/report"
import Invoice from "./invoice"
import { Link } from "react-router-dom"

// sale form memorized function component
const SaleForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        // checking user permission
        if (can("create_sale") || can("create_order") || can("create_proforma_invoice")) {
            const pathname: string = props.location.pathname
            const pos: "cart" | "invoice" | "order" = pathname.includes("invoice") ? "invoice" : pathname.includes("order") ? "order" : "cart"
            setPageTitle(`New ${pos === "cart" ? "sale" : pos}`)
            onMount(pos)
            getOrderNumber(pos)
            application.dispatch({ schema: "sale", collection: "sales", pos })
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // eslint-disable-next-line
    }, [application.state.customerId])

    React.useEffect(() => {
        createCustomerCount()
        // eslint-disable-next-line
    }, [])
    // form validation async function
    async function validateForm(event: React.ChangeEvent<HTMLFormElement>): Promise<void> {
        try {

            // prevent form default submit
            event.preventDefault()

            // errors store
            const errors: string[] = []

            // account
            const account = application.state.secondAccountData

            // prices and numbers
            const stock: number = number.reFormat(application.state.stock)
            const quantity: number = number.reFormat(application.state.quantity)
            const buyingPrice: number = number.reFormat(application.state.buyingPrice) || 0
            const sellingPrice: number = number.reFormat(application.state.sellingPrice) || 0
            const productSellingPrice: number = application.state.product?.selling_price || 0

            // product validation
            if (string.isEmpty(application.state.productName)) {
                errors.push("")
                application.dispatch({ productNameError: "required" })
            }
            else if (string.isEmpty(application.state.productId)) {
                errors.push("")
                application.dispatch({ productNameError: "product does not exist" })
            }
            else if (buyingPrice <= 0) {
                errors.push("")
                application.dispatch({ productNameError: "update product buying price" })
            }

            // product values validation
            if (string.isNotEmpty(application.state.productId)) {

                if (string.isEmpty(application.state.quantity)) {
                    errors.push("")
                    application.dispatch({ quantityError: "required" })
                }
                else if (quantity <= 0) {
                    errors.push("")
                    application.dispatch({ quantityError: "can't be less or equal to zero" })
                }

                if (string.isEmpty(application.state.sellingPrice)) {
                    errors.push("")
                    application.dispatch({ sellingPriceError: "required" })
                }
                else if (sellingPrice <= 0) {
                    errors.push("")
                    application.dispatch({ sellingPriceError: "can't be less or equal to zero" })
                }

                if (application.state.pos !== "invoice") {

                    if (string.isEmpty(application.state.stock)) {
                        errors.push("")
                        application.dispatch({ stockError: "required" })
                    }
                    else if ((stock <= 0) || (quantity > stock)) {
                        errors.push("")
                        application.dispatch({ stockError: "no enough stock" })
                    }

                }
            }

            // customer validation
            if ((application.state.pos !== "cart") || (application.state.status === "credit")) {

                if (string.isEmpty(application.state.customerName)) {
                    errors.push("")
                    application.dispatch({ customerNameError: "required" })
                }
                else if (string.isEmpty(application.state.customerId)) {
                    errors.push("")
                    application.dispatch({ customerNameError: "customer does not exist" })
                }
            }

            if (array.isEmpty(errors)) {

                const discount = application.user.branch._id === "636e249d4e980c0257a222e7" ? 0 : (productSellingPrice - sellingPrice) * quantity
                // new sale
                const sale = {
                    discount,
                    quantity,
                    stock_before: stock,
                    ...application.onCreate,
                    type: application.state.pos,
                    stock_after: stock - quantity,
                    product: application.state.productId,
                    total_amount: sellingPrice * quantity,
                    profit: (sellingPrice - buyingPrice) * quantity,
                    status: application.state.pos === "invoice" ? "invoice" : application.state.status,
                    account: account && (application.state.useCustomerAccount === "no") ? account._id : null,
                    reference: string.isNotEmpty(application.state.reference) ? application.state.reference : null,
                    use_customer_account: application.state.useCustomerAccount === "yes" && !account ? true : false,
                    category: string.isNotEmpty(application.state.categoryId) ? application.state.categoryId : null,
                    customer: string.isNotEmpty(application.state.customerId) ? application.state.customerId : null,
                    createdAt: string.isNotEmpty(application.state.date) ? application.state.date : new Date().toISOString(),
                }

                // request options
                const options: createOrUpdate = {
                    loading: true,
                    method: "POST",
                    route: apiV1 + "create",
                    body: {
                        schema: "sale",
                        documentData: sale
                    }
                }

                // api request
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.dispatch({
                        stock: "",
                        quantity: "",
                        products: [],
                        product: null,
                        productId: "",
                        productName: "",
                        sellingPrice: "",
                        buyingPrice: "",
                        secondAccount: "",
                        secondAccounts: [],
                        secondAccountData: null,
                        useCustomerAccount: "no",
                        notification: application.successMessage,
                        sales: [response.message, ...application.state.sales],
                    })
                }
                else
                    application.dispatch({ notification: response.message })

            }


        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    async function createCustomerCount(): Promise<void> {
        try {

            const condition: string = JSON.stringify({
                created_by: application.user._id,
                createdAt: { $gte: new Date().setHours(0, 0, 0) }
            })

            const customerCountExist = await application.readOrDelete({
                method: "GET",
                loading: true,
                disabled: false,
                route: apiV1 + "read",
                parameters: `schema=customer_count&condition=${condition}&select=${JSON.stringify({ _id: 1 })}`
            })

            if (!customerCountExist.success) {
                application.createOrUpdate({
                    loading: true,
                    method: "POST",
                    route: apiV1 + "create",
                    body: {
                        schema: "customer_count",
                        documentData: {
                            number: 0,
                            ...application.onCreate
                        }
                    }
                })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    async function getOrderNumber(type: "order" | "invoice" | "cart"): Promise<void> {
        try {
            if (type !== "cart") {
                const condition: string = JSON.stringify({ branch: application.user.branch._id, type })
                const parameters: string = `schema=order&condition=${condition}`
                const options: readOrDelete = {
                    route: apiV1 + "count",
                    method: "GET",
                    loading: true,
                    disabled: false,
                    parameters
                }
                const response: serverResponse = await application.readOrDelete(options)

                application.dispatch({ orderNumber: Number(response.message) <= 0 ? 1 : response.message + 1 })

            }
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })

        }
    }

    const sendMessage = (sales: any[]): void => {
        try {

            if (sales.length > 0) {
                let message: string = ``
                const total_amount: number = sales.map((sale: any) => sale.total_amount).reduce((a: number, b: number) => a + b, 0)
                message = `Jumla ya manunuzi yako kwenye duka la ${text.reFormat(application.user.branch.name).toUpperCase()} ni kiasi cha TZS ${number.format(total_amount)}${application.state.debt ? `, deni lako la nyuma ni kiasi cha TZS ${number.format(application.state.debt)}, jumla ni ${number.format(total_amount + application.state.debt)}` : ""}.\n\n`
                const customer = application.state.customer
                const payments: any[] = application.user.branch.settings.payment_methods
                const mpesa = payments.filter((payment: any) => payment.vendor === "M-PESA")[0]
                const tigo = payments.filter((payment: any) => payment.vendor === "TIGOPESA")[0]
                const nmb = payments.filter((payment: any) => payment.vendor === "NMB BANK")[0]
                const crdb = payments.filter((payment: any) => payment.vendor === "CRDB BANK")[0]

                const paymentMethods: string = `1. Lipa namba Voda: ${mpesa.account}\n2. Lipa namba Tigo: ${tigo.account}\n3. Akaunti NMB: ${nmb.account}\n4. Akaunti CRDB: ${crdb.account}\nJina: ${text.reFormat(application.user.branch.name).toUpperCase()}.`
                message = message + paymentMethods

                if (customer) {
                    const options: sendMessage = {
                        message,
                        receivers: [`+${customer.phone_number}`]
                    }
                    application.sendMessage(options)
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    async function onMount(type: "cart" | "order" | "invoice"): Promise<void> {
        try {

            let saleCondition: object = commonCondition(true)
            let hasCustomer: boolean = false
            const customerId = application.state.customerId.trim()

            if (props.location.state) {
                const { customer, product }: any = props.location.state
                if (customer) {
                    hasCustomer = true
                    saleCondition = { ...saleCondition, customer: customer._id }
                    application.dispatch({
                        customer,
                        customers: [customer],
                        customerId: customer._id,
                        customerName: `${text.reFormat(customer.name)} - ${customer.phone_number}`,
                    })
                }
                else if (product && !product.is_store_product) {
                    application.dispatch({
                        products: [product],
                        productId: product._id,
                        stock: product.stock?.toString(),
                        productName: text.reFormat(product.name),
                        buyingPrice: product.buying_price?.toString(),
                        sellingPrice: product.selling_price?.toString(),
                    })
                }
            }

            if (string.isNotEmpty(customerId) && (type !== "cart")) {
                hasCustomer = true
                saleCondition = { ...saleCondition, customer: customerId }
            }

            const joinForeignKeys: boolean = true
            const sort: string = JSON.stringify({ createdAt: -1 })
            const condition: string = JSON.stringify({ ...saleCondition, type, created_by: application.user._id })
            const select: string = JSON.stringify({ quantity: 1, total_amount: 1, discount: 1, status: 1, type: 1, user_customer_account: 1, account: 1, category: 1, created_by: 0, updated_by: 0, branch: 0, })
            const parameters: string = `schema=sale&condition=${condition}&select=${select}&sort=${sort}&joinForeignKeys=${joinForeignKeys}`

            // request options
            const options: readOrDelete = {
                route: apiV1 + "list-all",
                method: "GET",
                loading: true,
                disabled: false,
                parameters
            }

            if ((type === "cart") || hasCustomer) {
                // api request
                const response: serverResponse = await application.readOrDelete(options)

                loadCustomerDebt()
                if (response.success)
                    application.dispatch({ sales: response.message })
                else
                    application.dispatch({ notification: response.message })

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    async function loadCustomerDebt(): Promise<void> {
        try {

            if (string.isNotEmpty(application.state.customerId)) {
                const options: createOrUpdate = {
                    method: "POST",
                    loading: false,
                    route: apiV1 + "aggregation",
                    body: {
                        schema: "debt",
                        aggregation: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { visible: true },
                                            { status: "unpaid" },
                                            { type: "customer_is_owed" },
                                            { $eq: ["$customer", { $toObjectId: application.state.customerId }] },
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: "$type",
                                    paid_amount: { $sum: "$paid_amount" },
                                    total_amount: { $sum: "$total_amount" }
                                }
                            },
                        ]
                    },
                }

                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    const debt = response.message[0]
                    if (debt)
                        application.dispatch({ debt: debt.total_amount - debt.paid_amount })
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // remove from cart
    const removeFromCart = async (_id?: string): Promise<void> => {
        try {

            const options: createOrUpdate = {
                route: apiV1 + "bulk-update",
                method: "PUT",
                loading: true,
                body: _id ? [
                    {
                        schema: "sale",
                        condition: { _id },
                        newDocumentData: {
                            visible: false,
                            ...application.onUpdate
                        }
                    }
                ] :
                    application.state.ids.map((id: string) => (
                        {
                            schema: "sale",
                            condition: { _id: id },
                            newDocumentData: {
                                visible: false,
                                ...application.onUpdate
                            }
                        }
                    ))
            }

            const response: serverResponse = await application.createOrUpdate(options)

            if (response.success) {

                if (_id) {
                    const newList = application.state.sales.filter((sale: any) => sale._id !== _id)
                    application.dispatch({ sales: newList, secondAccounts: [], secondAccount: "", secondAccountData: null })
                }
                else {
                    const newList = application.state[application.state.collection].filter((data: any) => !application.state.ids.some((deletedData: any) => data._id === deletedData))
                    application.dispatch({ sales: newList })
                }
                application.dispatch({ notification: `Product${_id ? " has" : "s have"} been removed from cart`, ids: [] })

            }
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const quantityChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        try {

            const { name, value } = event.target
            const newQuantity = Number(value)

            if (newQuantity >= 1) {
                const sale = application.state.sales.filter((saleData: any) => saleData._id === name)[0]
                if (sale && (sale.quantity !== newQuantity)) {
                    const productOldStock = sale.quantity + sale.product.stock
                    if (newQuantity <= productOldStock) {

                        const sellingPrice = sale.total_amount / sale.quantity

                        const update = {
                            schema: "sale",
                            condition: { _id: sale._id },
                            newDocumentData: {
                                $set: {
                                    visible: false,
                                    ...application.onUpdate,
                                }
                            }
                        }

                        const create = {
                            schema: "sale",
                            documentData: {
                                type: sale.type,
                                status: sale.status,
                                quantity: newQuantity,
                                ...application.onCreate,
                                product: sale.product._id,
                                total_amount: sellingPrice * newQuantity,
                                account: sale.account ? sale.account._id : null,
                                use_customer_account: sale.use_customer_account,
                                customer: sale.customer ? sale.customer._id : null,
                                profit: (sellingPrice - sale.product.buying_price) * newQuantity,
                                discount: (sale.product.selling_price - sellingPrice) * newQuantity,
                                category: string.isNotEmpty(application.state.categoryId) ? application.state.categoryId : null,
                                reference: sale.reference
                            }
                        }

                        const options: createOrUpdate = {
                            route: apiV1 + "multiple-task",
                            method: "POST",
                            loading: true,
                            body: {
                                data: [update, create],
                                tasks: ["update", "create"]
                            }
                        }

                        const response: serverResponse = await application.createOrUpdate(options)

                        if (response.success) {

                            const { taskResults } = response.message
                            const deletedSale = taskResults[0].message
                            const newSale = taskResults[1].message

                            const newSales = [newSale, ...application.state.sales.filter((saleData: any) => saleData._id !== deletedSale._id)]

                            application.dispatch({
                                sales: newSales,
                                secondAccount: "",
                                secondAccounts: [],
                                secondAccountData: null,
                            })

                            const field: any = document.getElementById(sale._id)

                            if (field) {
                                field.value = ""
                            }

                        }
                        else {
                            application.dispatch({ notification: response.message })
                        }

                    }
                    else {
                        application.dispatch({ notification: "no enough stock" })
                    }
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderSales = React.useCallback(() => {
        try {
            return application.state.sales.map((sale: any, index: number) => (
                <tr key={index} /* onClick={() => application.selectList(sale._id)} */>
                    <td data-label={translate("select")}>
                        <Checkbox
                            onChange={() => application.selectList(sale._id)}
                            checked={application.state.ids.indexOf(sale._id) >= 0}
                            onTable
                        />
                    </td>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("product")} className="sticky">
                        <Link to={can("view_product") ? {
                            pathname: "/product/view",
                            state: { product: sale.product._id }
                        } : "#"} className="bold">
                            {text.reFormat(sale.product.name)}&nbsp;{sale.category ? `(${text.reFormat(sale.category.name)})` : null}
                        </Link>
                    </td>
                    <td data-label={translate("quantity")} className="right-align">
                        <div style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingRight: "1rem"
                        }}>
                            <input
                                autoFocus
                                type="number"
                                min="1"
                                id={sale._id}
                                defaultValue=""
                                name={sale._id}
                                onBlur={quantityChange}
                                style={{
                                    textAlign: "center",
                                    borderRadius: 0,
                                    maxWidth: "50px",
                                    marginRight: "10px",
                                    backgroundColor: "transparent"
                                }}
                            />
                            <div >{number.format(sale.quantity)}</div>
                        </div>
                    </td>
                    <td data-label={translate("amount")} className="right-align">
                        <span className={`${sale.status === "credit" ? "text-error" : ""}`}>
                            {number.format(sale.total_amount)}
                        </span>
                    </td>
                    {
                        application.state.pos !== "invoice" && can("view_discount")
                            ?
                            <td data-label={translate("discount")} className="right-align">{sale.discount >= 0 ? number.format(sale.discount) : 0}</td>
                            : null
                    }
                    <td className="sticky-right">
                        <div className="action-button">
                            <ActionButton
                                type="error"
                                to="#"
                                tooltip="remove"
                                position="left"
                                icon="delete"
                                onClick={() => removeFromCart(sale._id)}
                            />
                        </div>
                    </td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.sales, application.state.ids])

    // saving cart
    const saveSales = async (): Promise<void> => {
        try {

            if (application.state.pos === "cart") {
                // request options
                const options: createOrUpdate = {
                    route: apiV1 + "bulk-update",
                    method: "PUT",
                    loading: true,
                    body: application.state.sales.map((sale: any) => ({
                        schema: "sale",
                        condition: { _id: sale._id },
                        newDocumentData: {
                            type: "sale"
                        }
                    }))
                }

                // api request
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    sendMessage(application.state.sales)
                    application.dispatch({
                        sales: [],
                        customer: null,
                        customerId: "",
                        customerName: "",
                        notification: application.successMessage,
                    })
                    application.createOrUpdate({
                        route: apiV1 + "update",
                        method: "PUT",
                        loading: false,
                        body: {
                            schema: "customer_count",
                            condition: { created_by: application.user._id, createdAt: { $gte: new Date().setHours(0, 0, 0) } },
                            newDocumentData: {
                                $inc: { number: 1 },
                                ...application.onUpdate
                            }
                        }
                    })
                }
                else
                    application.dispatch({ notification: response.message })

            }
            else {
                // request options
                const options: createOrUpdate = {
                    route: apiV1 + "create",
                    method: "POST",
                    loading: true,
                    body: {
                        schema: "order",
                        documentData: {
                            ...application.onCreate,
                            type: application.state.pos,
                            number: application.state.orderNumber,
                            customer: application.state.customerId,
                            sales: application.state.sales.map((sale: any) => sale._id),
                            reference: string.isNotEmpty(application.state.reference) ? application.state.reference : null,
                        }
                    }
                }
                // api request
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    if (application.state.pos === "order") {
                        sendMessage(application.state.sales)
                        application.createOrUpdate({
                            route: apiV1 + "update",
                            method: "PUT",
                            loading: false,
                            body: {
                                schema: "customer_count",
                                condition: { created_by: application.user._id, createdAt: { $gte: new Date().setHours(0, 0, 0, 0) } },
                                newDocumentData: {
                                    $inc: { number: 1 },
                                    ...application.onUpdate
                                }
                            }
                        })
                    }
                    application.dispatch({
                        stock: "",
                        sales: [],
                        quantity: "",
                        product: null,
                        productId: "",
                        customerId: "",
                        customer: null,
                        productName: "",
                        buyingPrice: "",
                        customerName: "",
                        sellingPrice: "",
                        notification: application.successMessage,
                    })
                    application.unMount()
                    getOrderNumber(application.state.pos)
                }
                else
                    application.dispatch({ notification: response.message })

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // print receipt
    const printReceipt = (): void => {
        try {

            setPageTitle(application.state.pos === "cart" || application.state.pos === "order" ? "sales invoice" : "proforma invoice")
            window.print()

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // component view
    return (
        <>
            <div className="row hide-on-print">
                <div className="col s12 m5 l4">
                    <div className="card">
                        <CardTitle title={
                            application.state.pos === "cart"
                                ? "new sale"
                                : application.state.pos === "order"
                                    ? "new order"
                                    : "new proforma invoice"
                        } />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>

                                {/* customer selection */}
                                <div className="row">
                                    <div className="col s12">
                                        <DataListComponent for="customer" />
                                    </div>
                                </div>

                                {/* product selection */}
                                <div className="row">
                                    <div className="col s12">
                                        <DataListComponent
                                            for="product"
                                            condition={{ is_store_product: false }}
                                        />
                                    </div>
                                </div>
                                {
                                    can("view_stock")
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                {/* product stock  */}
                                                <NumberComponent
                                                    disabled
                                                    name="stock"
                                                    label="stock available"
                                                    placeholder="stock available"
                                                />
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    can("view_selling_price")
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                {/* selling price */}
                                                <NumberComponent
                                                    name="sellingPrice"
                                                    label="selling price"
                                                    placeholder="enter selling price"
                                                    disabled={!can("adjust_selling_price")}
                                                />
                                            </div>
                                        </div>

                                        : null
                                }
                                <div className="row">
                                    <div className="col s12">
                                        {/* quantity */}
                                        <NumberComponent
                                            name="quantity"
                                            label="quantity"
                                            placeholder="enter quantity"
                                        />
                                    </div>
                                </div>

                                {
                                    application.state.pos !== "invoice"
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
                                                    <Option label="Cash" value="cash" />
                                                    <Option label="Credit" value="credit" />
                                                </Select>
                                            </div>
                                        </div>
                                        : null

                                }
                                {
                                    can("back_date_sale")
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <Input
                                                    label="date"
                                                    type="date"
                                                    name="date"
                                                    placeholder="Enter date"
                                                    value={application.state.date}
                                                    error={application.state.dateError}
                                                    onChange={application.handleInputChange}
                                                    max={new Date().toISOString().substring(0, 10)}
                                                />
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    can("view_reference_on_sale")
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <Input
                                                    type="text"
                                                    label="reference"
                                                    name="reference"
                                                    placeholder="enter reference"
                                                    error={application.state.referenceError}
                                                    onChange={application.handleInputChange}
                                                    value={application.state.reference.toUpperCase()}
                                                />
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    application.state.status === "cash" && can("view_account")
                                        ?
                                        <>
                                            <div className="row">
                                                <div className="col s12">
                                                    <DepositOrWithdraw type="deposit" />
                                                </div>
                                            </div>
                                            {
                                                string.isNotEmpty(application.state.customerId) && string.isEmpty(application.state.secondAccount)
                                                    ?
                                                    <div className="row">
                                                        <div className="col s12">
                                                            <Checkbox
                                                                name="useCustomerAccount"
                                                                label="use customer account"
                                                                onChange={application.handleInputChange}
                                                                checked={application.state.useCustomerAccount === "yes"}
                                                                value={application.state.useCustomerAccount === "yes" ? "no" : "yes"}
                                                            />
                                                        </div>
                                                    </div>
                                                    : null
                                            }
                                        </>
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
                <div className="col s12 m7 l8">
                    <div className="card">
                        <div className="card-title">
                            <span>{translate("Cart")}&nbsp;</span>
                            {
                                application.state.sales.length > 0
                                    ?
                                    <>
                                        -&nbsp;
                                        <span className="text-primary">
                                            {
                                                number.format(
                                                    application.state.sales.map((sale: any) => sale.total_amount).reduce((a: number, b: number) => a + b, 0)
                                                )
                                            }
                                        </span>
                                    </>

                                    : null
                            }
                        </div>
                        <div className="card-content">
                            <table>
                                <thead>
                                    <tr onClick={() => application.selectList()}>
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state[application.state.collection]?.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        <th>#</th>
                                        <th className="sticky">{translate("product")}</th>
                                        <th className="right-align">{translate("quantity")}</th>
                                        <th className="right-align">{translate("amount")}</th>
                                        {
                                            application.state.pos !== "invoice" && can("view_discount")
                                                ?
                                                <th className="right-align">{translate("discount")}</th>
                                                : null
                                        }
                                        <th className="center sticky-right">{translate("remove")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {renderSales()}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td>
                                            <span className="bold text-primary uppercase">{translate("total")}</span>
                                        </td>
                                        <td colSpan={2}></td>
                                        <td className="right-align" data-label={translate("quantity")}>
                                            <span style={{ marginRight: -15 }}>
                                                {
                                                    number.format(
                                                        application.state.sales.map((sale: any) => sale.quantity).reduce((a: number, b: number) => a + b, 0)
                                                    )
                                                }
                                            </span>
                                        </td>
                                        <td className="right-align" data-label={translate("amount")}>
                                            <span className="text-primary bold">
                                                {
                                                    number.format(
                                                        application.state.sales.map((sale: any) => sale.total_amount).reduce((a: number, b: number) => a + b, 0)
                                                    )
                                                }
                                            </span>
                                        </td>
                                        {
                                            application.state.pos !== "invoice" && can("view_discount")
                                                ?
                                                <>
                                                    <td className="right-align" data-label={translate("discount")}>
                                                        <span className="text-error">
                                                            {
                                                                number.format(
                                                                    application.state.sales.filter((sale: any) => sale.discount > 0).map((sale: any) => sale.discount).reduce((a: number, b: number) => a + b, 0)
                                                                )
                                                            }
                                                        </span>
                                                    </td>
                                                </>
                                                : null
                                        }
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {
                            application.state.sales.length > 0
                                ?
                                <div style={{ paddingTop: "1.5rem", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
                                    <div className="action-button">
                                        <ActionButton
                                            to="#"
                                            tooltip="print"
                                            position="left"
                                            type="info"
                                            icon="print"
                                            onClick={printReceipt}
                                        />
                                        <ActionButton
                                            to="#"
                                            tooltip="save"
                                            position="left"
                                            type="primary"
                                            icon="save"
                                            onClick={saveSales}
                                        />
                                        {
                                            application.state.ids.length > 0
                                                ?
                                                <ActionButton
                                                    to="#"
                                                    tooltip="remove"
                                                    position="left"
                                                    type="error"
                                                    icon="delete"
                                                    onClick={() => removeFromCart()}
                                                />
                                                : null
                                        }
                                    </div>
                                </div>
                                : null
                        }
                    </div>
                </div>
            </div>
            {
                can("list_sale") || can("list_order") || can("list_proforma_invoice")
                    ?
                    <FloatingButton
                        to={application.state.pos === "cart" ? "/sale/list" : application.state.pos === "order" ? "/sale/order-list" : "/sale/proforma-invoice-list"}
                        tooltip={`list ${application.state.pos === "cart" ? "sales" : application.state.pos}`}
                        icon="list_alt"
                    />
                    : null
            }

            <Report
                title=""
                report="sales"
                number={application.state.orderNumber}
                type={application.state.pos}
                branch={application.user.branch}
                customer={application.state.customerId ? application.state.customer : null}
            >
                <Invoice sales={application.state.sales} type={application.state.pos} />
            </Report>
        </>
    )
})

export default SaleForm