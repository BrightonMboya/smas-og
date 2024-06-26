// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../components/button"
import { Checkbox } from "../../components/form"
import Pagination from "../../components/pagination"
import Search from "../../components/search"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { routerProps } from "../../types"
import { ApplicationContext } from "../../context"
import { Link } from "react-router-dom"
import ListComponentFilter from "../../components/reusable/list-component-filter"

// device list memorized function component
const DeviceList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("list_device")) {
            onMount()
            setPageTitle("devices")
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {
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

            const condition: string = JSON.stringify(initialCondition)
            const order = 1
            const joinForeignKeys: boolean = true
            const sort: string = JSON.stringify({ name: order })
            const select: object = { updated_by: 0, __v: 0, createdAt: 0, updatedAt: 0, branch: 0 }
            const parameters: string = `schema=device&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "devices",
                sort: "name",
                order,
                schema: "device",
                collection: "devices",
                select,
                joinForeignKeys,
                fields: ["name", "description", "type", "brand", "model", "imei"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering devices
    const renderList = React.useCallback(() => {
        try {
            return application.state.devices.map((device: any, index: number) => (
                <tr key={device._id} onClick={() => application.selectList(device._id)}>
                    {
                        (can("delete_device") || can("restore_deleted"))
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(device._id)}
                                    checked={application.state.ids.indexOf(device._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")} className="sticky bold">{text.reFormat(device.name)}</td>
                    <td data-label={translate("customer")}>
                        <Link to={can("view_customer") ? {
                            pathname: "/customer/view",
                            state: { customer: device.customer?._id }
                        } : "#"}
                            className="semibold"
                        >
                            {text.reFormat(device.customer?.name)} - {device.customer?.phone_number}
                        </Link>
                    </td>
                    <td className="center" data-label={translate("type")}>
                        <span className={`badge ${device.type === "mobile_phone" ? "primary" : device.type === "computer" ? "warning" : "success"}`} data-tooltip={device.description}>
                            <i className="material-icons">
                                {device.type === "mobile_phone" ? "phone_iphone" : device.type === "computer" ? "computer" : "devices"}
                            </i>
                            {text.reFormat(device.type)}
                        </span>
                    </td>
                    <td className="right-align text-primary">{device.features?.length}</td>
                    {/* <td data-label={translate("branch")} className="text-primary">{text.reFormat(device.branch?.name)}</td> */}
                    {/* <td data-label={translate("created by")}>{text.reFormat(device.created_by?.username)}</td> */}
                    {
                        can("edit_device") || can("view_device")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("edit_device") && device.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/device/form",
                                                    state: { device: device._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_device")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/device/view",
                                                    state: { device: device._id }
                                                }}
                                                type="info"
                                                icon="visibility"
                                                tooltip="view"
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
    }, [application.state.devices, application.state.ids])

    // component view
    return (
        <>
            <ListComponentFilter />
            <div className="card list">
                <Search
                    refresh={onMount}
                    select={application.selectList}
                    onClick={application.searchData}
                    value={application.state.searchKeyword}
                    onChange={application.handleInputChange}
                >
                    {
                        (application.state.ids.length >= 1) && (can("restore_deleted") || can("delete_device"))
                            ?
                            <>
                                {
                                    can("delete_device") && (application.state.condition !== "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="error"
                                            icon="delete"
                                            tooltip="delete"
                                            onClick={() => application.openDialog("deleted")}
                                        />
                                        : null
                                }
                                {
                                    can("restore_deleted") && (application.state.condition === "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="warning"
                                            icon="restore_from_trash"
                                            tooltip="restore"
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
                                    (can("delete_device") || can("restore_deleted"))
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state.devices.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null
                                }
                                <th>#</th>
                                <th className="sticky">{translate("name")}</th>
                                <th>{translate("customer")}</th>
                                <th className="center">{translate("type")}</th>
                                <th className="right-align">{translate("features")}</th>
                                {/* <th>{translate("branch")}</th> */}
                                {/* <th>{translate("created by")}</th> */}
                                {
                                    can("edit_device") || can("view_device")
                                        ? <th className="center sticky-right">{translate("options")}</th>
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
                can("create_device")
                    ? <FloatingButton to="/device/form" tooltip="new device" />
                    : null
            }
        </>
    )
})

// exporting component
export default DeviceList