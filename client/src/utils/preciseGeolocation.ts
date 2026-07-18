export const MAX_ACCEPTABLE_ACCURACY_METERS = 100

export const getPreciseCurrentPosition = (
    options: { timeoutMs?: number; targetAccuracyMeters?: number; maxAcceptableAccuracyMeters?: number } = {},
): Promise<GeolocationPosition> => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported by this browser"))
    const timeoutMs = options.timeoutMs ?? 45_000
    const targetAccuracy = options.targetAccuracyMeters ?? 40
    const maxAcceptableAccuracy = options.maxAcceptableAccuracyMeters ?? MAX_ACCEPTABLE_ACCURACY_METERS
    let best: GeolocationPosition | undefined
    let settled = false
    let timer = 0
    let watchId = 0
    const finish = (error?: GeolocationPositionError | Error) => {
        if (settled) return
        settled = true
        navigator.geolocation.clearWatch(watchId)
        window.clearTimeout(timer)
        if (best && best.coords.accuracy <= maxAcceptableAccuracy) resolve(best)
        else if (best) reject(new Error(`Your device only provided an approximate location (±${Math.round(best.coords.accuracy)} m). Enable Precise Location and try outdoors or near a window.`))
        else reject(error ?? new Error("Unable to determine your current location"))
    }
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            if (!best || position.coords.accuracy < best.coords.accuracy) best = position
            if (position.coords.accuracy <= targetAccuracy) finish()
        },
        (error) => { if (error.code === error.PERMISSION_DENIED) finish(error) },
        { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs },
    )
    timer = window.setTimeout(() => finish(new Error("Location detection timed out")), timeoutMs)
})
