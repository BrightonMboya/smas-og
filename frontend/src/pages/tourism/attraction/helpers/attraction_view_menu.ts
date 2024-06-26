import { array } from "fast-web-kit";
import { can } from "../../../../helpers/permissions";
import { moduleMenuOnView } from "../../../../types";


const attractionViewMenu: moduleMenuOnView[] = [

    // new quotation
    {
        name: "new quotation",
        link: "/quotation-form",
        visible: can("create_quotation")
    },

    // listing quotation
    {
        name: "list quotations",
        link: "/quotation-list",
        visible: can("list_quotation")
    },

    // listing attraction items
    {
        name: "list attraction items",
        visible: can("view_item"),
        link: "/attraction/item-list",
    }

]

export default array.sort(attractionViewMenu, "asc", "name")