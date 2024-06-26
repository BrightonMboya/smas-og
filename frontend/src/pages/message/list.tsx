// dependencies
import numeral from "numeral"
import React from "react"
import { FloatingButton } from "../../components/button"
import { emessageApiKey, emessageDomain, formatDate, noAccess, pageNotFound, setPageTitle } from "../../helpers"
import { can } from "../../helpers/permissions"
import translate from "../../helpers/translator"
import { routerProps } from "../../types"
import { ApplicationContext } from "../../context"

// message list memorized function component
const MessageList: React.FunctionComponent<routerProps> = React.memo((props: routerProps) => {

    // application context
    const { application } = React.useContext(ApplicationContext)

    // component mounting
    React.useEffect(() => {

        // check permission
        if (can("list_message")) {
            setPageTitle("messages")
            onMount()
        }
        else {
            props.history.push(pageNotFound)
            application.dispatch({ notification: noAccess })
        }

        // component unmounting
        return () => application.unMount()

        // eslint-disable-next-line
    }, [])

    async function onMount(): Promise<void> {
        try {

            application.dispatch({ loading: true })
            const vendor: string = application.user.branch?.vendor || "Smas App"
            const apiKey: string = application.user.branch?.api_key || emessageApiKey
            const parameters: string = `apiKey=${apiKey}&vendor=${vendor}`
            const response = await (await fetch(`${emessageDomain}/messages?${parameters}`, {
                mode: "cors",
                method: "GET",
            })).json()

            if (response.success)
                application.dispatch({ messages: response.message })
            else
                application.dispatch({ notification: response.message })

            application.dispatch({ loading: false })


        } catch (error) {
            application.dispatch({ loading: false })
            application.dispatch({ notification: (error as Error).message })
        }
    }

    const renderMessages = React.useCallback(() => {
        try {
            return application.state.messages.map((message: any, index: number) => (
                <tr key={index}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={translate("message")}>
                        {message.message}
                    </td>
                    <td className="right-align text-primary" data-label={translate("cost")}>
                        {numeral(message.cost).format("0,0")}
                    </td>
                    <td className="center text-success" data-label={translate("receivers")}>
                        {numeral(message.receivers.length).format("0,0")}
                    </td>
                    <td className="center" data-label={translate("date")}>
                        {formatDate(message.date)}
                    </td>
                </tr>
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [application.state.messages])

    // component view
    return (
        <>
            <div className="card">
                <div className="card-content">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{translate("message")}</th>
                                <th className="right-align">{translate("cost")}</th>
                                <th className="center">{translate("receivers")}</th>
                                <th className="center">{translate("date")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderMessages()}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="text-primary bold uppercase" colSpan={2}>
                                    {translate("total")}
                                </td>
                                <td className="right-align text-primary bold">
                                    {
                                        numeral(
                                            application.state.messages.map((message: any) => message.cost).reduce((a: number, b: number) => a + b, 0)
                                        ).format("0,0")
                                    }
                                </td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            {
                can("create_message")
                    ? <FloatingButton to="/message/form" tooltip="new message" icon="add_circle" />
                    : null
            }
        </>
    )

})

// export component
export default MessageList