/* requiring dependencies */
import React from "react"
import * as XLSX from "xlsx"
import FileSaver from "file-saver"
import { backendStatus, createOrUpdate, datalistSearch, dispatch, mount, readOrDelete, sendMessage, serverResponse, stateKey, uploadFile, validation } from "../types"
import { apiV1, commonCondition, decrypt, encrypt, has_enable_encryption, paymentTypes, serverURL, storage, text, getInfo, truckStatus, deviceTypes } from "."
import getBackendCondition from "./backendCondition"
import { can } from "./permissions"
import pluralize from "pluralize"
import state from "../hooks/state"
import { string } from "fast-web-kit"
import { accountFilters, adjustmentFilters, purchaseFilters, transactionFilters } from "./filters"

/* creating application global variables */
class Application {

    // variable type definition
    public state: state
    public dispatch: dispatch
    private serverURL: string
    public headers: HeadersInit
    public user: any
    public onUpdate: { updated_by: string | null }
    public onCreate: { created_by: string | null, branch: string | null }
    public condition: { _id: string }
    public successMessage: string
    public loading: boolean
    public buttonTitle: "update" | "create"

    // constructor
    constructor(state: state, dispatch: dispatch) {
        this.state = state
        this.dispatch = dispatch
        this.serverURL = serverURL
        this.user = getInfo("user")
        this.headers = {
            "Content-Type": "application/json",
            "token": this.user ? encrypt(this.user._id).payload : ""
        }
        this.condition = { _id: this.state.id }
        this.onUpdate = this.user ? { updated_by: this.user._id } : { updated_by: null }
        this.onCreate = this.user ? { created_by: this.user._id, branch: this.user.branch ? this.user.branch._id : null } : { created_by: null, branch: null }
        this.successMessage = this.state.edit ? "updated successfully" : "created successfully"
        this.loading = this.user?.settings?.system_loading === "no" ? false : this.state.loading || true
        this.buttonTitle = this.state.edit ? "update" : "create"
    }

    // function for handling application input change
    public handleInputChange = (event: React.ChangeEvent<HTMLElement>): void => {
        try {

            // get HTML element name and value from event target
            const { name, value }: any = event.target

            // update application state
            this.dispatch({ [name]: value })

        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    // function for POST (creating) and PUT (updating) resource(s) to the server
    public createOrUpdate = async (options: createOrUpdate): Promise<serverResponse> => {
        try {

            // enable loading if necessary
            this.dispatch({ loading: options.loading })

            // make a post or put request to the server
            const response: any = await (await fetch(`${this.serverURL}/${options.route}`, {
                method: options.method,
                mode: "cors",
                body: JSON.stringify(has_enable_encryption ? encrypt(options.body) : options.body),
                headers: this.headers
            })).json()

            // disable loading
            this.dispatch({ loading: false })

            if (has_enable_encryption)
                return decrypt(response)

            // returning response
            return response

        } catch (error) {

            // disable loading
            this.dispatch({ loading: false })
            return { success: false, message: (error as Error).message }

        }
    }

    // function for GET (reading) and DELETE (deleting) resource(s) to the server
    public readOrDelete = async (options: readOrDelete): Promise<serverResponse> => {
        try {

            // enable loading if necessary
            this.dispatch({ loading: options.loading })
            this.dispatch({ disabled: options.disabled ? true : false })

            // make a get or delete request to the server
            let response = await (await fetch(`${this.serverURL}/${options.route}?${has_enable_encryption ? `payload=${encrypt(options.parameters).payload}` : options.parameters}`, {
                method: options.method,
                mode: "cors",
                headers: this.headers
            })).json()

            // disable loading
            this.dispatch({ loading: false })
            this.dispatch({ disabled: false })

            // returning response
            if (has_enable_encryption) {
                response = decrypt(response)
                if (response.success && (options.method === "GET")) {
                    // this.dispatch({ [options]})
                }
            }

            return response

        } catch (error) {

            // disable loading
            this.dispatch({ loading: false })
            this.dispatch({ disabled: false })

            return { success: false, message: (error as Error).message }

        }
    }

    // uploading file
    public uploadFile = async (options: uploadFile): Promise<void> => {
        try {

            this.dispatch({ loading: true })
            this.dispatch({ notification: "Uploading file" })

            const formData = new FormData()
            formData.append("file", this.state.file)
            formData.append("body", JSON.stringify({ folderName: options }))

            const response: serverResponse = await (await fetch(`${this.serverURL}/${apiV1}upload-file`, {
                method: "POST",
                mode: "cors",
                body: formData,
                headers: { "token": this.user ? encrypt(this.user._id).payload : "" }
            })).json()


            if (response.success)
                this.dispatch({ notification: "File has been uploaded" })
            else
                this.dispatch({ notification: "Failed to upload file" })

            this.dispatch({ loading: false })

        } catch (error) {
            this.dispatch({ loading: false })
            this.dispatch({ disabled: false })
        }
    }

    // user authentication login and logout
    public authenticate = (action: "login" | "logout", data?: any) => {
        try {

            // checking authentication action
            if (action === 'login' && data) {

                // storing user data in local storage
                storage.store("user", data)

                // updating authenticated state to true
                this.dispatch({ authenticated: true })
                if (can("view_dashboard"))
                    window.location.href = "/"
                else
                    window.location.href = "/profile/view"
                // this.dispatch({  notification: {  notification: "You have been logged in" } })
            }
            else {
                storage.remove("user")
                this.dispatch({ authenticated: false })
                window.location.href = "/"
                // this.dispatch({  notification: {  notification: "You have been logged out" } })
            }

        } catch (error) {

            // remove user from local storage
            storage.remove("user")
            this.dispatch({ notification: (error as Error).message })

        }
    }

    // function for retrieving user from local storage and authenticating
    public retrieveUserAndAuthenticate = async (): Promise<void> => {
        try {

            // retrieving user
            const user = storage.retrieve("user")
            const language = storage.retrieve("language")

            // verifying user data exist in local storage
            if (user) {
                this.dispatch({ authenticated: true })
                // updating authenticated state to true
                const joinForeignKeys: boolean = true
                const select: string = JSON.stringify({})
                storage.store("language", user.settings.language)
                const condition: string = JSON.stringify({ _id: user._id, visible: true })
                const options: readOrDelete = {
                    method: "GET",
                    loading: false,
                    disabled: false,
                    route: apiV1 + "read",
                    parameters: `schema=user&condition=${condition}&select=${select}&joinForeignKeys=${joinForeignKeys}`
                }

                const response = await this.readOrDelete(options)

                if (response.success) {
                    storage.store("user", response.message)
                    storage.store("language", response.message?.settings.language)
                }
                else {
                    localStorage.clear()
                    window.location.reload()
                }

            }

            else {
                // updating authenticated state to false
                this.dispatch({ authenticated: false })
                if (!language)
                    storage.store("language", "english")
            }

        } catch (error) {

            // updating authenticated state to false
            this.dispatch({ authenticated: false })
            this.dispatch({ notification: (error as Error).message })

        }
    }

    // function for opening and closing sidebar
    public toggleSidebar = (): void => {
        try {
            // getting body document element
            const body = document.querySelector("body")

            // checking wether body is available
            if (body) {

                // checking wether sidebar has toggle-sidebar class
                if (body.classList.contains("toggle-sidebar"))
                    // removing class ie: opening sidebar
                    body.classList.remove("toggle-sidebar")

                else
                    // adding class ie: closing sidebar
                    body.classList.add("toggle-sidebar")
            }

        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    // autoclose sidebar on medium screen and below
    public closeSidebar = (): void => {
        try {
            if (window.screen.availWidth <= 1199)
                this.toggleSidebar()
        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    // showing and hiding component
    public toggleComponent(name: "modal" | "dialog"): void {
        try {

            // select component
            const component: HTMLElement | null = document.querySelector(`.${name}`)

            // checking wether component is selected or not
            if (component)
                // toggle show component class
                component.classList.toggle("show")

        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    // component unmounting
    public unMount = (): void => this.dispatch({ unMount: { ...this.state } })

    // load component data on mounting
    public mount = async (options: mount): Promise<serverResponse> => {
        try {

            this.dispatch({ fields: options.fields })
            this.dispatch({ select: options.select })
            this.dispatch({ schema: options.schema })
            this.dispatch({ collection: options.collection })
            this.dispatch({ joinForeignKeys: options.joinForeignKeys })

            // make api request
            const response: serverResponse = await this.readOrDelete({
                route: options.route,
                loading: true,
                disabled: false,
                parameters: options.parameters,
                method: "GET"
            })

            if (response.success) {

                if (options.route === "api/list-all")
                    this.dispatch({ [options.collection]: response.message })
                else if (options.route === "api/list") {
                    this.dispatch({
                        sort: options.sort,
                        order: options.order,
                        condition: options.condition,
                        limit: response.message.limit,
                        page: response.message.currentPage,
                        nextPage: response.message.nextPage,
                        pages: response.message.totalDocuments,
                        previousPage: response.message.previousPage,
                        [options.collection]: response.message.documents
                    })

                    // pagination
                    this.pagination(response.message)
                }

                return response

            }

            this.dispatch({
                [options.schema]: null,
                [options.collection]: [],
                condition: options.condition,
                notification: response.message
            })

            return response

        } catch (error) {

            // return response
            return { success: false, message: (error as Error).message }

        }
    }

    // searching data to the server
    public searchData = async (event: React.ChangeEvent<HTMLFormElement>): Promise<void> => {
        try {

            // prevent form default submit
            event.preventDefault()

            // cheking wether keyword has been provided
            if (this.state.searchKeyword.trim() !== "") {

                // search deleted data
                const searchDeleted: object = this.state.condition === "deleted" ? { visible: false } : { visible: true }

                // parameters, condition and sort
                const condition: string = JSON.stringify({ ...commonCondition(true), ...this.state.propsCondition, ...searchDeleted })
                const sort: string = JSON.stringify({ createdAt: 1 })
                const select: string = JSON.stringify(this.state.select)
                const parameters: string = `schema=${this.state.schema}&keyword=${text.format(this.state.searchKeyword)}&condition=${condition}&sort=${sort}&select=${select}&joinForeignKeys=${JSON.stringify(this.state.joinForeignKeys)}&fields=${JSON.stringify(this.state.fields)}`

                // request options
                const options: readOrDelete = {
                    route: apiV1 + "search",
                    method: "GET",
                    parameters,
                    loading: true,
                    disabled: false
                }

                // making api request
                const response: serverResponse = await this.readOrDelete(options)

                // checking wether data have been found
                if (response.success) {
                    this.dispatch({ pageNumbers: [] })
                    this.dispatch({ [this.state.collection]: response.message })
                }
                else {
                    this.dispatch({ pageNumbers: [] })
                    this.dispatch({ [this.state.collection]: [] })
                    this.dispatch({ notification: response.message })
                }

                // this.dispatch({ ids: {  ids: [] } })

            }

        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    // filtering data to backend
    public filterData = async (condition: string, order: 1 | -1, sort: string, limit: number): Promise<void> => {
        try {


            if (
                (this.state.condition !== condition) ||
                (this.state.order !== order) ||
                (this.state.sort !== sort) ||
                (this.state.limit !== limit)
            ) {

                const sortKey = sort === "created time" ? "createdAt" : ["region", "location", "street"].includes(sort) ? `address.${sort}` : sort.replace(/ /g, "_")

                // parameters, condition and sort
                const backendSort: string = JSON.stringify({ [sortKey]: order })
                const backendCondition: string = JSON.stringify({ ...getBackendCondition(condition), ...this.state.propsCondition })
                const select: string = JSON.stringify(this.state.select)
                const parameters: string = `schema=${this.state.schema}&condition=${backendCondition}&sort=${backendSort}&page=${this.state.page}&limit=${limit}&select=${select}&joinForeignKeys=${JSON.stringify(this.state.joinForeignKeys)}`

                // request options
                const options: readOrDelete = {
                    route: `${apiV1}list`,
                    method: "GET",
                    loading: true,
                    disabled: false,
                    parameters
                }

                // making api request
                const response: serverResponse = await this.readOrDelete(options)

                if (response.success) {
                    this.dispatch({ sort: sort })
                    this.dispatch({ order: order })
                    this.dispatch({ condition: condition })
                    this.dispatch({ limit: limit })
                    this.dispatch({ page: response.message.currentPage })
                    this.dispatch({ nextPage: response.message.nextPage })
                    this.dispatch({ pages: response.message.totalDocuments })
                    this.dispatch({ previousPage: response.message.previousPage })
                    this.dispatch({ [this.state.collection]: response.message.documents })

                    // pagination
                    this.pagination(response.message)

                }
                else {
                    this.dispatch({ page: 1 })
                    this.dispatch({ pages: 1 })
                    this.dispatch({ limits: [] })
                    this.dispatch({ sort: sort })
                    this.dispatch({ nextPage: 0 })
                    this.dispatch({ order: order })
                    this.dispatch({ limit: limit })
                    this.dispatch({ previousPage: 0 })
                    this.dispatch({ pageNumbers: [] })
                    this.dispatch({ condition: condition })
                    this.dispatch({ [this.state.collection]: [] })
                    this.dispatch({ notification: response.message })
                }

                this.dispatch({ ids: [] })

            }
        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    // paginatint list
    private pagination = (data: any): void => {

        const { pages, limit, currentPage } = data

        // // counter to ensure we create only 10 pages pagination
        const screenWidth: number = window.screen.availWidth
        const screenLimit: number = screenWidth > 992 ? 10 : 5

        // // create page numbers according to screen size
        let pageNumbers: number[] = []

        if (((pages.length <= 10) && (screenLimit === 10)) || ((pages.length <= 5) && screenLimit === 5))
            pageNumbers = pages
        else {

            let counter: number = 0
            for (let index = currentPage; counter < screenLimit; index += 1) {
                if (pages.includes(index))
                    pageNumbers.push(index)
                counter += 1
            }

            if ((pageNumbers.length < 10) && (screenWidth > 992))
                pageNumbers = [...new Set([...this.state.pageNumbers, ...pageNumbers])]
            else if ((pageNumbers.length < 5) && (screenWidth <= 992))
                pageNumbers = [...new Set([...this.state.pageNumbers, ...pageNumbers])]

        }

        // // create limits
        let limits: number[] = []
        for (let index = 0; index <= 1000 /* (pages.length * limit) */; index += limit)
            limits.push(index)

        // // remove first element in limit, because it is 0
        limits.shift()

        limits = [...new Set([...this.state.limits, ...limits])]

        if (pageNumbers.length > 0)
            this.dispatch({ pageNumbers })
        else
            this.dispatch({ pageNumbers })

        if (limits.length > 0)
            this.dispatch({ limits })
        else
            this.dispatch({ limits })

    }

    // load new page (paginate)
    public paginateData = async (page: number): Promise<void> => {
        if ((page >= 1) && (this.state.page !== page)) {

            const sortKey = this.state.sort === "created time" ? "createdAt" : ["region", "location", "street"].includes(this.state.sort) ? `address.${this.state.sort}` : this.state.sort.replace(/ /g, "_")
            const backendSort: string = JSON.stringify({ [sortKey]: this.state.order })
            const backendCondition: string = JSON.stringify({ ...getBackendCondition(this.state.condition), ...this.state.propsCondition })
            const select: string = JSON.stringify(this.state.select)
            const joinForeignKeys: string = JSON.stringify(this.state.joinForeignKeys)
            const parameters: string = `schema=${this.state.schema}&condition=${backendCondition}&sort=${backendSort}&page=${page}&limit=${this.state.limit}&select=${select}&joinForeignKeys=${joinForeignKeys}`

            // request options
            const options: readOrDelete = {
                route: apiV1 + "list",
                method: "GET",
                loading: true,
                disabled: false,
                parameters
            }

            // making api request
            const response: serverResponse = await this.readOrDelete(options)

            if (response.success) {

                this.dispatch({ limit: response.message.limit })
                this.dispatch({ page: response.message.currentPage })
                this.dispatch({ nextPage: response.message.nextPage })
                this.dispatch({ pages: response.message.totalDocuments })
                this.dispatch({ previousPage: response.message.previousPage })
                this.dispatch({ [this.state.collection]: response.message.documents })

                // pagination
                this.pagination(response.message)

            }
            else
                this.dispatch({ notification: response.message })

            // this.dispatch({ ids:  ids: [] } })

        }
    }

    // table list selection
    public selectList = (id?: string): void => {
        try {

            // checking wether id has been provided
            if (id)
                // remove id
                if (this.state.ids.includes(id))
                    this.dispatch({ ids: this.state.ids.filter((listId: string) => listId !== id) })
                // add new id
                else
                    this.dispatch({ ids: [...this.state.ids, id] })
            else
                // deselect all
                if ((this.state.ids.length === this.state[this.state.collection].length) && (this.state.ids.length > 0))
                    this.dispatch({ ids: [] })

                // select all
                else
                    this.dispatch({ ids: this.state[this.state.collection].map((list: any) => list._id) })

        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    // opening dialog on button click
    public openDialog = async (backendStatus: backendStatus): Promise<void> => {
        try {
            // opening confirmation dialog
            this.toggleComponent("dialog")

            // update state vendor status
            this.dispatch({ backendStatus })

        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    // exporting excel file
    public arrayToExcel = (template: any[], fileName: string): void => {
        try {
            const workSheet = XLSX.utils.json_to_sheet(template)
            const workBook = { Sheets: { 'data': workSheet }, SheetNames: ['data'] }
            const excelBuffer = XLSX.write(workBook, { bookType: 'xlsx', type: 'array' })
            const excelData = new Blob([excelBuffer], { type: 'xlsx' })
            FileSaver.saveAs(excelData, `${this.user.branch?.name}_${text.format(fileName)}.xlsx`)
        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    // convert excel file to JSON
    public excelToArray = (file: any, callback?: any): void => {
        try {
            const fileReader = new FileReader()
            fileReader.onload = () => {
                const workbook = XLSX.read(fileReader.result, { type: "binary" })
                const workSheetName = workbook.SheetNames[0]
                const workSheet = workbook.Sheets[workSheetName]
                const list = XLSX.utils.sheet_to_json(workSheet)
                this.dispatch({ list })
                if (callback)
                    callback(list)
            }
            fileReader.readAsBinaryString(file)
        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    // get model sort and condition
    public getSortOrCondition = (type: "sort" | "condition"): string[] => {
        let initialConditions: string[] = can("list_deleted") && (this.state.collection !== "payments") ? [`deleted`, this.state.collection] : [this.state.collection]
        let initialSorts: string[] = ["created time"]
        let conditions: string[] = []
        let sorts: string[] = []
        const products = can("list_stolen_product") ? ["stolen"] : []
        const orders = this.state.pathname.includes("order") ? ["orders", "today orders"] : ["today proforma invoice", "proforma invoice"]

        switch (this.state.collection) {

            case "products":
                conditions = [...initialConditions, "almost out of stock", "out of stock", "in stock", ...products]
                sorts = [...initialSorts, "name", "selling price", "stock", "buying price"]
                break

            case "expense_types":
            case "stores":
                conditions = [...initialConditions]
                sorts = [...initialSorts, "name"]
                break

            case "expenses":
            case "freights":
            case "purchases":
                conditions = [...initialConditions, ...purchaseFilters]
                sorts = [...initialSorts, "total amount", "paid amount", "date"]
                break

            case "customers":
                conditions = [...initialConditions, "with tin number", "without tin number"]
                sorts = [...initialSorts, "name", "phone number", "location", "street", "region", "tin"]
                break
            case "debts":
                conditions = [...initialConditions, "paid", "unpaid", "of today", "shop debts", "customer debts", "sale debts", "partial_paid"]
                sorts = [...initialSorts, "total amount", "paid amount", "date", "type"]
                break

            case "branches":
                conditions = [...initialConditions, "with tin number", "without tin number", "with subscription", "without subscription"]
                sorts = [...initialSorts, "name", "phone number", "location", "street", "region", "tin", "days"]
                break

            case "activities":
                conditions = [...initialConditions, "deletion", "creation", "modification"]
                sorts = [...initialSorts, "type", "module", "activity"]
                break

            case "users":
                conditions = [...initialConditions, "verified", "not verified", "with 2FA", "without 2FA", "owners", "employee", "admins"]
                sorts = [...initialSorts, "username", "phone number", "account type", "phone number verified", "two factor authentication enabled"]
                break

            case "payments":
                conditions = [...initialConditions, "active", "canceled", ...paymentTypes]
                sorts = [...initialSorts, "total amount", "status", "type"]
                break

            case "store_products":
                conditions = [...initialConditions, "out of stock"]
                sorts = [...initialSorts, "name", "stock"]
                break

            case "adjustments":
                conditions = [...initialConditions, ...adjustmentFilters]
                sorts = [...initialSorts, "type", "before adjustment", "adjustment", "after adjustment"]
                break

            case "debt_histories":
                conditions = [...initialConditions, "of today"]
                sorts = [...initialSorts, "total amount", "date"]
                break

            case "sales":
                conditions = [...initialConditions, "today sales", "credit sales", "cash sales", "today credit sales", "today cash sales", "sales on cart"]
                sorts = [...initialSorts, "total amount", "discount", "profit", "quantity", "status"]
                break

            case "orders":
                conditions = [...initialConditions, ...orders]
                sorts = [...initialSorts, "number"]
                break

            case "roles":
                conditions = [...initialConditions]
                sorts = [...initialSorts, "name", "description"]
                break

            case "routes":
                conditions = [...initialConditions]
                sorts = [...initialSorts, "from", "to", "cost", "distance"]
                break

            case "trucks":
                conditions = [...initialConditions, ...truckStatus]
                sorts = [...initialSorts, "name", "status", "description"]
                break

            case "truck_orders":
                conditions = [...initialConditions, "paid", "unpaid", "partial_paid"]
                sorts = [...initialSorts, "number", "route_name", "total_amount", "paid_amount"]
                break

            case "cargos":
                conditions = [...initialConditions, "paid", "unpaid", "partial_paid", "in_transit", "received"]
                sorts = [...initialSorts, "number", "total_amount", "paid_amount"]
                break
            case "devices":
                conditions = [...initialConditions, ...deviceTypes]
                sorts = [...initialSorts, "name", "type", "model", "brand", "imei"]
                break
            case "services":
                conditions = [...initialConditions, "completed", "incomplete"]
                sorts = [...initialSorts, "service_cost", "product_cost", "service", "status"]
                break
            case "accounts":
                conditions = [...initialConditions, ...accountFilters]
                sorts = ["name", "balance", "number", "type", "provider", "monthly_fee"]
                break
            case "transactions":
                conditions = [...initialConditions, ...transactionFilters]
                sorts = ["account", "number", "total_amount", "fee", "reference", "type", "date"]
                break

            default:
                conditions = initialConditions
                sorts = []

        }

        if (type === "condition")
            return [...new Set(conditions)]

        return [...new Set(sorts)]

    }

    // updating backend status
    public updateBackendStatus = async (): Promise<void> => {
        try {

            // closing dialog
            this.toggleComponent("dialog")

            // creating request options
            const options: createOrUpdate = {
                route: apiV1 + "bulk-update",
                method: "PUT",
                loading: true,
                body: this.state.ids.map((id: string) => (
                    (this.state.backendStatus === "deleted") || (this.state.backendStatus === "restored")
                        ?
                        {
                            condition: { _id: id },
                            schema: this.state.schema,
                            newDocumentData: {
                                $set: {
                                    ...this.onUpdate,
                                    visible: this.state.backendStatus === "deleted" ? false : true
                                }
                            }
                        }
                        : (this.state.backendStatus === "enabled") || (this.state.backendStatus === "disabled")
                            ?
                            {
                                condition: { _id: id },
                                schema: this.state.schema,
                                newDocumentData: {
                                    $set: {
                                        ...this.onUpdate,
                                        disabled: this.state.backendStatus === "disabled" ? true : false
                                    }
                                }
                            }
                            :
                            {
                                condition: { _id: id },
                                schema: this.state.schema,
                                newDocumentData: {
                                    $set: {
                                        ...this.onUpdate,
                                        status: text.format(this.state.backendStatus)
                                    }
                                }
                            }
                ))
            }

            // making api request
            const response: serverResponse = await this.createOrUpdate(options)

            // cheking wether the request succeded
            if (response.success) {

                const { passedQueries, failedQueries } = response.message

                if (failedQueries.length === 0) {

                    // creating new data array
                    let newList: any[] = []

                    // checking wether status is not "deleted"
                    if ((this.state.backendStatus !== "deleted") && (this.state.backendStatus !== "restored"))

                        // eslint-disable-next-line
                        this.state[this.state.collection].map((data: any) => {
                            // creating new data object
                            let newData = data;

                            passedQueries.map((updatedData: any) => data._id === updatedData._id ? newData = updatedData : null)
                            // adding updated data to new data array
                            newList.push(newData)

                        })
                    else
                        newList = this.state[this.state.collection].filter((data: any) => !passedQueries.some((deletedData: any) => data._id === deletedData._id))

                    this.dispatch({ [this.state.collection]: newList })
                    this.dispatch({ [this.state.schema]: passedQueries[0] })
                    this.dispatch({ notification: `${this.state.ids.length > 1 ? `${this.state.collection} have` : ` ${this.state.schema} has`} been ${this.state.backendStatus}` })
                    this.dispatch({ backendStatus: "restored" })

                    // if (this.state.ids.length > 1)
                    this.dispatch({ ids: [] })
                }

            }
            else
                this.dispatch({ notification: `Failed to update ${this.state.schema}` })

        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    /* file handling func */
    public handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        try {

            const files = event.target.files;

            if (files && (files.length > 0)) {
                this.dispatch({ files })
                this.dispatch({ filesError: "" })
                this.dispatch({ file: files[0] })

                if (files[0].type.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    this.excelToArray(files[0])
                else if (files[0].type.includes("image/")) {
                    this.dispatch({ image: files[0].name })
                }

            }
            else {
                this.dispatch({ files: null, list: [] , filesError: "File is required" })
            }

        }
        catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    // validation
    public validate = async (options: validation): Promise<void> => {
        try {

            if (this.state[options.errorKey].trim() === "") {

                this.dispatch({ [options.errorKey]: "validating" })

                const response: serverResponse = await this.readOrDelete({
                    route: apiV1 + "validate",
                    method: "GET",
                    loading: false,
                    disabled: true,
                    parameters: `schema=${options.schema}&condition=${JSON.stringify({ ...options.condition, visible: true })}&validationType=${this.state.edit ? "onUpdate" : "onCreate"}&documentId=${this.state.id}&select={}&joinForeignKeys=${false}`
                })

                if (response.success)
                    this.dispatch({ [options.errorKey]: "data already exist" })
                else {
                    this.dispatch({ [options.errorKey]: "" })
                    this.dispatch({ disabled: false })
                }

            }

        } catch (error) {
            this.dispatch({ notification: (error as Error).message })
        }
    }

    public sendMessage = async (options: sendMessage): Promise<serverResponse> => {
        try {

            const { branch: { api_key, vendor, settings } } = this.user

            if (api_key && vendor && settings && settings.notifications.includes("customer_sale_or_order_receipt")) {

                const response: serverResponse = await (await fetch(`https://emessage.co.tz/api/send-message`, {
                    mode: "cors",
                    method: "POST",
                    body: JSON.stringify({
                        vendor,
                        ...options,
                        apiKey: api_key,
                    }),
                    headers: { "Content-Type": "application/json" }
                })).json()

                return response
            }
            return { success: false, message: "invalid api key or vendor name" }

        } catch (error) {
            return { success: false, message: (error as Error).message }
        }
    }

    public datalistSearch = async (event: React.ChangeEvent<HTMLInputElement>, options: datalistSearch): Promise<serverResponse> => {
        try {

            const keyword: string = text.format(event.target.value)

            if (string.isNotEmpty(keyword)) {
                const schema: stateKey = options.schema
                const sort: string = JSON.stringify(options.sort)
                const select: string = JSON.stringify(options.select)
                const fields: string = JSON.stringify(options.fields)
                const condition: string = JSON.stringify(options.condition ? options.condition : commonCondition(true))
                const joinForeignKeys: boolean = can("view_category") && schema === "product"
                const parameters: string = `schema=${schema}&condition=${condition}&select=${select}&sort=${sort}&fields=${fields}&keyword=${keyword}&joinForeignKeys=${joinForeignKeys}`

                const requestOptions: readOrDelete = {
                    parameters,
                    method: "GET",
                    loading: false,
                    disabled: true,
                    route: apiV1 + "search"
                }

                const response: serverResponse = await this.readOrDelete(requestOptions)

                if (response.success)
                    this.dispatch({
                        [options.schema]: response.message[0],
                        [pluralize(options.schema)]: response.message,
                    })
                else
                    this.dispatch({
                        // [options.schema]: null,
                        [pluralize(options.schema)]: [],
                        //  notification: `no ${schema} has been found`
                    })

                return response
            }

            return { success: false, message: "No value has been provided" }

        } catch (error) {
            return { success: false, message: (error as Error).message }
        }
    }

    loadMore = () => this.dispatch({ offset: this.state.offset + this.state.limit })

}

/* exporting Global Variables class */
export default Application