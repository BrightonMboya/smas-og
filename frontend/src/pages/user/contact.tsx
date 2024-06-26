// dependencies
import React from "react"
import { vendorContacts } from "../../helpers"
import translate from "../../helpers/translator"
import { Icon } from "../../components/elements"

// contact us memorized function component
const Contact: React.FunctionComponent<any> = React.memo(() => {

    const vendor = "smasapp"
    const phoneNumber = vendorContacts[vendor]

    return (
        <div className="floating-button home">
            <a href={`tel:${phoneNumber}`} data-tooltip={translate("contact us")} style={{ textDecoration: "none" }}>
                <Icon name="call" />
            </a>
        </div>
    )
})

export default Contact