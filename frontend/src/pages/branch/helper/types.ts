import { array } from "fast-web-kit"

// availabel branch types
const branchTypes: string[] = array.sort(
    [
        "other",
        "tourism",
        "hardware",
        "pharmacy",
        "logistics",
        "stationery",
        "electronics",
        "Energy Supplies"
    ],
    "asc"
)

export default branchTypes