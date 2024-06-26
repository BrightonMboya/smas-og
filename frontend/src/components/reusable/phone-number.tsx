// dependencies
import React from "react"
import { Input } from "../form"
import { ApplicationContext } from "../../context"
import { string } from "fast-web-kit"
import { stateKey } from "../../types"

type phoneNumberComponent = {
    label: string
    name: stateKey
    placeholder?: string
    validateSchema?: stateKey
    validatingCondition?: object
    validatingBackendField?: string
}

// phone number functional memorized component
const PhoneNumberComponent: React.FunctionComponent<phoneNumberComponent> = React.memo((props: phoneNumberComponent) => {

    // applicaiton context
    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {
        application.dispatch({ [props.name]: "" })
        // eslint-disable-next-line
    }, [application.state.phoneCode])

    return (
        <>
            <Input
                type="number"
                name={props.name}
                label={props.label}
                onChange={application.handleInputChange}
                placeholder={props.placeholder || "enter phone number"}
                error={application.state[(`${props.name}Error`) as stateKey]}
                value={string.isEmpty(application.state[props.name]) ? `${application.state.phoneCode}${application.state[props.name]}` : application.state[props.name]}
                onKeyUp={() => props.validateSchema && props.validatingBackendField && props.validatingCondition
                    ?
                    application.validate(
                        {
                            schema: props.validateSchema,
                            errorKey: (`${props.name}Error`) as stateKey,
                            condition: { ...props.validatingCondition, [props.validatingBackendField]: application.state[props.name] },
                        }
                    )
                    :
                    {}
                }
            />
        </>
    )
})

export default PhoneNumberComponent