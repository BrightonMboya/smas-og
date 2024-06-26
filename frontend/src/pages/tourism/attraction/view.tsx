// dependecies
import React from "react"
import { moduleMenuOnView, readOrDelete, routerProps, serverResponse } from "../../../types"
import { can } from "../../../helpers/permissions"
import { FloatingButton } from "../../../components/button"
import { ApplicationContext } from "../../../context"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import translate from "../../../helpers/translator"
import { Link } from "react-router-dom"
import ViewDetail from "../../../components/view-detail"
import { Icon } from "../../../components/elements"
import attractionViewMenu from "./helpers/attraction_view_menu"
import { array, number } from "fast-web-kit"

// attraction view memorized functional component
const AttractionView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

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

            if (can("view_attraction")) {
                if (props.location.state) {

                    const { attraction }: any = props.location.state

                    if (attraction) {
                        // backend data for fetching attraction data
                        const joinForeignKeys: boolean = true
                        const select: string = JSON.stringify({})
                        const condition: string = JSON.stringify({ _id: attraction })

                        // parameter
                        const parameters: string = `schema=attraction&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                            setPageTitle("view attraction")

                            // updating state
                            application.dispatch({
                                schema: "attraction",
                                collection: "attractions",
                                attraction: response.message,
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

    return (
        <>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {text.abbreviate(application.state.attraction?.name)}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state.attraction?.name)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="info" type="rounded"/>
                                <div className="title semibold">{translate("attraction menu & action")}</div>
                            </div>
                            {
                                attractionViewMenu.map((menu: moduleMenuOnView, index: number) => {
                                    if (menu.visible && application.state.attraction?.visible)
                                        return (
                                            <Link
                                                to={{
                                                    pathname: `${menu.link}`,
                                                    state: {
                                                        propsCondition: {
                                                            attraction: application.state.attraction?._id,
                                                        },
                                                        attraction: application.state[application.state.schema]
                                                    }
                                                }}
                                                className="view-item" key={index}
                                            >
                                                <Icon name="chevron_right" />
                                                <div className="title">{translate(menu.name)}</div>
                                            </Link>
                                        )
                                    else
                                        return null
                                })
                            }
                            {
                                application.state[application.state.schema]?.visible && (can("edit_attraction") || can("delete_attraction"))
                                    ?
                                    <>
                                        {
                                            can("edit_attraction")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/attraction/form`,
                                                        state: { attraction: application.state[application.state.schema]?._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_attraction")
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
                                {translate("attraction information")}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("near by hotels")}:
                                        </div>
                                        <div className="title bold">
                                            {number.toWord(array.getLength(application.state.attraction?.hotels))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("category")}:
                                        </div>
                                        <div className="title text-primary bold">
                                            {text.reFormat(application.state.attraction?.category)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold ${application.state[application.state.schema]?.visible ? "text-success" : "text-error"}`}>
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
            {
                can("list_attraction")
                    ?
                    <FloatingButton
                        to="/attraction/list"
                        icon="list_alt"
                        tooltip="list attractions"
                    />
                    : null
            }
        </>
    )
})

export default AttractionView