// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../../components/button"
import { Textarea } from "../../../components/form"
import { apiV1, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { readOrDelete, routerProps, serverResponse } from "../../../types"
import { ApplicationContext } from "../../../context"
import ViewDetail from "../../../components/view-detail"
import { Icon } from "../../../components/elements"
import { number } from "fast-web-kit"

// adjustment view memorized function component
const AdjustmentView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        if (can("view_stock_adjustment")) {
            if (props.location.state) {
                const pathname: string = props.location.pathname
                const { adjustment }: any = props.location.state
                if (adjustment) {
                    application.dispatch({
                        pathname,
                        ids: [adjustment],
                        schema: "adjustment",
                        collection: "adjustments"
                    })
                    onMount(adjustment)
                    setPageTitle("view adjustment")
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

            // parameters, condition, select, join foreign keys
            const joinForeignKeys: boolean = true
            const select: string = JSON.stringify({})
            const condition: string = JSON.stringify({ _id })
            const parameters: string = `schema=adjustment&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
            const options: readOrDelete = {
                route: apiV1 + "read",
                method: "GET",
                loading: true,
                disabled: false,
                parameters
            }

            const response: serverResponse = await application.readOrDelete(options)

            if (response.success)
                application.dispatch({ adjustment: response.message })
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
                                    text.abbreviate(application.state[application.state.schema]?.product ?
                                        application.state[application.state.schema].product?.name :
                                        application.state[application.state.schema]?.store_product?.name)
                                }
                            </div>
                            <div className="view-title">
                                <span>
                                    {text.reFormat(application.state[application.state.schema]?.product ? application.state[application.state.schema].product?.name : application.state[application.state.schema]?.store_product?.name)}
                                </span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="info" />
                                <div className="title semibold">{translate(`${text.reFormat(application.state.schema)} information`)}</div>
                            </div>
                            <div className="row">
                                <div className="col s12">
                                    <Textarea
                                        readOnly
                                        label=""
                                        error=""
                                        placeholder=""
                                        name="description"
                                        onChange={() => { }}
                                        value={translate(application.state[application.state.schema]?.description)}
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
                                <span>{translate(`${text.reFormat(application.state.schema)} information`)}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <Link to={can("view_user") ? {
                                    pathname: "/user/view",
                                    state: { user: application.state[application.state.schema]?.user?._id }
                                } : "#"}>
                                    <div className="col s12 m6 l6">
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("user")}:
                                            </div>
                                            <div className="title bold text-primary">
                                                {text.reFormat(application.state[application.state.schema]?.user?.username)}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase semibold ${!application.state[application.state.schema]?.visible ? "text-error" : "text-success"}`}>
                                            {translate(!application.state[application.state.schema]?.visible ? "deleted" : "active")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("before adjustment")}:
                                        </div>
                                        <div className="title semibold">
                                            {number.format(application.state[application.state.schema]?.before_adjustment)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("adjustment")}:
                                        </div>
                                        <div className={`title semibold text-${application.state[application.state.schema]?.type === "increase" ? "success" : "error"} `}>
                                            {application.state[application.state.schema]?.type === "increase" ? "+" : "-"}{number.format(application.state[application.state.schema]?.adjustment)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("after adjustment")}:
                                        </div>
                                        <div className="title text-primary bold">
                                            {number.format(application.state[application.state.schema]?.after_adjustment)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("type")}:
                                        </div>
                                        <div className={`title text-primary text-${application.state[application.state.schema]?.type === "increase" ? "success" : "error"}`}>
                                            {translate(application.state[application.state.schema]?.type === "increase" ? "increased" : "decreased")}
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
                can("list_stock_adjustment")
                    ? <FloatingButton
                        to={application.state.pathname.includes("product") ? "/product/adjustment-list" : "/store/adjustment-list"}
                        tooltip="list adjustments"
                    />
                    : null
            }
        </>
    )

})

export default AdjustmentView