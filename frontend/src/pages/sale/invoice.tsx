// dependencies
import React from "react"
import { getInfo, number, text } from "../../helpers"
import translate from "../../helpers/translator"

type type = "cart" | "order" | "invoice" | "delivery"
type invoice = {
    sales: any[]
    type: type
}

type footer = {
    type: type
}

const marginTop = {
    marginTop: "1.8rem"
}

export const InvoiceFooter: React.FunctionComponent<footer> = React.memo((props: footer) => {
    const user = getInfo("user")
    const branch = user.branch
    const settings = branch?.settings

    return (
        <div style={marginTop}>
            {
                props.type !== "delivery"
                    ?
                    <>
                        <div className="row">
                            <div className="col s6">
                                <div className="payment-title left-align">
                                    {translate("bank payments")}
                                </div>
                                {
                                    settings?.payment_methods
                                        .filter((method: any) => method.vendor.includes("BANK"))
                                        .map((method: any, index: number) => (
                                            <div key={index} className="method">{method.vendor}: {method.account} - {method.name}</div>
                                        ))
                                }
                            </div>
                            <div className="col s6 right-align">
                                <div className="payment-title">
                                    {translate("mobile payments")}
                                </div>
                                {
                                    settings?.payment_methods
                                        .filter((method: any) => !method.vendor.includes("BANK"))
                                        .map((method: any, index: number) => (
                                            <div key={index} className="method right">{method.vendor}: {method.account} - {method.name}</div>
                                        ))
                                }
                            </div>
                        </div>

                    </>
                    :
                    <>
                        <div className="row">
                            <div className="col s6">
                                <div className="payment-title left-align">
                                    {translate("supplier")}
                                </div>
                                <div className="uppercase">
                                    {text.reFormat(user.branch?.name)}
                                </div>
                            </div>
                            <div className="col s6 right-align">
                                <div className="payment-title">
                                    {translate("received / customer")}
                                </div>
                                <div className="right-align">
                                    ...................................
                                </div>
                            </div>
                        </div>
                    </>
            }
            <div className="row" style={marginTop}>
                <div className="col s6 capitalize">
                    {translate("prepared by")}: {text.reFormat(user.username)}
                </div>
                <div className="col s6 right-align">
                    {translate("Approved With Official Stamp")}
                </div>
            </div>
            <div className="row" style={{ marginTop: "5rem" }}>
                <div className="col s6">
                    {translate("signature")}: ............................
                </div>
                <div className="col s6 right-align">
                    ................................................
                </div>
            </div>
            <div className="row" style={marginTop}>
                <div className="col s12 center">
                    <div className="bold">{props.type !== "invoice" ? settings?.sale_note : settings?.invoice_note}</div>
                    <div style={{ margin: "5px" }}>
                        <span className="bold">{translate("email")}:</span> <span className="italic">{branch?.email}</span>&nbsp;&nbsp;<span className="bold">{translate("website")}: </span> <span className="italic">{branch?.website}</span>
                    </div>
                    <div className="italic">{translate("this is a computer generated invoice")}.</div>
                </div>
            </div>
        </div>
    )

})

const Invoice: React.FunctionComponent<invoice> = React.memo((props: invoice) => {

    const renderSales = React.useCallback(() => {
        try {
            return props.sales.map((sale: any, index: number) => (
                <tr key={sale._id}>
                    <td>{index + 1}</td>
                    <td>{text.reFormat(sale.product.name)}&nbsp;{sale.category ? `(${text.reFormat(sale.category.name)})` : null}</td>
                    <td className="right-align">
                        {number.format(sale.quantity)}
                    </td>
                    <td className="right-align">
                        {number.format(sale.total_amount / sale.quantity)}
                    </td>
                    <td className="right-align">
                        {number.format(sale.total_amount)}
                    </td>
                </tr>
            ))
        } catch (error) {
            console.log(`Invoice rendering error: ${(error as Error).message}`)
        }
    }, [props])

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>{translate("product")}</th>
                        <th className="right-align">{translate("quantity")}</th>
                        <th className="right-align">{translate("price")}</th>
                        <th className="right-align">{translate("amount")}</th>
                    </tr>
                </thead>
                <tbody>
                    {renderSales()}
                </tbody>
                <tfoot>
                    <tr>
                        <td className="center bold uppercase" colSpan={4}>
                            {translate("total")}
                        </td>
                        <td className="right-align bold">
                            {
                                number.format(
                                    props.sales.map((sale: any) => sale.total_amount)
                                        .reduce((a: number, b: number) => a + b, 0)
                                )
                            }
                        </td>
                    </tr>
                </tfoot>
            </table>
            <InvoiceFooter type={props.type} />
        </>
    )
})

export default Invoice