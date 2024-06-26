import React from "react"
import Modal from "../../../../components/modal"
import { ApplicationContext } from "../../../../context"
import translate from "../../../../helpers/translator"
import { getDate, storage } from "../../../../helpers"
import { array, number } from "fast-web-kit"
import { ActionButton } from "../../../../components/button"
import { can } from "../../../../helpers/permissions"

const TripComponent: React.FunctionComponent<{ showOptions?: boolean }> = React.memo(({ showOptions }) => {

    const { application } = React.useContext(ApplicationContext)

    const deleteTrip = (id: string): void => {
        try {

            const newTrips = application.state.trips.filter((trip: any) => trip.attractionId !== id)
            storage.store("trips", newTrips)
            application.dispatch({ trips: newTrips })
            application.toggleComponent("modal")

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const handleTripSelect = (value: string): void => {
        try {

            const trip = application.state.trips.filter((trip: any) => trip.attractionId === value)[0]

            if (trip) {
                application.dispatch({ ...trip })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderTrips = React.useCallback(() => {
        try {
            return array.sort(application.state.trips, "asc", "attractionName").map((trip: any, index: number) => (
                <tr key={index}>
                    <td>{index + 1}</td>
                    <td className="bold">{trip?.name}&nbsp;-&nbsp;{trip?.description}</td>
                    <td className="right-align text-success">{number.format(trip.totalAmount)}</td>
                    <td className="right-align">{number.format(trip.totalMargin)}</td>
                    {
                        can("view_profit")
                            ?
                            <>
                                <td className="right-align">{number.format(trip.profit)}</td>
                                <td className="right-align text-success">{number.format(Number(trip.profit) + Number(trip.totalMargin))}</td>
                            </>
                            : null
                    }
                    <td className="center">
                        {getDate(trip.date)}
                    </td>
                    {
                        showOptions
                            ?
                            <td className="center sticky-right">
                                <div className="action-button">
                                    <ActionButton
                                        to={"#"}
                                        tooltip="edit"
                                        type="primary"
                                        icon="edit_note"
                                        onClick={() => {
                                            application.toggleComponent("modal")
                                            handleTripSelect(trip.attractionId)
                                        }}
                                    />
                                    <ActionButton
                                        to={"#"}
                                        tooltip="delete"
                                        type="error"
                                        icon="delete"
                                        onClick={() => deleteTrip(trip.attractionId)}
                                    />
                                </div>
                            </td>
                            : null
                    }
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.trips])

    return (
        <Modal
            title="attraction trips"
            buttonTitle="continue"
            toggleComponent={application.toggleComponent}
            buttonAction={() => application.toggleComponent("modal")}
        >
            <table>
                <thead>
                    <tr onClick={() => application.selectList()}>
                        <th>#</th>
                        <th className="sticky">{translate("item")}</th>
                        <th className="right-align">{translate("amount")}</th>
                        <th className="right-align">{translate("margin")}</th>
                        {
                            can("view_profit")
                                ?
                                <>
                                    <th className="right-align">{translate("hotel profit")}</th>
                                    <th className="right-align">{translate("total profit")}</th>
                                </>
                                : null
                        }
                        <th className="center">{translate("date")}</th>
                        {
                            showOptions
                                ?
                                <th className="center sticky-right">{translate("options")}</th>
                                : null
                        }
                    </tr>
                </thead>
                <tbody>
                    {renderTrips()}
                </tbody>
                <tfoot>
                    <tr>
                        <td className="bold" colSpan={2}>
                            {translate("total")}
                        </td>
                        <td className="bold right-align text-primary">
                            {
                                number.format(array.computeMathOperation(application.state.trips.map((trip: any) => Number(trip.totalAmount)), '+'))
                            }
                        </td>
                        <td className="bold right-align">
                            {
                                number.format(array.computeMathOperation(application.state.trips.map((trip: any) => Number(trip.totalMargin)), '+'))
                            }
                        </td>
                        {
                            can("view_profit")
                                ?
                                <>
                                    <td className="bold right-align">
                                        {
                                            number.format(
                                                array.computeMathOperation(application.state.trips.map((trip: any) => Number(trip.profit)), '+')
                                            )
                                        }
                                    </td>
                                    <td className="bold text-success right-align">
                                        {
                                            number.format(
                                                array.computeMathOperation(application.state.trips.map((trip: any) => Number(trip.totalMargin)), '+')
                                                +
                                                array.computeMathOperation(application.state.trips.map((trip: any) => Number(trip.profit)), '+')
                                            )
                                        }
                                    </td>
                                </>
                                : null
                        }
                        <td colSpan={showOptions ? 2 : 1}></td>
                    </tr>
                </tfoot>
            </table>
        </Modal>
    )
})

export default TripComponent