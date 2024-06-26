import React from "react"
import {socketURL, text } from "../../../../helpers"
import { number, time } from "fast-web-kit"
// import { number } from "fast-web-kit"
// import Report from "../../../report/components/report"
// import { getInfo } from "../../../../helpers"
// import translate from "../../../../helpers/translator"

type print_quotation = {
    data: any
    type: "quotation_invoice" | "quotation"
}

// const marginTop = {
//     marginTop: "1.8rem"
// }

const PrintQuotation: React.FunctionComponent<print_quotation> = React.memo((props: print_quotation) => {

    const renderData = React.useCallback(() => {
        try {
            return props.data.trips?.map((trip: any, index: number) => (
                <tr key={index}>
                    <td>
                        {trip?.name || "Trip Name"}
                        <h6 style={{ margin: 0, padding: 0 }}>{trip?.description || "Description"}</h6>
                    </td>
                    <td className="right-align">1</td>
                    <td className="right-align">${number.format(Number(trip?.totalAmount))}</td>
                    <td className="right-align">${number.format(Number(trip?.totalAmount))}</td>
                </tr>
            ))
        } catch (error) {
            console.log((error as Error).message)
        }
    }, [props])

    return (
        <>
            <div className="show-on-print">
                <h1 className="invoice">INVOICE</h1>
                <div className="invoice-header">
                    <div className="logo"
                        style={{ backgroundImage: `url("${socketURL}/uploads/branch/${props.data?.branch?.image}")` }}
                    >
                    </div>
                    <div className="company-details">
                        <h3>{text.reFormat(props?.data?.branch.name)}</h3>
                        <p className="location">PO Box {props.data?.branch?.settings?.pobox}<br />{props.data?.branch?.address?.region},&nbsp;{props.data?.branch?.address?.country}</p>
                        <p>+{props?.data?.branch.phone_number}</p>
                        <p><a className="lowercase" href={props?.data?.branch.website}>{props?.data?.branch.website}</a></p>
                    </div>
                </div>
                <div className="line"></div>
                <div className="section-two">
                    <div className="left-section">
                        <div className="bill-to-header">BILL TO</div>
                        <h5>{text.reFormat(props.data?.customer?.name)}</h5>
                        <p>
                            <a
                                href={`mailto:${props.data?.customer?.email}`}
                                className="lowercase"
                            >
                                {props.data?.customer?.email}
                            </a>
                        </p>
                    </div>
                    <div className="invoice-info">
                        <h5>Invoice Number: <span>{props.data?.number}</span></h5>
                        <h5>Invoice Date: <span>{time.formatDate(props.data?.createdAt, "DD-MM-YYYY")}</span></h5>
                        <h5>Payment Due: <span>{time.formatDate(time.addTimeToDate(props.data.createdAt, 15, "days").toISOString(), "DD-MM-YYYY")}</span></h5>
                        <h5 className="amount-due">Amount Due (USD): ${number.format(props.data?.total_amount)}</h5>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Items</th>
                            <th className="right-align">Quantity</th>
                            <th className="right-align">Price</th>
                            <th className="right-align">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderData()}
                    </tbody>
                </table>

                <div className="totals">
                    <h5 className="right-align">Subtotal: ${number.format(props.data?.total_amount)}</h5>
                    <h5 className="right-align">Total: ${number.format(props.data?.total_amount)}</h5>
                    <h5 className="right-align">Amount Due (USD): ${number.format(props.data?.total_amount)}</h5>
                </div>

                <div className="invoice-notes">
                    <p>{props.data?.branch?.settings?.sale_note}</p>
                </div>

                <p className="thank-you">Thank you for your business!</p>
            </div>
        </>
    )
})

export default PrintQuotation