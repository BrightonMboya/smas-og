import React from "react"
import { ApplicationContext } from "../../context"
import { Datalist, Option } from "../form"
import translate from "../../helpers/translator"
import regions from "../../helpers/regions"
import { text } from "../../helpers"
import { stateKey } from "../../types"

type TZRegionComponent = {
    name: stateKey
    label: string
    placeholder?: string
}

const TanzaniaRegions: React.FunctionComponent<TZRegionComponent> = React.memo((props: TZRegionComponent) => {

    const { application } = React.useContext(ApplicationContext)

    // rendering regions
    const renderRegions = React.useCallback(() => {
        try {
            return regions.sort().map((region: string) => (
                <Option key={region} value={(text.reFormat(region))} label={region} />
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.region])

    return (
        <>
            <Datalist
                type="text"
                name={props.name}
                list="regions"
                label={props.label}
                value={application.state[props.name]}
                onChange={application.handleInputChange}
                placeholder={props.placeholder || "Enter region"}
                error={application.state[`${props.name}Error` as stateKey]}
            >
                <Option value="" label={translate(props.placeholder || "Enter region")} />
                {renderRegions()}
            </Datalist>
        </>
    )
})

export default TanzaniaRegions