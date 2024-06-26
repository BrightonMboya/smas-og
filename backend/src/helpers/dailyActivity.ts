import { number } from "fast-web-kit"
import * as activities from "./activities"

// one hour interval
setInterval(() => {
    try {

        activities.dailyReport()
        activities.weeklyReport()
        activities.annualReport()
        activities.monthlyReport()
        activities.deleteDeletedData()
        activities.remindCustomerDebt()
        activities.decrementBranchDays()
        activities.deleteInactiveBranch()
        activities.checkBranchUnpaidDebts()
        activities.checkIncompleteServices()
        activities.checkBranchProductStatus()
        activities.checkBranchRemainingDays()
        activities.checkBranchUnpaidExpenseAndPurchase()

    } catch (error) {
        console.log(`Interval error: ${(error as Error).message}`)
    }
}, number.toMilliseconds(1, "hours"))

setInterval(activities.captureProductStock, number.toMilliseconds(1, "minutes"))