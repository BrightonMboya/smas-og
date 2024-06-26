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

// expense type view memorized functional component
const ExpenseTypeView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_expense_type")) {
            if (props.location.state) {
                const { expenseType }: any = props.location.state
                if (expenseType) {
                    setPageTitle("view expense type")
                    application.dispatch({
                        ids: [expenseType],
                        schema: "expense_type",
                        collection: "expense_types",
                    })
                    onMount(expenseType)
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
            const parameters: string = `schema=expense_type&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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
                application.dispatch({ expense_type: response.message })
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
                                {text.abbreviate(application.state.expense_type?.name)}
                            </div>
                            <div className="view-title">
                                <span>
                                    {text.reFormat(application.state.expense_type?.name)}
                                </span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("expense type menu & action")}</div>
                            </div>
                            {
                                application.state.expense_type?.visible
                                    ?
                                    <Link
                                        to={{
                                            pathname: `/expense/list`,
                                            state: { propsCondition: { expense_type: application.state.expense_type?._id } }
                                        }}
                                        className="view-item"
                                    >
                                        <Icon name="chevron_right" />
                                        <div className="title">{translate("list expenses")}</div>
                                    </Link>
                                    : null
                            }
                            {
                                (can("edit_expense_type") || can("delete_expense_type")) && application.state.expense_type?.visible
                                    ?
                                    <>
                                        {
                                            can("edit_expense_type")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/expense/type-form`,
                                                        state: { expenseType: application.state[application.state.schema]._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_expense_type")
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
                                    can("restore_deleted") && !application.state.expense_type?.visible && !application.state.loading
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
                                <span>{translate("expense type information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title semibold uppercase ${application.state.expense_type?.visible ? "text-success" : "text-error bold"}`}>
                                            {translate(application.state.expense_type?.visible ? "active" : "deleted")}
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
                can("list_expense_type")
                    ?
                    <FloatingButton
                        to="/expense/type-list"
                        tooltip="list expense types"
                    />
                    : null
            }
        </>
    )
})

export default ExpenseTypeView