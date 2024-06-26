import React from "react"
import { Option, Select } from "../form"
import { ApplicationContext } from "../../context"
import reportTypes from "../../pages/report/helper/types"
import { text } from "../../helpers"

const ReportTypeComponent: React.FunctionComponent = React.memo(() => {

    const { application } = React.useContext(ApplicationContext)

    const renderReportTypes = React.useCallback(() => {
        try {

            return reportTypes.map((report, index: number) => {
                if (report.visible)
                    return <Option key={index} label={text.reFormat(report.type)} value={report.type} />
                return null
            })

        } catch (error) {
            application.dispatch({
                notification: (error as Error).message
            })
        }
        // eslint-disable-next-line
    }, [reportTypes])

    return (
        <Select
            name="reportType"
            label="report type"
            value={application.state.reportType}
            onChange={application.handleInputChange}
            error={application.state.reportTypeError}
        >
            <Option label="select report type" value="" />
            {renderReportTypes()}
        </Select>
    )
})

export default ReportTypeComponent