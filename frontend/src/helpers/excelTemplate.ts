// product template
export const productTemplate: {
    name: string
    data: {
        "NAME": string
        "STOCK": number
        "BARCODE": number
        "BUYING PRICE": number
        "SELLING PRICE": number
        "REORDER STOCK LEVEL": number
    }[]
} = {
    name: "product import template",
    data: [
        {
            "NAME": "Sample one",
            "STOCK": 500,
            "BARCODE": 6734543643,
            "BUYING PRICE": 1000,
            "SELLING PRICE": 1250,
            "REORDER STOCK LEVEL": 5
        },
        {
            "NAME": "Sample two",
            "STOCK": 95,
            "BARCODE": 3421231423,
            "BUYING PRICE": 5000,
            "SELLING PRICE": 7500,
            "REORDER STOCK LEVEL": 10
        },
        {
            "NAME": "Sample three",
            "STOCK": 1000,
            "BARCODE": 65423424342,
            "BUYING PRICE": 10000,
            "SELLING PRICE": 15000,
            "REORDER STOCK LEVEL": 0
        },
    ]
}


export const storeProductTemplate: {
    name: string
    data: {
        "NAME": string
        "STOCK": number
    }[]
} = {
    name: "store product import template",
    data: [
        {
            "NAME": "Sample one",
            "STOCK": 500,
        },
        {
            "NAME": "Sample two",
            "STOCK": 95,
        },
        {
            "NAME": "Sample three",
            "STOCK": 1000,
        },
    ]
}