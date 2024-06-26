// dependencies
import React from "react"
import { Button, FloatingButton } from "../../components/button"
import { CardTitle } from "../../components/card"
import { Input } from "../../components/form"
import { apiV1, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../helpers"
import { can } from "../../helpers/permissions"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../types"
import { ApplicationContext } from "../../context"
import { array, string } from "fast-web-kit"
import CustomDatalist from "../../components/datalist"

// store form memorized function component
const StoreForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // checking permission
        if (can("create_store") || can("edit_store")) {
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
            setPageTitle("new store")
            if (props.location.state) {
                const { store }: any = props.location.state
                if (store) {

                    const joinForeignKeys: boolean = true
                    const select: string = JSON.stringify({})
                    const condition: string = JSON.stringify({ _id: store })
                    const parameters: string = `schema=store&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
                    const options: readOrDelete = {
                        parameters,
                        method: "GET",
                        loading: true,
                        disabled: false,
                        route: apiV1 + "read"
                    }
                    const response: serverResponse = await application.readOrDelete(options)

                    if (response.success) {
                        setPageTitle("edit store")
                        const store = response.message
                        application.dispatch({
                            edit: true,
                            id: store._id,
                            users: [store.user],
                            userId: store.user._id,
                            branches: [store.branch],
                            branchId: store.branch._id,
                            name: text.reFormat(store.name),
                            userName: `${text.reFormat(store.user.username)} - ${store.user.phone_number}`,
                            branchName: `${text.reFormat(store.branch.name)} - ${store.branch.phone_number}`,
                        })
                    }
                    else
                        application.dispatch({ notification: response.message })

                }
                else
                    setPageTitle("new store")
            }
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    // validate form
    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            event.preventDefault()
            const errors: string[] = []

            if (string.isEmpty(application.state.name)) {
                errors.push("")
                application.dispatch({ nameError: "required" })
            }

            if (string.isEmpty(application.state.branchName)) {
                errors.push("")
                application.dispatch({ branchNameError: "required" })
            }
            else if (string.isEmpty(application.state.branchId)) {
                errors.push("")
                application.dispatch({ branchNameError: "branch does not exist" })
            }

            if (string.isEmpty(application.state.userName)) {
                errors.push("")
                application.dispatch({ userNameError: "required" })
            }
            else if (string.isEmpty(application.state.userId)) {
                errors.push("")
                application.dispatch({ userNameError: "user does not exist" })
            }

            if (array.isEmpty(errors) && string.isEmpty(application.state.nameError)) {

                const creatorOrModifier = application.state.edit ? application.onUpdate : application.onCreate
                const store = {
                    ...creatorOrModifier,
                    user: application.state.userId,
                    branch: application.state.branchId,
                    name: text.format(application.state.name),
                }
                const options: createOrUpdate = {
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    method: application.state.edit ? "PUT" : "POST",
                    loading: true,
                    body: {
                        schema: "store",
                        documentData: store,
                        newDocumentData: { $set: store },
                        condition: application.condition,
                    }
                }
                const response: serverResponse = await application.createOrUpdate(options)

                if (response.success) {
                    application.unMount()
                    application.dispatch({ notification: application.successMessage })
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
                <div className="col s12 m8 l6 offset-l3 offfset-m2">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} store`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            label="name"
                                            type="text"
                                            name="name"
                                            value={application.state.name}
                                            error={application.state.nameError}
                                            onChange={application.handleInputChange}
                                            placeholder="Enter name"
                                            onKeyUp={() => application.validate({
                                                schema: "store",
                                                errorKey: "nameError",
                                                condition: { ...commonCondition(true), name: text.format(application.state.name).toLowerCase() }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <CustomDatalist
                                            sort="name"
                                            list="branches"
                                            nameId="branchId"
                                            name="branchName"
                                            label="branch"
                                            placeholder="enter branch"
                                            nameError="branchNameError"
                                            fields={["name", "phone_number"]}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <CustomDatalist
                                            sort="username"
                                            list="users"
                                            nameId="userId"
                                            name="userName"
                                            label="user"
                                            placeholder="enter user"
                                            nameError="userNameError"
                                            fields={["username", "phone_number"]}
                                        />
                                    </div>
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
                can("list_store")
                    ? <FloatingButton to="/store/list" tooltip="list stores" icon="list_alt" />
                    : null
            }
        </>
    )

})

export default StoreForm