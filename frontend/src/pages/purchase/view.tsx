// dependencies
import React from "react"
import { FloatingButton } from "../../components/button"
import { apiV1, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { Link } from "react-router-dom"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"
import { number } from "fast-web-kit"

// purchase type view memorized functional component
const PurchaseView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_purchase")) {
            if (props.location.state) {
                const { purchase }: any = props.location.state
                if (purchase) {
                    setPageTitle("view purchase")
                    application.dispatch({
                        ids: [purchase],
                        schema: "purchase",
                        collection: "purchases",
                    })
                    onMount(purchase)
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
            const condition: string = JSON.stringify({ _id })
            const select: string = JSON.stringify({})
            const joinForeignKeys: boolean = true
            const parameters: string = `schema=purchase&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                application.dispatch({ purchase: response.message })
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
                                {text.abbreviate(application.state.purchase?.product?.name)}
                            </div>
                            <div className="view-title">
                                <span>
                                    {text.reFormat(application.state.purchase?.product?.name)}
                                </span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("purchase action")}</div>
                            </div>
                            {
                                (can("delete_purchase") || can("edit_purchase")) && application.state.purchase?.visible
                                    ?
                                    <>
                                        {
                                            can("edit_purchase")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/purchase/form`,
                                                        state: { purchase: application.state.purchase?._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_purchase")
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
                                    : null
                            }
                        </div>
                    </div>
                </div>
                <div className="col s12 m7 l8">
                    <div className="view">
                        <div className="view-header">
                            <div className="title">
                                <span>{translate("purchase information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <Link to={can("view_supplier") && application.state.purchase?.supplier ? {
                                        pathname: "/supplier/view",
                                        state: { supplier: application.state.purchase?.supplier?._id }
                                    } : "#"}>
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("supplier")}:
                                            </div>
                                            <div className="title text-primary">
                                                {application.state.purchase?.supplier ? text.reFormat(application.state.purchase?.supplier?.name) : translate("n/a")}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("date")}:
                                        </div>
                                        <div className="title">
                                            {getDate(application.state.purchase?.date)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("invoice number")}:
                                        </div>
                                        <div className="title">
                                            {application.state.purchase?.number ? application.state.purchase?.number : translate("n/a")}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("reference")}:
                                        </div>
                                        <div className="title">
                                            {application.state.purchase?.reference ? application.state.purchase?.reference : translate("n/a")}
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
                                        <div className="title semibold text-primary">
                                            {number.format(application.state.purchase?.total_amount)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("paid amount")}:
                                        </div>
                                        <div className="title text-success semibold">
                                            {number.format(application.state.purchase?.paid_amount)}
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
                                            {number.format(application.state.purchase?.total_amount - application.state.purchase?.paid_amount)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold ${application.state.purchase?.visible ? "text-success" : "text-error bold"}`}>
                                            {translate(application.state.purchase?.visible ? "active" : "deleted")}
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
                can("list_purchase")
                    ?
                    <FloatingButton
                        tooltip="list purchases"
                        to={application.state.purchase?.product.is_store_product ? "/store/purchase-list" : "/purchase/list"}
                    />
                    : null
            }
        </>
    )
})

export default PurchaseView