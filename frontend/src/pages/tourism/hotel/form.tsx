// dependencies
import React from "react"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../../types"
import { can } from "../../../helpers/permissions"
import { Button, FloatingButton } from "../../../components/button"
import { ApplicationContext } from "../../../context"
import { apiV1, hotelCategories, hotelRoomTypes, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import { CardTitle } from "../../../components/card"
import { array, email, string } from "fast-web-kit"
import { Input, Option, Select } from "../../../components/form"
import { Link } from "react-router-dom"
import translate from "../../../helpers/translator"
import Modal from "../../../components/modal"
import PhoneNumberComponent from "../../../components/reusable/phone-number"
import TanzaniaRegions from "../../../components/reusable/tz-regions"
import { transformHotelData } from "../../../helpers/tourism"

// hotel memorized functional component
const HotelForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    // function that runs on page opening
    async function onMount(): Promise<void> {
        try {

            // checking if user has access
            if (can("create_hotel") || can("edit_hotel")) {

                // setting initial page title
                setPageTitle("new hotel")

                // chekcing if location state has data
                if (props.location.state) {

                    // destructuring hotel data from location state
                    const { hotel }: any = props.location.state

                    // checking if hotel data has been provided
                    if (hotel) {

                        // backend data for fetching hotel data
                        const joinForeignKeys: boolean = false
                        const select: string = JSON.stringify({})
                        const condition: string = JSON.stringify({ _id: hotel })

                        // parameter
                        const parameters: string = `schema=hotel&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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

                            // hotel data
                            const hotelData = response.message

                            // updating page title
                            setPageTitle("edit hotel")

                            // updating state
                            application.dispatch({
                                edit: true,
                                id: hotelData._id,
                                hotelCategory: hotelData.category,
                                hotelName: text.reFormat(hotelData.name),
                                phoneNumber: hotelData.contacts.phone_number,
                                region: text.reFormat(hotelData.address.region),
                                email: hotelData.contacts.email ? hotelData.contacts.email : "",
                                website: hotelData.contacts.website ? hotelData.contacts.website : "",
                                hotelRooms: hotelData.rooms.map((room: any) => ({ ...room, price: Number(room.price) }))
                            })

                        }
                        else
                            application.dispatch({ notification: response.message })

                    }

                }

            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({ notification: noAccess })
            }

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
    }

    // form validation functions
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // prevent default form submit
            event.preventDefault()

            // error store
            const errors: string[] = []

            // validating form fields
            if (string.isEmpty(application.state.hotelName)) {
                errors.push("")
                application.dispatch({ hotelNameError: "required" })
            }

            if (string.isEmpty(application.state.hotelCategory)) {
                errors.push("")
                application.dispatch({ hotelCategoryError: "required" })
            }

            if (string.isEmpty(application.state.phoneNumber)) {
                errors.push("")
                application.dispatch({ phoneNumberError: "required" })
            }
            // else if (string.getLength(application.state.phoneNumber) !== 10) {
            //     errors.push("")
            //     application.dispatch({ phoneNumberError: "phone number must have 10 digits" })
            // }

            if (string.isEmpty(application.state.region)) {
                errors.push("")
                application.dispatch({ regionError: "required" })
            }

            if (array.isEmpty(application.state.hotelRooms)) {
                errors.push("")
                application.dispatch({ notification: "Please enter atleast 1 hotel room" })
            }

            // checking if there is no error occured
            if (array.isEmpty(errors)) {

                const createOrUpdate = application.state.edit ? application.onUpdate : application.onCreate
                const hotel = {
                    ...createOrUpdate,
                    name: text.format(application.state.hotelName),
                    category: text.format(application.state.hotelCategory),
                    address: {
                        // street: text.format(application.state.street),
                        region: text.format(application.state.region),
                        // location: text.format(application.state.location),
                    },
                    rooms: application.state.hotelRooms.map((room) => ({ ...room, price: room.price })),
                    contacts: {
                        phone_number: application.state.phoneNumber,
                        email: string.isNotEmpty(application.state.email) ? application.state.email.toLowerCase() : null,
                        website: string.isNotEmpty(application.state.website) ? application.state.website.toLowerCase() : null,
                    }
                }

                // request options
                const options: createOrUpdate = {
                    loading: true,
                    body: {
                        schema: "hotel",
                        documentData: hotel,
                        newDocumentData: { $set: hotel },
                        condition: application.condition
                    },
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create")
                }

                // api request
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.unMount()
                    application.dispatch({ notification: application.successMessage })
                }
                else
                    application.dispatch({ notification: response.message })

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering categories
    const renderList = React.useCallback((type: "categories" | "roomTypes") => {
        try {

            const list = type === "categories" ? hotelCategories : hotelRoomTypes
            return array.sort(list, "asc").map((data: string, index: number) => (
                <Option value={text.format(data)} label={data} key={index} />
            ))

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [hotelCategories, hotelRoomTypes])

    const importFromExcel = async (): Promise<void> => {
        try {

            if (!array.isEmpty(application.state.list)) {

                const invalidHotels: any[] = []

                // validating
                const hotels = application.state.list

                for (const hotel of hotels) {

                    if (string.isEmpty(hotel["NAME"]))
                        invalidHotels.push({ ...hotel, ERROR: "NAME is required" })

                    else if (string.isEmpty(hotel["CATEGORY"]))
                        invalidHotels.push({ ...hotel, ERROR: "CATEGORY is required" })

                    else if (string.isEmpty(hotel["PHONE"]?.toString()))
                        invalidHotels.push({ ...hotel, ERROR: "PHONE is required" })

                    else if (string.getLength(hotel["PHONE"]?.toString()) !== 12)
                        invalidHotels.push({ ...hotel, ERROR: "PHONE must have 12 digits" })

                    else if (string.isNotEmpty(hotel["EMAIL"]) && !email.isValid(hotel["EMAIL"]))
                        invalidHotels.push({ ...hotel, ERROR: "EMAIL is not valid" })

                    else if (string.isEmpty(hotel["REGION"]))
                        invalidHotels.push({ ...hotel, ERROR: "REGION is required" })

                    else if (string.isEmpty(hotel["ROOM TYPE"]))
                        invalidHotels.push({ ...hotel, ERROR: "ROOM TYPE is required" })

                    else if (string.isEmpty(hotel["LOW"]))
                        invalidHotels.push({ ...hotel, ERROR: "LOW is required" })

                    else if (string.isNotEmpty(hotel["LOW"])) {
                        console.log(hotel)
                        const [STO, rackRate] = hotel["LOW"].split("/")

                        if (string.isEmpty(STO))
                            invalidHotels.push({ ...hotel, ERROR: "LOW STO price is required" })

                        else if (string.isEmpty(rackRate))
                            invalidHotels.push({ ...hotel, ERROR: "LOW Rack rate price is required" })
                    }
                    else if (string.isEmpty(hotel["HIGH"]))
                        invalidHotels.push({ ...hotel, ERROR: "HIGH is required" })

                    else if (string.isNotEmpty(hotel["HIGH"])) {

                        const [STO, rackRate] = hotel["HIGH"].split("/")

                        if (string.isEmpty(STO))
                            invalidHotels.push({ ...hotel, ERROR: "HIGH STO price is required" })

                        else if (string.isEmpty(rackRate))
                            invalidHotels.push({ ...hotel, ERROR: "HIGH Rack rate price is required" })
                    }
                    else if (string.isEmpty(hotel["PEAK"]))
                        invalidHotels.push({ ...hotel, ERROR: "PEAK is required" })

                    else if (string.isNotEmpty(hotel["PEAK"])) {

                        const [STO, rackRate] = hotel["PEAK"].split("/")

                        if (string.isEmpty(STO))
                            invalidHotels.push({ ...hotel, ERROR: "PEAK STO price is required" })

                        else if (string.isEmpty(rackRate))
                            invalidHotels.push({ ...hotel, ERROR: "PEAK Rack rate price is required" })
                    }

                }

                if (array.isEmpty(invalidHotels)) {

                    const options: createOrUpdate = {
                        loading: true,
                        method: "POST",
                        route: apiV1 + "bulk-create",
                        body: transformHotelData(hotels).map((hotel: any) => ({
                            schema: "hotel",
                            documentData: {
                                ...hotel,
                                ...application.onCreate
                            }
                        }))
                    }

                    const response: serverResponse = await application.createOrUpdate(options)

                    if (response.success) {

                        const { passedQueries, failedQueries } = response.message
                        const passedLength = passedQueries.length
                        const failedLength = failedQueries.length

                        if (array.isEmpty(failedQueries)) {
                            application.dispatch({
                                list: [],
                                notification: `${passedLength} hotel${passedLength > 1 ? "s have " : " has"} been created`,
                            })
                        }
                        else {
                            application.dispatch({
                                list: [],
                                notification: `${passedLength} hotel${passedLength > 1 ? "s have " : " has"} been created and ${failedLength} hotel${failedLength > 1 ? "s have " : " has"} failed`,
                            })
                            application.arrayToExcel(failedQueries, "hotel failed to import")
                        }

                        application.toggleComponent("modal")
                    }
                    else
                        application.dispatch({ notification: response.message })

                }
                else {
                    application.dispatch({ filesError: "This excel file has errors please fix" })
                    application.arrayToExcel(invalidHotels, "hotel import error")
                }

            }
            else
                application.dispatch({ filesError: "excel file is required" })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-m1 offset-l2">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} hotel`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm} autoComplete="off">
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            label="name"
                                            name="hotelName"
                                            placeholder="enter name"
                                            value={application.state.hotelName}
                                            onChange={application.handleInputChange}
                                            error={application.state.hotelNameError}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Select
                                            name="hotelCategory"
                                            label="category"
                                            value={application.state.hotelCategory}
                                            onChange={application.handleInputChange}
                                            error={application.state.hotelCategoryError}
                                        >
                                            <Option label={"select hotel category"} value={""} />
                                            {renderList("categories")}
                                        </Select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <PhoneNumberComponent
                                            name="phoneNumber"
                                            label="phone number"
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="email"
                                            name="email"
                                            label="email address"
                                            placeholder="enter email address"
                                            value={application.state.email}
                                            onChange={application.handleInputChange}
                                            error={application.state.emailError}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="url"
                                            label="website"
                                            name="website"
                                            value={application.state.website}
                                            error={application.state.websiteError}
                                            onChange={application.handleInputChange}
                                            placeholder="enter website"
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <TanzaniaRegions
                                            name="region"
                                            label="region"
                                        />
                                    </div>
                                </div>
                                {
                                    !application.state.edit
                                        ?
                                        <div className="row">
                                            <div className="col s12 right-align">
                                                <Link to="#" className="text-primary" onClick={() => application.toggleComponent("modal")} >
                                                    {translate("import hotels from excel")}
                                                </Link>
                                            </div>
                                        </div>
                                        : null
                                }
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
            </div>
            <Modal
                buttonTitle="import"
                title="import from excel"
                buttonAction={importFromExcel}
                toggleComponent={application.toggleComponent}
            >
                <div className="row">
                    <div className="col s12">
                        <form action="#">
                            <Input
                                type="file"
                                name="files"
                                label="choose file"
                                error={application.state.filesError}
                                onChange={application.handleFileChange}
                            />
                        </form>
                    </div>
                </div>
            </Modal>
            {
                can("list_hotel")
                    ?
                    <FloatingButton
                        to="/hotel/list"
                        tooltip="list hotels"
                    />
                    : null
            }
        </>
    )
})

// exportig component
export default HotelForm