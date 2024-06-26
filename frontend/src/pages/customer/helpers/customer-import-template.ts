export type customerTemplate = {
    name: string
    data: {
        "NAME": string
        "EMAIL": string
        "REGION": string
        "COUNTRY": string
        "TIN NUMBER"?: string
        "PHONE NUMBER": string
        "IDENTIFICATION": string
    }[]
}

// customer template
const customerImportTemplate: customerTemplate = {
    name: "customer import template",
    data: [
        {
            "NAME": "Customer One",
            "PHONE NUMBER": "255752628215",
            "TIN NUMBER": "123456789",
            "REGION": "Mbeya",
            "COUNTRY": "TANZANIA",
            "IDENTIFICATION": "1992022912132131",
            "EMAIL": "customer@gmail.com"
        },
        {
            "COUNTRY": "TANZANIA",
            "NAME": "Customer Two",
            "PHONE NUMBER": "255623356337",
            "REGION": "Dar es salaam",
            "IDENTIFICATION": "1992022912132131",
            "EMAIL": "customer2@gmail.com"
        }
    ]
}

export default customerImportTemplate