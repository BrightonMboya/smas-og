// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../components/button"
import { Textarea } from "../../components/form"
import Modal from "../../components/modal"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"

// device view memorized function component
const DeviceView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_device")) {
            onMount()
            setPageTitle("device view")
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

            if (props.location.state) {
                const { device }: any = props.location.state
                if (device) {
                    const joinForeignKeys: boolean = true
                    const condition: string = JSON.stringify({ _id: device })
                    const parameters: string = `schema=device&condition=${condition}&joinForeignKeys=${joinForeignKeys}&select=`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read"
                    }
                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success)
                        application.dispatch({
                            schema: "device",
                            collection: "devices",
                            ids: [response.message],
                            device: response.message
                        })
                    else
                        application.dispatch({ notification: response.message })
                }
                else
                    props.history.goBack()
            }
            else
                props.history.goBack()

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderFeatures = React.useCallback(() => {
        try {
            return application.state.device?.features.map((feature: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("feature")}>{text.reFormat(feature.key)}</td>
                    <td data-label={translate("value")}>{text.reFormat(feature.value)}</td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.device])


    // component view
    return (
        <>
            <Modal
                title="device features"
                buttonTitle="continue"
                toggleComponent={application.toggleComponent}
                buttonAction={() => application.toggleComponent("modal")}
            >
                <div className="row">
                    <div className="col s12">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{translate("feature")}</th>
                                    <th>{translate("value")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderFeatures()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {text.abbreviate(application.state.device?.name)}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state.device?.name)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("device menu & action")}</div>
                            </div>
                            <div className="row">
                                <div className="col s12">
                                    <Textarea
                                        label=""
                                        name="description"
                                        value={translate(application.state.device?.description)}
                                        error=""
                                        onChange={() => { }}
                                        placeholder=""
                                        readOnly
                                    />
                                </div>
                            </div>
                            {
                                application.state.device?.features?.length > 0
                                    ?
                                    <Link
                                        to="#"
                                        className="view-item"
                                        onClick={() => application.toggleComponent("modal")}
                                    >
                                        <Icon name="devices" />
                                        <div className="title semibold">{translate("View features")}</div>
                                    </Link>
                                    : null
                            }
                            {
                                application.state.device?.visible && (can("edit_device") || can("delete_device") || can("create_service") || can("list_service") || can("create_report"))
                                    ?
                                    <>
                                    {
                                            can("create_report")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/report/form`,
                                                        state: { device: application.state[application.state.schema] }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="chevron_right" />
                                                    <div className="title">{translate("new report")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("create_service")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/service/form`,
                                                        state: { device: application.state[application.state.schema] }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="chevron_right" />
                                                    <div className="title">{translate("new service")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("list_service")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/service/list`,
                                                        state: { propsCondition: { device: application.state[application.state.schema]._id } }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="chevron_right" />
                                                    <div className="title">{translate("list services")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("edit_device")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/device/form`,
                                                        state: { device: application.state[application.state.schema]._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_device")
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
                                    : !application.state.device?.visible && can("restore_deleted") && !application.state.loading
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
                                <span>{translate(`${text.reFormat(application.state.schema)} information`)}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                {
                                    can("view_customer")
                                        ?
                                        <div className="col s12 m6 l6">
                                            <Link
                                                to={{
                                                    pathname: application.state.device?.customer ? "/customer/view" : "#",
                                                    state: { customer: application.state.device?.customer?._id }
                                                }}
                                                className="view-detail"
                                            >
                                                <div className="label">
                                                    {translate("customer")}:
                                                </div>
                                                <div className="title text-primary">
                                                    {text.reFormat(application.state.device?.customer?.name)} - {application.state.device?.customer?.phone_number}
                                                </div>
                                            </Link>
                                        </div>
                                        : null
                                }
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold ${!application.state.device?.visible ? "text-error" : "text-success"}`}>
                                            {translate(!application.state.device?.visible ? "deleted" : "active")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("type")}:
                                        </div>
                                        <div className={`title`}>
                                            {translate(application.state.device?.type)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("features")}:
                                        </div>
                                        <div className={`title text-primary`}>
                                            {application.state.device?.features?.length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {
                                application.state.device?.type === "mobile_phone"
                                    ?
                                    <>
                                        <div className="row">
                                            <div className="col s12 m6 l6">
                                                <div className="view-detail">
                                                    <div className="label">
                                                        {translate("brand")}:
                                                    </div>
                                                    <div className={`title`}>
                                                        {translate(application.state.device?.brand)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col s12 m6 l6">
                                                <div className="view-detail">
                                                    <div className="label">
                                                        {translate("model")}:
                                                    </div>
                                                    <div className={`title`}>
                                                        {translate(application.state.device?.model)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col s12">
                                                <div className="view-detail">
                                                    <div className="label">
                                                        {translate("imei")}:
                                                    </div>
                                                    <div className={`title text-primary`}>
                                                        {translate(application.state.device?.imei)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                    : null
                            }
                            <ViewDetail />
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_device")
                    ? <FloatingButton to="/device/list" tooltip="list devices" />
                    : null
            }
        </>
    )

})

// exporting component
export default DeviceView