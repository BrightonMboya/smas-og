// dependencies
import React from "react"
import CustomDatalist from "../datalist"
import { stateKey } from "../../types"
import pluralize from "pluralize"

type dataListComponent = {
    for: stateKey
    disabled?: boolean
    condition?: object
    isPurchase?: boolean
}

// datalist list resusable memorized component
const DataListComponent: React.FunctionComponent<dataListComponent> = React.memo((props: dataListComponent) => (
    <CustomDatalist
        label={props.for}
        disable={props.disabled}
        condition={props.condition}
        isPurchase={props.isPurchase}
        placeholder={`enter ${props.for}`}
        name={`${props.for}Name` as stateKey}
        nameId={`${props.for}Id` as stateKey}
        list={pluralize(props.for) as stateKey}
        nameError={`${props.for}NameError` as stateKey}
        sort={props.for === "user" ? "username" : "name"}
        fields={props.for === "user" ? ["username", "phone_number"] : props.for === "customer" ? ["name", "phone_number"] : ["name"]}
    />
))

export default DataListComponent