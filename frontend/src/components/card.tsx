// dependencies
import React from "react"
import translate from "../helpers/translator"

// card title memorized functional component
export const CardTitle: React.FunctionComponent<{ title: string }> = React.memo(({ title }) => (
    <div className="card-title center">
        {translate(title)}
    </div>
))