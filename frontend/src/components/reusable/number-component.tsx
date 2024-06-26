// dependencies
import React from "react"
import { Input } from "../form"
import { ApplicationContext } from "../../context"
import { stateKey } from "../../types"
import { number } from "../../helpers"
import { string } from "fast-web-kit"

type numberComponent = {
    label: string
    name: stateKey
    disabled?: boolean
    placeholder: string
}

// number component memorized function component
const NumberComponent: React.FunctionComponent<numberComponent> = React.memo((props: numberComponent) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    return (
        <Input
            type="text"
            name={props.name}
            label={props.label}
            disabled={props.disabled}
            placeholder={props.placeholder}
            onChange={application.handleInputChange}
            error={application.state[`${props.name}Error` as stateKey]}
            value={string.isNotEmpty(application.state[props.name]) ? number.format(application.state[props.name]) : ""}
        />
    )
})

export default NumberComponent