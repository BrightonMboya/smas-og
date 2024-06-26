// dependencies
import React from "react"
import { FloatingButton } from "../../components/button"
import { apiV1, getDate, noAccess, number, pageNotFound, setPageTitle, text } from "../../helpers"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { Textarea } from "../../components/form"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { Link } from "react-router-dom"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"

// freight type view memorized functional component
const FreightView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_freight")) {
            if (props.location.state) {
                const { freight }: any = props.location.state
                if (freight) {
                    setPageTitle("view freight")
                    application.dispatch({
                        ids: [freight],
                        collection: "freights",
                        schema: "freight",
                    })
                    onMount(freight)
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

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(_id: string): Promise<void> {
        try {

            // parameters, condition, select and foreign key joining
            const joinForeignKeys: boolean = true
            const select: string = JSON.stringify({})
            const condition: string = JSON.stringify({ _id })
            const parameters: string = `schema=freight&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

            // request options
            const options: readOrDelete = {
                route: apiV1 + "read",
                method: "GET",
                loading: true,
                disabled: false,
                parameters
            }

            // api request
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success)
                application.dispatch({ freight: response.message })
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    return (
        <>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {text.abbreviate(application.state[application.state.schema]?.name)}
                            </div>
                            <div className="view-title">
                                <span>
                                    {text.reFormat(application.state[application.state.schema]?.name)}
                                </span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("freight action")}</div>
                            </div>
                            <div className="row">
                                <div className="col s12">
                                    <Textarea
                                        name=""
                                        label=""
                                        value={application.state[application.state.schema]?.description}
                                        error=""
                                        onChange={() => { }}
                                        placeholder=""
                                        readOnly
                                    />
                                </div>
                            </div>
                            {
                                (can("edit_freight") || can("delete_freight")) && application.state[application.state.schema]?.visible
                                    ?
                                    <>
                                        {
                                            can("edit_freight")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/freight/form`,
                                                        state: { freight: application.state[application.state.schema]._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_freight")
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
                                    :
                                    can("restore_deleted") && !application.state[application.state.schema]?.visible && !application.state.loading
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
                                <span>{translate("freight information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("date")}:
                                        </div>
                                        <div className="title bold text-primary">
                                            {getDate(application.state[application.state.schema]?.date)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("total amount")}:
                                        </div>
                                        <div className="title text-success semibold">
                                            {number.format(application.state[application.state.schema]?.total_amount)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("paid amount")}:
                                        </div>
                                        <div className="title text-primary semibold">
                                            {number.format(application.state[application.state.schema]?.paid_amount)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("remain amount")}:
                                        </div>
                                        <div className="title text-error semibold">
                                            {number.format(application.state[application.state.schema]?.total_amount - application.state[application.state.schema]?.paid_amount)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold ${application.state[application.state.schema]?.visible ? "text-success" : "text-error bold"}`}>
                                            {translate(application.state[application.state.schema]?.visible ? "active" : "deleted")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ViewDetail />
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_freight")
                    ?
                    <FloatingButton
                        to="/freight/list"
                        tooltip="list freights"
                    />
                    : null
            }
        </>
    )
})

export default FreightView