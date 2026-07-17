export type IndiaAddressFields = {
    address: string
    city: string
    state: string
    zip: string
    lat: number
    lng: number
}

const INDIA_VIEWBOX = "68.1,37.1,97.4,6.4"

export const isIndianPincode = (value: string) => /^[1-9]\d{5}$/.test(value.trim())

export const isPointInIndia = (lat: number, lng: number) =>
    Number.isFinite(lat) && Number.isFinite(lng) && lat >= 6.4 && lat <= 37.1 && lng >= 68.1 && lng <= 97.4

const requestJson = async (url: string) => {
    const response = await fetch(url, { headers: { "Accept-Language": "en-IN,en;q=0.9" } })
    if (!response.ok) throw new Error("The address service is temporarily unavailable")
    return response.json()
}

type GeocodeResult = {
    lat?: string
    lon?: string
    display_name?: string
    address?: Record<string, string | undefined>
}

const normalized = (value: unknown) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

const hasExactPincode = (item: GeocodeResult, zip: string) =>
    String(item?.address?.postcode || "").replace(/\s/g, "") === zip

const localityScore = (item: GeocodeResult, fields: Pick<IndiaAddressFields, "address" | "city" | "state">) => {
    const searchable = normalized([
        item?.display_name,
        item?.address?.village,
        item?.address?.town,
        item?.address?.city,
        item?.address?.municipality,
        item?.address?.county,
        item?.address?.state,
    ].filter(Boolean).join(" "))
    const terms = [fields.address, fields.city, fields.state]
        .flatMap((value) => normalized(value).split(" "))
        .filter((term) => term.length > 2)
    return terms.reduce((score, term) => score + (searchable.includes(term) ? 1 : 0), 0)
}

const bestExactPincodeMatch = (items: GeocodeResult[], zip: string, fields: Pick<IndiaAddressFields, "address" | "city" | "state">) =>
    items
        .filter((item) => hasExactPincode(item, zip))
        .sort((a, b) => localityScore(b, fields) - localityScore(a, fields))[0]

export const geocodeIndianAddress = async (fields: Pick<IndiaAddressFields, "address" | "city" | "state" | "zip">) => {
    if (!isIndianPincode(fields.zip)) throw new Error("Enter a valid 6-digit Indian PIN code")

    const params = new URLSearchParams({
        format: "jsonv2",
        addressdetails: "1",
        limit: "5",
        countrycodes: "in",
        bounded: "1",
        viewbox: INDIA_VIEWBOX,
        street: fields.address.trim(),
        city: fields.city.trim(),
        state: fields.state.trim(),
        postalcode: fields.zip.trim(),
        country: "India",
    })
    const results = await requestJson(`https://nominatim.openstreetmap.org/search?${params}`)
    const matches: GeocodeResult[] = Array.isArray(results) ? results : []
    let match = bestExactPincodeMatch(matches, fields.zip.trim(), fields)

    // Never accept a similarly named village with a different PIN. If detailed
    // address data is missing in OpenStreetMap, fall back to the verified PIN
    // delivery area instead of placing the marker in the wrong district.
    if (!match) {
        const pinParams = new URLSearchParams({
            format: "jsonv2",
            addressdetails: "1",
            limit: "10",
            countrycodes: "in",
            postalcode: fields.zip.trim(),
            country: "India",
        })
        const pinResults = await requestJson(`https://nominatim.openstreetmap.org/search?${pinParams}`)
        match = bestExactPincodeMatch(Array.isArray(pinResults) ? pinResults as GeocodeResult[] : [], fields.zip.trim(), fields)
    }
    const lat = Number(match?.lat)
    const lng = Number(match?.lon)
    if (!match || !isPointInIndia(lat, lng)) throw new Error("We could not locate that Indian address. Check the street, city, state and PIN code")
    return { lat, lng }
}

export const reverseGeocodeIndianPoint = async (lat: number, lng: number): Promise<IndiaAddressFields> => {
    if (!isPointInIndia(lat, lng)) throw new Error("Your current location appears to be outside India")
    const params = new URLSearchParams({
        format: "jsonv2",
        addressdetails: "1",
        zoom: "18",
        lat: String(lat),
        lon: String(lng),
    })
    const result = await requestJson(`https://nominatim.openstreetmap.org/reverse?${params}`)
    const details = result?.address || {}
    const countryCode = String(details.country_code || "").toLowerCase()
    if (countryCode !== "in") throw new Error("Your current location appears to be outside India")

    const street = [details.house_number, details.road || details.pedestrian || details.residential]
        .filter(Boolean).join(" ")
    const locality = details.neighbourhood || details.suburb || details.quarter || details.hamlet
    const address = [street, locality].filter(Boolean).join(", ") || result?.display_name?.split(",").slice(0, 2).join(", ") || ""
    const city = details.city || details.town || details.village || details.municipality || details.county || ""
    const state = details.state || details.state_district || ""
    const zip = String(details.postcode || "").replace(/\s/g, "")
    if (!address || !city || !state || !isIndianPincode(zip)) {
        throw new Error("Location detected, but the complete address could not be resolved. Please fill the missing fields")
    }
    return { address, city, state, zip, lat, lng }
}
