// dependencies
import React from "react"
import { moduleMenuOnView, readOrDelete, routerProps, serverResponse } from "../../../types"
import { can } from "../../../helpers/permissions"
import { FloatingButton } from "../../../components/button"
import { ApplicationContext } from "../../../context"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import translate from "../../../helpers/translator"
import { number } from "fast-web-kit"
import { Link } from "react-router-dom"
import { Icon } from "../../../components/elements"
import ViewDetail from "../../../components/view-detail"
import accountViewMenu from "./helper/account-view-menu"

// account view memorized functional component
const AccountView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        setPageTitle("account view")
        onMount()
        // component unmounting
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            if (can("view_account")) {
                if (props.location.state) {
                    const { account }: any = props.location.state
                    if (account) {

                        const joinForeignKeys: boolean = true
                        const select: string = JSON.stringify({
                            type: 1,
                            name: 1,
                            visible: 1,
                            number: 1,
                            balance: 1,
                            provider: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            monthly_fee: 1,
                            customer: 1,
                            supplier: 1,
                            user: 0,
                        })
                        const condition: string = JSON.stringify({ _id: account })
                        const parameters: string = `schema=account&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
                        const options: readOrDelete = {
                            parameters,
                            method: "GET",
                            loading: true,
                            disabled: false,
                            route: apiV1 + "read"
                        }

                        const response: serverResponse = await application.readOrDelete(options)

                        if (response.success) {

                            const account = response.message
                            application.dispatch({
                                account,
                                schema: "account",
                                ids: [account._id],
                                collection: "accounts"
                            })
                        }
                        else
                            application.dispatch({ notification: response.message })
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
                                    text.abbreviate(application.state.account?.name)
                                }
                            </div>
                            <div className="view-title">
                                {application.state.account?.name}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="summarize" />
                                <div className="title semibold">{translate("account menu & actions")}</div>
                            </div>
                            {
                                accountViewMenu.map((accountMenu: moduleMenuOnView, index: number) => {
                                    if (accountMenu.visible && application.state.account?.visible)
                                        return (
                                            <Link
                                                to={{
                                                    pathname: `${accountMenu.link}`,
                                                    state: {
                                                        propsCondition: {
                                                            account: application.state.account?._id,
                                                        },
                                                        account: application.state[application.state.schema]
                                                    }
                                                }}
                                                className="view-item" key={index}
                                            >
                                                <Icon name="chevron_right" />
                                                <div className="title">{translate(accountMenu.name)}</div>
                                            </Link>
                                        )
                                    else
                                        return null
                                })
                            }
                            {
                                application.state.account?.visible && (can("edit_account") || can("delete_account") || can("enable_account") || can("disable_account"))
                                    ?
                                    <>
                                        {
                                            can("disable_account") && !application.state.account?.disabled
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.openDialog('disabled')}
                                                >
                                                    <Icon name="warning" type="rounded text-warning" />
                                                    <div className="title semibold">{translate("disable")}</div>
                                                </Link>
                                                : can("enable_account") && application.state.account?.disabled
                                                    ?
                                                    <Link
                                                        to="#"
                                                        className="view-item"
                                                        onClick={() => application.openDialog('enabled')}
                                                    >
                                                        <Icon name="enable" type="rounded text-success" />
                                                        <div className="title semibold">{translate("enable")}</div>
                                                    </Link>
                                                    : null

                                        }
                                        {
                                            can("edit_account")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/account/form`,
                                                        state: { account: application.state.account?._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title semibold">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_account")
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
                                    : !application.state.account?.visible && can("restore_deleted") && !application.state.loading
                                        ?
                                        <Link
                                            to="#"
                                            className="view-item"
                                            onClick={() => application.openDialog("restored")}
                                        >
                                            <Icon name="restore_from_trash" />
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
                                <span>{translate("account information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("account type")}:
                                        </div>
                                        <div className="title text-primary">
                                            {text.reFormat(application.state.account?.type)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("provider")}:
                                        </div>
                                        <div className="title">
                                            {text.reFormat(application.state.account?.provider)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("available balance")}:
                                        </div>
                                        <div className={`title semibold text-${application.state.account?.balance >= 0 ? "primary" : "error"}`}>
                                            {number.format(application.state.account?.balance)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("monthly fee")}:
                                        </div>
                                        <div className="title semibold text-error">
                                            {number.format(application.state.account?.monthly_fee)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("account number")}:
                                        </div>
                                        <div className="title semibold">
                                            {application.state.account?.number ? application.state.account?.number?.toUpperCase() : translate("n/a")}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold text-${application.state.account?.disabled || !application.state.account?.visible ? "error" : "success"}`}>
                                            {
                                                translate(application.state.account?.disabled ? "disabled" : !application.state.account?.visible ? "deleted" : "active").toUpperCase()
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {
                                application.state.account?.type === "user" || application.state.account?.type === "customer" || application.state.account?.type === "supplier"
                                    ?
                                    <div className="row">
                                        <div className="col s12">
                                            <Link to={can("view_expense_type") ? {
                                                pathname: `/${application.state.account?.type}/view`,
                                                state: {
                                                    [application.state.account?.type]: application.state.account?.[application.state.account?.type]?._id
                                                }
                                            } : "#"}>
                                                <div className="view-detail">
                                                    <div className="label">
                                                        {translate(application.state.account?.type)}:
                                                    </div>
                                                    <div className="title text-primary">
                                                        {
                                                            text.reFormat(application.state.account?.type !== "user" ? application.state.account[application.state.account?.type]?.name : application.state.account[application.state.account?.type]?.username)
                                                        }
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                    : null
                            }
                            <ViewDetail />
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_account")
                    ?
                    <FloatingButton
                        icon="list_alt"
                        to="/transaction/account-list"
                        tooltip="list accounts"
                    />
                    : null
            }
        </>
    )
})

export default AccountView