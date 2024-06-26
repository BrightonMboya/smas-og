// dependecies
import React from "react"
import { readOrDelete, routerProps, serverResponse } from "../../../types"
import { can } from "../../../helpers/permissions"
import { FloatingButton } from "../../../components/button"
import { ApplicationContext } from "../../../context"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import translate from "../../../helpers/translator"
import { Link } from "react-router-dom"
import ViewDetail from "../../../components/view-detail"
import Modal from "../../../components/modal"
import { number } from "fast-web-kit"
import { Icon } from "../../../components/elements"

// hotel view memorized functional component
const HotelView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            if (can("view_hotel")) {
                if (props.location.state) {

                    const { hotel }: any = props.location.state

                    if (hotel) {
                        // backend data for fetching hotel data
                        const joinForeignKeys: boolean = true
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

                            // updating page title
                            setPageTitle("view hotel")

                            // updating state
                            application.dispatch({
                                schema: "hotel",
                                collection: "hotels",
                                hotel: response.message,
                                ids: [response.message._id],
                            })

                        }
                        else
                            application.dispatch({ notification: response.message })
                    }
                    else
                        props.history.goBack()
                }
                else
                    props.history.goBack()
            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({ notification: noAccess })
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering hotel room types
    const renderRoomTypes = React.useCallback(() => {
        try {
            return application.state.hotel?.rooms.map((room: any, index: number) => (
                <tr key={index}>
                    <td data-label={"#"}>{index + 1}</td>
                    <td data-label={translate("type")}>{text.reFormat(room.type)}</td>
                    <td data-label={translate("price")} className="right-align text-primary">
                        {number.format(room.price)}
                    </td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.hotel])

    return (
        <>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {text.abbreviate(application.state.hotel?.name)}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state.hotel?.name)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("hotel menu & action")}</div>
                            </div>
                            <Link
                                to="#"
                                className="view-item"
                                onClick={() => application.toggleComponent("modal")}
                            >
                                <Icon name="bed" />
                                <div className="title semibold">{translate("view rooms")}</div>
                            </Link>
                            {
                                can("list_attraction")
                                    ?
                                    <Link
                                        className="view-item"
                                        to={{
                                            pathname: "/attraction/list",
                                            state: { propsCondition: { hotels: { $in: [application.state.hotel?._id] } } }
                                        }}>
                                        <Icon name="chevron_right" />
                                        <div className="title">{translate("list near by attractions")}</div>
                                    </Link>
                                    : null
                            }
                            {
                                application.state[application.state.schema]?.visible && (can("edit_hotel") || can("delete_hotel"))
                                    ?
                                    <>
                                        {
                                            can("edit_hotel")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/hotel/form`,
                                                        state: { hotel: application.state[application.state.schema]?._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_hotel")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.openDialog("deleted")}
                                                >
                                                    <Icon name="delete" type="rounded text-error" />
                                                    <div className="title semibold">{translate("delete")}</div>
                                                </Link>
                                                : null
                                        }
                                    </>
                                    : !application.state[application.state.schema]?.visible && can("restore_deleted") && !application.state.loading
                                        ?
                                        <Link
                                            to="#"
                                            className="view-item"
                                            onClick={() => application.openDialog("restored")}
                                        >
                                            <Icon name="restore_from_trash" type="rounded text-warning" />
                                            <div className="title semibold">{translate("restore")}</div>
                                        </Link>
                                        : null
                            }
                        </div>
                    </div>
                </div>
                <div className="col s12 m7 l8">
                    <div className="view">
                        <div className="view-header">
                            <div className="title">
                                {translate("hotel information")}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("category")}:
                                        </div>
                                        <div className="title">
                                            {text.reFormat(application.state.hotel?.category)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("phone number")}:
                                        </div>
                                        <div className="title">
                                            <a href={`tel:+${application.state.hotel?.contacts.phone_number}`} className="text-primary">
                                                +{application.state.hotel?.contacts.phone_number}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("email")}:
                                        </div>
                                        <div className="title">
                                            {
                                                application.state.hotel?.email
                                                    ?
                                                    <a href={`mailto:${application.state.hotel?.contacts.email}`} className="text-secondary lowercase">
                                                        {application.state.hotel?.contacts.email}
                                                    </a>
                                                    : translate("n/a")
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("website")}:
                                        </div>
                                        <div className="title">
                                            {
                                                application.state.hotel?.website
                                                    ?

                                                    <a href={`${application.state.hotel?.contacts.website}`} target="blank" className="text-secondary lowercase">
                                                        {application.state.hotel?.contacts.website}
                                                    </a>
                                                    : translate("n/a")
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("region")}:
                                        </div>
                                        <div className="title">
                                            {text.reFormat(application.state[application.state.schema]?.address?.region)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold ${application.state[application.state.schema]?.visible ? "text-success" : "text-error bold"}`}>
                                            {application.state[application.state.schema]?.visible ? translate("active") : translate("deleted")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ViewDetail />
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                buttonTitle="continue"
                toggleComponent={() => {
                    application.dispatch({
                        hotelRoomType: "",
                        hotelRoomPrice: "",
                    })
                    application.toggleComponent("modal")
                }}
                buttonAction={() => application.toggleComponent("modal")}
                title={`${text.reFormat(application.state.hotel?.name)} rooms`}
            >
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>{translate("type")}</th>
                            <th className="right-align">{translate("price")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderRoomTypes()}
                    </tbody>
                </table>
            </Modal>
            {
                can("list_hotel")
                    ?
                    <FloatingButton
                        to="/hotel/list"
                        icon="list_alt"
                        tooltip="list hotels"
                    />
                    : null
            }
        </>
    )
})

export default HotelView