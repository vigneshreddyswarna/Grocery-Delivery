export const cleanString = (value: unknown, maxLength = 255) =>
    typeof value === "string" ? value.trim().slice(0, maxLength) : ""

export const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const isValidCoordinate = (value: unknown, type: "lat" | "lng") => {
    const coordinate = Number(value)
    if (!Number.isFinite(coordinate)) return false
    return type === "lat"
        ? coordinate >= -90 && coordinate <= 90
        : coordinate >= -180 && coordinate <= 180
}

export const isPositiveInteger = (value: unknown) =>
    Number.isInteger(Number(value)) && Number(value) > 0
