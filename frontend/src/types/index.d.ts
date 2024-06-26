import { RouteComponentProps } from 'react-router'
import React from "react"
import state from "../hooks/state"

export type action = Partial<state> & {}

// dispatch
export type dispatch = { ({ }: action): void }

// server response
export type serverResponse = {
    success: boolean
    message: any
}

/* server post or put method options */
export type createOrUpdate = {
    route: string
    body: object
    method: "POST" | "PUT"
    loading: boolean
}

/* server post or put method options */
export type readOrDelete = {
    route: string
    parameters: string
    method: "GET" | "DELETE"
    loading: boolean
    disabled: boolean
}

export type uploadFile = string

/* component mount */
export type mount = {
    route: "api/list" | "api/list-all" | "api/bulk-list-all"
    parameters: string
    collection: stateKey
    schema: stateKey
    sort: string
    condition: string
    order: 1 | -1
    select: any
    joinForeignKeys: boolean
    fields: string[]
}

export type datalistSearch = {
    schema: stateKey
    sort: any
    select: any
    fields: string[]
    condition?: any
}

// backend status
export type backendStatus = "deleted" | "restored" | "" | "canceled" | "completed" | "enabled" | "disabled" | "available"

export type application = {
    buttonTitle: "update" | "create"
    handleInputChange(event: React.ChangeEvent<HTMLElement>): void
    createOrUpdate(options: createOrUpdate): Promise<serverResponse>
    readOrDelete(options: readOrDelete): Promise<serverResponse>
    authenticate(action: "login" | "logout", user?: any): void
    retrieveUserAndAuthenticate(): void
    state: state
    user: any
    dispatch: dispatch
    mount(options: mount): Promise<serverResponse>
    unMount(): void
    toggleSidebar(): void
    searchData(event: React.ChangeEvent<HTMLFormElement>): Promise<void>
    filterData(condition: string, order: 1 | -1, sort: string, limit: number): Promise<void>
    paginateData(page: number): Promise<void>
    selectList(id?: string): void
    getSortOrCondition(type: "sort" | "condition"): string[]
    openDialog(backendStatus: backendStatus): void
    updateBackendStatus(): Promise<void>
    excelToArray(file: any, callback?: any): void
    arrayToExcel(dataArray: any[], fileName: string): void
    toggleComponent(name: "modal" | "dialog"): void
    handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void
    closeSidebar(): void
    validate(options: validation): Promise<void>
    uploadFile(options: uploadFile): Promise<void>
    onUpdate: { updated_by: string | null }
    onCreate: { created_by: string | null, branch: string | null }
    condition: { _id: string }
    successMessage: string
    headers: HeadersInit
    sendMessage(options: sendMessage): Promise<serverResponse>
    datalistSearch(event: React.ChangeEvent<HTMLInputElement>, options: datalistSearch): Promise<serverResponse>
}


// component children
export type children = {
    children: React.ReactNode
}

/* routing component props */
export interface routerProps extends RouteComponentProps { }

export type listView = {
    name: string
    link: string
    icon?: string
    visible: boolean
}

export type validation = {
    condition: object
    schema: stateKey
    errorKey: stateKey
}

export type sendMessage = {
    message: string
    receivers: string[]
}

export type encryptionType = {
    payload: string
}

export type stateKey = keyof state

export type country = {
    name: string;
    phoneCode: string;
    continent: string;
    capital?: string
}


// menu type on module view
export type moduleMenuOnView = {
    name: string
    link: string
    icon?: string
    visible: boolean
}
