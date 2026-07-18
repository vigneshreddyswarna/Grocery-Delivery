const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/

export const parseMoneyToPaise = (value: unknown): number | null => {
    const normalized = typeof value === "number" ? value.toFixed(2) : String(value ?? "").trim()
    if (!MONEY_PATTERN.test(normalized)) return null
    const [rupees, fraction = ""] = normalized.split(".")
    const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"))
    return Number.isSafeInteger(paise) ? paise : null
}

export const paiseToDecimal = (paise: number) => {
    if (!Number.isSafeInteger(paise)) throw new Error("Money must use whole paise")
    return `${Math.trunc(paise / 100)}.${String(Math.abs(paise % 100)).padStart(2, "0")}`
}

export const calculateOrderMoney = (lines: Array<{ unitPricePaise: number; quantity: number }>) => {
    const subtotalPaise = lines.reduce((sum, line) => {
        const lineTotal = line.unitPricePaise * line.quantity
        if (!Number.isSafeInteger(line.unitPricePaise) || !Number.isSafeInteger(line.quantity) || line.quantity <= 0 || !Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(sum + lineTotal)) {
            throw new Error("Order amount exceeds the supported range")
        }
        return sum + lineTotal
    }, 0)
    const deliveryFeePaise = subtotalPaise >= 49_900 ? 0 : 3_500
    const taxPaise = Math.round(subtotalPaise * 5 / 100)
    return { subtotalPaise, deliveryFeePaise, taxPaise, totalPaise: subtotalPaise + deliveryFeePaise + taxPaise }
}
