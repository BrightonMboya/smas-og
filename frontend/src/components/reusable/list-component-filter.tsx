// component dependencies
import React from "react"
import { ApplicationContext } from "../../context"
import Filter from "../filter"

// component list filter memorized functional component
const ListComponentFilter: React.FunctionComponent = React.memo(() => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // renderng component filter
    const renderFilter = React.useCallback(() => {
        return (
            <Filter
                sort={application.state.sort}
                order={application.state.order}
                limit={application.state.limit}
                filter={application.filterData}
                limits={application.state.limits}
                condition={application.state.condition}
                sorts={application.getSortOrCondition("sort")}
                conditions={application.getSortOrCondition("condition")}
            />
        )
        // eslint-disable-next-line
    }, [
        application.state.sort,
        application.state.order,
        application.state.limit,
        application.state.limits,
        application.state.condition,
    ])

    // component view
    return (
        <>
            {renderFilter()}
        </>
    )
})

export default ListComponentFilter