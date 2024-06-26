// dependencies
import React from "react"
import { FloatingButton } from "../../components/button"
import { apiV1, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { readOrDelete, routerProps, serverResponse } from "../../types"
import { Textarea } from "../../components/form"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { Link } from "react-router-dom"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"
import { number } from "fast-web-kit"

// expense type view memorized functional component
const ExpenseView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_expense")) {
            if (props.location.state) {
                const { expense }: any = props.location.state
                if (expense) {
                    setPageTitle("view expense")
                    application.dispatch({
                        ids: [expense],
                        schema: "expense",
                        collection: "expenses",
                    })
                    onMount(expense)
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
            const parameters: string = `schema=expense&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                application.dispatch({ expense: response.message })
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
                                {text.abbreviate(application.state.expense?.name)}
                            </div>
                            <div className="view-title">
                                <span>
                                    {text.reFormat(application.state.expense?.name)}
                                </span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title">{translate("expense actions")}</div>
                            </div>
                            <div className="row">
                                <div className="col s12">
                                    <Textarea
                                        name=""
                                        label=""
                                        value={application.state.expense?.description}
                                        error=""
                                        onChange={() => { }}
                                        placeholder=""
                                        readOnly
                                    />
                                </div>
                            </div>
                            {
                                (can("edit_expense") || can("delete_expense")) && application.state.expense?.visible
                                    ?
                                    <>
                                        {
                                            can("edit_expense")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/expense/form`,
                                                        state: { expense: application.state.expense._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_expense")
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
                                    can("restore_deleted") && !application.state.expense?.visible && !application.state.loading
                                        ?
                                        <Link
                                            to="#"
                                            className="view-item"
                                            onClick={() => application.openDialog("restored")}
                                        >
                                            <i className="material-icons-round text-warning">restore_from_trash</i>
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
                                <span>{translate("expense information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("reference")}:
                                        </div>
                                        <div className={`title semibold`}>
                                            {application.state.expense?.reference ? application.state.expense?.reference : translate("n/a")}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("has_receipt")}:
                                        </div>
                                        <div className={`title semibold`}>
                                            {
                                                application.state.expense?.has_receipt ? translate("yes") : translate("no")
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <Link to={can("view_expense_type") ? {
                                        pathname: "/expense/type-view",
                                        state: { expenseType: application.state.expense?.expense_type?._id }
                                    } : "#"}>
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("type")}:
                                            </div>
                                            <div className="title bold text-primary">
                                                {text.reFormat(application.state.expense?.expense_type?.name)}
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
                                            {getDate(application.state.expense?.date)}
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
                                            {number.format(application.state.expense?.total_amount)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("paid amount")}:
                                        </div>
                                        <div className="title text-primary semibold">
                                            {number.format(application.state.expense?.paid_amount)}
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
                                            {number.format(application.state.expense?.total_amount - application.state.expense?.paid_amount)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold ${application.state.expense?.visible ? "text-success" : "text-error bold"}`}>
                                            {translate(application.state.expense?.visible ? "active" : "deleted")}
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
                can("list_expense")
                    ?
                    <FloatingButton
                        to="/expense/list"
                        tooltip="list expenses"
                    />
                    : null
            }
        </>
    )
})

export default ExpenseView