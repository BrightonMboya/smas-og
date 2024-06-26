// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Input } from "../../components/form"
import Modal from "../../components/modal"
import { apiV1, noAccess, number, pageNotFound, setPageTitle, text } from "../../helpers"
import { productTemplate } from "../../helpers/excelTemplate"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, routerProps, serverResponse, readOrDelete } from "../../types"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"
import CustomDatalist from "../../components/datalist"
import DataListComponent from "../../components/reusable/datalist"

// product memorized functional component
const ProductForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking user access
        if (can("edit_product") || can("create_product")) {
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

            const pathname: string = props.location.pathname
            const title: string = pathname === "/product/form" ? "product" : "store product"
            application.dispatch({
                pathname,
                isStoreProduct: title === "product" ? false : true
            })

            setPageTitle(`new ${title}`)
            // editing or creating ?
            if (props.location.state) {

                // getting product from router component state
                const { product }: any = props.location.state

                // verifying product has been provided
                if (product) {

                    const joinForeignKeys: boolean = true
                    const select: string = JSON.stringify({
                        name: 1,
                        stock: 1,
                        store: 1,
                        barcode: 1,
                        quantity: 1,
                        category: 1,
                        buying_price: 1,
                        selling_price: 1,
                        is_store_product: 1,
                        reorder_stock_level: 1
                    })
                    const condition: string = JSON.stringify({ _id: product })
                    const parameters: string = `schema=product&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

                    // request options
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read",
                    }

                    // api request
                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        setPageTitle(`edit ${title}`)
                        application.dispatch({
                            edit: true,
                            id: response.message._id,
                            stock: response.message.stock?.toString(),
                            quantity: response.message.quantity?.toString(),
                            productName: text.reFormat(response.message.name),
                            isStoreProduct: response.message?.is_store_product,
                            buyingPrice: response.message.buying_price?.toString(),
                            sellingPrice: response.message.selling_price?.toString(),
                            reorderStockLevel: response.message.reorder_stock_level?.toString(),
                            barcode: response.message.barcode ? response.message.barcode.toString() : "",
                        })

                        if (response.message.is_store_product) {
                            application.dispatch({
                                stores: [response.message.store],
                                storeId: response.message.store._id,
                                storeName: text.reFormat(response.message.store.name),
                            })
                        }

                        if (response.message.category) {
                            application.dispatch({
                                categories: [response.message.category],
                                categoryId: response.message.category._id,
                                categoryName: text.reFormat(response.message.category.name),
                            })
                        }
                    }
                    else
                        application.dispatch({ notification: response.message })
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // function for validating form
    const submitForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // preventing form default submit
            event.preventDefault()

            // variable to hold errors
            const errors: string[] = []
            const stock = number.reFormat(application.state.stock)
            const buying_price = number.reFormat(application.state.buyingPrice)
            const selling_price = number.reFormat(application.state.sellingPrice)
            const reorder_stock_level = number.reFormat(application.state.reorderStockLevel)

            if (string.isEmpty(application.state.productName)) {
                errors.push("")
                application.dispatch({ productNameError: "required" })
            }

            if (can("view_category") && string.isEmpty(application.state.categoryName)) {
                errors.push("")
                application.dispatch({ categoryNameError: "required"})
            }
            else if (string.isNotEmpty(application.state.categoryName) && string.isEmpty(application.state.categoryId)) {
                errors.push("")
                application.dispatch({ categoryNameError: "category does not exist" })
            }

            if (buying_price < 0) {
                errors.push("")
                application.dispatch({ buyingPriceError: "can't be less than zero" })
            }
            else if (buying_price > selling_price) {
                errors.push("")
                application.dispatch({ buyingPriceError: "can't be greater than selling price" })
            }

            if (selling_price < 0) {
                errors.push("")
                application.dispatch({ sellingPriceError: "can't be less or equal to zero" })
            }

            if (stock < 0) {
                errors.push("")
                application.dispatch({ stockError: "can't be less than zero" })
            }

            if (reorder_stock_level < 0) {
                errors.push("")
                application.dispatch({ reorderStockLevelError: "can't be less than zero" })
            }

            if (application.state.edit) {
                if (buying_price <= 0) {
                    errors.push("")
                    application.dispatch({ buyingPrice: "can't be less or equal to zero" })
                }

                if (selling_price <= 0) {
                    errors.push("")
                    application.dispatch({ sellingPrice: "can't be less or equal to zero" })
                }
            }

            if (application.state.isStoreProduct) {
                if (string.isEmpty(application.state.storeName)) {
                    errors.push("")
                    application.dispatch({ storeNameError: "required" })
                }
                else if (string.isEmpty(application.state.storeId)) {
                    errors.push("")
                    application.dispatch({ storeNameError: "store does not exist" })
                }
            }

            // checking if there's no error occured
            if (array.isEmpty(errors) && string.isEmpty(application.state.productNameError)) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const product = {
                    stock,
                    ...creatorOrModifier,
                    buying_price,
                    selling_price,
                    reorder_stock_level,
                    is_store_product: application.state.isStoreProduct,
                    name: text.format(application.state.productName).toLowerCase(),
                    quantity: application.state.edit ? application.state.quantity : stock,
                    store: application.state.isStoreProduct ? application.state.storeId : null,
                    barcode: application.state.barcode.trim() ? application.state.barcode : null,
                    category: string.isNotEmpty(application.state.categoryId) ? application.state.categoryId : null
                }

                const options: createOrUpdate = {
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    method: application.state.edit ? "PUT" : "POST",
                    loading: true,
                    body: {
                        schema: "product",
                        documentData: product,
                        condition: application.condition,
                        newDocumentData: { $set: product }
                    }
                }

                // making api request
                const response: serverResponse = await application.createOrUpdate(options)

                // checking if request was processed successfull
                if (response.success) {
                    application.unMount()
                    application.dispatch({ notification: application.successMessage, isStoreProduct: application.state.isStoreProduct })
                }
                else
                    application.dispatch({ notification: response.message })

            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // function for uploading contacts from excel
    const uploadProducts = async (): Promise<void> => {
        try {

            // validating if products have been added to list array
            if (application.state.list.length > 0) {

                // close model
                application.toggleComponent("modal")

                // validating products
                const validProducts: any[] = []
                const invalidProducts: any[] = []

                for (const product of application.state.list) {
                    if (product["NAME"] === undefined)
                        invalidProducts.push({ ...product, NAME: "", ERROR: "Name is required" })
                    else if (product["STOCK"] === undefined)
                        invalidProducts.push({ ...product, STOCK: "", ERROR: "STOCK is required" })
                    else if (Number(product["STOCK"]) < 0)
                        invalidProducts.push({ ...product, ERROR: "STOCK can't be less than zero" })
                    else if (product["BUYING PRICE"] === undefined)
                        invalidProducts.push({ ...product, ERROR: "BUYING PRICE is required" })
                    else if (Number(product["BUYING PRICE"]) < 0)
                        invalidProducts.push({ ...product, ERROR: "BUYING PRICE can't be less than zero" })
                    else if (product["SELLING PRICE"] === undefined)
                        invalidProducts.push({ ...product, ERROR: "SELLING PRICE is required" })
                    // else if (Number(product["BUYING PRICE"]) > Number(product["SELLING PRICE"]))
                    //     invalidProducts.push({ ...product, ERROR: "BUYING PRICE can't be greater than SELLING PRICE" })
                    else if ((product["REORDER STOCK LEVEL"] !== undefined) && Number(product["REORDER STOCK LEVEL"]) < 0)
                        invalidProducts.push({ ...product, ERROR: "Reorder stock level can't be less than 0" })
                    else
                        validProducts.push(product)
                }

                // clear product list
                application.dispatch({ list: [] })

                // checking if there's no invalid product
                if (invalidProducts.length === 0) {

                    const errors: string[] = []

                    if (application.state.isStoreProduct) {
                        if (string.isEmpty(application.state.storeName)) {
                            errors.push("")
                            application.dispatch({ storeNameError: "required" })
                        }
                        else if (string.isEmpty(application.state.storeId)) {
                            errors.push("")
                            application.dispatch({ storeNameError: "store does not exist" })
                        }
                    }

                    if (array.isEmpty(errors)) {

                        // request options
                        const options: createOrUpdate = {
                            route: apiV1 + "bulk-create",
                            method: "POST",
                            loading: true,
                            body: validProducts.map((product: any) => ({
                                schema: "product",
                                documentData: {
                                    ...application.onCreate,
                                    stock: Number(product["STOCK"]),
                                    quantity: Number(product["STOCK"]),
                                    name: text.format(product["NAME"]).toLowerCase(),
                                    buying_price: Number(product["BUYING PRICE"]),
                                    selling_price: Number(product["SELLING PRICE"]),
                                    is_store_product: application.state.isStoreProduct,
                                    barcode: product["BARCODE"] ? Number(product["BARCODE"]) : null,
                                    store: application.state.isStoreProduct ? application.state.storeId : null,
                                    reorder_stock_level: product["REORDER STOCK LEVEL"] ? Number(product["REORDER STOCK LEVEL"]) : 0
                                }
                            }
                            ))
                        }

                        // making api request
                        const response: serverResponse = await application.createOrUpdate(options)

                        // checking if request was processed successfully
                        if (response.success) {

                            application.unMount()
                            onMount()

                            const { failedQueries, passedQueries } = response.message

                            if (failedQueries.length === 0) {
                                application.dispatch({ notification: `${passedQueries.length} ${passedQueries.length > 1 ? "products have" : "product has"} created` })
                            }
                            else {
                                application.dispatch({ notification: `${passedQueries.length} product(s) have been created, while ${failedQueries.length} product(s) failed to create` })
                                application.arrayToExcel(failedQueries, "product(s) failed to create")
                            }

                        }
                        else {
                            application.dispatch({ notification: response.message })
                        }
                    }
                }
                else
                    application.arrayToExcel([...invalidProducts, validProducts], "product validation error")

            }
            else
                application.dispatch({ filesError: "File is required or file has no product(s)" })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // returning component view
    return (
        <>
            <Modal
                buttonTitle="Import"
                buttonAction={uploadProducts}
                title="Import products from excel"
                toggleComponent={application.toggleComponent}
            >
                <form action="#">
                    <div className="row">
                        <div className="col s12">
                            <Input
                                type="file"
                                label="Choose file"
                                name="files"
                                error={application.state.filesError}
                                onChange={application.handleFileChange}
                                accept=".xls,.xlsx"
                            />
                        </div>
                    </div>
                </form>
                <div className="col s12 right-align">
                    <Link to="#" className="guest-link right-link" onClick={() => application.arrayToExcel(productTemplate.data, productTemplate.name)}>
                        {translate("Download sample product template")}
                    </Link>
                </div>
            </Modal>
            <div className="row">
                <div className="col s12 m10 l8 offset-l2 offset-m1">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} ${application.state.isStoreProduct ? "store" : ""} product`} />
                        <div className="card-content">
                            <form action="#" onSubmit={submitForm}>
                                {
                                    can("view_category")
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <DataListComponent for="category" />
                                            </div>
                                        </div>
                                        : null
                                }
                                {
                                    application.state.isStoreProduct
                                        ?
                                        <div className="row">
                                            <div className="col s12">
                                                <CustomDatalist
                                                    sort="name"
                                                    list="stores"
                                                    label="store"
                                                    nameId="storeId"
                                                    fields={["name"]}
                                                    name="storeName"
                                                    placeholder="enter store"
                                                    nameError="storeNameError"
                                                />
                                            </div>
                                        </div>
                                        : null
                                }
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="text"
                                            label="name"
                                            name="productName"
                                            value={application.state.productName}
                                            error={application.state.productNameError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter name"
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <Input
                                            type="number"
                                            label="barcode / serial"
                                            name="barcode"
                                            value={application.state.barcode}
                                            error={application.state.barcodeError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter barcode"
                                            onKeyUp={() => application.validate({
                                                schema: "product",
                                                errorKey: "barcodeError",
                                                condition: { barcode: text.format(application.state.barcode).toLowerCase() }
                                            })}
                                        />
                                    </div>
                                </div>
                                {
                                    can("view_buying_price") || can("view_selling_price")
                                        ?
                                        <div className="row">
                                            {
                                                can("view_buying_price")
                                                    ?
                                                    <div className={`col s12 ${can("view_selling_price") ? "m6 l6" : ""}`}>
                                                        <Input
                                                            type="text"
                                                            label="buying price"
                                                            name="buyingPrice"
                                                            value={application.state.buyingPrice ? number.format(application.state.buyingPrice) : ""}
                                                            error={application.state.buyingPriceError}
                                                            onChange={application.handleInputChange}
                                                            placeholder="Enter buying price"
                                                        />
                                                    </div>
                                                    : null
                                            }
                                            {
                                                can("view_selling_price")
                                                    ?
                                                    <div className={`col s12 ${can("view_buying_price") ? "m6 l6" : ""}`}>
                                                        <Input
                                                            type="text"
                                                            label="selling price"
                                                            name="sellingPrice"
                                                            value={application.state.sellingPrice ? number.format(application.state.sellingPrice) : ""}
                                                            error={application.state.sellingPriceError}
                                                            onChange={application.handleInputChange}
                                                            placeholder="Enter selling price"
                                                        />
                                                    </div>
                                                    : null
                                            }
                                        </div>
                                        : null
                                }
                                <div className="row">
                                    {
                                        can("view_stock")
                                            ?
                                            <div className="col s12 m6 l6">
                                                <Input
                                                    type="text"
                                                    label="Stock available"
                                                    name="stock"
                                                    value={application.state.stock ? number.format(application.state.stock) : ""}
                                                    error={application.state.stockError}
                                                    onChange={application.handleInputChange}
                                                    placeholder="Enter stock available"
                                                    disabled={application.state.edit}
                                                />
                                            </div>
                                            : null
                                    }
                                    <div className={`col s12 ${can("view_stock") ? "m6 l6" : ""}`}>
                                        <Input
                                            type="text"
                                            label="re-order stock level"
                                            name="reorderStockLevel"
                                            value={application.state.reorderStockLevel ? number.format(application.state.reorderStockLevel) : ""}
                                            error={application.state.reorderStockLevelError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter re-order stock level (stock alert)"
                                        />
                                    </div>
                                </div>
                                <div className="col s12 right-align">
                                    <Link to="#" className="guest-link right-link" onClick={() => application.toggleComponent("modal")}>
                                        {translate("Upload or Import from Excel")}
                                    </Link>
                                </div>
                                <div className="row">
                                    <div className="col s12 center">
                                        <Button
                                            title={application.state.edit ? "update" : "create"}
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
                can("list_product") || can("list_store_product")
                    ?
                    <FloatingButton
                        to={application.state.isStoreProduct ? "/store/product-list" : "/product/list"}
                        icon="list_alt"
                        tooltip={application.state.isStoreProduct ? "list store products" : "List products"}
                    />
                    : null
            }
        </>
    )

})

// exporting component
export default ProductForm