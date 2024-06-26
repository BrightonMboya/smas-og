/* dependencies */
import React from "react"
import { Link } from "react-router-dom"

/* component type */
type pagination = {
    nextPage: number
    previousPage: number
    currentPage: number
    pageNumbers: number[]
    paginate(page: number): Promise<void>
}

/* pagination memorized functional component */
const Pagination: React.FunctionComponent<pagination> = React.memo((props: pagination) => props.pageNumbers.length >= 1 && (props.nextPage !== 0 || props.previousPage !== 0) ? (
    <div className="pagination">
        <div className="content">
            <Link to={`${props.previousPage > 0 ? `#page-no-${props.previousPage}` : '#'}`} onClick={() => {
                if (props.previousPage > 0)
                    props.paginate(props.previousPage)
            }} className="link">
                <i className="material-icons-round">chevron_left</i>
            </Link>
        </div>
        {
            props.pageNumbers.map((pageNumber: number, index: number) => (
                <div className={`content ${pageNumber === props.currentPage ? "active" : ""}`} key={index}>
                    <Link to={`#page-no-${pageNumber}`} onClick={() => props.paginate(pageNumber)} className={`link`} >
                        {pageNumber}
                    </Link>
                </div>
            ))
        }
        <div className="content">
            <Link to={`${props.nextPage > 0 ? `#page-no-${props.nextPage}` : '#'}`} onClick={() => props.nextPage > 0 ? props.paginate(props.nextPage) : null} className="link">
                <i className="material-icons-round">chevron_right</i>
            </Link>
        </div>
    </div>
) : null)

/* exporting component */
export default Pagination