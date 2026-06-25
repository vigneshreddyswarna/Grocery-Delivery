import { beforeEach, describe, expect, it, vi } from "vitest"
import bcrypt from "bcrypt"
import { createReq, createRes, getJson } from "./testUtils.js"

const mocks = vi.hoisted(() => ({
    prisma: {
        deliveryPartner: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        pendingDeliveryPartner: {
            findUnique: vi.fn(),
            deleteMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
        },
        $transaction: vi.fn(),
    },
    email: {
        sendPartnerVerificationEmail: vi.fn(),
    },
    authToken: {
        AUTH_TOKEN_TYPES: {
            VERIFY_EMAIL: "VERIFY_EMAIL",
            RESET_PASSWORD: "RESET_PASSWORD",
        },
        createPartnerAuthToken: vi.fn(),
        createVerificationOtp: vi.fn(),
    },
}))

vi.mock("../config/prisma.js", () => ({ prisma: mocks.prisma }))
vi.mock("../services/authEmail.js", () => ({
    sendPartnerVerificationEmail: mocks.email.sendPartnerVerificationEmail,
}))
vi.mock("../services/authToken.js", () => mocks.authToken)

const { createDeliveryPartner, confirmDeliveryPartner } = await import("../controllers/adminController.js")

beforeEach(() => {
    vi.clearAllMocks()
    mocks.authToken.createVerificationOtp.mockReturnValue("654321")
    mocks.email.sendPartnerVerificationEmail.mockResolvedValue({})
    mocks.prisma.$transaction.mockImplementation(async (callback: unknown) => {
        if (typeof callback === "function") return callback(mocks.prisma)
        return Promise.all(callback as Promise<unknown>[])
    })
})

describe("admin delivery partner onboarding", () => {
    it("stores partner details as pending and sends OTP without creating the real partner", async () => {
        mocks.prisma.deliveryPartner.findUnique.mockResolvedValue(null)
        mocks.prisma.pendingDeliveryPartner.deleteMany.mockResolvedValue({ count: 0 })
        mocks.prisma.pendingDeliveryPartner.create.mockResolvedValue({
            id: "pending-1",
            email: "partner@example.com",
        })

        const req = createReq({
            name: "Partner One",
            email: "partner@example.com",
            password: "Password123",
            phone: "9999999999",
            vehicleType: "bike",
        })
        const res = createRes()

        await createDeliveryPartner(req, res)

        expect(mocks.prisma.deliveryPartner.create).not.toHaveBeenCalled()
        expect(mocks.prisma.pendingDeliveryPartner.create).toHaveBeenCalled()
        expect(mocks.email.sendPartnerVerificationEmail).toHaveBeenCalledWith("partner@example.com", "Partner One", "654321")
        expect(res.status).toHaveBeenCalledWith(201)
        expect(getJson(res)).toMatchObject({
            pendingPartner: { id: "pending-1", email: "partner@example.com" },
        })
    })

    it("rejects invalid OTP and does not create a delivery partner", async () => {
        mocks.prisma.pendingDeliveryPartner.findUnique.mockResolvedValue({
            id: "pending-1",
            name: "Partner One",
            email: "partner@example.com",
            password: "hashed",
            phone: "9999999999",
            vehicleType: "bike",
            otpHash: "not-the-submitted-otp-hash",
            expiresAt: new Date(Date.now() + 60_000),
        })

        const req = createReq({ pendingPartnerId: "pending-1", otp: "111111" })
        const res = createRes()

        await confirmDeliveryPartner(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(mocks.prisma.deliveryPartner.create).not.toHaveBeenCalled()
        expect(getJson(res)).toMatchObject({ message: "Verification code is invalid" })
    })

    it("creates a verified delivery partner after the correct OTP is entered", async () => {
        const otp = "654321"
        const hashedPassword = await bcrypt.hash("Password123", 12)
        const crypto = await import("node:crypto")
        const otpHash = crypto.createHash("sha256").update(otp).digest("hex")

        mocks.prisma.pendingDeliveryPartner.findUnique.mockResolvedValue({
            id: "pending-1",
            name: "Partner One",
            email: "partner@example.com",
            password: hashedPassword,
            phone: "9999999999",
            vehicleType: "bike",
            otpHash,
            expiresAt: new Date(Date.now() + 60_000),
        })
        mocks.prisma.deliveryPartner.create.mockResolvedValue({
            id: "partner-1",
            name: "Partner One",
            email: "partner@example.com",
            phone: "9999999999",
            vehicleType: "bike",
            isActive: true,
            emailVerifiedAt: new Date(),
        })
        mocks.prisma.pendingDeliveryPartner.delete.mockResolvedValue({})

        const req = createReq({ pendingPartnerId: "pending-1", otp })
        const res = createRes()

        await confirmDeliveryPartner(req, res)

        expect(mocks.prisma.deliveryPartner.create).toHaveBeenCalled()
        expect(mocks.prisma.pendingDeliveryPartner.delete).toHaveBeenCalledWith({ where: { id: "pending-1" } })
        expect(res.status).toHaveBeenCalledWith(201)
        expect(getJson(res)).toMatchObject({
            message: "Delivery partner verified and created.",
            partner: { id: "partner-1", email: "partner@example.com" },
        })
    })
})
