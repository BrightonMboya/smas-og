// dependencies
import React from "react"
import { ApplicationContext } from "../context"
import { can } from "../helpers/permissions"
import { Link } from "react-router-dom"
import translate from "../helpers/translator"
import { formatDate, getDate, text } from "../helpers"

// bottom view detail memorized function component
const ViewDetail: React.FunctionComponent = React.memo(() => {

    const { application } = React.useContext(ApplicationContext)

    return (
        <>
            {
                can("view_user")
                    ?
                    <>
                        <div className="row">
                            <div className="col s12 m6 l6">
                                <Link
                                    to={{
                                        pathname: application.state[application.state.schema]?.created_by ? "/user/view" : "#",
                                        state: { user: application.state[application.state.schema]?.created_by?._id }
                                    }}
                                    className="view-detail"
                                >
                                    <div className="label">
                                        {translate("created by")}:
                                    </div>
                                    <div className="title">
                                        {text.reFormat(application.state[application.state.schema]?.created_by?.username)}
                                    </div>
                                </Link>
                            </div>
                            <div className="col s12 m6 l6">
                                <div className="view-detail">
                                    <div className="label">
                                        {translate("created date")}:
                                    </div>
                                    <div className="title" data-tooltip={translate(formatDate(application.state[application.state.schema]?.createdAt))}>
                                        {
                                            getDate(application.state[application.state.schema]?.createdAt)
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col s12 m6 l6">
                                <Link
                                    to={{
                                        pathname: application.state[application.state.schema]?.updated_by ? "/user/view" : "#",
                                        state: { user: application.state[application.state.schema]?.updated_by?._id }
                                    }}
                                    className="view-detail"
                                >
                                    <div className={`label ${!application.state[application.state.schema]?.visible ? "text-error bold" : ""}`}>
                                        {translate(application.state[application.state.schema]?.visible ? "updated by" : "deleted by")}:
                                    </div>
                                    <div className="title">
                                        {
                                            application.state[application.state.schema]?.updated_by ? text.reFormat(application.state[application.state.schema]?.updated_by?.username) : translate("n/a")
                                        }
                                    </div>
                                </Link>
                            </div>
                            <div className="col s12 m6 l6">
                                <div className="view-detail">
                                    <div className={`label ${!application.state[application.state.schema]?.visible ? "text-error bold" : ""}`}>
                                        {translate(application.state[application.state.schema]?.visible ? "updated date" : "deleted date")}:
                                    </div>
                                    <div className="title" data-tooltip={application.state[application.state.schema]?.updated_by ? translate(formatDate(application.state[application.state.schema]?.updatedAt)) : ""}>
                                        {
                                            application.state[application.state.schema]?.updated_by ? getDate(application.state[application.state.schema]?.updatedAt) : translate("n/a")
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                    : null
            }
            {
                can("view_branch")
                    ?
                    <div className="row">
                        <div className="col s12">
                            <Link to={{
                                pathname: application.state[application.state.schema]?.branch ? "/branch/view" : "#",
                                state: { branch: application.state[application.state.schema]?.branch?._id }
                            }}
                                className="view-detail"
                            >
                                <div className="label">
                                    {translate("branch")}:
                                </div>
                                <div className="title">
                                    {application.state[application.state.schema]?.branch ? text.reFormat(application.state[application.state.schema]?.branch?.name) : translate("n/a")}
                                </div>
                            </Link>
                        </div>
                    </div>
                    : null
            }
        </>
    )
})

export default ViewDetail