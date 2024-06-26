// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../components/button"
import { Textarea } from "../../components/form"
import { apiV1, getDate, noAccess, pageNotFound, text } from "../../helpers"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"
import { number } from "fast-web-kit"

// debt view memorized function component
const DebtView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application conext
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user permission
        if (can("view_debt")) {
            if (props.location.state) {
                const { debt }: any = props.location.state

                if (debt) {
                    document.title = "Debt view"
                    application.dispatch({
                        ids: [debt],
                        schema: "debt",
                        collection: "debts"
                    })
                    onMount(debt)
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
            const parameters: string = `schema=debt&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                application.dispatch({ debt: response.message })
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
                                {
                                    text.abbreviate(
                                        application.state.debt?.sale ? "sale debt" :
                                            application.state.debt?.expense ? "expense debt" :
                                            application.state.debt?.purchase ? "supplier debt" :
                                            application.state.debt?.truck_order ? "truck order debt" :
                                                    application.state.debt?.quotation_invoice ? "quotation invoice debt" : "customer debt"
                                    )
                                }
                            </div>
                            <div className="view-title">
                                <span>
                                    {
                                        translate(
                                            application.state.debt?.sale ? "sale debt" :
                                                application.state.debt?.expense ? "expense debt" :
                                                    application.state.debt?.purchase ? "supplier debt" :
                                                    application.state.debt?.truck_order ? "truck order debt" :
                                                        application.state.debt?.quotation_invoice ? "quotation invoice debt" : "customer debt"
                                        )
                                    }
                                </span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("debt menu & action")}</div>
                            </div>
                            {
                                application.state.debt?.visible
                                    ?
                                    <>
                                        {
                                            (application.state.debt?.total_amount !== application.state.debt?.paid_amount) && (can("create_debt_payment"))
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/debt/history-form`,
                                                        state: { debt: application.state.debt?._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="chevron_right" />
                                                    <div className="title">{translate("debt payment")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            (application.state.debt?.paid_amount > 0) && can("list_debt_history")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/debt/history-list`,
                                                        state: { propsCondition: { debt: application.state.debt?._id } }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="chevron_right" />
                                                    <div className="title">{translate("list debt history")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("edit_debt") || can("delete_debt")
                                                ?
                                                <>
                                                    {
                                                        can("edit_debt") &&
                                                            !application.state.debt?.sale &&
                                                            !application.state.debt?.expense &&
                                                            !application.state.debt?.truck_order &&
                                                            !application.state.debt?.quotation_invoice &&
                                                            !application.state.debt?.purchase
                                                            ?
                                                            <Link
                                                                to={{
                                                                    pathname: `/debt/form`,
                                                                    state: { debt: application.state[application.state.schema]._id }
                                                                }}
                                                                className="view-item"
                                                            >
                                                                <Icon name="edit_note" type="rounded text-success" />
                                                                <div className="title semibold">{translate("edit")}</div>
                                                            </Link>
                                                            : null
                                                    }
                                                    {
                                                        can("delete_debt") &&
                                                            (application.state.debt?.paid_amount !== application.state.debt?.total_amount) &&
                                                            !application.state.debt?.sale &&
                                                            !application.state.debt?.expense &&
                                                            !application.state.debt?.quotation_invoice &&
                                                            !application.state.debt?.purchase
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
                                    </>
                                    :
                                    can("restore_deleted") && !application.state.debt?.visible && !application.state.loading
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
                            <div className="row">
                                <div className="col s12">
                                    <Textarea
                                        name=""
                                        label=""
                                        value={application.state.debt?.description}
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
                                    <Link
                                        className="view-detail"
                                        to="#"
                                    >
                                        <div className={`label text-${application.state.debt?.type === "debtor" ? "primary" : "error"}`}>
                                            {translate(application.state.debt?.type)}:
                                        </div>
                                        <div className="title semibold">
                                            {text.reFormat(
                                                application.state.debt?.customer ? application.state.debt?.customer?.name :
                                                    application.state.debt?.expense ? application.state.debt?.expense?.name :
                                                        application.state.debt?.supplier ? application.state.debt?.supplier?.name : "n/a"
                                            )}
                                        </div>
                                    </Link>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("date")}:
                                        </div>
                                        <div className="title">
                                            {getDate(application.state.debt?.date)}
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
                                            {number.format(application.state.debt?.total_amount)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("paid amount")}:
                                        </div>
                                        <div className="title text-primary semibold">
                                            {number.format(application.state.debt?.paid_amount)}
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
                                            {number.format(application.state.debt?.total_amount - application.state.debt?.paid_amount)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold
                                        ${!application.state.debt?.visible ? "text-error " : application.state.debt?.status === "unpaid" ? "text-error" : "text-success"}
                                        `}>
                                            {translate(application.state.debt?.visible ? application.state.debt?.status : "deleted")}
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
                can("list_debt")
                    ? <FloatingButton to="/debt/list" tooltip="list debts" />
                    : null
            }
        </>
    )

})

// exporting component
export default DebtView