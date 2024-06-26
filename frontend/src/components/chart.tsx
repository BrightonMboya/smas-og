/* dependencies */
import React from "react"
import Chart from "react-apexcharts"
import { getInfo, number } from "../helpers"
import translate from "../helpers/translator"

/* component type */
type chart = {
    title: string
    sales: any[]
    theme: string
    purchases: any[]
    payments: any[]
    expenses: any[]
    services: any[]
}

/* custom chart memorized functional component */
const CustomChart: React.FunctionComponent<chart> = React.memo((props: chart) => {

    // months
    const months: string[] = [
        translate("January"), translate("February"), translate("March"), translate("April"), translate("May"), translate("June"), translate("July"), translate("Augost"), translate("September"), translate("October"), translate("November"), translate("December")
    ]

    // rendering chart
    const renderChart = React.useCallback(() => {
        const options: ApexCharts.ApexOptions = {
            colors: [ getInfo("user", "branch")?.settings?.primary_color || "#0066CC" ],
            plotOptions: {
                bar: {
                    borderRadius: 0,
                    horizontal: false,
                }
            },
            dataLabels: {
                enabled: false,
                formatter: function (value: number) {
                    return number.format(value)
                },
            },
            xaxis: {
                categories: months,
            },
            tooltip: {
                theme: props.theme,
                x: {
                    show: true,
                    // formatter: (type: string) => {
                    //     return translate(type)
                    // }
                },
                y: {
                    formatter: function (value: number) {
                        return number.format(value)
                    },
                    title: {
                        formatter: function (type: string) {
                            return translate(type)
                        }
                    }
                }
            }
        };
        const series = [
            {
                name: translate(props.title),
                data: props.title === "purchases" ? props.purchases : props.title === "sales" ? props.sales : props.title === "expenses" ? props.expenses : props.title === "payments" ? props.payments : props.title === "services" ? props.services : [],
            },
        ]
        return (
            <Chart
                type="bar"
                width={"100%"}
                height={"500"}
                options={options}
                series={series}
            />
        )
        // eslint-disable-next-line
    }, [props])

    // returning component view
    return (
        <>
            {renderChart()}
        </>
    )

})

/* exporting component */
export default CustomChart