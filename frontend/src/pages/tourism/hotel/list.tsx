// dependencies
import React from "react"
import { routerProps } from "../../../types"
import { can } from "../../../helpers/permissions"
import { ActionButton, FloatingButton } from "../../../components/button"
import { ApplicationContext } from "../../../context"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import Search from "../../../components/search"
import translate from "../../../helpers/translator"
import { Checkbox } from "../../../components/form"
import { array } from "fast-web-kit"
import Pagination from "../../../components/pagination"
import ListComponentFilter from "../../../components/reusable/list-component-filter"

export const styles = {
    flex: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    }
}

// hotel list memorized functional component
const HotelList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

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

            if (can("list_hotel")) {

                setPageTitle("hotels")
                // creating initial condition
                let initialCondition: object = commonCondition(true)

                // checking if condition has been passed from other components
                if (props.location.state) {
                    const { propsCondition }: any = props.location.state
                    if (propsCondition) {
                        initialCondition = { ...initialCondition, ...propsCondition }
                        application.dispatch({ propsCondition })
                    }
                }

                const order = 1
                const joinForeignKeys: boolean = false
                const sort: string = JSON.stringify({ name: order })
                const condition: string = JSON.stringify(initialCondition)
                const select: object = { name: order, contacts: order, address: order, visible: order, category: order, rooms: order }
                const parameters: string = `schema=hotel&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

                application.mount({
                    order,
                    select,
                    parameters,
                    sort: "name",
                    joinForeignKeys,
                    schema: "hotel",
                    route: `${apiV1}list`,
                    condition: "hotels",
                    collection: "hotels",
                    fields: ["name", "category", "rooms", "address.region", "contacts.email", "contacts.phone_number", "contacts.website"]
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

    const renderList = React.useCallback(() => {
        try {
            return application.state.hotels.map((hotel: any, index: number) => (
                <tr key={index} /* onClick={() => application.selectList(hotel._id)} */>
                    {
                        can("delete_hotel") || can("restore_deleted")
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(hotel._id)}
                                    checked={application.state.ids.indexOf(hotel._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")} className="sticky bold">{text.reFormat(hotel.name)}</td>
                    <td data-label={translate("category")}>{text.reFormat(hotel.category)}</td>
                    <td className="center">
                        {
                            array.sort(hotel.rooms, "asc", "type").map((room: any, index: number) => (
                                <div key={index}>{text.reFormat(room.type)}</div>
                            ))
                        }
                    </td>
                    <td data-label={translate("place")}>
                        {text.reFormat(hotel.address.region)}
                    </td>
                    <td className="center">
                        <div style={styles.flex}>
                            <span>{translate("phone")}:</span>&nbsp;
                            <a className="text-primary" href={`tel:+${hotel.contacts.phone_number}`}>
                                +{hotel.contacts.phone_number}
                            </a>
                        </div>
                        {
                            hotel.contacts.website
                                ?
                                <div style={styles.flex}>
                                    <span>{translate("website")}:</span>&nbsp;
                                    <a className="text-success" target="blank" href={`${hotel.contacts.website}`}>
                                        {hotel.contacts.website}
                                    </a>
                                </div>
                                : null
                        }
                        {
                            hotel.contacts.email
                                ?
                                <div style={styles.flex}>
                                    <span>{translate("email")}:</span>&nbsp;
                                    <a className="text-secondary" href={`mailto:${hotel.contacts.email}`}>
                                        {hotel.contacts.email}
                                    </a>
                                </div>
                                : null
                        }
                    </td>
                    {
                        can("edit_hotel") || can("view_hotel")
                            ?
                            <td className="center sticky-right">
                                <div className="action-button">
                                    {
                                        can("edit_hotel") && hotel.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/hotel/form",
                                                    state: { hotel: hotel._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                tooltip="edit"
                                                position="left"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_hotel")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/hotel/view",
                                                    state: { hotel: hotel._id }
                                                }}
                                                type="info"
                                                icon="visibility"
                                                tooltip="view"
                                                position="left"
                                            />
                                            : null
                                    }
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
    }, [application.state.hotels, application.state.ids])

    return (
        <>
            <ListComponentFilter />
            <div className="card list">
                <Search
                    onChange={application.handleInputChange}
                    onClick={application.searchData}
                    value={application.state.searchKeyword}
                    refresh={onMount}
                    select={application.selectList}
                >
                    {
                        (application.state.ids.length > 0) && (can("delete_hotel") || can("restore_deleted"))
                            ?
                            <>
                                {
                                    can("delete_hotel") && (application.state.condition !== "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="error"
                                            icon="delete"
                                            tooltip="delele"
                                            position="left"
                                            onClick={() => application.openDialog("deleted")}
                                        />
                                        : null
                                }
                                {
                                    can("delete_hotel") && (application.state.condition === "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="primary"
                                            icon="restore_from_trash"
                                            tooltip="restore"
                                            position="left"
                                            onClick={() => application.openDialog("restored")}
                                        />
                                        : null
                                }
                            </>
                            : null
                    }
                </Search>
                <div className="card-content">
                    <table>
                        <thead>
                            <tr onClick={() => application.selectList()}>
                                {
                                    can("delete_hotel") || can("restore_deleted")
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state.hotels.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null
                                }
                                <th>#</th>
                                <th className="sticky">{translate("name")}</th>
                                <th>{translate("category")}</th>
                                <th className="center">{translate("rooms")}</th>
                                <th>{translate("place")}</th>
                                <th className="center">{translate("contacts")}</th>
                                {/* <th className="center">{translate("status")}</th> */}
                                {
                                    can("edit_hotel") || can("view_hotel")
                                        ?
                                        <th className="center sticky-right">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderList()}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    paginate={application.paginateData}
                    currentPage={application.state.page}
                    nextPage={application.state.nextPage}
                    pageNumbers={application.state.pageNumbers}
                    previousPage={application.state.previousPage}
                />
            </div>
            {
                can("create_hotel")
                    ? <FloatingButton
                        to="/hotel/form"
                        icon="add_circle"
                        tooltip="new hotel"
                    />
                    : null
            }
        </>
    )

})

export default HotelList