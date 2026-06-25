import { beforeEach,describe,expect,it,vi } from "vitest"

const mocks=vi.hoisted(()=>({
    updateMany:vi.fn(),findUnique:vi.fn(),send:vi.fn(),transaction:vi.fn(),
}))

vi.mock("../config/prisma.js",()=>({prisma:{
    order:{updateMany:mocks.updateMany,findUnique:mocks.findUnique},
    $transaction:mocks.transaction,
}}))
vi.mock("../inngest/index.js",()=>({inngest:{send:mocks.send}}))

import { fulfillPaidOrder,releaseUnpaidOrder } from "../services/orderPayment.js"

describe("payment fulfillment",()=>{
    beforeEach(()=>vi.clearAllMocks())

    it("fulfills a paid order only once",async()=>{
        mocks.updateMany.mockResolvedValueOnce({count:1})
        mocks.findUnique.mockResolvedValueOnce({id:"order-1",items:[{product:"product-1",quantity:2}]})
        await expect(fulfillPaidOrder("order-1")).resolves.toBe(true)
        expect(mocks.send).toHaveBeenCalledWith({name:"order/placed",data:{orderId:"order-1"}})

        mocks.updateMany.mockResolvedValueOnce({count:0})
        await expect(fulfillPaidOrder("order-1")).resolves.toBe(false)
        expect(mocks.send).toHaveBeenCalledTimes(2)
    })

    it("releases reserved stock when an unpaid checkout expires",async()=>{
        const tx={
            order:{findFirst:vi.fn().mockResolvedValue({id:"order-1",items:[{product:"product-1",quantity:2}]}),deleteMany:vi.fn().mockResolvedValue({count:1})},
            product:{update:vi.fn().mockResolvedValue({})},
        }
        mocks.transaction.mockImplementationOnce((callback:(client:typeof tx)=>unknown)=>callback(tx))
        await expect(releaseUnpaidOrder("order-1")).resolves.toBe(true)
        expect(tx.product.update).toHaveBeenCalledWith({where:{id:"product-1"},data:{stock:{increment:2}}})
    })
})
