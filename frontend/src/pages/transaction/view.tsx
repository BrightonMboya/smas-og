// dependencies
import React from "react"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { apiV1, getDate, getRelativeTime, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import { FloatingButton } from "../../components/button"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"
import translate from "../../helpers/translator"
import { Textarea } from "../../components/form"
import { Link } from "react-router-dom"
import { number } from "fast-web-kit"

// transaction view memorized functional component
const TransactionView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        setPageTitle("transaction view")
        onMount()
        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            if (can("view_transaction")) {
                if (props.location.state) {
                    const { transaction }: any = props.location.state
                    if (transaction) {
                        const joinForeignKeys: boolean = true
                        const select: string = JSON.stringify({})
                        const condition: string = JSON.stringify({ _id: transaction })
                        const parameters: string = `schema=transaction&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                            application.dispatch({
                                schema: "transaction",
                                collection: "transactions",
                                ids: [response.message._id],
                                transaction: response.message
                            })
                        }
                        else
                            application.dispatch({
                                notification: response.message
                            })

                    }
                    else
                        props.history.goBack()
                }
                else
                    props.history.goBack()
            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({
                    notification: noAccess
                })
            }

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
    }

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {
                                    text.abbreviate(`${application.state.transaction?.account?.name} ${text.reFormat(application.state.transaction?.account.provider)} ${application.state.transaction?.account_type}`)
                                }
                            </div>
                            <div className="view-title">
                                {application.state.transaction?.account?.name}&nbsp;{text.reFormat(application.state.transaction?.account.provider)}&nbsp;{application.state.transaction?.account_type}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="info" />
                                <div className="title">{translate("transaction information")}</div>
                            </div>
                            <div className="row">
                                <div className="col s12">
                                    <Textarea
                                        label=""
                                        name=""
                                        error=""
                                        readOnly
                                        placeholder=""
                                        onChange={() => { }}
                                        value={application.state.transaction?.description}
                                    />
                                </div>
                            </div>
                            {
                                !application.state.transaction?.sale &&
                                    !application.state.transaction?.debt &&
                                    application.state.transaction?.visible &&
                                    !application.state.transaction?.expense &&
                                    !application.state.transaction?.purchase &&
                                    !application.state.transaction?.truck_order &&
                                    !application.state.transaction?.quotation_invoice &&
                                    (can("delete_transaction") || can("edit_transaction"))
                                    ?
                                    <>
                                        {
                                            can("edit_transaction")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: "/transaction/form",
                                                        state: { transaction: application.state.transaction?._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" />
                                                    <div className="title">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_transaction")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.openDialog("deleted")}
                                                >
                                                    <Icon name="delete" type="rounded text-error" />
                                                    <div className="title">{translate("delete")}</div>
                                                </Link>
                                                : null
                                        }
                                    </>
                                    : null
                            }
                        </div>
                    </div>
                </div>
                <div className="col s12 m5 l8">
                    <div className="view">
                        <div className="view-header">
                            <div className="title">
                                <span>{translate("transaction information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("type")}:
                                        </div>
                                        <div className={`title text-${application.state.transaction?.type === "withdraw" ? "error" : "success"}`}>
                                            {application.state.transaction?.type}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("number")}:
                                        </div>
                                        <div className="title">
                                            {application.state.transaction?.number}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("amount")}:
                                        </div>
                                        <div className="title text-secondary bold">
                                            {number.format(application.state.transaction?.total_amount)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("fee")}:
                                        </div>
                                        <div className="title text-error bold">
                                            {number.format(application.state.transaction?.fee)}
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
                                        <div className="title text-primary bold">
                                            {number.format(application.state.transaction?.total_amount + application.state.transaction?.fee)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("reference")}:
                                        </div>
                                        <div className="title">
                                            {application.state.transaction?.reference}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("cause")}:
                                        </div>
                                        <div className="title">
                                            {application.state.transaction?.cause}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("date")}:
                                        </div>
                                        <div className="title" data-tooltip={getRelativeTime(application.state.transaction?.date)}>
                                            {getDate(application.state.transaction?.date)}
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
                can("list_transaction")
                    ? <FloatingButton
                        icon="list_alt"
                        to="/transaction/list"
                        tooltip="list transactions"
                    />
                    : null
            }
        </>
    )

})

export default TransactionView