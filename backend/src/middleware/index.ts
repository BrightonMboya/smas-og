/* dependencies */
import { time } from "fast-web-kit"
import { controllers, helpers } from "bapig"
import { Response, NextFunction } from "express"

// server entrace validation
export const serverEntrace = async (request: any, response: Response, next: NextFunction) => {
    try {

        const path: string = request.path
        const entry: string = "/api"
        const allowedPath: string[] = [
            `${entry}/read`,
            `${entry}/update`,
            `${entry}/validate`,
            `/custom/zipped-data`,
            `${entry}/authenticate`,
            `${entry}/change-field-encryption`,
            `${entry}/create-field-encryption`,
        ]

        if (allowedPath.includes(path))
            next()
        else {
            const { token }: any = request.headers

            if (token) {

                const _id = helpers.decrypt({ payload: token })
                const userExist = await controllers.getSingleDocument({
                    schema: "user",
                    condition: { _id },
                    select: {},
                    joinForeignKeys: true
                })

                if (userExist.success) {
                    const user = userExist.message
                    if (user.visible)
                        if (user.phone_number_verified)
                            if ((user.account_type === "smasapp") || (user.account_type === "assistance"))
                                next()
                            else {
                                if ((user.branch.days > 0) && (user.branch.visible) && (user.branch.settings)) {

                                    const currentHour = time.currentHour();
                                    const currentMinute = time.currentMinute();
                                    const { opening_time, closing_time } = user.branch?.settings
                                    const [openingHour, openingMinute] = opening_time?.split(":").map(Number) ?? []
                                    const [closingHour, closingMinute] = closing_time?.split(":").map(Number) ?? []

                                    if (
                                        (currentHour > openingHour && currentHour < closingHour) ||
                                        (currentHour === openingHour && currentMinute >= openingMinute) ||
                                        (currentHour === closingHour && currentMinute <= closingMinute)
                                    )
                                        next()
                                    else {
                                        if (helpers.hasEnableEncryption)
                                            response.json(helpers.encrypt({ success: false, message: `Not working hours your shop opens at ${opening_time} to ${closing_time}` }))
                                        else
                                            response.json({ success: false, message: `Not working hours your shop opens at ${opening_time} to ${closing_time}` })
                                    }
                                }
                                else if (!user.branch.visible) {
                                    if (helpers.hasEnableEncryption)
                                        response.json(helpers.encrypt({ success: false, message: "This branch is disabled" }))
                                    else
                                        response.json({ success: false, message: "This branch is disabled" })

                                }
                                else if (!user.branch.settings) {
                                    if (helpers.hasEnableEncryption)
                                        response.json(helpers.encrypt({ success: false, message: "Branch has not completed installation" }))
                                    else
                                        response.json({ success: false, message: "Branch has not completed installation" })
                                }
                                else {
                                    const success = false
                                    const message = "Monthly support and maintenance fee is required"
                                    if (helpers.hasEnableEncryption)
                                        response.json(helpers.encrypt({ success, message }))
                                    else
                                        response.json({ success, message })
                                }
                            }
                        else {
                            if (helpers.hasEnableEncryption)
                                response.json(helpers.encrypt({ success: false, message: "Please verify your phone number" }))
                            else
                                response.json({ success: false, message: "Please verify your phone number" })
                        }
                    else
                        if (helpers.hasEnableEncryption)
                            response.json(helpers.encrypt({ success: false, message: "Your account has been disabled, please contact your adminstrator" }))
                        else
                            response.json({ success: false, message: "Your account has been disabled, please contact your adminstrator" })
                }
                else
                    response.json(helpers.hasEnableEncryption ? helpers.encrypt(userExist) : userExist)
            }
            else
                if (helpers.hasEnableEncryption)
                    response.json(helpers.encrypt({ success: false, message: "You're not authorized, make sure your account is active and has been verified" }))
                else
                    response.json({ success: false, message: "You're not authorized, make sure your account is active and has been verified" })
        }

    } catch (error) {
        if (helpers.hasEnableEncryption)
            response.status(200).json(helpers.encrypt({ success: false, message: (error as Error).message }))
        else
            response.status(200).json({ success: false, message: (error as Error).message })
    }
}