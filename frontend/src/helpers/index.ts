import moment from "moment"
import { listView, stateKey } from "../types"
import { can } from "./permissions"
import translate from "./translator"
import { encryptionType } from "../types";
import { string, time, number as myNumber, array, object } from "fast-web-kit"

window.Buffer = window.Buffer || require("buffer").Buffer;
const crypto = require('crypto-browserify')

// environment variables
const environment = process.env
const project_stage = environment.NODE_ENV
const encryption_type: any = environment.REACT_APP_ENCRYPTION_TYPE
export const emessageApiKey = environment.REACT_APP_EMESSAGE_API_KEY
const encryption_algorithm = environment.REACT_APP_ENCRYPTION_ALGORITHM
const encryption_key = Buffer.from(environment.REACT_APP_ENCRYPTION_KEY as string, "utf8")
export const has_enable_encryption = environment.REACT_APP_ENABLE_ENCRYPTION === "true" ? true : false
const initialization_vector = Buffer.from(environment.REACT_APP_INITIALIZATION_VECTOR as string, "utf8")

const isDocker: boolean = false

// server port
const port = 2001

// domain name
const domain: string = "https://smas.app"
export const emessageDomain: string = "https://emessage.co.tz/api"

/* creating and exporting backend server URL */
export const serverURL: string = project_stage === "development" ? `http://localhost:${port}` : isDocker ? "" : `${domain}`

// socket url
export const socketURL: string = project_stage === "development" ? `http://localhost:${port}` : isDocker ? "" : `${domain}:${port}`

/* creating and exporting application name */
export const applicationName: string = "SMAS Accounting"

export const setPageTitle = (title: string): void => { document.title = translate(title) }

/* creating and exporting text object formating */
export const text = {
    format: (text: string): string => string.toSnakeCase(text),
    reFormat: (text: string): string => string.toTitleCase(string.removeCase(text, "snake_case")),
    abbreviate: (text: string): string => (string.getAbbreviation(string.removeCase(text, "snake_case")))
}

export const number = {
    format: (number: any) => {
        if ((typeof number === "string") || (typeof number) === "number") {
            number = number.toString()
            let formatedNumber: string = ""

            if (number.includes("."))
                return number.replace(/^(\d+(?:,\d{3})*\.\d+)[.\d]*$/, '$1').replace(/[^0-9,.]/g, '')

            if (number.length <= 4)
                formatedNumber = myNumber.format(number)

            if (number.length > 4)
                formatedNumber = myNumber.format(myNumber.reFormat(number))

            return formatedNumber.replace(/[^0-9,.-]/g, '')
        }
        else
            return number

    },
    reFormat: (number: string): number => myNumber.reFormat(number),
}

// decryption function
export function decrypt(data: encryptionType): any {
    try {
        const decipher = crypto.createDecipheriv(encryption_algorithm, encryption_key, initialization_vector)
        const decrypted = JSON.parse(decipher.update(data.payload, encryption_type, "utf8") + decipher.final("utf8"))
        return decrypted
    } catch (error) {
        console.log((error as Error).message)
        localStorage.clear()
        return { success: false, message: (error as Error).message }
    }
}

// encryption function
export function encrypt(data: any): encryptionType {
    try {
        const cipher = crypto.createCipheriv(encryption_algorithm, encryption_key, initialization_vector)
        const payload = cipher.update(JSON.stringify(data), "utf8", encryption_type) + cipher.final(encryption_type)
        return { payload }
    } catch (error) {
        console.log((error as Error).message)
        localStorage.clear()
        return { payload: (error as Error).message }
    }
}

// local storage operations
export const storage = {
    clear: () => localStorage.clear(),
    retrieve: (key: string) => {

        const payload: string | null = localStorage.getItem(key)

        if (payload) {
            const data = decrypt({ payload: JSON.parse(payload) })
            return data
        }
        return payload

    },
    store: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(encrypt(data).payload)),
    remove: (key: string) => localStorage.removeItem(key)
}

/* creating and exporting  function for getting specific local storage data information */
export const getInfo = (key: string, info?: string) => {
    if (string.isNotEmpty(key)) {
        const data = storage.retrieve(key)
        if (object.isValid(data)) {
            if (info && string.isNotEmpty(info)) {
                if (object.keyExist(data, info))
                    return data[info]
                return data
            }
            else
                return data
        }
    }
    return null
}

/* user */
export const user = getInfo("user")

export const isOwner: boolean = user && (user.account_type === "user") ? true : false
export const isUser: boolean = user && ((user.account_type === "employee")) ? true : false
export const isAdmin: boolean = user && ((user.account_type === "smasapp") /* && (user.role === null) */) ? true : false

/* backend api path */
export const api: "api/" = "api/"
export const apiV1: "api/" = "api/"

/* date formating */
export const getDate = (date: any): string => {
    const hours = time.currentHour(date)
    const minutes = time.currentMinute(date)
    const formatedDate = time.convertToDate(date).toDateString()
    return `${formatedDate} - ${hours <= 9 ? `0${hours}` : hours}:${minutes <= 9 ? `0${minutes}` : minutes}`
}
export const formatDate = (date: any) => translate(moment(date).startOf("seconds").fromNow())

/* user account types */
export const accountTypes: string[] = ["smasapp", "user", "assistance", "employee"]

/* page not found */
export const pageNotFound: string = "/page-not-found"

// product list view
export const productListsView: listView[] = [
    { name: "list sales", icon: "shopping_cart", link: "/sale/list", visible: can("list_sale") },
    { name: "list services", icon: "shopping_cart", link: "/service/list", visible: can("list_service") },
    { name: "list purchases", icon: "local_shipping", link: "/purchase/list", visible: can("list_purchase") },
    { name: "list adjustments", icon: "remove_circle", link: "/product/adjustment-list", visible: can("list_stock_adjustment") },
    { name: "adjust stock", icon: "remove_circle", link: "/product/adjustment-form", visible: can("adjust_stock") },
    { name: "new purchase", icon: "remove_circle", link: "/purchase/form", visible: can("create_purchase") },
    { name: "new report", icon: "remove_circle", link: "/report/form", visible: can("create_report") },
    { name: "new sale", icon: "remove_circle", link: "/sale/form", visible: can("create_sale") },
    { name: "new service", icon: "remove_circle", link: "/service/form", visible: can("create_service") },
    { name: "new order", icon: "remove_circle", link: "/sale/order-form", visible: can("create_order") },
    { name: "new proforma invoice", icon: "remove_circle", link: "/sale/proforma-invoice-form", visible: can("create_proforma_invoice") },
]

export const userListView: listView[] = [
    { name: "list activities", link: "/branch/activity-list", visible: can("list_activity") },
    { name: "list customers", link: "/customer/list", visible: can("list_customer") },
    { name: "list debts", link: "/debt/list", visible: can("list_debt") },
    { name: "list expenses", link: "/expense/list", visible: can("list_expense") },
    { name: "list products", link: "/product/list", visible: can("list_product") },
    { name: "list purchases", link: "/purchase/list", visible: can("list_purchase") },
    { name: "list roles", link: "/role/list", visible: can("list_role") },
    { name: "list sales", link: "/sale/list", visible: can("list_sale") },
    { name: "list users", link: "/user/list", visible: can("list_user") },
    { name: "list trucks", link: "/truck/list", visible: can("list_truck") },
    { name: "list truck orders", link: "/truck/order-list", visible: can("list_order") },
    { name: "list routes", link: "/truck/route-list", visible: can("list_route") },
    { name: "list branches", link: "/branch/list", visible: can("list_branch") },
    { name: "list stores", link: "/store/list", visible: can("list_store") },
    { name: "list store products", link: "/store/product-list", visible: can("list_store_product") },
    { name: "list orders", link: "/sale/order-list", visible: can("list_order") },
    { name: "list proforma invoice", link: "/sale/proforma-invoice-list", visible: can("list_proforma_invoice") },
    { name: "list stock adjustment", link: "/product/adjustment-list", visible: can("list_stock_adjustment") },
    { name: "new report", icon: "remove_circle", link: "/report/form", visible: can("create_report") },
    { name: "income_statement", icon: "remove_circle", link: "/report/income-statement", visible: can("view_income_statement") },
    { name: "list debt history", icon: "currency_exchange", link: "/debt/history-list", visible: can("list_debt_history") },
]

export const noAccess: string = `You have no access to view this page`

export const debtTypes: string[] = array.sort(
    ["debtor", "creditor"],
    "asc"
)



export const getRelativeTime = (date: any) => translate(moment(date).startOf("seconds").fromNow())

export const isInvalid = (value: any): boolean => isNaN(Number(value))

export const paymentTypes: string[] = [
    "system_installation", "monthly_subscription", "sms_purchase", "vendor_name_registration", "other", "server_payment"
]
export const dashboardCollections: stateKey[] = [
    "branches", "sales", "payments", "users", "purchases", "expenses", "debts", "debt_histories", "expense_types", "adjustments", "customers", "activities", "products", "orders", "stores", "roles", "suppliers", "customer_counts", "routes", "trucks", "truck_orders", "stocks", "devices", "services", "freights", "accounts", "transactions", "hotels", "attractions", "quotations", "items", "quotation_invoices", "categories"
]

export const years = (): number[] => {
    try {

        const generatedYears: number[] = []
        const currentYear: number = new Date().getFullYear()

        for (let year = 2020; year <= currentYear; year += 1)
            generatedYears.push(year)

        return generatedYears

    } catch (error) {
        console.log(`Years generation error: ${(error as Error).message}`)
        return [new Date().getFullYear()]
    }
}

export const notificationTypes: string[] = [
    "monthly_subscription", "customer_sale_or_order_receipt", "product_stock", "store_product_stock", "daily_report", "daily_debts_report", "customer_debt_reminder", "stolen_product", "unpaid_expense_and_purchase", "monthly_report", "annual_report", "weekly_report", "incomplete_service", "customer_service_completion"
]

export const formatTin = (tin: number): string => {
    try {
        if (tin) {
            const tinInString: string = tin.toString()
            const firstSection: string = tinInString.substring(0, 3)
            const secondSection: string = tinInString.substring(3, 6)
            const thirdSection: string = tinInString.substring(6)
            return `${firstSection}-${secondSection}-${thirdSection}`
        }
        else
            return translate("n/a")

    } catch (error) {
        return translate("n/a")
    }
}

export const getGraphData = (dataArray: any[]): number[] => {
    try {

        const numbers: number[] = []

        if (dataArray) {
            for (let index = 1; index <= 12; index += 1) {
                const data = dataArray.filter((data: any) => data._id.month === index)[0]
                let amount: number = 0

                if (data) {
                    if (data.total_amount)
                        amount = data.total_amount
                    else if (data.service_cost)
                        amount = data.service_cost + data.product_cost
                }
                // const amount = data?.total_amount || (data?.service_cost + data?.product_cost) || 0
                // const amount = dataArray.filter((data: any) => data._id.month === index)[0]?.total_amount
                if (amount)
                    numbers.push(amount)
                else
                    numbers.push(0)
            }
        }

        return numbers

    } catch (error) {
        console.log(`graph data error: ${(error as Error).message}`)
        return []
    }
}

export const truckStatus: string[] = [
    "available", "rented", "unavailable"
]

export const rentalStatus: string[] = [
    "bad_condition", "good_condition"
]

// device types
export const deviceTypes: string[] = [
    "mobile_phone",
    "computer",
    "other"
]

// application vendor contacts
export const vendorContacts = {
    smasapp: "+255752628215",
}

// checking if admin account has switched to a specific branch
export const adminHasSwitched = (): boolean => {
    try {

        if (isAdmin) {
            const branch = getInfo("user", "branch")
            if (branch)
                return true
            return false
        }

        return false

    } catch (error) {
        console.log((error as Error).message)
        return false
    }
}

// getting common condition function
export function commonCondition(listAll?: boolean): any {
    try {

        const pathname: string = window.location.pathname
        const condition: object = { visible: true, $expr: {} }

        if (user) {

            const userId = user._id
            const branchId = user.branch ? user.branch._id : ""
            const stores = user.stores ? user.stores.map((branch: string) => ({ $toObjectId: branch })) : []
            const branches = user.branches ? user.branches.map((branch: string) => ({ $toObjectId: branch })) : []

            // system administrator
            if (isAdmin) {

                // admin has switched to a specific branch
                if (adminHasSwitched()) {
                    return {
                        ...condition,
                        $expr: {
                            $or: [
                                { $in: ["$_id", [{ $toObjectId: branchId }]] },
                                { $in: ["$branch", [{ $toObjectId: branchId }]] }
                            ]
                        }
                    }
                }

                // if admin has role
                if (user.role) {
                    return {
                        ...condition,
                        $expr: {
                            $or: [
                                { $in: ["$_id", stores] },
                                { $in: ["$store", stores] },
                                { $in: ["$_id", branches] },
                                { $in: ["$branch", branches] },
                                { $in: ["$user", [{ $toObjectId: userId }]] },
                                { $in: ["$created_by", [{ $toObjectId: userId }]] },
                            ]
                        }
                    }
                }

                // if admin has no role
                return condition

            }

            // branch owner
            if (isOwner) {

                // on home path condition
                if ((pathname === "/") || (pathname === "/dashboard"))
                    return {
                        ...condition,
                        $expr: {
                            $or: [
                                { $in: ["$_id", stores] },
                                { $in: ["$store", stores] },
                                { $in: ["$branch", [{ $toObjectId: branchId }]] }
                            ]
                        }
                    }

                // on branch list path
                if (pathname === "/branch/list")
                    return {
                        ...condition,
                        $expr: {
                            $or: [
                                { $in: ["$_id", branches] },
                                { $in: ["$user", [{ $toObjectId: userId }]] },
                            ]
                        }
                    }

                // other pathnames
                return {
                    ...condition,
                    $expr: {
                        $or: [
                            { $in: ["$_id", stores] },
                            { $in: ["$store", stores] },
                            { $in: ["$user", [{ $toObjectId: userId }]] },
                            { $in: ["$branch", [{ $toObjectId: branchId }]] },
                        ]
                    }
                }

            }

            // branch employee
            if (isUser) {

                // if page allows to list all
                if (listAll)
                    return {
                        ...condition,
                        $expr: {
                            $or: [
                                { $in: ["$_id", stores] },
                                { $in: ["$store", stores] },
                                { $in: ["$_id", [{ $toObjectId: branchId }]] },
                                { $in: ["$branch", [{ $toObjectId: branchId }]] },
                            ]
                        }
                    }

                // branch list pathname
                if (pathname === "/branch/list")
                    return {
                        ...condition,
                        $expr: {
                            $or: [
                                { $in: ["$_id", branches] },
                                { $in: ["$user", [{ $toObjectId: userId }]] },
                            ]
                        }
                    }

                // store pathnames
                if (pathname.includes("store"))
                    return {
                        ...condition,
                        $expr: {
                            $or: [
                                { $in: ["$_id", stores] },
                                { $in: ["$store", stores] },
                                { $in: ["$branch", [{ $toObjectId: branchId }]] },
                                { $in: ["$created_by", [{ $toObjectId: userId }]] },
                            ]
                        }
                    }
                // user see only what he or she has created on the branch
                return {
                    ...condition,
                    $expr: {
                        $and: [
                            { $in: ["$branch", [{ $toObjectId: branchId }]] },
                            { $in: ["$created_by", [{ $toObjectId: userId }]] },
                        ]
                    }
                }

            }

        }
        else
            return { noUser: true }

    } catch (error) {
        return { error }
    }
}

// sms vendor name
export const getVendorName = (): string => "Smas App"

// branch working hours
export const isWorkingHours = () => {
    try {
        if (!user || !user.branch) return false;

        const { opening_time, closing_time } = user.branch.settings;
        const currentHour = time.currentHour();
        const currentMinute = time.currentMinute();
        const [openingHour, openingMinute] = opening_time?.split(":").map(Number) ?? [];
        const [closingHour, closingMinute] = closing_time?.split(":").map(Number) ?? [];

        if (
            (currentHour > openingHour && currentHour < closingHour) ||
            (currentHour === openingHour && currentMinute >= openingMinute) ||
            (currentHour === closingHour && currentMinute <= closingMinute)
        )
            return true

        return false;
    } catch (error) {
        console.log((error as Error).message)
        return false
    }
}

// get shop working hours
export const getWorkingHours = () => {
    try {

        if (user && user.branch) {
            const { opening_time, closing_time } = user.branch.settings
            const currentHour = time.currentHour()
            const currentMinute = time.currentMinute()
            const openingHour = Number(opening_time?.split(":")[0])
            const closingHour = Number(closing_time?.split(":")[0])
            const openingMinute = opening_time?.split(":")[1]
            const closingMinute = closing_time?.split(":")[1]

            if (
                ((currentHour > openingHour) && (currentHour < closingHour)) ||
                ((currentHour === openingHour) && (currentMinute >= 0)) ||
                ((currentHour === closingHour) && (currentMinute < 0))
            )
                return ``
            return `from ${openingHour}:${openingMinute}${openingHour <= 12 ? "am" : "pm"} to ${closingHour}:${closingMinute}${closingHour <= 12 ? "am" : "pm"}`
        }

        return ``


    } catch (error) {
        console.log(`getting working hours error: ${(error as Error).message}`)
        return ``
    }
}

// account providers
export const accountProviders: string[] = array.sort(
    [
        "Bank of Tanzania",
        "CRDB Bank",
        "NMB",
        "Stanbic Bank",
        "Standard Chartered Bank",
        "Barclays Bank",
        "Exim Bank",
        "Azania Bank",
        "Access Bank",
        "Diamond Trust Bank",
        "Bank M",
        "TPB Bank",
        "Akiba Commercial Bank",
        "EQUITY",
        "UBA",
        "KCB Bank",
        "Mkombozi Commercial Bank",
        "I&M Bank",
        "BancABC",
        "Maendeleo Bank",
        "M-PESA",
        "TigoPesa",
        "Airtel Money",
        "HaloPesa",
        "EzyPesa",
        "M-Kash",
        "TTCL Pesa",
        "MaxMalipo",
        "NONE",
        "AZAM PAY",
        "ABSA"
    ],
    "asc"
)

// account provider types
export const accountProvidersTypes: string[] = array.sort(
    [
        "bank",
        "mobile",
        "customer",
        "supplier",
        "cash in hand"
    ],
    "asc"
)

// transaction types
export const transactionTypes: string[] = array.sort(
    [
        "deposit",
        "withdraw",
    ],
    "asc"
)

// hotel categories
export const hotelCategories: string[] = array.sort(
    [
        "Luxury",
        "Luxury +",
        "Luxury Mid Range",
        "Mid Range"
    ],
    "asc"
)

// hotel room types
export const hotelRoomTypes: string[] = array.sort(
    [
        "Single Room",
        "Double Room",
        "Triple Room",
        "Family Room",
        "Sharing Room"
    ],
    "asc"
)

// tourism attraction categories
export const attractionCategories: string[] = array.sort(
    [
        "Historical Site",
        "Natural Landmark",
        "Museum",
        "Art Gallery",
        "Amusement Park",
        "Zoo",
        "Aquarium",
        "Botanical Garden",
        "National Park",
        "Beach",
        "Cultural Center",
        "Religious Site",
        "Market",
        "Shopping District",
        "Food Market",
        "Winery/Vineyard",
        "Sports Venue",
        "Scenic Viewpoint",
        "Hiking Trail",
        "Cruise/Boat Tour",
        "Waterfall",
        "Cave",
        "Theme Park",
        "Golf Course",
        "Ski Resort",
        "Theater",
        "Music Festival",
        "Street Art",
        "City Tour",
        "Guided Excursion",
        "Adventure Park",
        "Science Center",
        "Planetarium",
        "Observatory",
        "Cultural Festival",
        "Historical Landmark"
    ],
    "asc"
)

// percentages
export const percentages = (): number[] => {
    try {

        const numbers: number[] = []

        for (let number = 1; number <= 100; number += 1)
            numbers.push(number)

        return numbers

    } catch (error) {
        console.log((error as Error).message)
        return []
    }
}

// get gas product ton
export const getTon = (productName: string, quantity: number): number => {
    try {

        let ton: number = 0

        if (string.isNotEmpty(productName) && productName.includes("kg") && productName.includes("gas")) {

            const kilogram = Number(productName.split("kg")[0])

            if (kilogram) {
                ton = (kilogram * quantity) / 1000
            }
        }


        return ton

    } catch (error) {
        console.log((error as Error).message)
        return 0
    }
}