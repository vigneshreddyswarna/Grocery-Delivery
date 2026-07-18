export const MAX_ACCEPTABLE_ACCURACY_METERS = 150

export const getPreciseCurrentPosition = (
    options: { timeoutMs?: number; targetAccuracyMeters?: number } = {},
): Promise<GeolocationPosition> => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported by this browser"))
    const timeoutMs = options.timeoutMs ?? 20_000
    const targetAccuracy = options.targetAccuracyMeters ?? 50
    let best: GeolocationPosition | undefined
    let settled = false
    let timer = 0
    let watchId = 0
    const finish = (error?: GeolocationPositionError | Error) => {
        if (settled) return
        settled = true
        navigator.geolocation.clearWatch(watchId)
        window.clearTimeout(timer)
        if (best) resolve(best)
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
