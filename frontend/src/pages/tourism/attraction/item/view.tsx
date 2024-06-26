// dependecies
import React from "react"
import { readOrDelete, routerProps, serverResponse } from "../../../../types"
import { can } from "../../../../helpers/permissions"
import { FloatingButton } from "../../../../components/button"
import { ApplicationContext } from "../../../../context"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../../../helpers"
import translate from "../../../../helpers/translator"
import { Link } from "react-router-dom"
import ViewDetail from "../../../../components/view-detail"
import { Icon } from "../../../../components/elements"
import { number } from "fast-web-kit"

// attraction view memorized functional component
const ItemView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

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

            if (can("view_item")) {
                if (props.location.state) {

                    const { item }: any = props.location.state

                    if (item) {
                        // backend data for fetching item data
                        const joinForeignKeys: boolean = true
                        const select: string = JSON.stringify({})
                        const condition: string = JSON.stringify({ _id: item })

                        // parameter
                        const parameters: string = `schema=item&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                            setPageTitle("view item")

                            // updating state
                            application.dispatch({
                                schema: "item",
                                collection: "items",
                                item: response.message,
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
                                {text.abbreviate(application.state.item?.name)}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state.item?.name)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="info" type="rounded" />
                                <div className="title semibold">{translate("item action")}</div>
                            </div>
                            {
                                application.state[application.state.schema]?.visible && (can("edit_item") || can("delete_item"))
                                    ?
                                    <>
                                        {
                                            can("edit_item")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/attraction/item-form`,
                                                        state: { item: application.state[application.state.schema]?._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_item")
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
                                {translate("item information")}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("attraction")}:
                                        </div>
                                        <div className="title text-primary">
                                            {text.reFormat(application.state.item?.attraction?.name)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("east africa price")}:
                                        </div>
                                        <div className="title text-secondary bold">
                                            {number.format(application.state.item?.prices?.east_africa)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("expatriate price")}:
                                        </div>
                                        <div className="title text-success bold">
                                            {number.format(application.state.item?.prices?.expatriate)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("non resident price")}:
                                        </div>
                                        <div className="title text-primary">
                                            {number.format(application.state.item?.prices?.non_resident)}
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
                can("list_item")
                    ?
                    <FloatingButton
                        icon="list_alt"
                        tooltip="list items"
                        to="/attraction/item-list"
                    />
                    : null
            }
        </>
    )
})

export default ItemView