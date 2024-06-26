/* dependencies */
import React from "react"
import { Link } from "react-router-dom"
import { text } from "../helpers"
import translate from "../helpers/translator"
import { Icon } from "./elements"

/* component type */
type filter = {
    condition: string
    conditions: string[]
    sort: string
    sorts: string[]
    order: 1 | -1
    limit: number
    limits: number[]
    filter(condition: string, order: number, sort: string, limit: number): Promise<void>
}

/* filter memorized functional component */
const Filter: React.FunctionComponent<filter> = React.memo((props: filter) => {

    // component state management
    const [activeBody, setActiveBody] = React.useState<0 | 1 | 2 | 3 | 4>(0)

    // component mounting
    React.useEffect(() => {
        setActiveBody(0)

        // component unmounting
        return () => setActiveBody(0)

        // eslint-disable-next-line
    }, [props])

    const toggleBody = (index: 0 | 1 | 2 | 3 | 4): void => {
        if (index === activeBody)
            setActiveBody(0)
        else
            setActiveBody(index)
    }

    // returning component view
    return (
        <div className="filter">

            {/* condition filter */}
            <div className="filter-body">
                <div className="filter-title" onClick={() => toggleBody(1)}>
                    <Icon name="filter_list" />
                    <span className="title">{translate(`${text.reFormat(props.condition)}`)}</span>
                </div>
                <div className={`filter-content`} data-active={(activeBody === 1) && (props.conditions.length > 0) ? "true" : "false"}>
                    {
                        props.conditions.sort((a, b) => a.length - b.length).map((condition: string, index: number) => (
                            <Link key={index} to="#" className="filter-item" data-active={condition.trim() === props.condition.trim() ? "true" : "false"}
                                onClick={() => {
                                    props.filter(condition.trim(), props.order, props.sort, props.limit)
                                    setActiveBody(0)
                                }}
                            >
                                <Icon name="arrow_right" />
                                <div className="item">{translate(`${text.reFormat(condition)}`)}</div>
                            </Link>
                        ))
                    }
                </div>
            </div>

            {/* order filter */}
            <div className="filter-body">
                <div className="filter-title" onClick={() => toggleBody(2)}>
                    <Icon name="low_priority" />
                    <span className="title">{props.order === 1 ? translate("ascending order") : translate("descending order")}</span>
                </div>
                <div className={`filter-content`} data-active={activeBody === 2 ? "true" : "false"}>
                    <Link to="#" className="filter-item" data-active={props.order === 1 ? "true" : "false"}
                        onClick={() => {
                            props.filter(props.condition, 1, props.sort, props.limit)
                            setActiveBody(0)
                        }}
                    >
                        <Icon name="arrow_right" />
                        <div className="item">{translate("ascending order")}</div>
                    </Link>
                    <Link to="#" className="filter-item" data-active={props.order === -1 ? "true" : "false"}
                        onClick={() => {
                            props.filter(props.condition, -1, props.sort, props.limit)
                            setActiveBody(0)
                        }}
                    >
                        <Icon name="arrow_right" />
                        <div className="item">{translate("descending order")}</div>
                    </Link>
                </div>
            </div>

            {/* sorting filter */}
            <div className="filter-body">
                <div className="filter-title" onClick={() => toggleBody(3)}>
                    <Icon name="sort" />
                    <span className="title">{translate(props.sort === "createdAt" ? "created time" : props.sort.trim())}</span>
                </div>
                <div className={`filter-content`} data-active={(activeBody === 3) && (props.sorts.length > 0) ? "true" : "false"}>
                    {
                        props.sorts.sort((a, b) => a.length - b.length).map((sort: string, index: number) => (
                            <Link key={index} to="#" className="filter-item" data-active={(sort.trim() === props.sort.trim()) || ((props.sort.trim() === "createdAt") && sort === "created time") ? "true" : "false"}
                                onClick={() => {
                                    props.filter(props.condition, props.order, sort === "created time" ? "createdAt" : sort.trim(), props.limit)
                                    setActiveBody(0)
                                }}
                            >
                                <Icon name="arrow_right" />
                                <div className="item">{translate(sort)}</div>
                            </Link>
                        ))
                    }
                </div>
            </div>

            {/* limit filter */}
            <div className="filter-body">
                <div className="filter-title" onClick={() => toggleBody(4)}>
                    <Icon name="insert_page_break" />
                    <span className="title"> {translate("limit of")}&nbsp;{props.limit}</span>
                </div>
                <div className={`filter-content`} data-active={(activeBody === 4) && props.limits.length > 0 ? "true" : "false"}>
                    {
                        props.limits.map((limit: number, index: number) => (
                            <Link key={index} to="#" className="filter-item" data-active={limit === props.limit ? "true" : "false"}
                                onClick={() => {
                                    props.filter(props.condition, props.order, props.sort, limit)
                                    setActiveBody(0)
                                }}
                            >
                                <Icon name="arrow_right" />
                                <div className="item">{translate("limit by")}&nbsp;{limit}</div>
                            </Link>
                        ))
                    }
                </div>
            </div>

        </div>
    )

})

/* exporting component */
export default Filter