import React from "react"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../../types"
import { can } from "../../../helpers/permissions"
import { Button, FloatingButton } from "../../../components/button"
import { ApplicationContext } from "../../../context"
import { api, apiV1, noAccess, pageNotFound, percentages, setPageTitle, storage, text } from "../../../helpers"
import { CardTitle } from "../../../components/card"
import { array, string } from "fast-web-kit"
import { Checkbox, Input, Option, Select, Textarea } from "../../../components/form"
import Accomodation from "./components/accomodation"
import ActivityComponent from "./components/activity"
import TotalComponent from "./components/total"
import translate from "../../../helpers/translator"
import TripComponent from "./components/trip"
import DataListComponent from "../../../components/reusable/datalist"
import { tourismSeasons } from "../../../helpers/tourism"
import Modal from "../../../components/modal"

const QuotationForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    const { application } = React.useContext(ApplicationContext)
    const [isModalOpen, setModalOpen] = React.useState<boolean>(false)

    React.useEffect(() => {
        onMount()
        return () => {
            if (application.state.edit)
                storage.remove("trips")
            application.unMount()
        }
        // eslint-disable-next-line
    }, [])

    React.useEffect(() => {
        const hotels = application.state.hotels.filter(hotel => application.state.ids.includes(hotel._id))
        application.dispatch({ list: hotels })
    }, [application.state.ids])

    React.useEffect(() => {
        const itemTotal = array.computeMathOperation(application.state.items.map((item: any) => item.total ? item.total : 0), "+").toString()
        const accomodationTotal = (application.state.list.reduce((sum, hotel) => {
            return sum + hotel.rooms.reduce((roomSum: any, room: any) => {
                return (roomSum || 0) + (room.total || 0);
            }, 0); // Initialize roomSum to 0 for each hotel
        }, 0)).toString()
        const profit = (application.state.list.reduce((sum, hotel) => {
            return sum + hotel.rooms.reduce((roomSum: any, room: any) => {
                return (roomSum || 0) + (room.profit || 0);
            }, 0); // Initialize roomSum to 0 for each hotel
        }, 0)).toString()

        application.dispatch({ itemTotal, accomodationTotal, profit })
        // const accomodationTotal = application.state.list.map((h))
    }, [application.state.items, application.state.hotels, application.state.list, application.state.margin, application.state.attractionId])

    // on page open
    async function onMount(): Promise<void> {
        try {

            if (can("create_quotation") || can("edit_quotation")) {

                setPageTitle("new quotation")

                if (props.location.state && !application.state.edit) {

                    const { quotation }: any = props.location.state

                    if (quotation) {

                        // backend data for fetching quotation data
                        const joinForeignKeys: boolean = false
                        const select: string = JSON.stringify({})
                        const condition: string = JSON.stringify({ _id: quotation })

                        // parameter
                        const parameters: string = `schema=quotation&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

                        // request options
                        const options: readOrDelete = {
                            parameters,
                            method: "GET",
                            loading: true,
                            disabled: false,
                            route: apiV1 + "read"
                        }

                        // api request
                        const response: serverResponse = await application.readOrDelete(options)

                        if (response.success) {

                            // quotation data
                            const quotationData = response.message

                            // updating page title
                            setPageTitle("edit quotation")

                            // updating state
                            application.dispatch({
                                edit: true,
                                id: quotationData._id,
                                ...quotationData.trips[0],
                                trips: quotationData.trips,
                            })

                            storage.store("trips", quotationData.trips)

                        }
                        else
                            application.dispatch({ notification: response.message })
                    }
                }

                let trips = storage.retrieve("trips")

                if (!array.isEmpty(trips))
                    application.dispatch({
                        trips,
                        customerId: trips[0].customerId,
                        customerName: trips[0].customerName,
                    })

            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({ notification: noAccess })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // get hotels and activities
    async function fetchData(): Promise<void> {
        try {

            const sort = { name: 1, "address.region": 1 }
            const condition = { visible: true, disabled: false }
            const hotelCondition = application.state.attraction ?
                {
                    ...condition,
                    _id: { $in: application.state.attraction.hotels }
                } :
                { error: true, ...condition }
            const queries: string = JSON.stringify(
                [
                    {
                        sort,
                        schema: "hotel",
                        joinForeignKeys: false,
                        condition: hotelCondition,
                        select: { ...sort, rooms: 1 },
                    },
                    {
                        sort,
                        schema: "item",
                        joinForeignKeys: false,
                        select: { name: 1, prices: 1 },
                        condition: { ...condition, attraction: application.state.attractionId },
                    }
                ]
            )
            const parameters: string = `queries=${queries}`
            const options: readOrDelete = {
                parameters,
                loading: true,
                method: "GET",
                disabled: false,
                route: api + "bulk-list-all"
            }
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success) {
                const { passedQueries } = response.message
                if (passedQueries) {
                    const { hotels, items } = passedQueries
                    const newItems: any[] = []
                    const itemsPrices = ["non_resident", "east_africa", "expatriate"]

                    application.dispatch({ loading: true })
                    for (const item of items) {
                        for (const price of itemsPrices) {
                            if (item.prices[price] > 0) {
                                newItems.push({ ...item, price: item.prices[price], name: `${item.name} (${price})` })
                            }
                        }
                    }
                    setModalOpen(true)
                    application.dispatch({ hotels, items: newItems, collection: "hotels", loading: false })
                }
            }
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering percentages (margin)
    const renderPercentages = React.useCallback(() => {
        try {
            return percentages().map((number: number) => (
                <Option value={number} label={`${number.toString()}%`} key={number} />
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [])

    // valdating form fields
    const validationPassed = (): boolean => {
        try {

            let success: boolean = true

            if (string.isEmpty(application.state.name)) {
                success = false
                application.dispatch({ nameError: "required" })
            }

            if (string.isEmpty(application.state.description)) {
                success = false
                application.dispatch({ descriptionError: "required" })
            }

            if (string.isEmpty(application.state.attractionId) || !application.state.attraction) {
                success = false
                application.dispatch({ attractionNameError: "required" })
            }

            if (string.isEmpty(application.state.season)) {
                success = false
                application.dispatch({ seasonError: "required" })
            }

            if (string.isEmpty(application.state.customerName)) {
                success = false
                application.dispatch({ customerNameError: "required" })
            }
            else if (string.isEmpty(application.state.customerId)) {
                success = false
                application.dispatch({ customerNameError: "customer does not exist" })
            }

            if (string.isEmpty(application.state.date)) {
                success = false
                application.dispatch({ dateError: "required" })
            }

            if (string.isEmpty(application.state.margin)) {
                success = false
                application.dispatch({ marginError: "required" })
            }

            return success

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
            return false
        }
    }

    // adding new trip
    const addTrip = () => {
        try {

            if (validationPassed()) {
                const trip = {
                    name: application.state.name,
                    date: application.state.date,
                    hotels: application.state.list,
                    items: application.state.items,
                    margin: application.state.margin,
                    season: application.state.season,
                    profit: application.state.profit,
                    itemTotal: application.state.itemTotal,
                    customerId: application.state.customerId,
                    attraction: application.state.attraction,
                    totalAmount: application.state.totalAmount,
                    description: application.state.description,
                    totalMargin: application.state.totalMargin,
                    attractionId: application.state.attractionId,
                    customerName: application.state.customerName,
                    attractionName: application.state.attractionName,
                    admissionTotal: application.state.admissionTotal,
                    accomodationTotal: application.state.accomodationTotal,
                    attractionActivityName: application.state.attractionActivityName,
                }

                const trips: any[] = application.state.trips

                const tripExist = trips.filter((q: any) => q.attractionId === trip.attractionId)[0]

                if (tripExist) {
                    const otherTrips = trips.filter((q: any) => q.attractionId !== trip.attractionId)
                    otherTrips.push(trip)
                    storage.store("trips", otherTrips)
                    application.dispatch({ trips: otherTrips })
                }
                else {
                    trips.push(trip)
                    application.dispatch({ trips })
                    storage.store("trips", trips)
                }

                application.unMount()
                onMount()
                application.dispatch({
                    id: application.state.id,
                    edit: application.state.edit,
                    customerId: application.state.customerId,
                    customerName: application.state.customerName,
                })
                application.toggleComponent("modal")
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const handleTripSelection = (value: string): void => {
        try {

            const trip = application.state.trips.filter((trip: any) => trip.attractionId === value)[0]

            if (trip) {
                application.dispatch({ ...trip, hotels: trip.hotels, list: trip.hotels })
            }
            else
                fetchData()

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    React.useEffect(() => {
        if (string.isNotEmpty(application.state.attractionId)) {
            handleTripSelection(application.state.attractionId)
        }
        else if (
            !array.isEmpty(application.state.hotels) ||
            !array.isEmpty(application.state.items)
        )
            application.dispatch({
                items: [],
                hotels: [],
                list: []
            })
        // eslint-disable-next-line
    }, [application.state.attractionId])

    const validateForm = async (event: React.ChangeEvent<any>): Promise<void> => {
        try {

            event.preventDefault()

            if (!array.isEmpty(application.state.trips)) {
                const createOrUpdate = application.state.edit ? application.onUpdate : application.onCreate
                const quotation = {
                    ...createOrUpdate,
                    trips: application.state.trips,
                    customer: application.state.customerId,
                    total_amount: array.computeMathOperation(application.state.trips.map((q: any) => Number(q.totalAmount)), "+"),
                    total_margin: array.computeMathOperation(application.state.trips.map((q: any) => Number(q.totalMargin)), "+"),
                    profit: array.computeMathOperation(application.state.trips.map((q: any) => Number(q.totalMargin)), "+") + array.computeMathOperation(application.state.trips.map((q: any) => Number(q.profit)), "+"),
                }
                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "quotation",
                        documentData: quotation,
                        condition: application.condition,
                        newDocumentData: { $set: quotation }
                    }
                }

                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.unMount()
                    storage.remove("trips")
                    application.dispatch({ notification: application.successMessage, trips: [] })
                }
                else
                    application.dispatch({ notification: response.message })

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderHotels = React.useCallback(() => {
        try {
            return application.state.hotels.map((hotel: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(hotel._id)}>
                    <td data-label={translate("select")}>
                        <Checkbox
                            onChange={() => application.selectList(hotel._id)}
                            checked={application.state.ids.indexOf(hotel._id) >= 0}
                            onTable
                        />
                    </td>
                    <td>{index + 1}</td>
                    <td>{text.reFormat(hotel.name)}</td>
                    <td>{text.reFormat(hotel.address.region)}</td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.ids, application.state.hotels])

    const renderAccomodation = React.useCallback(() => {
        try {

            if (string.isNotEmpty(application.state.season))
                return array.sort(application.state.list, "asc", "name").map((hotel: any, index: number) => (
                    <Accomodation
                        key={index}
                        hotel={hotel}
                        state={application.state}
                        dispatch={application.dispatch}
                        season={application.state.season}
                        accomodationTotal={application.state.accomodationTotal}
                    />
                ))
            return null

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }, [application.state.list, application.state.season])

    return (
        <>
            <div className="row">
                <div className="col s12 m4 l4">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} quotation`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <DataListComponent
                                            for="customer"
                                            disabled={!array.isEmpty(application.state.trips)}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Select
                                            name="season"
                                            label="season"
                                            value={application.state.season}
                                            error={application.state.seasonError}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option label="select tourism season" disabled value={""} />
                                            {
                                                tourismSeasons.map((season: string, index: number) => (
                                                    <Option label={season} value={season} key={index} />
                                                ))
                                            }
                                        </Select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <DataListComponent
                                            for="attraction"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Select
                                            name="margin"
                                            label="margin"
                                            value={application.state.margin}
                                            error={application.state.marginError}
                                            onChange={application.handleInputChange}
                                        >
                                            <Option label={"select margin"} value={""} />
                                            {renderPercentages()}
                                        </Select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            name="date"
                                            label="date"
                                            type="datetime-local"
                                            value={application.state.date}
                                            error={application.state.dateError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                    <Input
                                            name="name"
                                            type="text"
                                            label="trip name"
                                            placeholder="enter trip name"
                                            value={application.state.name}
                                            error={application.state.nameError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Textarea
                                            name="description"
                                            label="description"
                                            placeholder="enter trip description"
                                            value={application.state.description}
                                            error={application.state.descriptionError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                </div>
                            </form>
                            {
                                    string.isNotEmpty(application.state.attractionId) && !array.isEmpty(application.state.hotels)
                                        ?
                                        <div className="row">
                                            <div className="col s12 center">
                                                <Button
                                                    title="select hotels"
                                                    loading={application.state.loading}
                                                    disabled={application.state.disabled}
                                                    onClick={() => {
                                                        setModalOpen(true)
                                                        application.toggleComponent("modal")
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        : null
                                }
                        </div>
                    </div>
                </div>
                <div className="col s12 m8 l8">
                    <div className="card">
                        {
                            application.state.attraction && string.isNotEmpty(application.state.attractionId)
                                ?
                                <>
                                    <div className="card-content">
                                        {renderAccomodation()}
                                        {
                                            !array.isEmpty(application.state.items)
                                                ?
                                                <ActivityComponent />
                                                : null
                                        }
                                        <TotalComponent />
                                    </div>
                                </>
                                : null
                        }
                        <div className="row">
                            <div className={`col s12 center ${array.isEmpty(application.state.trips) ? "" : "m4 l4"}`}>
                                <button className="success" onClick={addTrip}>
                                    {translate("add trip")}
                                </button>
                            </div>
                            {
                                !array.isEmpty(application.state.trips)
                                    ?
                                    <>
                                        <div className="col s12 m4 l4 center">
                                            <button className="warning" onClick={() => application.toggleComponent("modal")}>
                                                {translate("view quotation trips")}
                                            </button>
                                        </div>
                                        {
                                            string.isEmpty(application.state.totalAmount)
                                                ?
                                                <div className="col s12 m4 l4 center">
                                                    <button disabled={application.state.loading || application.state.disabled} onClick={validateForm}>
                                                        {translate(application.state.edit ? "update quotation" : "create quotation")}
                                                    </button>
                                                </div>
                                                : null
                                        }
                                    </>
                                    : null
                            }
                        </div>
                    </div>
                </div>
            </div>
            {
                !isModalOpen
                    ?
                    <TripComponent showOptions />
                    :
                    <Modal
                        title="Hotels near by"
                        buttonTitle="continue"
                        toggleComponent={() => {
                            setModalOpen(false)
                            application.toggleComponent("modal")
                        }}
                        buttonAction={() => {
                            setModalOpen(false)
                            application.toggleComponent("modal")
                        }}
                    >
                        <table>
                            <thead>
                                <tr onClick={() => application.selectList()}>
                                    <th>
                                        <Checkbox
                                            onChange={() => application.selectList()}
                                            checked={(application.state.ids.length > 0) && (application.state.hotels.length === application.state.ids.length)}
                                            onTable
                                        />
                                    </th>
                                    <th>#</th>
                                    <th>{translate("name")}</th>
                                    <th>{translate("place")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderHotels()}
                            </tbody>
                        </table>
                    </Modal>
            }
            {
                can("create_quotation")
                    ?
                    <FloatingButton
                        to="/quotation/list"
                        tooltip="list quotations"
                    />
                    : null
            }
        </>
    )
})

export default QuotationForm