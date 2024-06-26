/* dependencies */
import React from "react"
import translate from "../helpers/translator"

/* component type*/
type modal = {
    title: string
    children: React.ReactNode
    buttonTitle: string
    buttonAction(event?: any): void
    toggleComponent(name: "modal"): void
}

/* modal memorized functional component */
const Modal: React.FunctionComponent<modal> = React.memo((props: modal) => (
    <div className="modal">
        <div className="modal-body">
            <div className="modal-title">
                <span className="title">
                    {translate(props.title)}
                </span>
            </div>
            <div className="modal-content">
                {props.children}
            </div>
            <div className="modal-footer">
                <button type="button" className="secondary" onClick={() => props.toggleComponent("modal")}>
                    {translate("Close")}
                </button>
                <button type="button" onClick={props.buttonAction}>
                    {translate(props.buttonTitle)}
                </button>
            </div>
        </div>
    </div>
))

/* exporting component */

export default Modal