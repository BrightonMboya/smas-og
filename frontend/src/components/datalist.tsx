// dependencies
import React from "react"
import { ApplicationContext } from "../context"
import { Datalist, Option } from "./form"
import { commonCondition, text } from "../helpers"
import { array, string } from "fast-web-kit"
import { stateKey } from "../types"
import pluralize from "pluralize"
import { can } from "../helpers/permissions"

type customDatalist = {
    sort: string
    label: string
    name: stateKey
    list: stateKey
    nameId: stateKey
    fields: string[]
    disable?: boolean
    condition?: object
    nameError: stateKey
    placeholder: string
    isPurchase?: boolean
}

// custom datalist memorized function component
const CustomDatalist: React.FunctionComponent<customDatalist> = React.memo((props: customDatalist) => {

    // aplication context
    const { application } = React.useContext(ApplicationContext)

    const handleSelect = (event: React.ChangeEvent<any>) => {
        try {
            const { value, list } = event.target;
            const options: any[] = list.querySelectorAll('option');
            const singularListName = pluralize.singular(props.list) as stateKey;

            // Check if options array is empty
            if (array.isEmpty(options)) {
                handleStateUpdate(props.list, singularListName);
            }

            // Loop through the options to find the selected value
            for (let option of options) {
                if (text.format(option.value) === text.format(value)) {
                    const id = option.getAttribute('data-unique');

                    // Check if the selected option has a data-unique attribute
                    if (string.isNotEmpty(id)) {
                        const dataExist = application.state[props.list].filter((data: any) => data._id === id)[0];

                        // Check if the selected option exists in the application state
                        if (dataExist) {
                            handleDataExistDispatch(dataExist, singularListName);
                        }
                    } else {
                        handleStateUpdate(props.list, singularListName);
                    }
                    break;
                }
            }
        } catch (error) {
            application.dispatch({ notification: (error as Error).message });
        }
    };

    // Handle state updates based on list type
    const handleStateUpdate = (list: string, singularListName: stateKey) => {
        const defaultDispatch = {
            [props.nameId]: "",
            [singularListName]: null,
            [props.nameError]: ` ${singularListName} does not exist`
        };

        application.dispatch(defaultDispatch);

        if (list === "products") {
            const productDispatch = {
                stock: "",
                categoryId: "",
                buyingPrice: "",
                productCost: "",
                sellingPrice: ""
            };

            application.dispatch(productDispatch);

            if (props.isPurchase) {
                const purchaseDispatch = {
                    date: "",
                    quantity: "",
                    paidAmount: "",
                    adjustment: "",
                    totalAmount: "",
                    reorderStockLevel: ""
                };
                application.dispatch(purchaseDispatch);
            }
        } else if (list === "routes") {
            application.dispatch({
                cost: "",
                distance: ""
            });
        } else if (list === "branches") {
            application.dispatch({
                totalAmount: ""
            });
        }
    };

    // Dispatches when data exists for the selected option
    const handleDataExistDispatch = (dataExist: any, singularListName: stateKey) => {

        const baseDispatch = {
            [props.nameId]: dataExist._id,
            [singularListName]: dataExist
        };

        application.dispatch(baseDispatch);

        if (props.list === "products") {

            const productDispatch = {
                buyingPrice: dataExist.buying_price.toString(),
                productCost: dataExist.selling_price.toString(),
                sellingPrice: dataExist.selling_price.toString(),
                categoryId: dataExist.category ? dataExist.category._id : "",
            };

            application.dispatch(productDispatch);

            if (props.isPurchase) {
                application.dispatch({
                    quantity: dataExist.stock.toString(),
                    reorderStockLevel: dataExist.reorder_stock_level.toString()
                });
            } else {
                application.dispatch({
                    product: dataExist,
                    stock: dataExist.stock.toString()
                });
            }
        } else if (props.list === "routes") {
            application.dispatch({
                totalAmount: dataExist.cost.toString(),
                distance: dataExist.distance.toString()
            });
        } else if (props.list === "branches") {
            application.dispatch({
                totalAmount: dataExist.fee.toString()
            });
        }
    };

    // rendering list
    const renderList = React.useCallback(() => {
        try {

            // getting array of provided list
            const dataArray: any[] = application.state[props.list]

            // returning branches, suppliers or customers
            if (array.elementExist(["branches", "suppliers", "customers"], props.list))
                return dataArray.map((data: any, index: number) => (
                    <Option key={index} value={`${text.reFormat(data.name)} - ${data.phone_number}`} label={`${data.name} - ${data.phone_number}`} uniqueData={data._id} />
                ))

            // returning products, devices, roles or expense_types
            if (array.elementExist(["devices", "roles", "expense_types", "stores", "trucks", "attractions", "categories"], props.list))
                return dataArray.map((data: any, index: number) => (
                    <Option key={index} value={text.reFormat(data.name)} label={data.name} uniqueData={data._id} />
                ))

            if (props.list === "products") {
                if (!can("view_category")) {
                    return dataArray.map((data: any, index: number) => (
                        <Option key={index} value={text.reFormat(data.name)} label={data.name} uniqueData={data._id} />
                    ))
                }
                return dataArray.map((data: any, index: number) => (
                    <Option key={index} value={`${text.reFormat(data.name)} -> ${text.reFormat(data?.category?.name)}`} label={`${text.reFormat(data.name)} -> ${text.reFormat(data?.category?.name)}`} uniqueData={data._id} />
                ))
            }

            if (props.list === "routes")
                return dataArray.map((data: any, index: number) => (
                    <Option key={index} value={`${text.reFormat(data.from)} - ${text.reFormat(data.to)}`} label={`${text.reFormat(data.from)} - ${text.reFormat(data.to)}`} uniqueData={data._id} />
                ))

            // returning users
            return dataArray.map((data: any, index: number) => (
                <Option key={index} value={`${text.reFormat(data.username)} - ${data.phone_number}`} label={`${data.username} - ${data.phone_number}`} uniqueData={data._id} />
            ))

        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state[props.list]])

    return (
        <Datalist
            type="text"
            name={props.name}
            list={props.list}
            label={props.label}
            // onSelect={handleSelect}
            disabled={props.disable}
            placeholder={props.placeholder}
            value={application.state[props.name]}
            onChange={(e) => {
                handleSelect(e)
                application.handleInputChange(e)
            }}
            error={application.state[props.nameError]}
            onKeyUp={(event) => {
                application.datalistSearch(event, {
                    fields: props.fields,
                    sort: { [props.sort]: 1 },
                    select: {
                        to: 1,
                        fee: 1,
                        from: 1,
                        name: 1,
                        cost: 1,
                        email: 1,
                        stock: 1,
                        hotels: 1,
                        website: 1,
                        address: 1,
                        distance: 1,
                        category: 1,
                        username: 1,
                        phone_number: 1,
                        buying_price: 1,
                        selling_price: 1,
                        reorder_stock_level: 1,
                    },
                    schema: pluralize.singular(props.list) as stateKey,
                    condition: props.condition ? { ...commonCondition(true), ...props.condition } : commonCondition(true),
                })
            }}
        >
            {renderList()}
        </Datalist>
    )
})

export default CustomDatalist