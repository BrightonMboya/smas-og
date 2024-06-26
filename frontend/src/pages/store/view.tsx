// dependencies
import React from "react"
import { Link } from "react-router-dom"
import { FloatingButton } from "../../components/button"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import ViewDetail from "../../components/view-detail"
import { Icon } from "../../components/elements"
import Modal from "../../components/modal"
import { Checkbox } from "../../components/form"

// store view memorized function component
const StoreView: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        if (can("view_store")) {
            if (props.location.state) {
                const { store }: any = props.location.state
                if (store) {
                    setPageTitle("view store")
                    application.dispatch({
                        collection: "stores",
                        schema: "store",
                        ids: [store]
                    })
                    onMount(store)
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
        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(_id: string): Promise<void> {
        try {

            // parameters, condition, select and foreign key joining
            const condition: string = JSON.stringify({ _id })
            const select: string = JSON.stringify({})
            const joinForeignKeys: boolean = true
            const parameters: string = `schema=store&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

            // request options
            const options: readOrDelete = {
                route: apiV1 + "read",
                method: "GET",
                loading: true,
                disabled: false,
                parameters
            }

            // api request
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success)
                application.dispatch({ store: response.message })
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const getBranches = async (): Promise<void> => {
        try {
            const sortAndSelect = { name: 1 }
            const sort: string = JSON.stringify(sortAndSelect)
            const select: string = JSON.stringify(sortAndSelect)
            const condition: string = JSON.stringify(commonCondition())
            const parameters: string = `schema=branch&condition=${condition}&select=${select}&sort=${sort}&joinForeignKeys=`
            const options: readOrDelete = {
                parameters,
                method: "GET",
                loading: true,
                disabled: false,
                route: apiV1 + "list-all"
            }
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success) {
                application.toggleComponent("modal")
                application.dispatch({ branches: response.message })
                application.dispatch({ list: application.state.store?.branches ? application.state.store.branches : [] })
            }
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const selectBranch = (id?: string): void => {
        try {

            if (id) {
                const idIndex: number = application.state.list.indexOf(id)

                if (idIndex >= 0)
                    application.dispatch({ list: application.state.list.filter((branchId: string) => branchId !== id) })
                else
                    application.dispatch({ list: [...application.state.list, id] })

            }
            else {
                if ((application.state.list.length > 0) && (application.state.list.length === application.state.branches.length))
                    application.dispatch({ list: [] })
                else {
                    application.dispatch({ list: application.state.branches.map((branch: any) => branch._id) })
                }
            }

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // rendering branches
    const renderBranches = React.useCallback(() => {
        try {
            return application.state.branches.map((branch: any, index: number) => (
                <tr key={branch._id} onClick={() => selectBranch(branch._id)}>
                    <td data-label={translate("select")}>
                        <Checkbox
                            onChange={() => selectBranch(branch._id)}
                            checked={application.state.list.indexOf(branch._id) >= 0}
                            onTable
                        />
                    </td>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("name")} >{text.reFormat(branch.name)}</td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.branches, application.state.list])

    const changeBranchAccess = async (): Promise<void> => {
        try {

            const options: createOrUpdate = {
                loading: true,
                method: "PUT",
                route: apiV1 + "update",
                body: {
                    schema: "store",
                    condition: { _id: application.state.store._id },
                    newDocumentData: {
                        $set: { branches: application.state.list }
                    }
                }
            }

            const response: serverResponse = await application.createOrUpdate(options)

            if (response.success) {
                application.toggleComponent("modal")
                application.dispatch({
                    list: [],
                    branches: [],
                    notification: "Branch access has been changed"
                })
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
                <div className="col s12 m5 l4">
                    <div className="view">
                        <div className="view-profile">
                            <div className="view-initials">
                                {text.abbreviate(application.state[application.state.schema]?.name)}
                            </div>
                            <div className="view-title">
                                <span>
                                    {text.reFormat(application.state[application.state.schema]?.name)}
                                </span>
                            </div>
                        </div>
                        <div className="view-items">
                            {
                                application.state[application.state.schema]?.visible && (can("edit_store") || can("delete_store") || can("list_user"))
                                    ?
                                    <>
                                        {
                                            can("list_store_product")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/store/product-list`,
                                                        state: { propsCondition: { store: application.state[application.state.schema]?._id } }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <i className="material-icons-round">chevron_right</i>
                                                    <div className="title">{translate("list store products")}</div>
                                                </Link>
                                                : null
                                        }
                                        <Link
                                            to="#"
                                            className="view-item"
                                            onClick={getBranches}
                                        >
                                            <Icon name="warning" type="rounded text-warning" />
                                            <div className="title">{translate("change branch access")}</div>
                                        </Link>
                                        {
                                            can("edit_store")
                                                ?
                                                <Link
                                                    to={{
                                                        pathname: `/store/form`,
                                                        state: { store: application.state[application.state.schema]._id }
                                                    }}
                                                    className="view-item"
                                                >
                                                    <i className="material-icons-round text-success">edit_note</i>
                                                    <div className="title">{translate("edit")}</div>
                                                </Link>
                                                : null
                                        }
                                        {
                                            can("delete_store")
                                                ?
                                                <Link
                                                    to="#"
                                                    className="view-item"
                                                    onClick={() => application.openDialog("deleted")}
                                                >
                                                    <i className="material-icons-round text-error">delete</i>
                                                    <div className="title">{translate("delete")}</div>
                                                </Link>
                                                : null
                                        }
                                    </>
                                    : !application.state[application.state.schema]?.visible && can("restore_deleted")
                                        ?
                                        <Link
                                            to="#"
                                            className="view-item"
                                            onClick={() => application.openDialog("restored")}
                                        >
                                            <i className="material-icons-round text-warning">restore_from_trash</i>
                                            <div className="title">{translate("restore")}</div>
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
                                <span>{translate(`${text.reFormat(application.state.schema)} information`)}</span>
                            </div>
                        </div>
                        <div className="view-items">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <Link to={can("view_user") && application.state[application.state.schema]?.user ? {
                                        pathname: "/user/view",
                                        state: { user: application.state[application.state.schema]?.user?._id }
                                    } : "#"}>
                                        <div className="view-detail">
                                            <div className="label">
                                                {translate("user")}:
                                            </div>
                                            <div className="title text-primary bold">
                                                {text.reFormat(application.state[application.state.schema]?.user?.username)}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                                <div className="col s12 m6 l6">
                                    <div className="view-detail">
                                        <div className="label">
                                            {translate("status")}:
                                        </div>
                                        <div className={`title ${!application.state[application.state.schema]?.visible ? "text-error" : "text-success"}`}>
                                            {translate(!application.state[application.state.schema]?.visible ? "deleted" : "active")}
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
                can("list_store")
                    ? <FloatingButton to="/store/list" tooltip="list stores" icon="list_alt" />
                    : null
            }

            <Modal
                buttonTitle="change access"
                title="change store branch access"
                buttonAction={changeBranchAccess}
                toggleComponent={application.toggleComponent}
            >
                <table>
                    <thead>
                        <tr>
                            <th>
                                <Checkbox
                                    onChange={() => selectBranch()}
                                    checked={(application.state.list.length > 0) && (application.state.list.length === application.state.branches.length)}
                                    onTable
                                />
                            </th>
                            <th>#</th>
                            <th>{translate("name")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderBranches()}
                    </tbody>
                </table>
            </Modal>
        </>
    )

})

// export component
export default StoreView