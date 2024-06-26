/* dependencies */
import React from "react"
import Chart from "react-apexcharts"
import translate from "../helpers/translator"
import {number} from "fast-web-kit"
import { getInfo } from "../helpers"

/* component type */
type pie = {
    theme: string
    sales: number
    services: number
    expenses: number
    payments: number
    purchases: number
    shop_debts: number
    truck_orders: number
    customer_debts: number
    quotation_invoices: number
}

/* pie chart memorized functinal component */
const Pie: React.FunctionComponent<pie> = React.memo((props: pie) => {

    const colors = props.theme === "light" ?
        ["#FF3333",/*  "#FFA500", "#0077CC", */ "#0066CC", "#CCCCCC", (getInfo("user", "branch")?.settings?.primary_color || "#0066CC"), "#0066CC"] :
        ["#FF6666", /* "#FFD700", "#0088CC", */ "#0066CC", "#999999", (getInfo("user", "branch")?.settings?.primary_color || "#0066CC"), "#6699CC"]

    // rendering chat
    const renderChart = React.useCallback(() => {
        try {
            const sales = props.sales + props.truck_orders + props.quotation_invoices
            const series = [props.expenses, /* props.customer_debts, props.shop_debts, */ props.payments, props.purchases, sales, props.services]
            const options: any = {
                labels: [translate("expenses"),/*  translate("customer debts"), translate("shop debts"), */ translate("payments"), translate("purchases"), translate("sales"), translate("services")],
                legend: {
                    position: 'bottom',
                    formatter: function (type: string, opts: any) {
                        return type + " - " + number.format(opts.w.globals.series[opts.seriesIndex])
                    }
                },
                // fill: {
                //     type: "gradient"
                // },
                colors,
                dataLabels: {
                    enabled: true,
                },
                responsive: [{
                    breakpoint: 500,
                    options: {
                        chart: {
                            width: "100%"
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }]
            }
            return (
                <Chart
                    options={options}
                    series={series}
                    type="donut"
                    height={"275%"}
                    width={"100%"}
                />
            )
        } catch (error) {
            console.log(`Pie rendering error: ${(error as Error).message}`)
        }
        // eslint-disable-next-line
    }, [props])


    // returning component view
    return (
        <>
            {renderChart()}
        </>
    )

})

// exporting component
export default Pie