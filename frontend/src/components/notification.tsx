/* dependencies */
import React from "react"
import translate from "../helpers/translator"
import { ApplicationContext } from "../context"
import { string } from "fast-web-kit"
import { Icon } from "./elements"

/* notification memorized functional component */
const Notification: React.FunctionComponent = React.memo(() => {
    const { application: { state: { notification } } } = React.useContext(ApplicationContext)
    if (string.isNotEmpty(notification))
        return (
            <div className="message hide-on-print">
                <div className="message-icon">
                    <Icon name="notifications_active" />
                </div>
                <div className="message-body">
                    <p>{translate(notification)}</p>
                </div>
            </div>
        )
    return null
})

/* exporting component */
export default Notification