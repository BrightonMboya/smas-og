/* dependencies */
import React from "react"
import translate from "../helpers/translator"
import { ActionButton } from "./button"

/* component type */
type search = {
    children: React.ReactNode
    value: any
    placeholder?: string
    onChange(event: React.ChangeEvent<HTMLInputElement>): void
    onClick(event: React.ChangeEvent<any>): Promise<void>
    refresh(): Promise<void>
    disabled?: boolean
    select(): void
}

/* search memorized functional component */
const Search: React.FunctionComponent<search> = React.memo((props: search) => (
    <div className="card-filter">
        <form action="#" onSubmit={props.onClick} className="left-section">
            <input
                type="search"
                name="searchKeyword"
                value={props.value}
                onChange={props.onChange}
                placeholder={translate(props.placeholder ? props.placeholder : "") || translate("Enter search keyword")}
                autoComplete="off"
                disabled={props.disabled}
            />
        </form>
        <div className="right-section">
            <div className="action-button">
                {props.children}
                <ActionButton to="#" icon="checklist" type="primary show-on-medium-and-down" tooltip={translate("select all")} position="left" onClick={() => props.select()} />
                <ActionButton to="#" icon="refresh" rotate type="success" tooltip={translate("refresh")} position="left" onClick={props.refresh} />
                {
                    props.value.trim() !== "" && !props.disabled
                        ?
                        <ActionButton to="#" icon="search" type="secondary blink" tooltip={translate("search")} position="left" onClick={props.onClick} />
                        : null
                }
            </div>
        </div>
    </div>
))

/* exporting component */
export default Search