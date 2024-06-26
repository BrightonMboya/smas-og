import React from "react"
import { number } from "fast-web-kit"
import { ApplicationContext } from "../../../../context"
import { percentages, text } from "../../../../helpers"
import translate from "../../../../helpers/translator"
import { Option } from "../../../../components/form"

export const quotationStyle = {
    width: 50,
    margin: 0,
    padding: 0,
    height: 30,
    paddingLeft: 10
}

const AdmissionComponent: React.FunctionComponent<any> = React.memo(() => {

    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {

        const { adult, child, driver_and_car }: any = application.state.attraction.admission_fee

        // adults
        const adultPopulation = Number(application.state.adultPopulation)
        const adultPopulationDays = Number(application.state.adultPopulationDays)
        const adultPopulationTotal = Number((adult * adultPopulationDays) * adultPopulation)

        // child
        const childPopulation = Number(application.state.childPopulation)
        const childPopulationDays = Number(application.state.childPopulationDays)
        const childPopulationTotal = Number(((child * childPopulationDays) * childPopulation))

        // car and driver
        const driverPopulation = Number(application.state.driverPopulation)
        const driverPopulationDays = Number(application.state.driverPopulationDays)
        const driverPopulationTotal = Number(((driver_and_car * driverPopulationDays) * driverPopulation))

        // total
        const admissionTotal = (adultPopulationTotal + childPopulationTotal + driverPopulationTotal).toString()

        application.dispatch({
            admissionTotal,
            adultPopulationTotal: adultPopulationTotal.toString(),
            childPopulationTotal: childPopulationTotal.toString(),
            driverPopulationTotal: driverPopulationTotal.toString()
        })
    },
        // eslint-disable-next-line
        [
            application.state.adultPopulation,
            application.state.adultPopulationDays,
            application.state.childPopulation,
            application.state.childPopulationDays,
            application.state.driverPopulation,
            application.state.driverPopulationDays
        ]
    )

    const renderPercentages = React.useCallback(() => {
        try {
            return percentages().map((number: number) => (
                <Option value={number.toString()} label={`${number.toString()}`} key={number} />
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [])

    return (
        <>
            <table>
                {/* ${application.state.attraction.name}  */}
                <caption className="text-primary">{text.reFormat(`Admission`)}</caption>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>{translate("Fee")}</th>
                        <th className="right-align">{translate("cost")}</th>
                        <th>{translate("population")}</th>
                        <th>{translate("days")}</th>
                        <th className="right-align">{translate("total")}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td className="bold">{translate("adults")}</td>
                        <td className="right-align">
                            {
                                number.format(application.state.attraction.admission_fee.adult)
                            }
                        </td>
                        <td>
                            <select
                                name="adultPopulation"
                                style={quotationStyle}
                                onChange={application.handleInputChange}
                                value={application.state.adultPopulation}
                            >
                                <Option label="none" value="" />
                                {renderPercentages()}
                            </select>
                        </td>
                        <td>
                            <select
                                name="adultPopulationDays"
                                style={quotationStyle}
                                onChange={application.handleInputChange}
                                value={application.state.adultPopulationDays}
                            >
                                <Option label="none" value="" />
                                {renderPercentages()}
                            </select>
                        </td>
                        <td className="right-align text-primary">
                            {
                                number.format(application.state.adultPopulationTotal)
                            }
                        </td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td className="bold">{translate("children")}</td>
                        <td className="right-align">
                            {
                                number.format(application.state.attraction.admission_fee.child)
                            }
                        </td>
                        <td>
                            <select
                                name="childPopulation"
                                style={quotationStyle}
                                onChange={application.handleInputChange}
                                value={application.state.childPopulation}
                            >
                                <Option label="none" value="" />
                                {renderPercentages()}
                            </select>
                        </td>
                        <td>
                            <select
                                name="childPopulationDays"
                                style={quotationStyle}
                                onChange={application.handleInputChange}
                                value={application.state.childPopulationDays}
                            >
                                <Option label="none" value="" />
                                {renderPercentages()}
                            </select>
                        </td>
                        <td className="right-align text-primary">
                            {
                                number.format(application.state.childPopulationTotal)
                            }
                        </td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td className="bold">{translate("driver and car")}</td>
                        <td className="right-align">
                            {
                                number.format(application.state.attraction.admission_fee.driver_and_car)
                            }
                        </td>
                        <td>
                            <select
                                name="driverPopulation"
                                style={quotationStyle}
                                onChange={application.handleInputChange}
                                value={application.state.driverPopulation}
                            >
                                <Option label="none" value="" />
                                {renderPercentages()}
                            </select>
                        </td>
                        <td>
                            <select
                                name="driverPopulationDays"
                                style={quotationStyle}
                                onChange={application.handleInputChange}
                                value={application.state.driverPopulationDays}
                            >
                                <Option label="none" value="" />
                                {renderPercentages()}
                            </select>
                        </td>
                        <td className="right-align text-primary">
                            {
                                number.format(application.state.driverPopulationTotal)
                            }
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td className="bold text-primary uppercase" colSpan={5}>
                            {translate("total")}
                        </td>
                        <td className="bold right-align text-primary">
                            {number.format(application.state.admissionTotal)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </>
    )
})

export default AdmissionComponent