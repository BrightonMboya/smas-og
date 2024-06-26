// dependencies
import React from "react"
import { FloatingButton } from "../../components/button"
import { apiV1, noAccess, number, pageNotFound, setPageTitle, text } from "../../helpers"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { Link } from "react-router-dom"
import translate from "../../helpers/translator"
import { can } from "../../helpers/permissions"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"

// payment  view memorized functional component
const PaymentView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_payment")) {
            if (props.location.state) {
                const { payment }: any = props.location.state
                if (payment) {
                    setPageTitle("view payment")
                    application.dispatch({
                        ids: [payment],
                        schema: "payment",
                        collection: "payments",
                    })
                    onMount(payment)
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
            const parameters: string = `schema=payment&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                application.dispatch({ payment: response.message })
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
                                {text.abbreviate(application.state[application.state.schema]?.type)}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state[application.state.schema]?.type)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <i className="material-icons-round">info</i>
                                <div className="title">{translate(`${text.reFormat(application.state.schema)} information`)}</div>
                            </div>
                            {
                                application.state[application.state.schema]?.visible && can("cancel_payment") && application.state[application.state.schema]?.status === "active"
                                    ?
                                    <>
                                        {
                                            can("cancel_payment")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.openDialog("canceled")}
                                                >
                                                    <i className="material-icons-round text-error">cancel</i>
                                                    <div className="title">{translate("cancel")}</div>
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
                                <span>{translate(`${text.reFormat(application.state.schema)} information`)}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("type")}:
                                        </div>
                                        <div className="title text-primary bold">
                                            {text.reFormat(application.state[application.state.schema]?.type)}
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
                                        <div className="title">
                                            {number.format(application.state[application.state.schema]?.total_amount)}
                                        </div>
                                    </div>
                                </div>

                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title bold ${application.state[application.state.schema]?.status === "canceled" || (application.state[application.state.schema]?.status === "canceled") ? "text-error" : "text-success"}`}>
                                            {translate(!application.state[application.state.schema]?.visible ? "deleted" : (application.state[application.state.schema]?.status === "canceled") ? "canceled" : "active")}
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
                can("list_payment")
                    ?
                    <FloatingButton
                        to="/payment/list"
                        tooltip="list payments"
                        icon="list_alt"
                    />
                    : null
            }
        </>
    )
})

export default PaymentView