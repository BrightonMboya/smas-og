/* dependencies */
import React from "react"
import { Link } from "react-router-dom"
import translate from "../helpers/translator"
import { Icon } from "./elements"
import { text } from "../helpers"

/* button */
export type button = {
    title: string
    disabled: boolean
    loading: boolean
    onClick?(event: React.ChangeEvent<any>): void
}

/* floating button */
export type floatingButton = {
    class?: "floating-button-menu" | "home"
    icon?: "arrow_circle_right" | "list_alt" | "add_circle" | "menu" | "home" | "analytics" | "bar_chart"
    to: string
    onClick?(): void
    tooltip: string
}

/* button */
export const Button: React.FunctionComponent<button> = React.memo((props: button) => (
    <button
        onClick={props.onClick}
        className={`btn ${props.disabled || props.loading ? "disabled" : ""}`}
        disabled={props.disabled || props.loading}
        type="submit"
    >
        {text.reFormat(translate(props.loading ? "Loading" : props.disabled ? "Error" : props.title))}
    </button>
))

/* floating button */
export const FloatingButton: React.FunctionComponent<floatingButton> = React.memo((props: floatingButton) => (
    <div className={`floating-button hide-on-print ${props.class}`}>
        <Link to={props.to} onClick={props.onClick} className="hide-on-print" data-tooltip={text.reFormat(translate(props.tooltip))}>
            <Icon name={props.to.includes("list") ? "list_alt" : props.to.includes("form") ? "add_circle" : props.icon ? props.icon : ""} type="rounded" />
        </Link>
    </div>
))

/* action button */
export type actionButton = {
    type: string
    icon: string
    tooltip: string
    position?: "left" | "right" | "top" | "bottom"
    to: object | string
    onClick?: any
    rotate?: boolean
}

/* table action button */
export const ActionButton: React.FunctionComponent<actionButton> = React.memo((props: actionButton) => (
    <Link
        to={props.to}
        className={`button ${props.type} hide-on-print`}
        data-tooltip={text.reFormat(translate(props.tooltip))}
        data-position={props.position}
        onClick={props.onClick}
    >
        <Icon name={props.icon} type="rounded" rotate={props.rotate} />
    </Link>
))