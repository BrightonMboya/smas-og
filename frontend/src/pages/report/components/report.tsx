// dependencies
import React from "react"
import { formatTin, getDate, socketURL, text } from "../../../helpers"
import translate from "../../../helpers/translator"

type report = {
    branch: any,
    title: string
    customer?: any
    number?: number
    children: React.ReactNode
    report: string
    type: "cart" | "order" | "invoice" | "delivery" | "report" | "quotation" | "quotation_invoice"
}

// report header memorized fuction component
const Report: React.FunctionComponent<report> = React.memo((props: report) => {
    return (
        <div className="report show-on-print">
            <div className="top-header">
                <div className="report-type">
                    {translate(props.type === "report" ? `${props.report} report` : `${props.type === "cart" ? "sales invoice" : props.type === "order" ? "sales invoice" : props.type === "invoice" ? "proforma invoice" : props.type === "quotation" ? "quotation" : props.type === "quotation_invoice" ? "quotation invoice" : "derivery note"}`)}
                </div>
                {
                    props.number
                        ?
                        <div className="number">
                            {translate(`number`)}:&nbsp;{props.number}
                        </div>
                        : null
                }
            </div>
            <div className="report-header">
                <div className="left-section">
                    <div className="logo-container">
                        <img src={props.branch?.image ? `${socketURL}/uploads/branch/${props.branch?.image}` : "/logo-original.png"} alt="logo" className="logo" />
                    </div>
                </div>
                {
                    props.branch
                        ?
                        <div className="right-section">
                            <div className="name">{text.reFormat(props.branch?.name)}</div>
                            {
                                props.branch?.settings?.pobox
                                    ?
                                    <div className="area">P.o.Box {props.branch?.settings?.pobox}</div>
                                    : null
                            }
                            <div className="area">{text.reFormat(props.branch?.address?.location)}</div>
                            <div className="area">{text.reFormat(props.branch?.address?.region)}</div>
                            <div className="area">{props.branch?.phone_number}</div>
                            {
                                props.branch?.name.includes("tungucha")
                                    ?
                                    <>
                                        <div className="area">0789060255</div>
                                        <div className="area">0768198000</div>
                                    </>
                                    : null
                            }
                            {
                                props.branch?.tin
                                    ? <div className="tin">TIN: {formatTin(props.branch?.tin)}</div>
                                    : null
                            }
                            <div className="date">
                                {getDate(new Date())}
                            </div>
                        </div>
                        : null
                }
            </div>
            <div className="customer">
                {
                    props.customer
                        ?
                        <>
                            <div className="report-type">{translate(props.type === "quotation" ? "quotation to" : "invoice to")}
                            </div>
                            <div className="name">{text.reFormat(props.customer?.name)}</div>
                            {
                                props.customer?.phone_number
                                    ?
                                    <div className="area">
                                        +{props.customer?.phone_number}
                                    </div>
                                    : null
                            }
                            {
                                props.customer?.email
                                    ?
                                    <div className="area text-primary lowercase">
                                        {props.customer?.email}
                                    </div>
                                    : null
                            }
                            {
                                props.customer.tin
                                    ? <div className="area">
                                        {translate("tin").toUpperCase()}: {formatTin(props.customer?.tin)}
                                    </div>
                                    : null
                            }
                            <div className="area">{text.reFormat(props.customer?.address?.region ? `${props.customer?.address?.region},` : "")} {text.reFormat(props.customer?.address?.country ? props.customer?.address?.country : "")}
                            </div>
                        </>
                        : null
                }
                <div className="area">{text.reFormat(props.title)}</div>
            </div>
            <div className="report-body">
                {props.children}
            </div>
        </div>
    )
})

export default Report