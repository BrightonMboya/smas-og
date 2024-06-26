// component dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../components/button"
import { Checkbox } from "../../components/form"
import Pagination from "../../components/pagination"
import Search from "../../components/search"
import { apiV1, commonCondition, formatTin, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { routerProps } from "../../types"
import { ApplicationContext } from "../../context"
import { array } from "fast-web-kit"
import ListComponentFilter from "../../components/reusable/list-component-filter"

// customer listing memprized functional component
const CustomerList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {

        if (can("list_customer"))
            onMount()
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    // fetching component data
    async function onMount(): Promise<void> {
        try {

            // setting new page title
            setPageTitle("customers")

            // creating initial condition
            let initialCondition: object = commonCondition(true)

            // checking if condition has been passed from other components
            if (props.location.state) {
                const { propsCondition }: any = props.location.state
                if (propsCondition) {
                    initialCondition = { ...initialCondition, ...propsCondition }
                    application.dispatch({ propsCondition })
                }
            }

            const order = 1
            const joinForeignKeys: boolean = false
            const sort: string = JSON.stringify({ name: order })
            const condition: string = JSON.stringify(initialCondition)
            const select: object = {
                tin: 1,
                name: 1,
                email: 1,
                address: 1,
                visible: 1,
                phone_number: 1,
                identification: 1,
            }
            const parameters: string = `schema=customer&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

            application.mount({
                order,
                select,
                parameters,
                sort: "name",
                joinForeignKeys,
                schema: "customer",
                route: `${apiV1}list`,
                condition: "customers",
                collection: "customers",
                fields: ["name", "phone_number", "address.region", "address.country", "email", "identification"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering customer list
    const renderCustomers = React.useCallback(() => {
        try {
            return application.state.customers.map((customer: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(customer._id)}>
                    {
                        can("delete_customer") || can("restore_deleted")
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(customer._id)}
                                    checked={application.state.ids.indexOf(customer._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")} className="sticky bold">{text.reFormat(customer.name)}</td>
                    <td data-label={translate("country")}>{text.reFormat(customer.address.country ? customer.address.country : translate("N/A"))}</td>
                    {
                        application.user?.branch?.type !== "tourism"
                            ?
                            <td data-label={translate("region")}>{text.reFormat(customer.address.region ? customer.address.region : translate("N/A"))}</td>
                            : null
                    }
                    <td data-label={translate("phone number")}>
                        {
                            customer.phone_number
                                ?
                                <a href={`tel:+${customer.phone_number}`} className="text-primary">
                                    {`+${customer.phone_number}`}
                                </a>
                                : translate("n/a")
                        }
                    </td>
                    <td data-label={translate("email")}>
                        {
                            customer.email
                                ?
                                <a href={`mailto:${customer.email}`} className="text-secondary">
                                    {customer.email}
                                </a>
                                : translate("n/a")
                        }
                    </td>
                    <td data-label={translate("identification")} className="center">{customer.identification ? customer.identification : translate("n/a")}</td>
                    {
                        application.user?.branch?.type !== "tourism"
                            ?
                            <td data-label={translate("tin")} className="center">{text.reFormat(customer.tin ? formatTin(customer.tin) : translate("N/A"))}</td>
                            : null
                    }
                    {
                        can("edit_customer") || can("view_customer") || can("create_order") || can("create_proforma_invoice")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("create_order")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/sale/order-form",
                                                    state: { customer: customer._id }
                                                }}
                                                type="success"
                                                icon="shopping_cart"
                                                tooltip="new order"
                                                position="left"
                                            />
                                            : null
                                    }
                                    {
                                        can("create_proforma_invoice")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/sale/proforma-invoice-form",
                                                    state: { customer: customer._id }
                                                }}
                                                type="warning"
                                                icon="receipt"
                                                tooltip="new proforma invoice"
                                                position="left"
                                            />
                                            : null
                                    }
                                    {
                                        can("edit_customer") && customer.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/customer/form",
                                                    state: { customer: customer._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                tooltip="edit"
                                                position="left"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_customer")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/customer/view",
                                                    state: { customer: customer._id }
                                                }}
                                                type="info"
                                                icon="visibility"
                                                tooltip="view"
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
    }, [application.state.customers, application.state.ids])

    // exporting customers to excel
    const exportCustomers = (): void => {
        try {

            // template to download
            const template: any[] = []

            if (application.state.ids.length === application.state[application.state.collection].length) {

                // looping to all customer data
                for (let customer of application.state[application.state.collection])

                    // adding customer to template array
                    template.push(
                        {
                            "NAME": text.reFormat(customer.name).toUpperCase(),
                            "COUNTRY": customer?.address?.country ? text.reFormat(customer?.address?.country) : "",
                            "REGION": customer?.address?.region ? text.reFormat(customer?.address?.region) : "",
                            "PHONE NUMBER": customer.phone_number ? customer.phone_number : "",
                            "EMAIL": customer?.email ? customer?.email : "",
                            "IDENTIFICATION": customer.identification ? customer.identification : "",
                            "TIN NUMBER": customer.tin ? customer.tin : "",
                        }
                    )

            }
            else {

                // gettting only selected
                const customers: any[] = application.state[application.state.collection].filter((customer: any) => application.state.ids.some((id: any) => customer._id === id))

                // looping to all customer data
                for (let customer of customers)

                    // adding customer to template array
                    template.push(
                        {
                            "NAME": text.reFormat(customer.name).toUpperCase(),
                            "COUNTRY": customer?.address?.country ? text.reFormat(customer?.address?.country) : "",
                            "REGION": customer?.address?.region ? text.reFormat(customer?.address?.region) : "",
                            "PHONE NUMBER": customer.phone_number ? customer.phone_number : "",
                            "EMAIL": customer?.email ? customer?.email : "",
                            "IDENTIFICATION": customer.identification ? customer.identification : "",
                            "TIN NUMBER": customer.tin ? customer.tin : "",
                        },
                    )

            }

            // confirming template array has
            if (template.length > 0)

                // convert template array to excel and export
                application.arrayToExcel(array.sort(template, "asc", "NAME"), "customers")

            application.dispatch({ ids: [] })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    return (
        <>
            <ListComponentFilter />
            <div className="card list">
                <Search
                    onChange={application.handleInputChange}
                    onClick={application.searchData}
                    value={application.state.searchKeyword}
                    refresh={onMount}
                    select={application.selectList}
                >
                    {
                        (application.state.ids.length > 0) && (can("delete_customer") || can("restore_deleted"))
                            ?
                            <>
                                {
                                    application.state.condition !== "deleted"
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="primary"
                                            icon="download"
                                            tooltip="export"
                                            position="left"
                                            onClick={exportCustomers}
                                        />
                                        : null
                                }
                                {
                                    can("delete_customer") && (application.state.condition !== "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="error"
                                            icon="delete"
                                            tooltip="delele"
                                            position="left"
                                            onClick={() => application.openDialog("deleted")}
                                        />
                                        : null
                                }
                                {
                                    can("delete_customer") && (application.state.condition === "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="primary"
                                            icon="restore_from_trash"
                                            tooltip="restore"
                                            position="left"
                                            onClick={() => application.openDialog("restored")}
                                        />
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
                                    can("delete_customer") || can("restore_deleted")
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state.customers.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null
                                }
                                <th>#</th>
                                <th className="sticky">{translate("name")}</th>
                                <th >{translate("country")}</th>
                                {
                                    application.user?.branch?.type !== "tourism"
                                        ?
                                        <th >{translate("region")}</th>
                                        : null
                                }
                                <th >{translate("phone number")}</th>
                                <th >{translate("email")}</th>
                                <th >{translate("identification")}</th>
                                {
                                    application.user?.branch?.type !== "tourism"
                                        ?
                                        <th className="center">{translate("tin")}</th>
                                        : null
                                }
                                {
                                    can("edit_customer") || can("view_customer")
                                        ?
                                        <th className="center sticky-right">{translate("options")}</th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderCustomers()}
                        </tbody>
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
                can("create_customer")
                    ?
                    <FloatingButton
                        to="/customer/form"
                        tooltip="new customer"
                    />
                    : null
            }
        </>
    )

})

export default CustomerList