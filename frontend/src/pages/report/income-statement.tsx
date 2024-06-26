// dependencies
import React from "react"
import { ActionButton, Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Input } from "../../components/form"
import { apiV1, isAdmin, isUser, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import { createOrUpdate, routerProps, serverResponse, stateKey } from "../../types"
import { General } from "./components"
import Report from "./components/report"
import { array, object, string } from "fast-web-kit"
import { ApplicationContext } from "../../context"
import DataListComponent from "../../components/reusable/datalist"

// report form memorized function component
const GeneralReport: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // Accessing the application context
    const { application } = React.useContext(ApplicationContext);

    // Handling component mounting
    React.useEffect(() => {
        // Checking user's permission to view income statement
        if (can("view_income_statement")) {
            onMount();
            setPageTitle("income statement");
        } else {
            // Redirecting to pageNotFound if access is denied
            props.history.push(pageNotFound);
            application.dispatch({ notification: noAccess });
        }

        // Component unmounting (clean-up)
        return () => application.unMount();

        // eslint-disable-next-line
    }, []);

    // Function to execute on component mount
    async function onMount(): Promise<void> {
        try {
            // Accessing user and branch information from the application context
            const user = application.user;
            const { branch }: any = user;

            if (branch) {
                // Dispatching branch-related information to the application context
                application.dispatch({
                    branch,
                    branches: [branch],
                    branchId: branch._id,
                    branchName: `${text.reFormat(branch.name)} - ${branch.phone_number}`
                });
            }

            // Dispatching user-related information if applicable
            if (isUser) {
                application.dispatch({
                    user,
                    users: [user],
                    userId: user._id,
                    userName: `${text.reFormat(user.username)} - ${user.phone_number}`
                });
            }

            // Checking for branch or user information from props
            if (props.location.state) {
                const { branch, user }: any = props.location.state;
                if (branch)
                    application.dispatch({
                        branch,
                        branches: [branch],
                        branchId: branch._id,
                        branchName: `${text.reFormat(branch.name)} - ${branch.phone_number}`
                    });
                else if (user)
                    application.dispatch({
                        user,
                        users: [user],
                        userId: user._id,
                        userName: `${text.reFormat(user.username)} - ${user.phone_number}`
                    });
            }
        } catch (error) {
            application.dispatch({ notification: (error as Error).message });
        }
    }

    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            event.preventDefault()
            const errors: string[] = []

            if (string.isEmpty(application.state.date)) {
                errors.push("")
                application.dispatch({ dateError: "required" })
            }

            if (string.isEmpty(application.state.dateTo)) {
                errors.push("")
                application.dispatch({ dateToError: "required" })
            }

            if (array.isEmpty(errors)) {

                // getting user and branch id if selected
                const user = application.state.userId
                const branch = application.state.branchId

                // start and end date
                const startDate: object = { $toDate: new Date(application.state.date).setHours(0, 0, 0, 0) }
                const endDate: object = { $toDate: new Date(application.state.dateTo).setHours(23, 59, 59, 999) }

                // initial backend $and expression
                let $and: object[] = []

                if (branch)
                    $and = [{ $eq: ["$branch", { $toObjectId: branch }] }]

                if (user)
                    $and = [...$and, { $eq: ["$created_by", { $toObjectId: branch }] }]

                // creating match pipeline
                const getMatchPipeline = (field: "date" | "createdAt", condition: object[] = [{}]): object => ({
                    $match: {
                        $expr: {
                            $and: [
                                ...$and,
                                ...condition,
                                { $eq: ["$visible", true] },
                                { $lte: [`$${field}`, endDate] },
                                { $gte: [`$${field}`, startDate] },
                            ]
                        }
                    }
                })

                // debt aggregation pipelines
                const commonAggregationPipeline: object[] = [
                    getMatchPipeline("date"),
                    {
                        $group: {
                            _id: "$type",
                            paid_amount: { $sum: "$paid_amount" },
                            total_amount: { $sum: "$total_amount" },
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            paid_amount: 1,
                            total_amount: 1,
                            unpaid_amount: { $subtract: ["$total_amount", "$paid_amount"] }
                        }
                    }
                ]

                // service aggregation pipeline
                const serviceAggregationPipeline: object[] = [
                    getMatchPipeline("createdAt"),
                    {
                        $group: {
                            _id: "$status",
                            service_cost: { $sum: "$service_cost" },
                            product_cost: { $sum: "$product_cost" },
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            service_cost: 1,
                            product_cost: 1,
                            total_cost: { $sum: ["$service_cost", "$product_cost"] }
                        }
                    }
                ]

                // payment aggregation pipeline
                const paymentAggregationPipeline: object[] = [
                    getMatchPipeline("createdAt", [{ $eq: ["$status", "active"] }]),
                    {
                        $group: {
                            _id: "$status",
                            total_amount: { $sum: "$total_amount" }
                        }
                    }
                ]

                // sale aggregation pipeline
                const saleAggregationPipeline: object[] = [
                    getMatchPipeline("createdAt", [
                        { $eq: ["$type", "sale"] },
                        { $ne: ["$status", "invoice"] }
                    ]),
                    {
                        $group: {
                            _id: "$_id",
                            status: { $first: "$status" },
                            profit: { $first: "$profit" },
                            product: { $first: "$product" },
                            quantity: { $first: "$quantity" },
                            discount: { $first: "$discount" },
                            total_amount: { $first: "$total_amount" },
                        }
                    },
                    {
                        $project: {
                            status: 1,
                            discount: 1,
                            quantity: 1,
                            total_amount: 1,
                            purchase_cost: { $subtract: ["$total_amount", "$profit"] }
                        }
                    },
                    {
                        $group: {
                            _id: "$status",
                            total_amount: { $sum: "$total_amount" },
                            purchase_cost: { $sum: "$purchase_cost" },
                            discount: { $sum: { $cond: [{ $gt: ["$discount", 0] }, "$discount", 0] } },
                        }
                    }
                ]

                // debt aggregation pipeline
                const debtAggregationPipeline: object[] = [
                    getMatchPipeline("date", [
                        { $eq: ["$sale", null] },
                        { $eq: ["$expense", null] },
                        { $eq: ["$purchase", null] },
                        { $eq: ["$quotation_invoice", null] },
                    ]),
                    {
                        $group: {
                            _id: "$type",
                            paid_amount: { $sum: "$paid_amount" },
                            total_amount: { $sum: "$total_amount" },
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            paid_amount: 1,
                            total_amount: 1,
                            unpaid_amount: { $subtract: ["$total_amount", "$paid_amount"] }
                        }
                    }
                ]

                // bulk aggregation
                const aggregations: { schema: stateKey, aggregation: object[] }[] = [
                    {
                        schema: "debt",
                        aggregation: debtAggregationPipeline
                    },
                    {
                        schema: "expense",
                        aggregation: commonAggregationPipeline
                    },
                    {
                        schema: "freight",
                        aggregation: commonAggregationPipeline
                    },
                    {
                        schema: "truck_order",
                        aggregation: commonAggregationPipeline
                    },
                    {
                        schema: "cargo",
                        aggregation: commonAggregationPipeline
                    },
                    {
                        schema: "quotation_invoice",
                        aggregation: commonAggregationPipeline
                    },
                    {
                        schema: "service",
                        aggregation: serviceAggregationPipeline
                    },
                    {
                        schema: "payment",
                        aggregation: paymentAggregationPipeline
                    },
                    {
                        schema: "sale",
                        aggregation: saleAggregationPipeline
                    }
                ]

                // request options
                const options: createOrUpdate = {
                    loading: true,
                    method: "POST",
                    body: aggregations,
                    route: apiV1 + "bulk-aggregation",
                }

                // request
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    const { passedQueries } = response.message

                    if (passedQueries) {

                        // Destructure data
                        const { debts, expenses, payments, sales, truck_orders, cargos, services, freights, quotation_invoices } = passedQueries

                        // Helper function to calculate a specific property from an array
                        const calculateProperty = (dataArray: any[], property: string, filterId: string): number => {

                            if (array.isEmpty(dataArray))
                                return 0

                            if (string.isEmpty(filterId))
                                return dataArray[0][property] || 0

                            const filteredItem = dataArray.filter(item => item._id === filterId)[0]

                            if (!filteredItem)
                                return 0

                            if (!object.keyExist(filteredItem, property))
                                return 0

                            return filteredItem[property]
                        }

                        // 1. Sales
                        const cashSales = calculateProperty(sales, 'total_amount', 'cash')
                        const creditSales = calculateProperty(sales, 'total_amount', 'credit')
                        const discount = can("view_discount_on_report") ? (calculateProperty(sales, 'discount', 'cash') + calculateProperty(sales, 'discount', 'credit')
                        ) : 0
                        // 2. Truck orders
                        const paidOrders = calculateProperty(truck_orders, 'paid_amount', '')
                        const unpaidOrders = calculateProperty(truck_orders, 'unpaid_amount', '')

                        // 3. Cargos
                        const paidCargos = calculateProperty(cargos, 'paid_amount', '')
                        const unpaidCargos = calculateProperty(cargos, 'unpaid_amount', '')

                        // 4. Quotation invoice
                        const paidInvoice = calculateProperty(quotation_invoices, 'paid_amount', '')
                        const unpaidInvoice = calculateProperty(quotation_invoices, 'unpaid_amount', '')

                        // 5. Expenses
                        const paidExpenses = calculateProperty(expenses, 'paid_amount', '')
                        const unpaidExpenses = calculateProperty(expenses, 'unpaid_amount', '')

                        // 6. Debts
                        const customerPaidDebts = calculateProperty(debts, 'paid_amount', 'debtor')
                        const totalCustomerDebts = calculateProperty(debts, 'total_amount', 'debtor')
                        const customerUnpaidDebts = calculateProperty(debts, 'unpaid_amount', 'debtor')
                        const shopPaidDebts = calculateProperty(debts, 'paid_amount', 'creditor')
                        const totalShopDebts = calculateProperty(debts, 'total_amount', 'creditor')
                        const shopUnpaidDebts = calculateProperty(debts, 'unpaid_amount', 'creditor')

                        // 7. Services
                        const completedServices = calculateProperty(services, 'total_cost', 'completed')
                        const incompleteServices = calculateProperty(services, 'total_cost', 'incomplete')
                        const totalServices = completedServices + incompleteServices

                        // 8. Freights
                        const paidFreights = calculateProperty(freights, 'paid_amount', '')
                        const unpaidFreights = calculateProperty(freights, 'unpaid_amount', '')

                        // 9. Payments
                        const totalPayments = calculateProperty(payments, 'total_amount', '')

                        // Revenue
                        const revenue = creditSales + cashSales + totalCustomerDebts + paidOrders + unpaidOrders + paidCargos + unpaidCargos + totalServices + paidInvoice + unpaidInvoice

                        // Purchase cost
                        const purchaseCost = calculateProperty(sales, 'purchase_cost', 'cash') + calculateProperty(sales, 'purchase_cost', 'credit')

                        // Cost of goods sold
                        const cogs = purchaseCost + paidFreights + unpaidFreights

                        // Gross profit
                        const grossProfit = revenue - cogs

                        // Shop expenses
                        const totalExpenses = totalPayments + paidExpenses + unpaidExpenses + totalShopDebts + discount

                        // Net income
                        const netIncome = grossProfit - totalExpenses

                        const title = `income statement report from ${new Date(application.state.date).toDateString()} to ${new Date(application.state.dateTo).toDateString()}`

                        application.dispatch({
                            cogs,
                            revenue,
                            netIncome,
                            cashSales,
                            paidOrders,
                            creditSales,
                            grossProfit,
                            paidExpenses,
                            unpaidOrders,
                            purchaseCost,
                            shopPaidDebts,
                            totalExpenses,
                            totalPayments,
                            unpaidExpenses,
                            shopUnpaidDebts,
                            customerPaidDebts,
                            customerUnpaidDebts,
                            paidCargos,
                            unpaidCargos,
                            completedServices,
                            incompleteServices,
                            title,
                            paidFreights,
                            unpaidFreights,
                            paidInvoice,
                            unpaidInvoice,
                            discount
                        })

                    }
                }
                else {
                    application.dispatch({ notification: response.message })
                }

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const printReport = (): void => {
        try {
            setPageTitle(application.state.title)
            window.print()
            setPageTitle("income statement")
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    return (
        <>
            <div className="row hide-on-print">
                <div className="col s12 m4 l4">
                    <div className="card">
                        <CardTitle title="new income statement" />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            label="start date (from)"
                                            type="date"
                                            name="date"
                                            value={application.state.date}
                                            error={application.state.dateError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter start date (from)"
                                            max={new Date().toISOString().substring(0, 10)}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            label="end date (to)"
                                            type="date"
                                            name="dateTo"
                                            value={application.state.dateTo}
                                            error={application.state.dateToError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter end date (to)"
                                            max={new Date().toISOString().substring(0, 10)}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <DataListComponent
                                            for="branch"
                                            disabled={!isAdmin}
                                        />
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
                        <CardTitle title="income statement" />
                        <div className="card-content">
                            <General
                                cogs={application.state.cogs}
                                revenue={application.state.revenue}
                                netIncome={application.state.netIncome}
                                cashSales={application.state.cashSales}
                                paidCargos={application.state.paidCargos}
                                paidOrders={application.state.paidOrders}
                                creditSales={application.state.creditSales}
                                grossProfit={application.state.grossProfit}
                                paidExpenses={application.state.paidExpenses}
                                unpaidOrders={application.state.unpaidOrders}
                                unpaidCargos={application.state.unpaidCargos}
                                purchaseCost={application.state.purchaseCost}
                                paidFreights={application.state.paidFreights}
                                paidInvoice={application.state.paidInvoice}
                                unpaidInvoice={application.state.unpaidInvoice}
                                shopPaidDebts={application.state.shopPaidDebts}
                                totalExpenses={application.state.totalExpenses}
                                totalPayments={application.state.totalPayments}
                                unpaidFreights={application.state.unpaidFreights}
                                unpaidExpenses={application.state.unpaidExpenses}
                                shopUnpaidDebts={application.state.shopUnpaidDebts}
                                completedServices={application.state.completedServices}
                                customerPaidDebts={application.state.customerPaidDebts}
                                incompleteServices={application.state.incompleteServices}
                                customerUnpaidDebts={application.state.customerUnpaidDebts}
                                discount={application.state.discount}

                            />
                        </div>
                        {
                            can("print_report") && string.isNotEmpty(application.state.title)
                                ?
                                <div className="action-button">
                                    <ActionButton
                                        to="#"
                                        icon="print"
                                        tooltip="print report"
                                        type="success"
                                        onClick={printReport}
                                    />
                                </div>
                                : null
                        }
                    </div>
                </div>
            </div>
            {
                can("create_report")
                    ? <FloatingButton to="/report/form" tooltip="create report" />
                    : null
            }
            <Report
                type="report"
                report="income statement"
                title={application.state.title}
                branch={string.isNotEmpty(application.state.branchId) ? application.state.branch : null}
            >
                <General
                    cogs={application.state.cogs}
                    revenue={application.state.revenue}
                    netIncome={application.state.netIncome}
                    cashSales={application.state.cashSales}
                    paidCargos={application.state.paidCargos}
                    paidOrders={application.state.paidOrders}
                    creditSales={application.state.creditSales}
                    grossProfit={application.state.grossProfit}
                    paidExpenses={application.state.paidExpenses}
                    unpaidOrders={application.state.unpaidOrders}
                    unpaidCargos={application.state.unpaidCargos}
                    purchaseCost={application.state.purchaseCost}
                    paidFreights={application.state.paidFreights}
                    paidInvoice={application.state.paidInvoice}
                    unpaidInvoice={application.state.unpaidInvoice}
                    shopPaidDebts={application.state.shopPaidDebts}
                    totalExpenses={application.state.totalExpenses}
                    totalPayments={application.state.totalPayments}
                    unpaidFreights={application.state.unpaidFreights}
                    unpaidExpenses={application.state.unpaidExpenses}
                    shopUnpaidDebts={application.state.shopUnpaidDebts}
                    completedServices={application.state.completedServices}
                    customerPaidDebts={application.state.customerPaidDebts}
                    incompleteServices={application.state.incompleteServices}
                    customerUnpaidDebts={application.state.customerUnpaidDebts}
                    discount={application.state.discount}
                />
            </Report>
        </>
    )

})

export default GeneralReport