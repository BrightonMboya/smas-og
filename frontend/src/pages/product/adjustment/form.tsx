// dependencies
import React from "react"
import { Button, FloatingButton } from "../../../components/button"
import { CardTitle } from "../../../components/card"
import { Option, Select, Textarea } from "../../../components/form"
import { apiV1, noAccess, number, pageNotFound, setPageTitle, text } from "../../../helpers"
import { can } from "../../../helpers/permissions"
import translate from "../../../helpers/translator"
import { createOrUpdate, routerProps, serverResponse } from "../../../types"
import { ApplicationContext } from "../../../context"
import { array, string } from "fast-web-kit"
import NumberComponent from "../../../components/reusable/number-component"
import DataListComponent from "../../../components/reusable/datalist"

// adjustment form memorized function component
const AdjustmentForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("adjust_stock")) {
            onMount()
            setPageTitle("stock adjustment")

            if (props.location.state) {
                const { product }: any = props.location.state
                if (product) {
                    application.dispatch({
                        productId: product._id,
                        stock: product.stock.toString(),
                        name: text.reFormat(product.name),
                        isStoreProduct: product.is_store_product
                    })
                }
            }
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    // get stock after adjustment
    React.useEffect(() => {
        if (string.isNotEmpty(application.state.type) && string.isNotEmpty(application.state.adjustment) && string.isNotEmpty(application.state.productId)) {
            const type: string = application.state.type
            const stock = number.reFormat(application.state.stock) || 0
            const adjustment = number.reFormat(application.state.adjustment) || 0
            const stockAfterAdjustment: number = type === "increase" ? stock + adjustment : stock - adjustment
            application.dispatch({ quantity: stockAfterAdjustment.toString() })

            if (stockAfterAdjustment < 0)
                application.dispatch({ quantityError: "stock after adjustment can't be less than 0" })

        }
        else {
            application.dispatch({ adjustment: "" })
            application.dispatch({ quantity: "" })
        }
        // eslint-disable-next-line
    }, [application.state.type, application.state.adjustment, application.state.productId])

    async function onMount(): Promise<void> {
        try {

            const pathname: string = props.location.pathname
            application.dispatch({
                pathname,
                schema: "product",
                collection: "products"
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // validate form
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            event.preventDefault()
            const errors: string[] = []
            const stock = number.reFormat(application.state.stock)
            const adjustment = number.reFormat(application.state.adjustment)
            const stockAfterAdjustment = number.reFormat(application.state.quantity)

            if (string.isEmpty(application.state.productName)) {
                errors.push("")
                application.dispatch({ productNameError: "required" })
            }
            else if (string.isEmpty(application.state.productId)) {
                errors.push("")
                application.dispatch({ nameError: "product does not exist" })
            }

            if (string.isEmpty(application.state.type)) {
                errors.push("")
                application.dispatch({ typeError: "required" })
            }

            if (string.isEmpty(application.state.adjustment)) {
                errors.push("")
                application.dispatch({ adjustmentError: "required" })
            }
            else if (adjustment <= 0) {
                errors.push("")
                application.dispatch({ adjustmentError: "can't be less or equal to zero" })
            }

            if (string.isEmpty(application.state.description)) {
                errors.push("")
                application.dispatch({ descriptionError: "required" })
            }

            if (array.isEmpty(errors) && string.isEmpty(application.state.quantityError)) {

                const options: createOrUpdate = {
                    route: apiV1 + "create",
                    method: "POST",
                    loading: true,
                    body: {
                        schema: "adjustment",
                        documentData: {
                            adjustment: adjustment,
                            ...application.onCreate,
                            before_adjustment: stock,
                            user: application.user._id,
                            type: application.state.type,
                            product: application.state.productId,
                            after_adjustment: stockAfterAdjustment,
                            description: application.state.description,
                            module: application.state.pathname.includes("store") ? "store" : "product",
                            category: string.isNotEmpty(application.state.categoryId) ? application.state.categoryId : null
                        }
                    }
                }
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.unMount()
                    onMount()
                }
                else
                    application.dispatch({ notification: response.message })

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-l2 offset-m1">
                    <div className="card">
                        <CardTitle title="stock adjustment" />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <DataListComponent
                                            for="product"
                                            condition={{ is_store_product: application.state.pathname.includes("store") }}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            disabled
                                            name="stock"
                                            label="available stock"
                                            placeholder="stock available"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Select
                                            name="type"
                                            label="type"
                                            value={application.state.type}
                                            error={application.state.typeError}
                                            onChange={application.handleInputChange}
                                            disabled={string.isEmpty(application.state.productId)}
                                        >
                                            <Option value="" label={translate("type")} />
                                            <Option value="decrease" label={translate("decrease")} />
                                            <Option value="increase" label={translate("increase")} />
                                        </Select>
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="adjustment"
                                            label="stock to adjust"
                                            placeholder="enter stock to adjust"
                                            disabled={string.isEmpty(application.state.productId)}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <NumberComponent
                                            disabled
                                            name="quantity"
                                            label="stock after adjustment"
                                            placeholder="stock after adjustment"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Textarea
                                            name="description"
                                            label="description"
                                            placeholder="Enter description"
                                            value={application.state.description}
                                            error={application.state.descriptionError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 center">
                                        <Button
                                            title={application.buttonTitle}
                                            loading={application.state.loading}
                                            disabled={application.state.disabled}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_stock_adjustment")
                    ? <FloatingButton
                        to={application.state.pathname.includes("store") ? "/store/adjustment-list" : "/product/adjustment-list"}
                        tooltip="stock adjustments"
                    />
                    : null
            }
        </>
    )

})

export default AdjustmentForm