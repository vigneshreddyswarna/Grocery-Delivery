export const getStoredValue = (key: string) => {
    try {
        return window.localStorage.getItem(key)
    } catch {
        return null
    }
}

export const setStoredValue = (key: string, value: string) => {
    try {
        window.localStorage.setItem(key, value)
        return true
    } catch {
        return false
    }
}

export const removeStoredValue = (...keys: string[]) => {
    try {
        keys.forEach((key) => window.localStorage.removeItem(key))
    } catch {
        // Storage can be unavailable in restrictive or private browser modes.
    }
}
