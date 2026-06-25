import { describe,expect,it } from "vitest"
import { canTransitionOrder,isOrderStatus } from "../utils/orderStatus.js"

describe("order lifecycle",()=>{
    it("allows the supported fulfillment path",()=>{
        expect(canTransitionOrder("Placed","Confirmed")).toBe(true)
        expect(canTransitionOrder("Confirmed","Assigned")).toBe(true)
        expect(canTransitionOrder("Assigned","Packed")).toBe(true)
        expect(canTransitionOrder("Packed","Out for Delivery")).toBe(true)
        expect(canTransitionOrder("Out for Delivery","Delivered")).toBe(true)
    })

    it("rejects skipped and terminal transitions",()=>{
        expect(canTransitionOrder("Placed","Delivered")).toBe(false)
        expect(canTransitionOrder("Delivered","Cancelled")).toBe(false)
        expect(canTransitionOrder("Cancelled","Assigned")).toBe(false)
    })

    it("rejects unknown status values",()=>{
        expect(isOrderStatus("Shipped")).toBe(false)
        expect(isOrderStatus(null)).toBe(false)
    })
})
