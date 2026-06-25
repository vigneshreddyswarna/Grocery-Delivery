import { beforeEach, describe, expect, it, vi } from "vitest"
import bcrypt from "bcrypt"
import { createReq, createRes, getJson } from "./testUtils.js"

const mocks = vi.hoisted(() => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
    authToken: {
        AUTH_TOKEN_TYPES: {
            VERIFY_EMAIL: "VERIFY_EMAIL",
            RESET_PASSWORD: "RESET_PASSWORD",
        },
        createVerificationOtp: vi.fn(),
        createUserAuthToken: vi.fn(),
        consumeUserAuthToken: vi.fn(),
    },
    email: {
        sendVerificationEmail: vi.fn(),
        sendPasswordResetEmail: vi.fn(),
    },
}))

vi.mock("../config/prisma.js", () => ({ prisma: mocks.prisma }))
vi.mock("../config/admin.js", () => ({
    isAdminEmail: (email: string | null | undefined) => email?.toLowerCase() === "admin@example.com",
}))
vi.mock("../services/authToken.js", () => mocks.authToken)
vi.mock("../services/authEmail.js", () => mocks.email)

const { register, login, verifyEmail } = await import("../controllers/authController.js")

beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = "test-secret-with-more-than-32-characters"
    mocks.authToken.createVerificationOtp.mockReturnValue("123456")
    mocks.authToken.createUserAuthToken.mockResolvedValue("123456")
    mocks.email.sendVerificationEmail.mockResolvedValue({})
})

describe("customer authentication", () => {
    it("creates an unverified account and sends an email OTP instead of logging in immediately", async () => {
        mocks.prisma.user.findUnique.mockResolvedValue(null)
        mocks.prisma.user.create.mockResolvedValue({
            id: "user-1",
            name: "Test User",
            email: "test@example.com",
            password: "hashed",
            role: "CUSTOMER",
        })

        const req = createReq({ name: "Test User", email: "test@example.com", password: "Password123" })
        const res = createRes()

        await register(req, res)

        expect(res.status).toHaveBeenCalledWith(201)
        expect(mocks.authToken.createUserAuthToken).toHaveBeenCalledWith("user-1", "VERIFY_EMAIL", 15, "123456")
        expect(mocks.email.sendVerificationEmail).toHaveBeenCalledWith("test@example.com", "Test User", "123456")
        expect(getJson(res)).toMatchObject({
            verificationRequired: true,
            email: "test@example.com",
        })
        expect(getJson(res)).not.toHaveProperty("token")
    })

    it("blocks login when the user has not verified their email", async () => {
        mocks.prisma.user.findUnique.mockResolvedValue({
            id: "user-1",
            email: "test@example.com",
            password: await bcrypt.hash("Password123", 12),
            emailVerifiedAt: null,
        })

        const req = createReq({ email: "test@example.com", password: "Password123" })
        const res = createRes()

        await login(req, res)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(getJson(res)).toMatchObject({ code: "EMAIL_NOT_VERIFIED" })
    })

    it("issues a token after a valid email OTP is consumed", async () => {
        mocks.authToken.consumeUserAuthToken.mockResolvedValue("user-1")
        mocks.prisma.user.update.mockResolvedValue({
            id: "user-1",
            name: "Test User",
            email: "test@example.com",
            role: "CUSTOMER",
            emailVerifiedAt: new Date(),
            addresses: [],
        })

        const req = createReq({ otp: "123456" })
        const res = createRes()

        await verifyEmail(req, res)

        expect(mocks.authToken.consumeUserAuthToken).toHaveBeenCalledWith("123456", "VERIFY_EMAIL")
        expect(getJson(res)).toMatchObject({ message: "Email verified" })
        expect(getJson(res).token).toEqual(expect.any(String))
    })
})
