import React from "react"
import { createOrUpdate, readOrDelete, routerProps, serverResponse } from "../../../types"
import { can } from "../../../helpers/permissions"
import { Button, FloatingButton } from "../../../components/button"
import { ApplicationContext } from "../../../context"
import { apiV1, attractionCategories, commonCondition, noAccess, pageNotFound, setPageTitle, text } from "../../../helpers"
import { CardTitle } from "../../../components/card"
import { array, string } from "fast-web-kit"
import { Checkbox, Datalist, Input, Option, Select } from "../../../components/form"
import regions from "../../../helpers/regions"
import { Link } from "react-router-dom"
import translate from "../../../helpers/translator"
import Modal from "../../../components/modal"

// attraction form memorized functional component
const AttractionForm: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {
        onMount()
        return () => application.unMount()
        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            if (can("create_attraction") || can("edit_attraction")) {

                setPageTitle("new attraction")
                application.dispatch({ collection: "hotels" })

                if (props.location.state) {

                    const { attraction }: any = props.location.state

                    if (attraction) {
                        // backend data for fetching attraction data
                        const joinForeignKeys: boolean = false
                        const select: string = JSON.stringify({})
                        const condition: string = JSON.stringify({ _id: attraction })

                        // parameter
                        const parameters: string = `schema=attraction&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`

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

                            // attraction data
                            const attractionData = response.message

                            // updating page title
                            setPageTitle("edit attraction")

                            // updating state
                            application.dispatch({
                                edit: true,
                                id: attractionData._id,
                                ids: attractionData.hotels,
                                attractionCategory: attractionData.category,
                                attractionName: text.reFormat(attractionData.name),
                                region: text.reFormat(attractionData.address?.region),
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

            if (string.isEmpty(application.state.attractionName)) {
                errors.push("")
                application.dispatch({ attractionNameError: "required" })
            }

            if (string.isEmpty(application.state.attractionCategory)) {
                errors.push("")
                application.dispatch({ attractionCategoryError: "required" })
            }

            if (string.isEmpty(application.state.region)) {
                errors.push("")
                application.dispatch({ regionError: "required" })
            }

            if (array.isEmpty(application.state.ids)) {
                errors.push("")
                application.dispatch({ notification: "please select atleast on near by hotel" })
            }

            if (array.isEmpty(errors)) {

                const createOrUpdate = application.state.edit ? application.onUpdate : application.onCreate
                const attraction = {
                    ...createOrUpdate,
                    hotels: application.state.ids,
                    name: text.format(application.state.attractionName),
                    category: text.format(application.state.attractionCategory),
                    address: {
                        region: text.format(application.state.region),
                    }
                }

                const options: createOrUpdate = {
                    loading: true,
                    method: application.state.edit ? "PUT" : "POST",
                    route: apiV1 + (application.state.edit ? "update" : "create"),
                    body: {
                        schema: "attraction",
                        documentData: attraction,
                        condition: application.condition,
                        newDocumentData: { $set: attraction }
                    }
                }

                const response: serverResponse = await application.createOrUpdate(options)

                if (response.message) {
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

    // rendering categories
    const renderList = React.useCallback(() => {
        try {

            return array.sort(attractionCategories, "asc").map((data: string, index: number) => (
                <Option value={text.format(data)} label={data} key={index} />
            ))

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [attractionCategories])

    // rendering regions
    const renderRegions = React.useCallback(() => {
        try {
            return regions.sort().map((region: string) => (
                <Option key={region} value={(text.reFormat(region))} label={region} />
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [regions])

    const fetchHotels = async (): Promise<void> => {
        try {
            const joinForeignKeys: boolean = false
            const sortAndSelect: string = JSON.stringify({ name: 1, "address.region": 1 })
            const condition: string = JSON.stringify({ ...commonCondition(true) })
            const parameters: string = `schema=hotel&condition=${condition}&select=${sortAndSelect}&sort=${sortAndSelect}&joinForeignKeys=${joinForeignKeys}`
            const options: readOrDelete = {
                parameters,
                loading: true,
                method: "GET",
                disabled: false,
                route: apiV1 + "list-all"
            }
            const response: serverResponse = await application.readOrDelete(options)

            if (response.success) {
                application.dispatch({ hotels: response.message })
                application.toggleComponent("modal")
            }
            else
                application.dispatch({ notification: response.message })

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderHotels = React.useCallback(() => {
        try {
            return application.state.hotels.map((hotel: any, index: number) => (
                <tr key={index} onClick={() => application.selectList(hotel._id)}>
                    <td data-label={translate("select")}>
                        <Checkbox
                            onChange={() => application.selectList(hotel._id)}
                            checked={application.state.ids.indexOf(hotel._id) >= 0}
                            onTable
                        />
                    </td>
                    <td>{index + 1}</td>
                    <td>{text.reFormat(hotel.name)}</td>
                    <td>{text.reFormat(hotel.address.region)}</td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.ids, application.state.hotels])

    return (
        <>
            <div className="row">
                <div className="col s12 m10 l6 offset-m1 offset-l3">
                    <div className="card">
                        <CardTitle title={`${application.state.edit ? "edit" : "new"} tourism attraction`} />
                        <div className="card-content">
                            <form action="#" onSubmit={validateForm}>
                                <div className="row">
                                    <div className="col s12">
                                        <Input
                                            type="text"
                                            label="name"
                                            name="attractionName"
                                            placeholder="enter name"
                                            value={application.state.attractionName}
                                            error={application.state.attractionNameError}
                                            onChange={application.handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Select
                                            name="attractionCategory"
                                            label="category"
                                            onChange={application.handleInputChange}
                                            value={application.state.attractionCategory}
                                            error={application.state.attractionCategoryError}
                                        >
                                            <Option label={"select attraction category"} value={""} />
                                            {renderList()}
                                        </Select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12">
                                        <Datalist
                                            type="text"
                                            name="region"
                                            list="regions"
                                            label="region"
                                            placeholder="Enter region"
                                            value={application.state.region}
                                            error={application.state.regionError}
                                            onChange={application.handleInputChange}
                                            onKeyUp={() => application.dispatch({ ids: [], hotels: [] })}
                                        >
                                            <Option value="" label={"Enter region"} />
                                            {renderRegions()}
                                        </Datalist>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s12 right-align">
                                        <Link to="#" className="text-primary" onClick={fetchHotels} >
                                            {translate(`${!array.isEmpty(application.state.ids) ? "add or view" : "add"} near by hotels`)}
                                        </Link>
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
            <Modal
                buttonTitle="continue"
                title="select near by hotels"
                toggleComponent={application.toggleComponent}
                buttonAction={() => application.toggleComponent("modal")}
            >
                <table>
                    <thead>
                        <tr onClick={() => application.selectList()}>
                            <th>
                                <Checkbox
                                    onChange={() => application.selectList()}
                                    checked={(application.state.ids.length > 0) && (application.state.hotels.length === application.state.ids.length)}
                                    onTable
                                />
                            </th>
                            <th>#</th>
                            <th>{translate("name")}</th>
                            <th>{translate("place")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderHotels()}
                    </tbody>
                </table>
            </Modal>
            {
                can("list_attraction")
                    ?
                    <FloatingButton
                        icon="list_alt"
                        to="/attraction/list"
                        tooltip="list attractions"
                    />
                    : null
            }
        </>
    )

})

export default AttractionForm