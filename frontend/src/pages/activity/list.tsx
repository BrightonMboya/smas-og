// dependencies
import React from "react"
import Modal from "../../components/modal"
import Pagination from "../../components/pagination"
import Search from "../../components/search"
import { apiV1, commonCondition, formatDate, getDate, getRelativeTime, isAdmin, noAccess, number, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { routerProps } from "../../types"
import { ApplicationContext } from "../../context"
import { Link } from "react-router-dom"
import { object, string } from "fast-web-kit"
import ListComponentFilter from "../../components/reusable/list-component-filter"

// activity list memorized function component
const ActivityList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("list_activity")) {
            setPageTitle("activities")
            onMount()
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            // creating initial condition
            let initialCondition: object = commonCondition()

            // checking if condition has been passed from other components
            if (props.location.state) {
                const { propsCondition }: any = props.location.state
                if (propsCondition) {
                    initialCondition = { ...initialCondition, ...propsCondition }
                    application.dispatch({ propsCondition })
                }
            }

            // request parameter, condition and sort
            const joinForeignKeys: boolean = true
            const sort: string = JSON.stringify({ createdAt: -1 })
            const condition: string = JSON.stringify(initialCondition)
            const select: object = { created_by: 0, updated_by: 0, updatedAt: 0 }
            const parameters: string = `schema=activity&condition=${condition}&select=${JSON.stringify(select)}&sort=${sort}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            // making api request
            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "activities",
                sort: "createdAt",
                order: -1,
                collection: "activities",
                schema: "activity",
                select,
                joinForeignKeys,
                fields: ["module", "type", "description"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderList = React.useCallback(() => {
        try {
            return application.state.activities.map((activity: any, index: number) => (
                <tr
                    key={activity._id}
                    onClick={() => {
                        application.dispatch({
                            activity: activity.data,
                            title: `${translate(`${activity.module} ${activity.type}`)} ${getDate(activity.createdAt)} (${formatDate(activity.createdAt)})`
                        })
                        application.toggleComponent("modal")
                    }}
                >
                    <td data-label={translate("#")}>{index + 1}</td>
                    <td data-label={translate("user")} className="sticky">
                        <Link to={can("view_user") && activity.user.username !== ("smas_app") ? {
                            pathname: "/user/view",
                            state: { user: activity.user._id }
                        } : "#"} className="bold">
                            {text.reFormat(activity.user.username)}
                        </Link>
                    </td>
                    {
                        isAdmin && can("view_branch")
                            ?
                            <td data-label={translate("branch")}>
                                <Link to={{
                                    pathname: "/branch/view",
                                    state: { branch: activity.branch._id }
                                }} className="text-primary">
                                    {text.reFormat(activity.branch.name)}
                                </Link>
                            </td>
                            : null
                    }
                    <td data-label={translate("module")}>
                        {translate(activity.module)}
                    </td>
                    <td data-label={translate("activity")} className="center">
                        {translate(activity.description)}
                    </td>
                    <td data-label={translate("type")} className="center">
                        <span className={`badge ${activity.type === "modification" ? "warning" : activity.type === "creation" ? "primary" : "error"}`}>
                            <i className="material-icons-round">
                                {
                                    activity.type === "modification" ? "edit_note" : activity.type === "creation" ? "fiber_new" : "delete"
                                }
                            </i>
                            {translate(activity.type)}
                        </span>
                    </td>
                    <td className="center" data-label={translate("moment")} data-tooltip={translate(getRelativeTime(activity.createdAt))}>
                        {getDate(activity.createdAt)}
                    </td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.ids, application.state.activities])


    // rendering activity data
    const renderActivityData = React.useCallback(() => {
        try {
            return (
                <Modal
                    title={application.state.title}
                    buttonTitle="Continue"
                    toggleComponent={application.toggleComponent}
                    buttonAction={() => {
                        application.toggleComponent("modal")
                        application.dispatch({ activity: null })
                    }}
                >
                    <div className="row">
                        <div className="col s12">
                            {activityData(application.state.activity)}
                        </div>
                    </div>
                </Modal>
            )
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }        // eslint-disable-next-line
    }, [application.state.activity])

    // component view
    return (
        <>
        <ListComponentFilter />
            {renderActivityData()}
            <div className="card list">
                <Search
                    refresh={onMount}
                    select={application.selectList}
                    onClick={application.searchData}
                    value={application.state.searchKeyword}
                    onChange={application.handleInputChange}
                >
                </Search>
                <div className="card-content">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th className="sticky">{translate("user")}</th>
                                {
                                    isAdmin && can("view_branch")
                                        ? <th>{translate("branch")}</th>
                                        : null
                                }
                                <th>{translate("module")}</th>
                                <th className="center">{translate("activity")}</th>
                                <th className="center">{translate("type")}</th>
                                <th className="center">{translate("moment")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderList()}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    paginate={application.paginateData}
                    currentPage={application.state.page}
                    nextPage={application.state.nextPage}
                    pageNumbers={application.state.pageNumbers}
                    previousPage={application.state.previousPage}
                />
            </div>
        </>
    )

})

function activityData(activity: any) {

    const displayObject = (data: any) => {
        try {

            let message = ``
            for (const key in data) {
                message = `${message}\n${text.reFormat(key)} - ${(key === "createdAt") || (key === "updatedAt") || (key === "date") ? `${getDate(data[key])} (${formatDate(data[key])})` : typeof data[key] === "number" ? number.format(data[key]) : object.isValid(data[key]) ? <pre>{displayObject(data[key])}</pre> : string.isValid(data[key]) ? text.reFormat(data[key]) : data[key]}`
            }

            return message
        } catch (error) {
            return JSON.stringify(data)
        }
    }

    const renderList = () => {
        if (activity) {

            const keys = Object.keys(activity).sort()

            return keys.map((key: string, index: number) => {
                if (activity[key])
                    return (
                        <tr key={index}>
                            {/* <td data-label="#">{index + 1}</td> */}
                            <td data-label={translate("field")}>{(text.reFormat(translate(key === "createdAt" ? "created_date" : key === "updatedAt" ? "updated_date" : key === "_id" ? "id" : key)))}</td>
                            <td data-label={translate("value")}>
                                {(key === "createdAt") || (key === "updatedAt") || (key === "date") ? `${getDate(activity[key])} (${formatDate(activity[key])})` : typeof activity[key] === "number" ? number.format(activity[key]) : object.isValid(activity[key]) ? <pre>{displayObject(activity[key])}</pre> : text.reFormat(activity[key].toString())}
                            </td>
                        </tr>
                    )
                return null
            })
        }
    }

    return (
        <table>
            <thead>
                <tr>
                    {/* <th>#</th> */}
                    <th>{translate("field")}</th>
                    <th>{translate("value")}</th>
                </tr>
            </thead>
            <tbody>
                {renderList()}
            </tbody>
        </table>
    )
}

// export component
export default ActivityList