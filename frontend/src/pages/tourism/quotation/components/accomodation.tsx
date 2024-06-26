import React from "react"
import translate from "../../../../helpers/translator"
import { percentages, text } from "../../../../helpers"
import { array, number } from "fast-web-kit"
import { Option } from "../../../../components/form"
import { quotationStyle } from "./admission"
import { dispatch } from "../../../../types"
import state from "../../../../hooks/state"

type accomodation = {
    hotel: any
    state: state
    season: string
    dispatch: dispatch
    accomodationTotal: string
}

const Accomodation: React.FunctionComponent<accomodation> = React.memo((props: accomodation) => {

    React.useEffect(() => {
        const accomodationTotal = array.computeMathOperation(props.hotel.rooms.map((room: any) => room.total ? room.total : 0), "+")
        props.dispatch({ accomodationTotal: accomodationTotal.toString() })

        // eslint-disable-next-line
    }, [props.hotel])

    const handleRoomChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        try {

            const { name, value }: any = event.target

            const roomNameAndType = name.split("-")
            const type = roomNameAndType[1]
            const roomName = roomNameAndType[0]
            const hotel = props.hotel
            const rooms = hotel.rooms
            const roomData = rooms.filter((room: any) => room.type === roomName)[0]

            if (roomData) {
                roomData[type] = Number(value)
                const newRoom = {
                    ...roomData,
                    total: ((roomData.count || 0) * roomData.prices[props.season]["rack_rate"]) * (roomData.days || 0).toFixed(2),
                    
                    profit: (Number((roomData.count || 0) * (roomData.prices[props.season]["rack_rate"] - roomData.prices[props.season]["sto"]))) * (roomData.days || 0).toFixed(2),
                }

            const oldRooms = rooms.filter((room: any) => room.type !== roomName)
            const newHotelData = { ...hotel, rooms: [newRoom, ...oldRooms] }
            const oldHotels = props.state.list.filter((hotel: any) => hotel._id !== newHotelData._id)
            const newHotels = [newHotelData, ...oldHotels]
            props.dispatch({ list: newHotels })
        }

        } catch (error) {
            props.dispatch({ notification: (error as Error).message })
        }
    }

    const renderPercentages = React.useCallback(() => {
        try {
            return percentages().map((number: number) => (
                <Option value={number.toString()} label={`${number.toString()}`} key={number} />
            ))
        } catch (error) {
            props.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [])

    const renderRooms = React.useCallback(() => {
        try {
            return array.sort(props.hotel.rooms, "asc", "type").map((room: any, index: number) => (
                <tr key={index}>
                    <td>{index + 1}</td>
                    <td className="bold">{text.reFormat(room.type)}</td>
                    <td className="right-align">
                        {number.format(room.prices[props.season]["rack_rate"])}
                    </td>
                    <td>
                        <select
                            name={`${room.type}-count`}
                            style={quotationStyle}
                            onChange={handleRoomChange}
                            defaultValue={room.quantity}
                        >
                            <Option label="none" value="" />
                            {renderPercentages()}
                        </select>
                    </td>
                    <td>
                        <select
                            name={`${room.type}-days`}
                            style={quotationStyle}
                            onChange={handleRoomChange}
                            defaultValue={room.days ? room.days : ""}
                        >
                            <Option label="none" value="" />
                            {renderPercentages()}
                        </select>
                    </td>
                    <td className="right-align text-primary">
                        {room.total ? number.format(room.total) : 0}
                    </td>
                </tr>
            ))
        } catch (error) {
            props.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [props.hotel, props.season, props.state.list])

    return (
        <>
            <table>
                <caption className="">{props.hotel.name}</caption>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>{translate("rooms")}</th>
                        <th className="right-align">{translate("cost")}</th>
                        <th>{translate("quantity")}</th>
                        <th>{translate("nights")}</th>
                        <th className="right-align">{translate("total")}</th>
                    </tr>
                </thead>
                <tbody>
                    {renderRooms()}
                </tbody>
                {/* <tfoot>
                    <tr>
                        <td className="bold uppercase" colSpan={5}>
                            {translate("total")}
                        </td>
                        <td className="right-align bold">
                            {
                                number.format(props.accomodationTotal)
                            }
                        </td>
                    </tr>
                </tfoot> */}
            </table>
        </>
    )
})


export default Accomodation