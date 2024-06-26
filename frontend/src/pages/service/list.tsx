// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../components/button"
import { Checkbox } from "../../components/form"
import Pagination from "../../components/pagination"
import Search from "../../components/search"
import { apiV1, commonCondition, getDate, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { routerProps } from "../../types"
import Report from "../report/components/report"
import { InvoiceFooter } from "../sale/invoice"
import { ApplicationContext } from "../../context"
import { Link } from "react-router-dom"
import { string, number } from "fast-web-kit"
import ListComponentFilter from "../../components/reusable/list-component-filter"

// service list memorized function component
const ServiceList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("list_service")) {
            onMount()
            setPageTitle("services")
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
            // creating initial condition
            let initialCondition: object = commonCondition()

            // checking if condition has been passed from other components
            if (props.location.state) {
                const { propsCondition }: any = props.location.state
                if (propsCondition) {
                    initialCondition = { ...initialCondition, ...propsCondition }
                    application.dispatch({ propsCondition })
                }
            }

            const condition: string = JSON.stringify(initialCondition)
            const order = -1
            const sort: string = JSON.stringify({ createdAt: order })
            const select: object = { updated_by: 0, __v: 0, updatedAt: 0 }
            const joinForeignKeys: boolean = true
            const parameters: string = `schema=service&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

            application.mount({
                route: `${apiV1}list`,
                parameters,
                condition: "services",
                sort: "created time",
                order,
                schema: "service",
                collection: "services",
                select,
                joinForeignKeys,
                fields: ["description", "status", "service", "number"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const printService = (service: any): void => {
        try {
            application.dispatch({
                service,
                branch: service.branch,
                customer: service.customer,
            })
            setPageTitle(`${service.customer.name}_service`)
            setTimeout(() => window.print(), 1000)
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering list
    const renderList = React.useCallback(() => {
        try {
            return application.state.services.map((service: any, index: number) => (
                <tr key={service._id} >
                    {
                        (can("delete_service"))
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(service._id)}
                                    checked={application.state.ids.indexOf(service._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label="#">{index + 1}</td>
                    <td className="sticky" data-label={translate("device")} data-tooltip={text.reFormat(service.customer?.name)}>
                        <Link to={can("view_device") ? {
                            pathname: "/device/view",
                            state: { device: service.device._id }
                        } : "#"} className="bold">
                            {text.reFormat(service.device?.name)}
                        </Link>
                    </td>
                    <td data-label={translate("service")}>{text.reFormat(service.service)}</td>
                    <td className="right-align" data-label={translate("number")}>{service.number}</td>
                    <td className="right-align text-primary" data-label={translate("service cost")}>{number.format(service.service_cost)}</td>
                    <td className="right-align" data-label={translate("product cost")} data-tooltip={text.reFormat(service.product?.name)}>{number.format(service.product_cost)}</td>
                    <td className="right-align text-success" data-label={translate("total cost")}>{number.format(service.service_cost + service.product_cost)}</td>
                    <td className="center" data-label={translate("status")}>
                        <span className={`badge ${service.status === "completed" ? "success" : "primary"}`} data-tooltip={string.truncate(service.description, 30)}>
                            <i className={`material-icons ${service.status === "incomplete" ? "rotate" : ""}`}>
                                {service.status === "completed" ? "done_all" : "autorenew"}
                            </i>
                            {text.reFormat(service.status)}
                        </span>
                    </td>
                    <td className="center">
                        {getDate(service.createdAt)}
                    </td>
                    {
                        can("view_service") || can("print_report")
                            ?
                            <td className="center sticky-right">
                                <div className="action-button">
                                    {
                                        can("print_report")
                                            ?
                                            <ActionButton
                                                to="#"
                                                type="success"
                                                icon="print"
                                                tooltip="print"
                                                onClick={() => printService(service)}
                                            />
                                            : null
                                    }
                                    {
                                        can("view_service")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/service/view",
                                                    state: { service: service._id }
                                                }}
                                                type="info"
                                                icon="visibility"
                                                tooltip="view"
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
    }, [application.state.services, application.state.ids])

    // component view
    return (
        <>
            <div className="hide-on-print">
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
                            application.state.ids.length >= 1
                                ?
                                <>
                                    {
                                        application.state.condition === "incomplete"
                                            ?
                                            <ActionButton
                                                to="#"
                                                type="success"
                                                icon="done_all"
                                                tooltip={`complete service${application.state.ids.length > 1 ? "s" : ""}`}
                                                onClick={() => application.openDialog("completed")}
                                            />
                                            : null
                                    }
                                    {
                                        can("delete_service") && (application.state.condition !== "deleted")
                                            ?
                                            <ActionButton
                                                to="#"
                                                type="error"
                                                icon="delete"
                                                tooltip="delete"
                                                onClick={() => application.openDialog("deleted")}
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
                                        (can("delete_service"))
                                            ?
                                            <th>
                                                <Checkbox
                                                    onChange={() => application.selectList()}
                                                    checked={(application.state.ids.length > 0) && (application.state.services.length === application.state.ids.length)}
                                                    onTable
                                                />
                                            </th>
                                            : null
                                    }
                                    <th>#</th>
                                    <th className="sticky">{translate("device")}</th>
                                    <th>{translate("service")}</th>
                                    <th className="right-align">{translate("number")}</th>
                                    <th className="right-align">{translate("service cost")}</th>
                                    <th className="right-align">{translate("product cost")}</th>
                                    <th className="right-align">{translate("total cost")}</th>
                                    <th className="center">{translate("status")}</th>
                                    <th className="center">{translate("date")}</th>
                                    {
                                        can("view_service") || can("print_report")
                                            ? <th className="center sticky-right">{translate("options")}</th>
                                            : null
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                {renderList()}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className="uppercase text-primary bold" colSpan={5}>{translate("total")}</td>
                                    <td className="right-align bold text-primary">
                                        {
                                            number.format(
                                                application.state.services.map((service: any) => service.service_cost).reduce((a: number, b: number) => a + b, 0)
                                            )
                                        }
                                    </td>
                                    <td className="right-align bold">
                                        {
                                            number.format(
                                                application.state.services.map((service: any) => service.product_cost).reduce((a: number, b: number) => a + b, 0)
                                            )
                                        }
                                    </td>
                                    <td className="right-align bold text-success">
                                        {
                                            number.format(
                                                application.state.services.map((service: any) => service.service_cost + service.product_cost).reduce((a: number, b: number) => a + b, 0)
                                            )
                                        }
                                    </td>
                                    <td></td>
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
                    can("create_service")
                        ? <FloatingButton to="/service/form" tooltip="new service" />
                        : null
                }
            </div>
            <Report
                type="report"
                title={application.state.title}
                report="service"
                branch={application.state.branch}
                customer={application.state.customer}
            >
                <table>
                    <thead>
                        <tr>
                            <th className="number">{translate("number")}</th>
                            <th>{translate("device")}</th>
                            <th>{translate("service")}</th>
                            <th className="right-align">{translate("service cost")}</th>
                            <th>{translate("product")}</th>
                            <th className="right-align">{translate("product cost")}</th>
                            <th className="right-align">{translate("total cost")}</th>
                            <th className="center">{translate("date")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="right-align" data-label={translate("number")}>{application.state.service?.number}</td>
                            <td className="text-primary bold">
                                {text.reFormat(application.state.service?.device?.name)}
                            </td>
                            <td className="">
                                {text.reFormat(application.state.service?.service)}
                            </td>
                            <td className="text-primary bold right-align">
                                {number.format(application.state.service?.service_cost)}
                            </td>
                            <td className="">
                                {application.state.service?.product ? text.reFormat(application.state.service?.product?.name) : translate("n/a")}
                            </td>
                            <td className="bold right-align">
                                {number.format(application.state.service?.product_cost)}
                            </td>
                            <td className="text-success bold right-align">
                                {number.format(application.state.service?.service_cost + application.state.service?.product_cost)}
                            </td>
                            <td className="center">
                                {getDate(application.state.service?.createdAt)}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <InvoiceFooter type="order" />
            </Report>
        </>
    )

})

// exporting component
export default ServiceList