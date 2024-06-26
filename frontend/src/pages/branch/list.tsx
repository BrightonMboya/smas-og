// dependencies
import React from "react"
import { ActionButton, FloatingButton } from "../../components/button"
import { Checkbox } from "../../components/form"
import Pagination from "../../components/pagination"
import Search from "../../components/search"
import { apiV1, commonCondition, formatTin, noAccess, pageNotFound, setPageTitle, socketURL, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { routerProps } from "../../types"
import { ApplicationContext } from "../../context"
import { Link } from "react-router-dom"
import { number } from "fast-web-kit"
import ListComponentFilter from "../../components/reusable/list-component-filter"

// branch list memorized function component
const BranchList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("list_branch")) {
            setPageTitle("branches")
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

            const order = 1
            const joinForeignKeys: boolean = false
            const sort: string = JSON.stringify({ name: order })
            const condition: string = JSON.stringify({ ...initialCondition })
            const select: object = { user: 0, updatedAt: 0, createdAt: 0, created_by: 0, updated_by: 0, __v: 0, branch: 0, }
            const parameters: string = `schema=branch&condition=${condition}&sort=${sort}&select=${JSON.stringify(select)}&joinForeignKeys=${joinForeignKeys}&page=${application.state.page}&limit=${application.state.limit}`

            application.mount({
                order,
                select,
                parameters,
                sort: "name",
                joinForeignKeys,
                schema: "branch",
                route: `${apiV1}list`,
                condition: "branches",
                collection: "branches",
                fields: ["name", "phone_number", "address.location", "address.region", "address.street", "vendor", "address.country", "email", "website"]
            })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }


    /**
     * Download zipped data for a given branch.
     *
     * @param branch - The branch object which contains details like _id, name, phone_number, and address.
     */
    const downloadZippedData = async (branch: any) => {
        try {

            application.dispatch({ loading: true })
            // Construct the API endpoint URL with the branch's _id as a query parameter
            const response = await fetch(`${socketURL}/custom/zipped-data?branch=${branch._id}`);

            // Check if the request was successful
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            // Convert the response to a blob for downloading
            const blob = await response.blob();

            // Create a blob URL for the response data
            const url = window.URL.createObjectURL(blob);

            // Create an anchor element to facilitate the download
            const link: any = document.createElement('a');
            link.href = url;

            // Set the download attribute to a formatted filename based on branch details
            link.setAttribute('download', `${branch.name}_${branch.phone_number}_${branch.address.region}.json.gz`);

            // Append the link to the DOM to make it clickable
            document.body.appendChild(link);

            // Trigger the download by programmatically clicking the link
            link.click();

            // Clean up: Remove the link from the DOM after initiating the download
            link.parentNode.removeChild(link);

        } catch (error) {
            // Dispatch a notification with the error message to inform the user
            application.dispatch({ notification: (error as Error).message });
        }
        finally {
            application.dispatch({ loading: false })
        }
    }

    const renderList = React.useCallback(() => {
        try {

            return application.state.branches.map((branch: any, index: number) => (
                <tr key={branch._id} onClick={() => application.selectList(branch._id)}>
                    {
                        (can("delete_branch") || can("restore_deleted"))
                            ?
                            <td data-label={translate("select")}>
                                <Checkbox
                                    onChange={() => application.selectList(branch._id)}
                                    checked={application.state.ids.indexOf(branch._id) >= 0}
                                    onTable
                                />
                            </td>
                            : null
                    }
                    <td data-label={translate("#")}>{index + 1}</td>
                    <td data-label={translate("name")} className={`sticky ${branch._id === application.user?.branch?._id ? "blink" : ""}`}>
                        <Link to="#" className="bold">
                            <span className={`${(branch.days <= 15) && branch.days > 0 ? "text-warning" : branch.days > 15 ? "" : "text-error"}`}>
                                {text.reFormat(branch.name)} - ({number.format(branch.days)})
                            </span>
                        </Link>
                    </td>
                    <td data-label={translate("country")}>
                        {text.reFormat(branch.address?.country)}
                    </td>
                    <td data-label={translate("region")}>
                        {text.reFormat(branch.address?.region)}
                    </td>
                    <td data-label={translate("fee")} className="right-align">
                        {number.format(branch.fee)}
                    </td>
                    <td data-label={translate("phone number")}>
                        <a href={`tel:+${branch.phone_number}`} className="text-primary semibold">
                            +{branch.phone_number}
                        </a>
                    </td>
                    <td data-label={translate("email")}>
                        {
                            branch.email
                                ?
                                <a href={`mailto:${branch.email}`} className="lowercase semibold">
                                    {branch?.email}
                                </a>
                                : translate("n/a")
                        }
                    </td>
                    <td data-label={translate("website")}>
                        {
                            branch.email
                                ?
                                <a href={`${branch.website}`} className="lowercase semibold" target="blank">
                                    {branch?.website}
                                </a>
                                : translate("n/a")
                        }
                    </td>
                    <td data-label={translate("tin")} className="center">
                        {branch.tin ? formatTin(branch.tin) : translate("n/a")}
                    </td>
                    {
                        can("edit_branch") || can("view_branch") || can("change_branch_settings")
                            ?
                            <td className="sticky-right">
                                <div className="action-button">
                                    {
                                        can("download_branch_data")
                                            ?
                                            <ActionButton
                                                to="#"
                                                type="secondary"
                                                icon="download"
                                                tooltip="download data"
                                                onClick={() => downloadZippedData(branch)}
                                            />
                                            : null
                                    }
                                    {
                                        can("edit_branch") && branch.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/branch/form",
                                                    state: { branch: branch._id }
                                                }}
                                                type="primary"
                                                icon="edit_note"
                                                tooltip="edit"
                                            />
                                            : null
                                    }
                                    {
                                        can("view_branch")
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/branch/view",
                                                    state: { branch: branch._id }
                                                }}
                                                type="info"
                                                icon="visibility"
                                                tooltip="view"
                                            />
                                            : null
                                    }
                                    {
                                        can("change_branch_settings") && branch.visible
                                            ?
                                            <ActionButton
                                                to={{
                                                    pathname: "/branch/settings",
                                                    state: { branch: branch._id }
                                                }}
                                                type="success"
                                                icon="settings"
                                                tooltip="settings"
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
    }, [application.state.ids, application.state.branches])

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
                        (application.state.ids.length >= 1) && (can("restore_deleted") || can("delete_branch"))
                            ?
                            <>
                                {
                                    can("delete_branch") && (application.state.condition !== "deleted")
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
                                {
                                    can("restore_deleted") && (application.state.condition === "deleted")
                                        ?
                                        <ActionButton
                                            to="#"
                                            type="warning"
                                            icon="restore_from_trash"
                                            tooltip="restore"
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
                                    (can("delete_branch") || can("restore_deleted"))
                                        ?
                                        <th>
                                            <Checkbox
                                                onChange={() => application.selectList()}
                                                checked={(application.state.ids.length > 0) && (application.state.branches.length === application.state.ids.length)}
                                                onTable
                                            />
                                        </th>
                                        : null
                                }
                                <th>#</th>
                                <th className="sticky"> {translate("name")} </th>
                                <th>{translate("country")}</th>
                                <th>{translate("region")}</th>
                                <th className="right-align"> {translate("fee")} </th>
                                <th > {translate("phone number")} </th>
                                <th>{translate("email")}</th>
                                <th>{translate("website")}</th>
                                <th className="center"> {translate("tin")} </th>
                                {
                                    can("edit_branch") || can("view_branch") || can("change_branch_settings")
                                        ?
                                        <th className="center sticky-right"> {translate("options")} </th>
                                        : null
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {renderList()}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="text-primary bold" colSpan={(can("delete_branch") || can("restore_deleted")) ? 5 : 4}>{translate("monthly fee")}</td>
                                <td className="right-align bold">
                                    {
                                        number.format(
                                            application.state.branches.map((branch: any) => branch.fee).reduce((a: number, b: number) => a + b, 0)
                                        )
                                    }
                                </td>
                                <td colSpan={5}></td>
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
                can("create_branch")
                    ?
                    <FloatingButton to="/branch/form" tooltip="new branch" />
                    : null
            }
        </>
    )

})

// export component
export default BranchList