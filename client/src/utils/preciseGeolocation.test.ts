import { afterEach, describe, expect, it, vi } from "vitest"
import { getPreciseCurrentPosition } from "./preciseGeolocation"

const position = (accuracy: number) => ({ coords: { latitude: 14.44, longitude: 79.98, accuracy } }) as GeolocationPosition

describe("precise geolocation", () => {
    afterEach(() => vi.unstubAllGlobals())
    it("selects a later, more accurate GPS reading", async () => {
        const clearWatch = vi.fn()
        vi.stubGlobal("navigator", { geolocation: {
            watchPosition: (success: PositionCallback) => { queueMicrotask(() => { success(position(300)); success(position(35)) }); return 7 },
            clearWatch,
        } })
        const result = await getPreciseCurrentPosition({ timeoutMs: 100, targetAccuracyMeters: 50 })
        expect(result.coords.accuracy).toBe(35)
        expect(clearWatch).toHaveBeenCalledWith(7)
    })
    it("rejects when geolocation is unavailable", async () => {
        vi.stubGlobal("navigator", {})
        await expect(getPreciseCurrentPosition()).rejects.toThrow("not supported")
    })
    it("rejects an inaccurate network location instead of pinning the wrong place", async () => {
        vi.stubGlobal("navigator", { geolocation: {
            watchPosition: (success: PositionCallback) => { queueMicrotask(() => success(position(900))); return 8 },
            clearWatch: vi.fn(),
        } })
        await expect(getPreciseCurrentPosition({ timeoutMs: 5, maxAcceptableAccuracyMeters: 100 }))
            .rejects.toThrow("approximate location")
    })
})
