/* dependencies */
import React from "react"
import { applicationName, text } from "../helpers"
import translate from "../helpers/translator"
import { Icon } from "./elements"
import { ApplicationContext } from "../context"

type breadcrumb = {
    icon: string
    title: string
    toggleSidebar(): void
    authenticate(action: "logout"): void
}

/* breadcrumb memorized functional component */
const Breadcrumb: React.FunctionComponent<breadcrumb> = React.memo((props: breadcrumb) => {

    const { application } = React.useContext(ApplicationContext)

    return (
        <div className="breadcrumb hide-on-print">
            <div className="section" onClick={props.toggleSidebar}>
                <Icon name={props.icon} />
                <span className="title">{translate(props.title)}</span>
            </div>
            <div className="center-section">
                <span className="name">{application.user.branch ? text.reFormat(application.user.branch.name) : applicationName}</span>
            </div>
            <div className="section right-section" onClick={() => props.authenticate("logout")}>
                <Icon name={"logout"} />
                <span className="title">{translate("logout")}</span>
            </div>
        </div>
    )
})

/* exporting component */
export default Breadcrumb