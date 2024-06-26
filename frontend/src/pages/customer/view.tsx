// component dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../components/button"
import { apiV1, formatTin, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { moduleMenuOnView, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"
import customerMenuView from "./helpers/customer-view-menu"

const CustomerView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {

        // checking user permission
        if (can("view_customer")) {

            // checking if customer has been passed from component state
            if (props.location.state) {

                // destructuring customer
                const { customer }: any = props.location.state

                // validating customer existance
                if (customer) {

                    // setting page title
                    setPageTitle("view customer")

                    // updating component state
                    application.dispatch({
                        ids: [customer],
                        schema: "customer",
                        collection: "customers"
                    })

                    // fetching customer data
                    onMount(customer)

                }
                else
                    props.history.goBack()
            }
            else
                props.history.goBack()
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    // fetching customer data
    async function onMount(customerId: string): Promise<void> {
        try {

            const select: string = JSON.stringify({
                tin: 1,
                name: 1,
                email: 1,
                branch: 1,
                visible: 1,
                createdAt: 1,
                updatedAt: 1,
                updated_by: 1,
                created_by: 1,
                phone_number: 1,
                identification: 1,
                "address.region": 1,
                "address.country": 1,
            })
            const condition: string = JSON.stringify({ _id: customerId })
            const parameters: string = `schema=customer&condition=${condition}&joinForeignKeys=${true}&select=${select}`

            // request options
            const options: readOrDelete = {
                route: apiV1 + "read",
                method: "GET",
                loading: true,
                disabled: true,
                parameters
            }

            // api request
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success)
                application.dispatch({ customer: response.message })
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // component view
    return (
        <>
            <div className="row">
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {text.abbreviate(application.state.customer?.name)}
                            </div>
                            <div className="view-title">
                                {text.reFormat(application.state.customer?.name)}
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="view-item active">
                                <Icon name="info" />
                                <div className="title semibold">{translate("customer menu & action")}</div>
                            </div>

                            {/* rendering customer menu */}
                            {
                                customerMenuView.map((menu: moduleMenuOnView, index: number) => {
                                    if (menu.visible && application.state.customer?.visible)
                                        return (
                                            <Link
                                                className="view-item" key={index}
                                                to={{
                                                    pathname: menu.link,
                                                    state: {
                                                        propsCondition: {
                                                            customer: application.state.customer?._id
                                                        },
                                                        customer: application.state.customer
                                                    }
                                                }}
                                            >
                                                <Icon name="chevron_right" />
                                                <div className="title">{translate(menu.name)}</div>
                                            </Link>
                                        )
                                    else
                                        return null
                                })
                            }

                            {/* customer actions */}
                            {
                                application.state.customer?.visible && (can("edit_customer") || can("delete_customer"))
                                    ?
                                    <>
                                        {
                                            can("edit_customer")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/customer/form`,
                                                        state: { customer: application.state.customer?._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <Icon name="edit_note" type="rounded text-success" />
                                                    <div className="title">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_customer")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.openDialog("deleted")}
                                                >
                                                    <Icon name="delete" type="rounded text-error" />
                                                    <div className="title semibold">{translate("delete")}</div>
                                                </Link>
                                                : null
                                        }
                                    </>
                                    : !application.state.customer?.visible && can("restore_deleted") && !application.state.loading
                                        ?
                                        <Link
                                            to="#"
                                            className="view-item"
                                            onClick={() => application.openDialog("restored")}
                                        >
                                            <Icon name="restore_from_trash" type="rounded text-warning" />
                                            <div className="title semibold">{translate("restore")}</div>
                                        </Link>
                                        : null
                            }
                        </div>
                    </div>
                </div>
                <div className="col s12 m7 l8">
                    <div className="view">
                        <div className="view-header">
                            <div className="title">
                                <span>{translate("customer information")}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("phone number")}:
                                        </div>
                                        <div className="title">
                                            {
                                                application.state.customer?.phone_number
                                                    ?
                                                    <a href={`tel:+${application.state.customer?.phone_number?.substring(1)}`} className="text-primary">
                                                        +{application.state.customer?.phone_number}
                                                    </a>
                                                    : translate("n/a")
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("email")}:
                                        </div>
                                        <div className="title">
                                            {
                                                application.state.customer?.email
                                                    ?
                                                    <a href={`mailto:${application.state.customer?.email}`} className="lowercase text-secondary">
                                                        {application.state.customer?.email}
                                                    </a>
                                                    : translate("n/a")
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("country")}:
                                        </div>
                                        <div className="title">
                                            {
                                                application.state.customer?.address?.country ?
                                                    text.reFormat(application.state.customer?.address?.country) :
                                                    translate("n/a")
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("region")}:
                                        </div>
                                        <div className="title">
                                            {
                                                application.state.customer?.address?.region ?
                                                    text.reFormat(application.state.customer?.address?.region)
                                                    : translate("n/a")
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("identification")}:
                                        </div>
                                        <div className="title">
                                            {
                                                application.state.customer?.identification ?
                                                    text.reFormat(application.state.customer?.identification) :
                                                    translate("n/a")
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className={`label`}>
                                            {translate("status")}:
                                        </div>
                                        <div className={`title uppercase ${application.state.customer?.visible ? "text-success" : "text-error"}`}>
                                            {application.state.customer?.visible ? translate("active") : translate("deleted")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s12">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("TIN")}:
                                        </div>
                                        <div className="title">
                                            {
                                                application.state.customer?.tin
                                                    ?
                                                    formatTin(application.state.customer?.tin)
                                                    : translate("n/a")
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ViewDetail />
                        </div>
                    </div>
                </div>
            </div>
            {
                can("list_customer")
                    ?
                    <FloatingButton
                        to="/customer/list"
                        tooltip="list customers"
                    />
                    : null
            }
        </>
    )

})

export default CustomerView