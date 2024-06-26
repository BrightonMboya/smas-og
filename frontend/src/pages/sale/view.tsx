// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../components/button"
import { apiV1, noAccess, number, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"

// sale view memorized function componet
const SaleView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_sale")) {
            if (props.location.state) {
                const { sale }: any = props.location.state
                if (sale) {
                    setPageTitle("view sale")
                    application.dispatch({
                        ids: [sale],
                        collection: "sales",
                        schema: "sale"
                    })
                    onMount(sale)
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
            const parameters: string = `schema=sale&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                application.dispatch({ sale: response.message })
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
                                {text.abbreviate(application.state[application.state.schema]?.product?.name)}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state[application.state.schema]?.product?.name)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <i className="material-icons-round">info</i>
                                <div className="title">{translate(`${text.reFormat(application.state.schema)} information`)}</div>
                            </div>
                            {
                                application.state[application.state.schema]?.visible && can("delete_sale")
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
                                <div className="col s12 m6 l6">
                                    <Link
                                        className="view-detail"
                                        to={can("view_customer") && application.state[application.state.schema]?.customer ? {
                                            pathname: "/customer/view",
                                            state: { customer: application.state[application.state.schema]?.customer?._id }
                                        } : "#"}
                                    >
                                        <div className="label">
                                            {translate("customer")}:
                                        </div>
                                        <div className="title text-primary bold">
                                            {application.state[application.state.schema]?.customer ? text.reFormat(application.state[application.state.schema]?.customer?.name) : translate("n/a")}
                                        </div>
                                    </Link>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">{translate("quantity")}</div>
                                        <div className="title">{number.format(application.state[application.state.schema]?.quantity)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">{translate("amount")}</div>
                                        <div className="title text-primary">{number.format(application.state[application.state.schema]?.total_amount)}</div>
                                    </div>
                                </div>
                                {
                                    can("view_profit")
                                        ?
                                        <div className="col s12 m6 l6">
                                            <div className="view-detail">
                                                <div className="label">{translate("profit")}</div>
                                                <div className="title text-success">{application.state[application.state.schema]?.profit > 0 ? number.format(application.state[application.state.schema]?.profit) : 0}</div>
                                            </div>
                                        </div>
                                        : null
                                }
                            </div>
                            {
                                can("view_loss") || can("view_discount")
                                    ?
                                    <div className="row">
                                        {
                                            can("view_discount")
                                                ?
                                                <div className="col s12 m6 l6">
                                                    <div className="view-detail">
                                                        <div className="label">{translate("discount")}</div>
                                                        <div className="title text-warning">{application.state[application.state.schema]?.discount > 0 ? number.format(application.state[application.state.schema]?.discount) : 0}</div>
                                                    </div>
                                                </div>
                                                : null
                                        }
                                        {
                                            can("view_loss")
                                                ?
                                                <div className="col s12 m6 l6">
                                                    <div className="view-detail">
                                                        <div className="label">{translate("loss")}</div>
                                                        <div className="title text-error">{application.state[application.state.schema]?.profit < 0 ? number.format(application.state[application.state.schema]?.profit * -1) : 0}</div>
                                                    </div>
                                                </div>
                                                : null
                                        }
                                    </div>
                                    : null
                            }
                            <div className="row">
                                {
                                    can("view_profit")
                                        ?
                                        <div className="col s12 m6 l6">
                                            <div className="view-detail">
                                                <div className="label">{translate("extra profit")}</div>
                                                <div className="title text-success">{application.state[application.state.schema]?.discount < 0 ? number.format(application.state[application.state.schema]?.discount * -1) : 0}</div>
                                            </div>
                                        </div>
                                        : null
                                }
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>{translate("status")}:</div>
                                        <div className={`title ${application.state[application.state.schema]?.visible ? "text-success" : "text-error bold"}`}>
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
                can("list_sale")
                    ? <FloatingButton to="/sale/list" icon="list_alt" tooltip="list sales" />
                    : null
            }
        </>
    )

})

export default SaleView