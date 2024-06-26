// dependencies
import React from "react"
import Search from "../../components/search"
import { apiV1, commonCondition, number, pageNotFound, setPageTitle, text } from "../../helpers"
import { routerProps } from "../../types"
import { Checkbox } from "../../components/form"
import { ActionButton, FloatingButton } from "../../components/button"
import Pagination from "../../components/pagination"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { ApplicationContext } from "../../context"
import ListComponentFilter from "../../components/reusable/list-component-filter"

// product list memorized functional component
const ProductList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // cheking if current user has access
        if (can("list_product") || can("do_stock_taking")) {
            // loading component data
            onMount()
        }
        else
            props.history.push(pageNotFound)

        // component ummounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    // loading component data
    async function onMount(): Promise<void> {
        try {

            const pathname = props.location.pathname
            const title: string = pathname.includes("store") ? "store" : ""
            setPageTitle(`${title} products`)

            // checking is its stocktaking
            const stockTaking: boolean = pathname === "/product/stock-taking"

            application.dispatch({ pathname })

            // creating initial condition
            let initialCondition: object = { ...commonCondition(true), is_store_product: title === "store" }

            // checking if condition has been passed from other components
            if (props.location.state) {
                const { propsCondition }: any = props.location.state
                if (propsCondition) {
                    initialCondition = { ...initialCondition, ...propsCondition }
                    application.dispatch({ propsCondition })
                }
            }

            // request parameter, condition and sort
            const joinForeignKeys: boolean = true
            const sort: string = JSON.stringify({ name: 1 })
            const condition: string = JSON.stringify(initialCondition)
            const select: object = { name: 1, stock: 1, selling_price: 1, reorder_stock_level: 1, visible: 1, quantity: 1, buying_price: 1, category: 1 }
            const parameters: string = `schema=product&condition=${condition}&select=${JSON.stringify(select)}&sort=${sort}&page=${application.state.page}&limit=${application.state.limit}&joinForeignKeys=${joinForeignKeys}`

            // making api request
            application.mount({
                route: stockTaking && can("do_stock_taking") ? `${apiV1}list-all` : `${apiV1}list`,
                parameters,
                condition: title === "store" ? "store_products" : "products",
                sort: "name",
                order: 1,
                collection: "products",
                schema: "product",
                select,
                joinForeignKeys,
                fields: ["name", "barcode"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering products
    const renderList = React.useCallback(() => {
        try {
            return application.state.products.map((product: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(product._id)}>
                    {
                        can("delete_product") || can("restore_deleted")
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(product._id)}
                                    checked={application.state.ids.indexOf(product._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")} className="sticky bold">
                        {text.reFormat(product.name)}&nbsp;{product.category ? `(${text.reFormat(product.category.name)})` : null}
                    </td>
                    {
                        can("view_buying_price")
                            ?
                            <td data-label={translate("buying price")} className="right-align">
                                {number.format(product.buying_price)}
                            </td>
                            : null
                    }
                    {
                        can("view_selling_price")
                            ?
                            <td data-label={translate("selling price")} className="right-align text-primary">
                                {number.format(product.selling_price)}
                            </td>
                            : null
                    }
                    {
                        can("view_stock")
                            ? <td
                                data-label={translate("stock")}
                                className={`right-align text-${product.stock === 0 ? "error" : (product.stock > 0) && (product.stock <= product.reorder_stock_level) ? "warning" : "success"} `}
                            >
                                {number.format(product.stock)}
                            </td>
                            : null
                    }
                    <td data-label={translate("sold")} className="right-align bold">
                        {number.format(product.quantity - product.stock)}
                    </td>
                    {
                        can("view_purchase")
                            ? <td
                                data-label={translate("purchase")}
                                className={`right-align text-secondary`}
                            >
                                {number.format(product.stock * product.buying_price)}
                            </td>
                            : null
                    }
                    {
                        can("view_selling_price")
                            ? <td
                                data-label={translate("expected sales")}
                                className={`right-align text-primary`}
                            >
                                {number.format(product.stock * product.selling_price)}
                            </td>
                            : null
                    }
                    <td data-label={translate("status")} className="center">
                        {
                            product.stock <= 0 && product.visible
                                ?
                                <span className="badge error ">
                                    {translate("out of stock")}
                                </span>
                                : (product.stock > 0) && (product.stock <= product.reorder_stock_level) && product.visible
                                    ?
                                    <span className="badge warning">
                                        {translate("almost out")}
                                    </span>
                                    : product.visible
                                        ?
                                        <span className="badge success">
                                            {translate("available")}
                                        </span>
                                        :
                                        <span className="badge error">
                                            <i className="material-icons-round">delete</i>
                                            {translate("deleted")}
                                        </span>
                        }
                    </td>
                    {
                        can("edit_product") || can("view_product")
                            ?
                            <td className="center sticky-right">
                                <div className="action-button">
                                    {
                                        (can("edit_product") || can("edit_store_product")) && product.visible
                                            ?
                                            <ActionButton
                                                type="primary"
                                                to={{
                                                    pathname: application.state.pathname.includes("store") ? "/store/product-form" : "/product/form",
                                                    state: { product: product._id }
                                                }}
                                                tooltip="edit"
                                                icon="edit_note"
                                                position="left"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_product") || can("view_store_product")
                                            ?
                                            <ActionButton
                                                type="info"
                                                to={{
                                                    pathname: application.state.pathname.includes("store") ? "/store/product-view" : "/product/view",
                                                    state: { product: product._id }
                                                }}
                                                tooltip="view"
                                                icon="visibility"
                                                position="left"
                                            />
                                            : null
                                    }
                                </div>
                            </td>
                            : null
                    }
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.products, application.state.ids])

    // exporting products
    const exportProducts = (): void => {
        try {

            // template to download
            const template: {
                "NAME": string
                "BUYING PRICE": number
                "SELLING PRICE": number
                "STOCK": number
                "REORDER STOCK LEVEL": number
                "TOTAL SOLD": number
                "STATUS": string
            }[] = []

            if (application.state.ids.length === application.state[application.state.collection].length)

                // looping to all product data
                for (let product of application.state[application.state.collection])

                    // adding product to template array
                    template.push({
                        "NAME": text.reFormat(product.name).toUpperCase(),
                        "BUYING PRICE": can("view_buying_price") ? product.buying_price : "",
                        "SELLING PRICE": product.selling_price,
                        "STOCK": can("view_stock") ? product.stock : "",
                        "REORDER STOCK LEVEL": product.reorder_stock_level,
                        "TOTAL SOLD": product.quantity - product.stock,
                        "STATUS": product.stock <= 0 ? "Out of stock" : (product.stock > 0) && (product.stock <= product.reorder_stock_level) ? "Almost out of stock" : "Available"
                    })

            else {

                // gettting only selected users
                const products: any[] = application.state[application.state.collection].filter((data: any) => application.state.ids.some((id: any) => data._id === id))

                // looping to all product data
                for (let product of products)

                    // adding product to template array
                    template.push({
                        "NAME": text.reFormat(product.name).toUpperCase(),
                        "BUYING PRICE": can("view_buying_price") ? product.buying_price : "",
                        "SELLING PRICE": product.selling_price,
                        "STOCK": can("view_stock") ? product.stock : "",
                        "REORDER STOCK LEVEL": product.reorder_stock_level,
                        "TOTAL SOLD": product.quantity - product.stock,
                        "STATUS": product.stock <= 0 ? "Out of stock" : (product.stock > 0) && (product.stock <= product.reorder_stock_level) ? "Almost out of stock" : "Available"
                    })

            }

            // confirming template array has users
            if (template.length > 0)

                // convert template array to excel and export
                application.arrayToExcel(template, "products")

            application.dispatch({ ids: [] })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // returning component view
    return (
        <>
            <ListComponentFilter />
            <div className="card list">
                <Search
                    refresh={onMount}
                    select={application.selectList}
                    onClick={application.searchData}
                    value={application.state.searchKeyword}
                    onChange={application.handleInputChange}
                >
                    {
                        (application.state.ids.length > 0) && can("delete_product")
                            ?
                            <>
                                {
                                    application.state.ids.length >= 1
                                        ?
                                        <>
                                            {
                                                can("do_stock_taking") && (application.state.condition !== "deleted")
                                                    ?
                                                    <ActionButton
                                                        icon="download"
                                                        to="#"
                                                        type="primary"
                                                        tooltip={`export`}
                                                        position="left"
                                                        onClick={exportProducts}
                                                    />
                                                    : null
                                            }
                                            {
                                                (can("delete_product") || can("delete_store_product")) && (application.state.condition !== "deleted")
                                                    ?
                                                    <ActionButton
                                                        icon="delete"
                                                        to="#"
                                                        type="error"
                                                        tooltip={`Delete`}
                                                        position="left"
                                                        onClick={() => application.openDialog("deleted")}
                                                    />
                                                    : (application.state.condition === "deleted")
                                                        ?
                                                        <>
                                                            <ActionButton
                                                                icon="restore_from_trash"
                                                                to="#"
                                                                type="warning"
                                                                tooltip={`Restore`}
                                                                position="left"
                                                                onClick={() => application.openDialog("restored")}
                                                            />
                                                        </>
                                                        : null
                                            }
                                        </>
                                        : null
                                }
                            </>
                            : null
                    }
                </Search>
                <div className="card-content">
                    <table>
                        <thead>
                            <tr onClick={() => application.selectList()}>
                                {
                                    can("delete_product") || can("restore_deleted")
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state.products.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null
                                }
                                <th>#</th>
                                <th className="sticky">{translate("name")}</th>
                                {
                                    can("view_buying_price")
                                        ? <th className="right-align">{translate("buying price")}</th>
                                        : null
                                }
                                {
                                    can("view_selling_price")
                                        ? <th className="right-align">{translate("selling price")}</th>
                                        : null
                                }
                                {
                                    can("view_stock")
                                        ? <th className="right-align">{translate("stock")}</th>
                                        : null
                                }
                                <th className="right-align">{translate("sold")}</th>
                                {
                                    can("view_purchase")
                                        ? <th className="right-align">{translate("purchase")}</th>
                                        : null
                                }
                                {
                                    can("view_selling_price")
                                        ? <th className="right-align">{translate("expected sales")}</th>
                                        : null
                                }
                                <th className="center">{translate("status")}</th>
                                {
                                    can("edit_product") || can("view_product")
                                        ?
                                        <th className="center sticky-right">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderList()}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="uppercase text-primary bold" colSpan={(can("delete_product") || can("restore_deleted")) ? 5 : 4}>{translate("total")}</td>
                                <td className="right-align text-success">
                                    {
                                        number.format(
                                            application.state.products.map((product) => product.stock).reduce((a: number, b: number) => a + b, 0)
                                        )
                                    }
                                </td>
                                <td className="right-align">
                                    {
                                        number.format(
                                            application.state.products.map((product) => product.quantity - product.stock).reduce((a: number, b: number) => a + b, 0)
                                        )
                                    }
                                </td>
                                {
                                    can("view_purchase")
                                        ?
                                        <td className="right-align text-secondary" data-label={translate("buying price")}>
                                            {
                                                number.format(
                                                    application.state.products.map((product) => product.buying_price * product.stock).reduce((a: number, b: number) => a + b, 0)
                                                )
                                            }
                                        </td>
                                        : null
                                }
                                {
                                    can("view_selling_price")
                                        ?
                                        <td className="right-align text-primary" data-label={translate("selling price")}>
                                            {
                                                number.format(
                                                    application.state.products.map((product) => product.selling_price * product.stock).reduce((a: number, b: number) => a + b, 0)
                                                )
                                            }
                                        </td>
                                        : null
                                }
                                <td></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <Pagination
                    paginate={application.paginateData}
                    currentPage={application.state.page}
                    nextPage={application.state.nextPage}
                    pageNumbers={application.state.pageNumbers}
                    previousPage={application.state.previousPage}
                />
            </div>
            {
                can("create_product") || can("create_store_product")
                    ?
                    <FloatingButton
                        icon="add_circle"
                        to={application.state.pathname.includes("store") ? "/store/product-form" : "/product/form"}
                        tooltip={application.state.pathname.includes("store") ? "new store product" : "new product"}
                    />
                    : null
            }
        </>
    )

})

// exporting component
export default ProductList