// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../../components/button"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../../types"
import { ApplicationContext } from "../../../context"
import ViewDetail from "../../../components/view-detail"
import { Icon } from "../../../components/elements"

// category view memorized functional component
const CategoryView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_category")) {
            if (props.location.state) {
                const { category }: any = props.location.state
                if (category) {
                    setPageTitle("view category")
                    application.dispatch({
                        ids: [category],
                        schema: "category",
                        collection: "categories",
                    })
                    onMount(category)
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
            const parameters: string = `schema=category&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                application.dispatch({ category: response.message })
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
                                {text.abbreviate(application.state.category?.name)}
                            </div>
                            <div className="view-title">
                                <span>
                                    {text.reFormat(application.state.category?.name)}
                                </span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("category menu & action")}</div>
                            </div>
                            {
                                (can("edit_category") || can("delete_category")) && application.state.category?.visible
                                    ?
                                    <>
                                        {
                                            can("edit_category")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/product/category-form`,
                                                        state: { category: application.state[application.state.schema]._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_category")
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
                                    can("restore_deleted") && !application.state.category?.visible && !application.state.loading
                                        ?
                                        <Link
                                            to="#"
                                            className="view-item"
                                            onClick={() => application.openDialog("restored")}
                                        >
                                            <i className="material-icons-round text-warning">restore_from_trash</i>
                                            <div className="title">{translate("restore")}</div>
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
                                <span>{translate("category information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title semibold uppercase ${application.state.category?.visible ? "text-success" : "text-error bold"}`}>
                                            {translate(application.state.category?.visible ? "active" : "deleted")}
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
                can("list_category")
                    ?
                    <FloatingButton
                        to="/product/category-list"
                        tooltip="list categories"
                    />
                    : null
            }
        </>
    )
})

export default CategoryView