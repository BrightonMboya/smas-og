import React from "react"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../../../types"
import { ApplicationContext } from "../../../../context"
import { can } from "../../../../helpers/permissions"
import { apiV1, noAccess, pageNotFound, setPageTitle, text, number } from "../../../../helpers"
import { Button, FloatingButton } from "../../../../components/button"
import { CardTitle } from "../../../../components/card"
import { array, string } from "fast-web-kit"
import { Input } from "../../../../components/form"
import NumberComponent from "../../../../components/reusable/number-component"
import DataListComponent from "../../../../components/reusable/datalist"
import { Link } from "react-router-dom"
import translate from "../../../../helpers/translator"
import Modal from "../../../../components/modal"

// item form memorized function component
const ItemForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {
            if (can("create_item") || can("edit_item")) {

                setPageTitle("new item")

                if (props.location.state) {

                    const { item }: any = props.location.state

                    if (item) {
                        // backend data for fetching item data
                        const joinForeignKeys: boolean = true
                        const select: string = JSON.stringify({})
                        const condition: string = JSON.stringify({ _id: item })

                        // parameter
                        const parameters: string = `schema=item&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

                        // request options
                        const options: readOrDelete = {
                            parameters,
                            method: "GET",
                            loading: true,
                            disabled: false,
                            route: apiV1 + "read"
                        }

                        // api request
                        const response: serverResponse = await application.readOrDelete(options)

                        if (response.success) {

                            // item data
                            const itemData = response.message

                            // updating page title
                            setPageTitle("edit item")

                            // updating state
                            application.dispatch({
                                edit: true,
                                id: itemData._id,
                                attractions: [itemData.attraction],
                                name: text.reFormat(itemData.name),
                                attractionId: itemData.attraction._id,
                                expatriatePrice: itemData.prices.expatriate.toString(),
                                attractionName: text.reFormat(itemData.attraction.name),
                                eastAfricaPrice: itemData.prices.east_africa.toString(),
                                nonResidentPrice: itemData.prices.non_resident.toString(),
                            })

                        }
                        else
                            application.dispatch({ notification: response.message })
                    }
                }
            }
            else {
                props.history.push(pageNotFound)
                application.dispatch({ notification: noAccess })
            }
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const validateForm = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            event.preventDefault()
            const errors: string[] = []
            const expatriate = number.reFormat(application.state.expatriatePrice) || 0
            const east_africa = number.reFormat(application.state.eastAfricaPrice) || 0
            const non_resident = number.reFormat(application.state.nonResidentPrice) || 0

            if (string.isEmpty(application.state.attractionName)) {
                errors.push("")
                application.dispatch({ attractionNameError: "required" })
            }
            else if (string.isEmpty(application.state.attractionId)) {
                errors.push("")
                application.dispatch({ attractionNameError: "attraction does not exist" })
            }

            if (string.isEmpty(application.state.name)) {
                errors.push("")
                application.dispatch({ nameError: "required" })
            }

            // if (string.isEmpty(application.state.expatriatePrice)) {
            //     errors.push("")
            //     application.dispatch({ expatriatePriceError: "required" })
            // }
            // else
            if (expatriate < 0) {
                errors.push("")
                application.dispatch({ expatriatePriceError: "can't be less than 0" })
            }

            if (east_africa < 0) {
                errors.push("")
                application.dispatch({ eastAfricaPriceError: "can't be less than 0" })
            }

            if (non_resident < 0) {
                errors.push("")
                application.dispatch({ nonResidentPriceError: "can't be less than 0" })
            }

            if (array.isEmpty(errors)) {

                const createOrUpdate = application.state.edit ? application.onUpdate : application.onCreate
                const item = {
                    ...createOrUpdate,
                    name: text.format(application.state.name),
                    attraction: application.state.attractionId,
                    prices: { expatriate, east_africa, non_resident },
                }
                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "item",
                        documentData: item,
                        newDocumentData: { $set: item },
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

    const importFromExcel = async(): Promise<void> => {
        try {

            const errors: string [] = []

            if (string.isEmpty(application.state.attractionName)) {
                errors.push("")
                application.dispatch({ attractionNameError: "required"})
            }
            else if (string.isEmpty(application.state.attractionId)) {
                errors.push("")
                application.dispatch({ attractionNameError: "attraction does not exist"})
            }

            if (array.isEmpty(application.state.list)) {
                errors.push("")
                application.dispatch({ filesError: "required"})
            }

            if (array.isEmpty(errors)) {

                const invalidItems: any[] = []
                const validItems: any [] = []

                for (const item of application.state.list) {

                    const {
                        NAME,
                        EXPATRIATE,
                        'EAST AFRICAN': EASTAFRICA,
                        'NON RESIDENT': NONRESIDENT
                    } = item

                    if (string.isEmpty(NAME)) {
                        invalidItems.push({ ...item, ERROR: "NAME is required" })
                    }
                    else {
                        validItems.push({
                            schema: "item",
                            documentData: {
                                name: text.format(NAME),
                                ...application.onCreate,
                                attraction: application.state.attractionId,
                                prices: {
                                    expatriate: Number(EXPATRIATE) || 0,
                                    east_africa: Number(EASTAFRICA) || 0,
                                    non_resident: Number(NONRESIDENT) || 0,
                                }
                            }
                        })
                    }
                }

                if (array.isEmpty(invalidItems)) {

                    const options: createOrUpdate = {
                        loading: true,
                        method: "POST",
                        body: validItems,
                        route: apiV1 + "bulk-create",
                    }

                    const response: serverResponse = await application.createOrUpdate(options)

                    if (response.success) {

                        const { passedQueries, failedQueries } = response.message
                        const passedLength = passedQueries.length
                        const failedLength = failedQueries.length

                        if (array.isEmpty(failedQueries)) {
                            application.dispatch({
                                list: [],
                                notification: `${passedLength} item${passedLength > 1 ? "s have " : " has"} been created`,
                            })
                        }
                        else {
                            application.dispatch({
                                list: [],
                                notification: `${passedLength} item${passedLength > 1 ? "s have " : " has"} been created and ${failedLength} item${failedLength > 1 ? "s have " : " has"} failed`,
                            })
                            application.arrayToExcel(failedQueries, "item failed to import")
                        }

                        application.toggleComponent("modal")

                    }
                    else
                        application.dispatch({ notification: response.message})

                }
                else  {
                    application.arrayToExcel(invalidItems, "items import error")
                }

            }


        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    return (
        <>
            <div className="row">
                <div className="col s12 m10 l8 offset-m1 offset-l2">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} attraction item`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <DataListComponent for="attraction" />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <Input
                                            label="name"
                                            type="text"
                                            name="name"
                                            placeholder="enter name"
                                            value={application.state.name}
                                            error={application.state.nameError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="expatriatePrice"
                                            label="expatriate Price"
                                            placeholder="enter expatriate Price"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="eastAfricaPrice"
                                            label="east africa Price"
                                            placeholder="enter east africa Price"
                                        />
                                    </div>
                                    <div className="col s12 m6 l6">
                                        <NumberComponent
                                            name="nonResidentPrice"
                                            label="non Resident Price"
                                            placeholder="enter non Resident Price"
                                        />
                                    </div>
                                </div>
                                {
                                    !application.state.edit
                                        ?
                                        <div className="row">
                                            <div className="col s12 right-align">
                                                <Link to="#" className="text-primary" onClick={() => application.toggleComponent("modal")} >
                                                    {translate("import items from excel")}
                                                </Link>
                                            </div>
                                        </div>
                                        : null
                                }
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
            <Modal
                buttonTitle="import"
                title="import attraction items from excel"
                buttonAction={importFromExcel}
                toggleComponent={application.toggleComponent}
            >
                <form action="#">
                    <div className="row">
                        <div className="col s12">
                            <DataListComponent for="attraction" />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col s12">
                            <Input
                                type="file"
                                name="files"
                                label="choose file"
                                error={application.state.filesError}
                                onChange={application.handleFileChange}
                            />
                        </div>
                    </div>
                </form>
            </Modal>
            {
                can("list_item")
                    ?
                    <FloatingButton
                        icon="list_alt"
                        tooltip="list items"
                        to="/attraction/item-list"
                    />
                    : null
            }
        </>
    )
})

export default ItemForm