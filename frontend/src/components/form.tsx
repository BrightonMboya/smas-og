/* requiring dependencies */
import React from "react"
import translate from "../helpers/translator"
import { text } from "../helpers"

/* input */
export type input = {
    name: string
    type: string
    value?: any
    error: string
    label: string
    onChange: onChange
    icon?: string
    placeholder?: string
    min?: string
    max?: string
    disabled?: boolean
    readOnly?: boolean
    multiple?: boolean
    pattern?: string
    counter?: boolean
    counterLength?: number
    onBlur?(): void
    accept?: string
    onClick?(event: any): void
    onKeyUp?(event?: any): void
}

/* on change */
export type onChange = { (event: React.ChangeEvent<any>): void }

/* checkbox */
export type checkbox = {
    checked: boolean
    name?: string
    label?: string
    onChange?: any
    value?: any
    error?: string
    onTable?: boolean
    disabled?: boolean
}

/* select */
export type select = {
    name: string
    onChange: onChange
    label: string
    value: any
    error: string
    disabled?: boolean
    multiple?: boolean
    onBlur?(): void
    onClick?(): void
    children: React.ReactNode
}


/* option */
export type option = {
    value: any
    label: any
    image?: string
    class?: string
    disabled?: boolean
    selected?: boolean
    defaultValue?: any
    onSelect?(): void
    uniqueData?: string
}


/* input field */
export const Input: React.FunctionComponent<input> = React.memo((props: input) => (
    <>
        <label htmlFor={props.name}>{text.reFormat(translate(props.label))}</label>
        <input
            step="any"
            id={props.name}
            type={props.type}
            name={props.name}
            value={props.value}
            placeholder={translate(props.placeholder ? props.placeholder : "")}
            onChange={props.onChange}
            onBlur={props.onBlur}
            min={props.min}
            max={props.max}
            disabled={props.disabled}
            readOnly={props.readOnly}
            multiple={props.multiple}
            pattern={props.pattern}
            accept={props.accept}
            autoComplete="OFF"
            onClick={props.onClick}
            onKeyUp={props.onKeyUp}
        // onKeyDown={props.onKeyDown}
        />
        <span className="helper-text">{translate(props.error)}</span>
    </>
))

/* checkbox */
export const Checkbox: React.FunctionComponent<checkbox> = React.memo((props: checkbox) => (
    <div className="checkbox">
        <input
            type="checkbox"
            id={props.name}
            name={props.name}
            onChange={props.onChange}
            checked={props.checked}
            value={props.value}
            disabled={props.disabled}
        />
        {props.onTable ? null : <label htmlFor={props.name}>{translate(props.label ? props.label : "")}</label>}
        {/* {props.onTable ? null : <span className="helper-text">{translate(props.error)}</span>} */}
    </div>
))

/* radion button */
export const Radio: React.FunctionComponent<checkbox> = React.memo((props: checkbox) => (
    <div>
        <label htmlFor={props.name}>
            <input
                type="radio"
                id={props.name}
                name={props.name}
                onChange={props.onChange}
                checked={props.checked}
                value={props.value}
            />
            <span>{translate(props.label ? props.label : "")}</span>
        </label>
    </div>
))

/* select */
export const Select: React.FunctionComponent<select> = React.memo((props: select) => (
    <>
        <label htmlFor={props.name}>{translate(props.label)}</label>
        <select
            name={props.name}
            value={props.value}
            onChange={props.onChange}
            id={props.name}
            multiple={props.multiple}
            disabled={props.disabled}
            onBlur={props.onBlur}
            onClick={props.onClick}
        >
            {props.children}
        </select>
        <span className="helper-text">{translate(props.error)}</span>
    </>
))

/* option */
export const Option: React.FunctionComponent<option> = React.memo((props: option) => (
    <option
        value={props.value}
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        selected={props.selected}
        onSelect={props.onSelect}
        data-unique={props.uniqueData}
        className={props.image ? props.class : ""}
        data-icon={props.image ? props.image : ""}
    >
        {text.reFormat(translate(props.label))}
    </option>
))

/* textarea */
type textarea = {
    name: string
    label: string
    placeholder: string
    value: any
    error: string
    onChange(event: React.ChangeEvent<HTMLElement>): void
    disabled?: boolean
    readOnly?: boolean
    onKeyDown?(): void
    onBlur?(): void
}

export const Textarea: React.FunctionComponent<textarea> = React.memo((props: textarea) => (
    <>
        <label htmlFor={props.name}>{translate(props.label)}</label>
        <textarea
            name={props.name}
            value={props.value}
            id={props.name}
            placeholder={translate(props.placeholder ? props.placeholder : "")}
            onChange={props.onChange}
            readOnly={props.readOnly}
            disabled={props.disabled}
            onKeyUp={props.onKeyDown}
            onBlur={props.onBlur}
        />
        <span className="helper-text">{translate(props.error)}</span>
    </>
))

// datalist interface
interface datalist extends input {
    children: React.ReactNode
    list: string
    onSelect?(event: React.ChangeEvent<any>): void
}

// datalist component
export const Datalist: React.FunctionComponent<datalist> = React.memo((props: datalist) => (
    <>
        <label htmlFor={props.name}>{translate(props.label)}</label>
        <input
            id={props.name}
            type={props.type}
            name={props.name}
            value={props.value}
            placeholder={translate(props.placeholder ? props.placeholder : "")}
            onChange={props.onChange}
            onBlur={props.onBlur}
            disabled={props.disabled}
            readOnly={props.readOnly}
            autoComplete="OFF"
            list={props.list}
            onSelect={props.onSelect}
            onKeyUp={props.onKeyUp}
        />
        <datalist id={props.list}>
            {props.children}
        </datalist>
        <span className="helper-text">{translate(props.error)}</span>
    </>
))