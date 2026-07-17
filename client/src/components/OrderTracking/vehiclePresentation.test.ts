import { describe, expect, it } from "vitest"
import { bikeSvgPath, getVehiclePresentation, scooterSvgPath } from "./vehiclePresentation"

describe("delivery vehicle marker presentation", () => {
    it("uses the bike marker by default", () => {
        expect(getVehiclePresentation()).toEqual({ type: "bike", label: "Bike", path: bikeSvgPath })
    })

    it("uses the scooter marker for scooter partners", () => {
        expect(getVehiclePresentation("SCOOTER")).toEqual({ type: "scooter", label: "Scooter", path: scooterSvgPath })
    })

    it("safely falls back to bike for unsupported legacy values", () => {
        expect(getVehiclePresentation("car").type).toBe("bike")
    })
})
