import React from "react"
import { ApplicationContext } from "../../context"
import { Option, Select } from "../form"
import countries from "../../helpers/countries"
import { array, string } from "fast-web-kit"
import { text } from "../../helpers"

const CountriesCompoent: React.FunctionComponent<any> = React.memo(() => {

    const { application } = React.useContext(ApplicationContext)

    React.useEffect(() => {
        application.dispatch({ phoneCode: "", region: "", street: "", location: "" })
        if (string.isNotEmpty(application.state.country)) {
            const country = countries.filter((country) => text.format(country.name) === application.state.country)[0]
            if (country) {
                application.dispatch({ phoneCode: country.phoneCode })
            }
        }
        // eslint-disable-next-line
    }, [application.state.country])

    const renderCountries = React.useCallback(() => {
        try {
            return array.sort(countries, "asc", "name").map((country, index: number) => (
                <Option label={country.name} value={text.format(country.name)} key={index} />
            ))
        } catch (error) {
            application.dispatch({ notification: (error as Error).message })
        }
        // eslint-disable-next-line
    }, [countries])

    return (
        <>
            <Select
                name="country"
                label="country"
                value={application.state.country}
                error={application.state.countryError}
                onChange={application.handleInputChange}
            >
                <Option label="select country" value="" />
                {renderCountries()}
            </Select>
        </>
    )

})

export default CountriesCompoent