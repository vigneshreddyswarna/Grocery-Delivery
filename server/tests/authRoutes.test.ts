import express from "express"
import request from "supertest"
import { beforeEach,describe,expect,it,vi } from "vitest"

const mocks=vi.hoisted(()=>({
    findUnique:vi.fn(),create:vi.fn(),
    createToken:vi.fn().mockResolvedValue("verification-token"),
    sendVerification:vi.fn().mockResolvedValue(undefined),
}))

vi.mock("../config/prisma.js",()=>({prisma:{user:{findUnique:mocks.findUnique,create:mocks.create}}}))
vi.mock("../services/authToken.js",()=>({
    AUTH_TOKEN_TYPES:{VERIFY_EMAIL:"VERIFY_EMAIL",RESET_PASSWORD:"RESET_PASSWORD"},
    createUserAuthToken:mocks.createToken,consumeUserAuthToken:vi.fn(),
}))
vi.mock("../services/authEmail.js",()=>({
    sendVerificationEmail:mocks.sendVerification,sendPasswordResetEmail:vi.fn(),
}))

import authRouter from "../routes/authRoutes.js"

const app=express()
app.use(express.json())
app.use("/api/auth",authRouter)

describe("customer authentication API",()=>{
    beforeEach(()=>vi.clearAllMocks())

    it("rejects weak registration passwords",async()=>{
        const response=await request(app).post("/api/auth/register").send({name:"Asha",email:"asha@example.com",password:"short"})
        expect(response.status).toBe(400)
        expect(mocks.create).not.toHaveBeenCalled()
    })

    it("does not create duplicate accounts",async()=>{
        mocks.findUnique.mockResolvedValueOnce({id:"existing",emailVerifiedAt:new Date()})
        const response=await request(app).post("/api/auth/register").send({name:"Asha",email:"asha@example.com",password:"secure123"})
        expect(response.status).toBe(409)
    })

    it("resends verification for an unfinished signup",async()=>{
        mocks.findUnique.mockResolvedValueOnce({id:"existing",name:"Asha",email:"asha@example.com",emailVerifiedAt:null})
        const response=await request(app).post("/api/auth/register").send({name:"Asha",email:"asha@example.com",password:"secure123"})
        expect(response.status).toBe(200)
        expect(response.body.verificationRequired).toBe(true)
        expect(mocks.sendVerification).toHaveBeenCalled()
    })

    it("creates an account and sends verification",async()=>{
        mocks.findUnique.mockResolvedValueOnce(null)
        mocks.create.mockResolvedValueOnce({id:"user-1",name:"Asha",email:"asha@example.com"})
        const response=await request(app).post("/api/auth/register").send({name:"Asha",email:"ASHA@example.com",password:"secure123"})
        expect(response.status).toBe(201)
        expect(response.body.verificationRequired).toBe(true)
        expect(mocks.createToken).toHaveBeenCalledWith("user-1","VERIFY_EMAIL",1440)
        expect(mocks.sendVerification).toHaveBeenCalledWith("asha@example.com","Asha","verification-token")
    })
})
