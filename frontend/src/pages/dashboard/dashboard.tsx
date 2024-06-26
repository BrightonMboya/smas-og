// dependencies
import numeral from "numeral"
import pluralize from "pluralize"
import React from "react"
import { Link } from "react-router-dom"
import CustomChart from "../../components/chart"
import { Option, Select } from "../../components/form"
import Pie from "../../components/pie"
import { apiV1, commonCondition, getGraphData, getInfo, noAccess, pageNotFound, setPageTitle, text, years } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { routerProps, serverResponse, stateKey } from "../../types"
import { ApplicationContext } from "../../context"
import { Icon } from "../../components/elements"
import ReportTypeComponent from "../../components/reusable/report-component"
import { array, object, string } from "fast-web-kit"

// dashboard memorized function component
const Dashboard: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    const currentHour = new Date().getHours()
    const theme = application.state.theme !== "auto" ? `${application.state.theme}` : ((currentHour >= 18) || (currentHour <= 6)) ? "dark" : "light"


    // component mounting
    React.useEffect(() => {

        if (can("view_dashboard")) {
            setPageTitle("dashboard")
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
        onMount()
        // eslint-disable-next-line
    }, [application.state.year])

    async function onMount(): Promise<void> {
        try {

            let branchId = null

            if (props.location.state) {
                const { branch }: any = props.location.state
                if (branch) {
                    branchId = branch._id
                    application.dispatch({ branchId })
                }
            }


            // filter for all collections
            const filter = { $eq: [Number(application.state.year), { $year: "$createdAt" }] }
            const startDate = { $toDate: new Date(`01-01-${application.state.year}`).setHours(0, 0, 0, 0) }
            const endDate = { $toDate: new Date(`12-31-${application.state.year}`).setHours(23, 59, 59, 999) }

            const time = [
                { $lte: ["$createdAt", endDate] },
                { $gte: ["$createdAt", startDate] }
            ]

            console.log(time)

            const condition =
                branchId ?
                    {
                        visible: true,
                        $expr: {
                            $and: [
                                filter,
                                { $eq: ["$branch", { $toObjectId: branchId }] },
                            ]
                        }
                    } :
                    {
                        visible: true,
                        $expr: {
                            $and: [
                                filter,
                                commonCondition().$expr
                            ]
                        }
                    }

            const sort = [{ "$sort": { "_id.month": 1 } }]

            // aggregation queries
            const queries = [
                {
                    schema: "sale",
                    aggregation: [
                        {
                            $match: {
                                ...condition,
                                $and: [
                                    { type: { $ne: "cart" } },
                                    { type: { $ne: "order" } },
                                    { status: { $ne: "invoice" } }
                                ]
                            }
                        },
                        {
                            $group: {
                                total_amount: { $sum: "$total_amount" },
                                _id: { month: { $month: "$createdAt" }, name: "sale" },
                                profit: { $sum: { $cond: [{ $gt: ["$profit", 0] }, "$profit", 0] } },
                                discount: { $sum: { $cond: [{ $gt: ["$discount", 0] }, "$discount", 0] } },
                            }
                        },
                        ...sort
                    ]
                },
                {
                    schema: "expense",
                    aggregation: [
                        {
                            $match: { ...condition }
                        },
                        {
                            $group: {
                                paid_amount: { $sum: "$paid_amount" },
                                total_amount: { $sum: "$total_amount" },
                                _id: { month: { $month: "$date" }, name: "expense" },
                            }
                        },
                        ...sort
                    ]
                },
                {
                    schema: "truck_order",
                    aggregation: [
                        {
                            $match: { ...condition }
                        },
                        {
                            $group: {
                                paid_amount: { $sum: "$paid_amount" },
                                total_amount: { $sum: "$total_amount" },
                                _id: { month: { $month: "$date" }, name: "truck_order" },
                            }
                        },
                        ...sort
                    ]
                },
                {
                    schema: "quotation_invoice",
                    aggregation: [
                        {
                            $match: { ...condition }
                        },
                        {
                            $group: {
                                paid_amount: { $sum: "$paid_amount" },
                                total_amount: { $sum: "$total_amount" },
                                _id: { month: { $month: "$date" }, name: "quotation_invoice" },
                            }
                        },
                        ...sort
                    ]
                },
                {
                    schema: "purchase",
                    aggregation: [
                        {
                            $match: { ...condition }
                        },
                        {
                            $group: {
                                paid_amount: { $sum: "$paid_amount" },
                                total_amount: { $sum: "$total_amount" },
                                _id: { month: { $month: "$date" }, name: "purchase" }
                            }
                        },
                        ...sort
                    ]
                },
                {
                    schema: "debt",
                    aggregation: [
                        {
                            $match: { ...condition, status: "unpaid" }
                        },
                        {
                            $group: {
                                _id: "$type",
                                paid_amount: { $sum: "$paid_amount" },
                                total_amount: { $sum: "$total_amount" }
                            }
                        },
                        ...sort
                    ]
                },
                {
                    schema: "payment",
                    aggregation: [
                        { $match: { ...condition, status: "active" } },
                        {
                            $group: {
                                total_amount: { $sum: "$total_amount" },
                                _id: { month: { $month: "$createdAt" }, name: "payment" }
                            }
                        },
                        ...sort
                    ]
                },
                {
                    schema: "service",
                    aggregation: [
                        { $match: { ...condition, status: "completed" } },
                        {
                            $group: {
                                profit: { $sum: "$profit" },
                                discount: { $sum: "$discount" },
                                service_cost: { $sum: "$service_cost" },
                                product_cost: { $sum: "$product_cost" },
                                _id: { month: { $month: "$createdAt" }, name: "service" }
                            }
                        },
                        ...sort
                    ]
                }
            ]

            // api request
            const response: serverResponse = await application.createOrUpdate({
                method: "POST",
                body: queries,
                loading: true,
                route: apiV1 + "bulk-aggregation",
            })

            const dataNames: stateKey[] = ["expense", "sale", "purchase", "debt", "payment", "service", "truck_order", "quotation_invoice"]

            if (response.success) {

                application.dispatch({ reportType: application.state.reportType === "unMount" ? "sales" : application.state.reportType })

                const { passedQueries } = response.message

                if (passedQueries) {
                    for (const dataName of dataNames) {
                        application.dispatch({ [dataName]: passedQueries[pluralize(dataName)] })
                    }
                }

            }
            else {
                application.dispatch({ notification: response.message })
                for (const dataName of dataNames) {
                    application.dispatch({ [dataName]: null })
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }


    const getTotalAmount = (collection: stateKey): number => {
        try {

            let totalAmount = 0

            if (collection.includes("debt"))
                totalAmount = application.state.debt?.filter((data: any) => collection.includes("customer_debt") ? data._id === "debtor" : data._id === "creditor")?.map((data: any) => data.total_amount - data.paid_amount).reduce((a: number, b: number) => a + b, 0)
            else if (collection === "service")
                totalAmount = application.state.service?.map((service: any) => service.service_cost + service.product_cost).reduce((a: number, b: number) => a + b, 0)
            else
                totalAmount = application.state[collection]?.map((data: any) => data.total_amount).reduce((a: number, b: number) => a + b, 0)

            if (totalAmount)
                return totalAmount
            return 0

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
            return 0
        }
    }

    const renderBadge = React.useCallback(() => {
        try {

            type badge = { title: stateKey, icon: string, link: string, visible: boolean, rank: number }

            const common: badge[] = [
                { title: "shop_debt", icon: "store", link: "/debt/list", visible: can("list_debt"), rank: 4 },
                { title: "expense", icon: "money", link: "/expense/list", visible: can("list_expense"), rank: 3 },
                { title: "customer_debt", icon: "request_quote", link: "/debt/list", visible: can("list_debt"), rank: 2 },
            ]

            const other: badge[] = [
                ...common,
                { title: "sale", icon: "shopping_cart", link: "/sale/list", visible: can("list_sale"), rank:1. },
            ]

            const tourism :badge[] = [
                ...common,
                { title: "quotation_invoice", icon: "money", link: "/quotation/invoice-list", visible: can("list_quotation_invoice"), rank: 1 },
            ]

            const logistics: badge[] = [
                ...common,
                { title: "truck_order", icon: "car_rental", link: "/truck/order-list", visible: can("list_truck_order"), rank: 1 },
            ]

            const getBadge = (): badge[] => {
                try {

                    const badge: any = {
                        tourism,
                        logistics,
                    }

                    const branchType = getInfo("user", "branch")?.type

                    if (string.isNotEmpty(branchType)) {
                        const type = text.format(branchType)
                        if (object.keyExist(badge, type))
                            return badge[type]
                        return other
                    }
                    return other

                } catch (error) {
                    application.dispatch({ notification: (error as Error).message })
                    return other
                }
            }

            return array.sort(getBadge(), "asc", "rank").map((badge: badge, index: number) => {
                if (badge.visible)
                    return (
                        <div className="col s12 m6 l3" key={index}>
                            <Link
                                className="badge-stat"
                                to={{
                                    pathname: badge.link,
                                    state: { propsCondition: { [application.state.branchId ? "branch" : "emptyString"]: application.state.branchId } }
                                }}
                                onClick={() => application.unMount()}
                            >
                                <div className="left-section">
                                    <div className="title">
                                        {translate(pluralize(badge.title === "customer_debt" ? "debtors" : badge.title === "shop_debt" ? "creditors" :  badge.title))}
                                    </div>
                                    <div className="count">
                                        {numeral(getTotalAmount(badge.title)).format(application.state.currencyFormat)}
                                    </div>
                                </div>
                                <div className="right-section">
                                    <div className="icon">
                                        <Icon name={badge.icon} />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )
                return null
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })

        }
        // eslint-disable-next-line
    }, [
        application.state.sale,
        application.state.service,
        application.state.expense,
        application.state.payment,
        application.state.purchase,
        application.state.shop_debt,
        application.state.customer_debt,
        application.state.currencyFormat
    ])

    return (
        <>
            <div className="row">
                {renderBadge()}
            </div>
            <div className="row">
                <div className="col s12 m12 l8">
                    <div className="row">
                        <div className="col s12 m6 l6">
                            <div className="card">
                                <div className="card-title">
                                    {translate("data comparison")} ({application.state.year})
                                </div>
                                <div className="card-content">
                                    <Pie
                                        theme={theme}
                                        sales={getTotalAmount("sale")}
                                        services={getTotalAmount("service")}
                                        expenses={getTotalAmount("expense")}
                                        payments={getTotalAmount("payment")}
                                        purchases={getTotalAmount("purchase")}
                                        shop_debts={getTotalAmount("shop_debt")}
                                        truck_orders={getTotalAmount("truck_order")}
                                        customer_debts={getTotalAmount("customer_debt")}
                                        quotation_invoices={getTotalAmount("quotation_invoice")}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col s12 m6 l6">
                            <div className="card">
                                <div className="card-title">
                                    {translate("income statement")} ({application.state.year})
                                </div>
                                <div className="payment-wrapper">

                                    <div className="payment">
                                        <div className="content">
                                            <div className="icon bg-primary">
                                                <Icon name="add_shopping_cart" />
                                            </div>
                                            <div className="detail">
                                                <div className="title">
                                                    {translate("gross profit")}
                                                </div>
                                                <div className="amount">
                                                    {
                                                        numeral(
                                                            application.state.sale?.map((sale: any) => sale.profit)
                                                                .reduce((a: number, b: number) => a + b, 0) + getTotalAmount("truck_order") +  getTotalAmount("quotation_invoice")  + getTotalAmount("service")
                                                        ).format(application.state.currencyFormat)
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="payment">
                                        <div className="content">
                                            <div className="icon bg-success">
                                                <Icon name="paid" />
                                            </div>
                                            <div className="detail">
                                                <div className="title">
                                                    {translate("net profit")}
                                                </div>
                                                <div className="amount">
                                                    {
                                                        numeral(
                                                            (application.state.sale?.map((sale: any) => sale.profit)
                                                            .reduce((a: number, b: number) => a + b, 0) + getTotalAmount("truck_order") +  getTotalAmount("quotation_invoice")  + getTotalAmount("service")) - (getTotalAmount("expense") +getTotalAmount("payment") )
                                                        ).format(application.state.currencyFormat)
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="payment">
                                        <div className="content">
                                            <div className="icon bg-info">
                                                <Icon name="local_shipping" />
                                            </div>
                                            <div className="detail">
                                                <div className="title">
                                                    {translate("purchases")}
                                                </div>
                                                <div className="amount">
                                                    {numeral(getTotalAmount("purchase")).format(application.state.currencyFormat)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="payment">
                                        <div className="content">
                                            <div className="icon bg-error">
                                                <Icon name="money" />
                                            </div>
                                            <div className="detail">
                                                <div className="title">
                                                    {translate("unpaid expenses")}
                                                </div>
                                                <div className="amount">
                                                    {
                                                        numeral(
                                                            application.state.expense?.map((expense: any) => expense.total_amount - expense.paid_amount)
                                                                .reduce((a: number, b: number) => a + b, 0) + application.state.sale?.map((sale: any) => sale.discount)
                                                                    .reduce((a: number, b: number) => a + b, 0)
                                                        ).format(application.state.currencyFormat)
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="payment">
                                        <div className="content">
                                            <div className="icon bg-info">
                                                <Icon name="local_shipping" />
                                            </div>
                                            <div className="detail">
                                                <div className="title">
                                                    {translate("unpaid purchases")}
                                                </div>
                                                <div className="amount">
                                                    {
                                                        numeral(
                                                            application.state.purchase?.map((purchase: any) => purchase.total_amount - purchase.paid_amount)
                                                                .reduce((a: number, b: number) => a + b, 0)
                                                        ).format(application.state.currencyFormat)
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {
                            can("view_report_statistics")
                                ?
                                <div className="col s12">
                                    <div className="card">
                                        <div className="card-title">
                                            {translate(`${application.state.reportType !== "unMount" ? application.state.reportType : ""} statistics`)} ({application.state.year})
                                        </div>
                                        <div className="card-content">
                                            <CustomChart
                                                theme={theme}
                                                title={application.state.reportType}
                                                sales={getGraphData(application.state.sale)}
                                                expenses={getGraphData(application.state.expense)}
                                                services={getGraphData(application.state.service)}
                                                payments={getGraphData(application.state.payment)}
                                                purchases={getGraphData(application.state.purchase)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                : null
                        }
                    </div>
                </div>
                {
                    can("list_service")
                        ?
                        <div className="col s12 m6 l4">
                            <Link
                                className="badge-stat"
                                to={{
                                    pathname: "/service/list",
                                    state: { propsCondition: { [application.state.branchId ? "branch" : "emptyString"]: application.state.branchId } }
                                }}
                                onClick={() => application.unMount()}
                            >
                                <div className="left-section">
                                    <div className="title">
                                        {translate("services")}
                                    </div>
                                    <div className="count">
                                        {numeral(getTotalAmount("service")).format(application.state.currencyFormat)}
                                    </div>
                                </div>
                                <div className="right-section">
                                    <div className="icon">
                                        <Icon name="build" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                        : null
                }
                {
                    can("list_payment")
                        ?
                        <div className="col s12 m6 l4">
                            <Link
                                className="badge-stat"
                                to={{
                                    pathname: "/payment/list",
                                    state: { propsCondition: { [application.state.branchId ? "branch" : "emptyString"]: application.state.branchId } }
                                }}
                                onClick={() => application.unMount()}
                            >
                                <div className="left-section">
                                    <div className="title">
                                        {translate("payments")}
                                    </div>
                                    <div className="count">
                                        {numeral(getTotalAmount("payment")).format(application.state.currencyFormat)}
                                    </div>
                                </div>
                                <div className="right-section">
                                    <div className="icon">
                                        <Icon name="payments" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                        : null
                }
                <div className="col s12 m6 l4">
                    <div className="card">
                        <div className="card-title">
                            {translate("helpers")}
                        </div>
                        <div className="card-content">
                            <div className="row">
                                <div className="col s12">
                                    <ReportTypeComponent />
                                </div>
                                <div className="col s12">
                                    <Select
                                        label=""
                                        name="year"
                                        value={application.state.year}
                                        error={application.state.yearError}
                                        onChange={application.handleInputChange}
                                    >
                                        {
                                            years().sort().map((year: number) => (
                                                <Option value={year} key={year} label={year.toString()} />
                                            ))
                                        }
                                    </Select>
                                </div>
                                <div className="col s12">
                                    <Select
                                        label=""
                                        name="currencyFormat"
                                        value={application.state.currencyFormat}
                                        error={application.state.currencyFormatError}
                                        onChange={application.handleInputChange}
                                    >
                                        <Option value={"0,0"} label="normal currency" />
                                        <Option value={"0a"} label="formated currency - 1" />
                                        <Option value={"0.00a"} label="formated currency - 2" />
                                        <Option value={"0.0a"} label="formated currency - 3" />
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
})

export default Dashboard