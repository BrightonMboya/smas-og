import React from "react"
import { ApplicationContext } from "../../../../context"
import translate from "../../../../helpers/translator"
import { number } from "fast-web-kit"

const TotalComponent: React.FunctionComponent<any> = React.memo(() => {

    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {
        const amount = (Number(application.state.itemTotal) || 0) + (Number(application.state.admissionTotal) || 0) + (Number(application.state.accomodationTotal) || 0)
        const totalMargin = (amount * Number(application.state.margin || 0)) / 100
        const totalAmount = (amount + totalMargin).toString()
        application.dispatch({ totalAmount, totalMargin: totalMargin.toString() })
        // eslint-disable-next-line
    }, [
        application.state.margin,
        application.state.itemTotal,
        application.state.accomodationTotal,
    ])

    return (
        <>
            <table>
                <tbody>
                <tr>
                        <td className="bold" colSpan={2}>
                            {translate("accomodation total")}
                        </td>
                        <td className="right-align bold">
                            {number.format(application.state.accomodationTotal)}
                        </td>
                    </tr>
                    <tr>
                        <td className="bold" colSpan={2}>
                            {translate("items total")}
                        </td>
                        <td className="right-align bold">
                            {number.format(application.state.itemTotal)}
                        </td>
                    </tr>
                    <tr>
                        <td className="bold" colSpan={2}>
                            {translate("margin")}
                        </td>
                        <td className="right-align bold">
                            {number.format(application.state.totalMargin)}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td className="bold text-success" colSpan={2}>
                            {translate("Sub total")}
                        </td>
                        <td className="bold text-success right-align">
                            {number.format(application.state.totalAmount)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </>
    )
})

export default TotalComponent