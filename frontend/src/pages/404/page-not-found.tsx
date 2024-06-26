// dependencies
import React from "react"
import { setPageTitle } from "../../helpers"
import translate from "../../helpers/translator"
import { routerProps } from "../../types"
import { ApplicationContext } from "../../context"

// page not found memorized function component
const PageNotFound: React.FunctionComponent<routerProps> = React.memo(() => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        setPageTitle("page not found")
        // component unmounting
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    // component view
    return (
        <>
            <div className="page-not-found">
                <h1>404</h1>
                <h2>{translate("Oops! page not found")}</h2>
                <p>{translate("Sorry, but the page you are looking for is not found. please, make sure you have type the correct url and your have permission to view the resource.")}</p>
            </div>
        </>
    )

})

// exporting component
export default PageNotFound