import React from "react"
import translate from "../../../../helpers/translator"
import { ApplicationContext } from "../../../../context"
import { percentages, text } from "../../../../helpers"
import { array, number } from "fast-web-kit"
import { quotationStyle } from "./admission"
import { Option } from "../../../../components/form"

const ActivityComponent: React.FunctionComponent<any> = React.memo(() => {

    const { application } = React.useContext(ApplicationContext)

    const handleItemChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        try {

            const { name, value }: any = event.target
            const idAndType = name.split("->")
            const _id = idAndType[0]
            const type = idAndType[1]
            let item = application.state.items.filter((item: any) => text.format(item.name) === text.format(_id))[0]

            if (item) {
                item[type] = Number(value)
                item.total = ((item.count || 0) * item.price) * (item.days || 0).toFixed(2)
                const newItems = [...application.state.items.filter((item: any) => text.format(item.name) !== text.format(_id)), item]
                const itemTotal = array.computeMathOperation(newItems.map((item: any) => item.total ? item.total : 0), "+").toString()
                application.dispatch({ items: newItems, itemTotal })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

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

    const renderItems = React.useCallback(() => {
        try {
            return array.sort(application.state.items, "asc", "name").map((item: any, index: number) => (
                <tr key={index}>
                    <td>{index + 1}</td>
                    <td className={`bold`}>{text.reFormat(item.name)}</td>
                    <td className="right-align">
                        {item.price}
                    </td>
                    <td>
                        <select
                            defaultValue={item.count ? item.count : ""}
                            name={`${item.name}->count`}
                            style={quotationStyle}
                            onChange={handleItemChange}
                        >
                            <Option label="none" value="" />
                            {renderPercentages()}
                        </select>
                    </td>
                    <td>
                        <select
                            defaultValue={item.days ? item.days : ""}
                            name={`${item.name}->days`}
                            style={quotationStyle}
                            onChange={handleItemChange}
                        >
                            <Option label="none" value="" />
                            {renderPercentages()}
                        </select>
                    </td>
                    <td className="right-align text-primary">
                        {number.format(item.total ? item.total : 0)}
                    </td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.items])

    return (
        <>
            <table>
                <caption className="text-warning">
                    {text.reFormat(`items & activities`)}
                </caption>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>{translate("item")}</th>
                        <th className="right-align">{translate("cost")}</th>
                        <th>{translate("population")}</th>
                        <th>{translate("days")}</th>
                        <th className="right-align">{translate("total")}</th>
                    </tr>
                </thead>
                <tbody>
                    {renderItems()}
                </tbody>
                {/* <tfoot>
                    <tr>
                        <td className="bold text-warning uppercase" colSpan={5}>
                            {translate("total")}
                        </td>
                        <td className="right-align text-warning">
                            { number.format(application.state.itemTotal)  }
                        </td>
                    </tr>
                </tfoot> */}
            </table>
        </>
    )
})

export default ActivityComponent