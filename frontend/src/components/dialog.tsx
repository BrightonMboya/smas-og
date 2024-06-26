/* dependencies */
import React from "react"
import translate from "../helpers/translator"

/* component dialog */
export type dialog = {
    text: string
    title: string
    hideAction?: boolean
    action(): Promise<void>
    toggleDialog(name: "dialog" | "modal"): void
}


/* dialog memorized functional component */
const Dialog: React.FunctionComponent<dialog> = React.memo((props: dialog) => (
    <div className={`dialog ${props.hideAction ? "show" : ""}`}>
        <div className="dialog-content">
            <div className="dialog-title">
                {translate(props.title)}
            </div>
            <div className="dialog-body">
                <p className="dialog-text">
                    {translate(props.text)}
                </p>
            </div>
            {
                !props.hideAction
                    ?
                    <div className="dialog-action">
                        <button className="secondary" onClick={() => props.toggleDialog("dialog")}>{translate("Decline")}</button>
                        <button onClick={props.action}>{translate("Accept")}</button>
                    </div>
                    : null
            }
        </div>
    </div>
))

/* exporting component */
export default Dialog