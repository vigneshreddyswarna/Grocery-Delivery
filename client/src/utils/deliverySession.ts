import type { DeliveryPartner } from "../types"
import { getStoredValue, removeStoredValue } from "./storage"

export function getSavedDeliveryPartner(): DeliveryPartner | null {
    const token = getStoredValue("delivery_token")
    const savedPartner = getStoredValue("delivery_partner")

    if (!token || !savedPartner) {
        clearDeliverySession()
        return null
    }

    try {
        const partner = JSON.parse(savedPartner) as DeliveryPartner
        if (!partner || typeof partner !== "object" || !partner.name) {
            clearDeliverySession()
            return null
        }
        return partner
    } catch {
        clearDeliverySession()
        return null
    }
}

export function clearDeliverySession() {
    removeStoredValue("delivery_partner", "delivery_token")
}
