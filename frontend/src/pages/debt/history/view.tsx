// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../../components/button"
import { Textarea } from "../../../components/form"
import { apiV1, getDate, noAccess, pageNotFound, text } from "../../../helpers"
import { readOrDelete, routerProps, serverResponse } from "../../../types"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { ApplicationContext } from "../../../context"
import ViewDetail from "../../../components/view-detail"
import { Icon } from "../../../components/elements"
import { number } from "fast-web-kit"

// debt view memorized function component
const DebtHistoryView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("view_debt_history")) {
            if (props.location.state) {
                const { debt_history }: any = props.location.state

                if (debt_history) {
                    document.title = "Debt history view"
                    application.dispatch({
                        ids: [debt_history],
                        schema: "debt_history",
                        collection: "debt_histories"
                    })
                    onMount(debt_history)
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

    // fetching component data
    async function onMount(_id: string): Promise<void> {
        try {

            // paramaters, condition, select, and foreign field population
            const joinForeignKeys: boolean = true
            const select: string = JSON.stringify({})
            const condition: string = JSON.stringify({ _id })
            const parameters: string = `schema=debt_history&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

            // request options
            const options: readOrDelete = {
                route: apiV1 + "read",
                method: "GET",
                loading: true,
                disabled: false,
                parameters
            }

            const response: serverResponse = await application.readOrDelete(options)

            if (response.success)
                application.dispatch({ debt_history: response.message })
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
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
                                {text.abbreviate(application.state.debt_history?.debt?.type)}
                            </div>
                            <div className="view-title">
                                <span>
                                    {text.reFormat(application.state.debt_history?.debt?.type)}
                                </span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title">{translate("debt action")}</div>
                            </div>
                            {
                                application.state.debt_history?.visible
                                    ?
                                    <>
                                        {
                                            can("delete_debt_history")
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
                            <div className="row">
                                <div className="col s12">
                                    <Textarea
                                        name=""
                                        label=""
                                        value={application.state.debt_history?.description}
                                        error=""
                                        onChange={() => { }}
                                        placeholder=""
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col s12 m7 l8">
                    <div className="view">
                        <div className="view-header">
                            <div className="title">
                                <span>{translate("debt information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div
                                        className="view-detail"
                                    >
                                        <div className="label">
                                            {translate(application.state.debt_history?.debt?.type)}:
                                        </div>
                                        <div className="title text-primary bold">
                                            {text.reFormat(
                                                application.state.debt_history?.debt?.customer ? application.state.debt_history?.debt?.customer?.name :
                                                    application.state.debt_history?.debt?.expense ? application.state.debt_history?.debt?.expense?.name :
                                                        application.state.debt_history?.debt?.supplier ? application.state.debt_history?.debt?.supplier?.name : "n/a"
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("date")}:
                                        </div>
                                        <div className="title">
                                            {getDate(application.state.debt_history?.date)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("debt")}:
                                        </div>
                                        <div className="title text-error semibold">
                                            {number.format(application.state.debt_history?.debt?.total_amount)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("paid amount")}:
                                        </div>
                                        <div className="title text-primary semibold">
                                            {number.format(application.state.debt_history?.total_amount)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold
                                        ${!application.state.debt_history?.visible ? "text-error " : application.state.debt_history?.debt?.status === "unpaid" ? "text-warning" : "text-success"}
                                        `}>
                                            {translate(application.state.debt_history?.visible ? "active" : "deleted")}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("reference")}:
                                        </div>
                                        <div className={`title semibold`}>
                                            {application.state.debt_history?.reference}
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
                can("list_debt_history")
                    ? <FloatingButton to="/debt/history-list" tooltip="list debts" />
                    : null
            }
        </>
    )

})

// exporting component
export default DebtHistoryView