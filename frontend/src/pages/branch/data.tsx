// dependencies
import pluralize from "pluralize"
import React from "react"
import { apiV1, commonCondition, dashboardCollections, noAccess, pageNotFound, setPageTitle } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { readOrDelete, routerProps, serverResponse, stateKey } from "../../types"
import { ApplicationContext } from "../../context"
import { number } from "fast-web-kit"

// brach data memorized function component
const BranchData: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_branch_data")) {
            setPageTitle("branch data")
            onMount()
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            let branchId: string | null = null
            // let userId = application.user._id

            if (props.location.state) {
                const { branch }: any = props.location.state
                if (branch) {
                    branchId = branch._id
                    if (branchId)
                        application.dispatch({ branchId })
                }
            }

            const condition: object = branchId ? { visible: true, branch: branchId } : commonCondition()
            const finalCondition: string = JSON.stringify(
                {
                    ...condition,
                    $and: [
                        { type: { $ne: "cart" } },
                        { status: { $ne: "invoice" } },
                        { status: { $ne: "canceled" } },
                        { account_type: { $ne: "smasapp" } }
                    ]
                }
            )

            const options: readOrDelete = {
                method: "GET",
                loading: true,
                disabled: false,
                route: apiV1 + "count-all-collection",
                parameters: `condition=${finalCondition}`
            }
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success) {
                if (response.message) {
                    let totalCount = 0
                    for (const collection of dashboardCollections)
                        if (response.message[collection]) {
                            application.dispatch({ [collection]: response.message[collection] })
                            totalCount += response.message[collection]
                        }
                    application.dispatch({ totalAmount: totalCount.toString() })
                }
            }
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    return (
        <>
            <div className="row">
                <div className="col s12">
                    <div className="card">
                        <div className="card-title center">
                            {translate("branch data")} - {number.format(application.state.totalAmount)}
                        </div>
                        <div className="card-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>{translate("#")}</th>
                                        <th>{translate("module")}</th>
                                        <th className="right-align">{translate("count")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        dashboardCollections.sort().map((collection: stateKey, index: number) => {
                                            return (
                                                <tr key={index} onClick={() => {
                                                    application.unMount()
                                                    props.history.push({
                                                        pathname: collection === "activities" ? `/branch/activity-list` : collection === "adjustments" ? "/product/adjustment-list" : collection === "debt_histories" ? "/debt/history-list" : collection === "expense_types" ? "/expense/type-list" : collection === "store_products" ? "/store/product-list" : collection === "orders" ? "/sale/order-list" : `/${pluralize.singular(collection)}/list`,
                                                        state: application.state.branchId ? { propsCondition: { branch: application.state.branchId } } : {}
                                                    })
                                                }}>
                                                    <td data-label="#">{index + 1}</td>
                                                    <td data-label={translate("module")}>{translate(collection)}</td>
                                                    <td data-label={translate("count")} className="right-align text-primary">
                                                        {
                                                            number.format(
                                                                application.state[collection]
                                                            )
                                                        }
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td className="uppercase text-primary bold" colSpan={2}>
                                            {translate("total")}
                                        </td>
                                        <td className="right-align text-primary bold">
                                            {number.format(application.state.totalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
})

export default BranchData