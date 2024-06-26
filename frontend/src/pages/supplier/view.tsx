import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../components/button"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"

const SupplierView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {

        if (can("view_supplier")) {
            if (props.location.state) {
                const { supplier }: any = props.location.state
                if (supplier) {
                    setPageTitle("view supplier")
                    application.dispatch({
                        ids: [supplier],
                        schema: "supplier",
                        collection: "suppliers",
                    })
                    onMount(supplier)
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

        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(_id: string): Promise<void> {
        try {

            const joinForeignKeys: boolean = true
            const select: string = JSON.stringify({})
            const condition: string = JSON.stringify({ _id })
            const parameters: string = `schema=supplier&condition=${condition}&joinForeignKeys=${joinForeignKeys}&select=${select}`
            const options: readOrDelete = {
                route: apiV1 + "read",
                method: "GET",
                loading: true,
                disabled: true,
                parameters
            }
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success)
                application.dispatch({ supplier: response.message })
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
                                <i className="material-icons-round">info</i>
                                <div className="title">{translate("supplier information")}</div>
                            </div>
                            {
                                can("create_purchase")
                                    ?
                                    <>
                                        <Link
                                            to={{
                                                pathname: "/purchase/form",
                                                state: { propsCondition: { supplier: application.state[application.state.schema]?._id }, supplier: application.state[application.state.schema] }
                                            }}
                                            className="view-item"
                                        >
                                            <i className="material-icons-round">chevron_right</i>
                                            <div className="title">{translate("new purchase")}</div>
                                        </Link>
                                        <Link
                                            to={{
                                                pathname: "/purchase/bulk",
                                                state: { propsCondition: { supplier: application.state[application.state.schema]?._id }, supplier: application.state[application.state.schema] }
                                            }}
                                            className="view-item"
                                        >
                                            <i className="material-icons-round">chevron_right</i>
                                            <div className="title">{translate("bulk purchase")}</div>
                                        </Link>
                                    </>
                                    : null
                            }
                            {
                                can("list_purchase")
                                    ?
                                    <>
                                        <Link
                                            to={{
                                                pathname: "/purchase/list",
                                                state: { propsCondition: { supplier: application.state[application.state.schema]?._id }, supplier: application.state[application.state.schema] }
                                            }}
                                            className="view-item"
                                        >
                                            <i className="material-icons-round">chevron_right</i>
                                            <div className="title">{translate("list purchases")}</div>
                                        </Link>
                                    </>
                                    : null
                            }
                            {
                                application.state[application.state.schema]?.visible && (can("edit_supplier") || can("delete_supplier"))
                                    ?
                                    <>
                                        {
                                            can("edit_supplier")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/supplier/form`,
                                                        state: { supplier: application.state[application.state.schema]?._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <i className="material-icons-round text-success">edit_note</i>
                                                    <div className="title">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_supplier")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.openDialog("deleted")}
                                                >
                                                    <i className="material-icons-round text-error">delete</i>
                                                    <div className="title">{translate("delete")}</div>
                                                </Link>
                                                : null
                                        }
                                    </>
                                    : !application.state[application.state.schema]?.visible && can("restore_deleted")
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
                                <span>{translate("supplier information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("phone number")}:
                                        </div>
                                        <div className="title text-primary">
                                            {application.state[application.state.schema]?.phone_number}
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
                                        <div className="label">
                                            {translate("location")}:
                                        </div>
                                        <div className="title">
                                            {text.reFormat(application.state[application.state.schema]?.address?.location)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("street")}:
                                        </div>
                                        <div className="title">
                                            {text.reFormat(application.state[application.state.schema]?.address?.street)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title ${application.state[application.state.schema]?.visible ? "text-success" : "text-error bold"}`}>
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
                can("list_supplier")
                    ?
                    <FloatingButton
                        to="/supplier/list"
                        icon="list_alt"
                        tooltip="list suppliers"
                    />
                    : null
            }
        </>
    )

})

export default SupplierView