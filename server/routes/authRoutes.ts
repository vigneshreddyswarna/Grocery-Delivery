import express from "express"
import { forgotPassword, getMe, googleLogin, login, register, resendVerification, resetPassword, verifyEmail } from "../controllers/authController.js";
import auth from "../middleware/auth.js";


const authRouter=express.Router();

authRouter.post('/register', register)
authRouter.post('/login',login)
authRouter.post('/google',googleLogin)
authRouter.post('/verify-email',verifyEmail)
authRouter.post('/resend-verification',resendVerification)
authRouter.post('/forgot-password',forgotPassword)
authRouter.post('/reset-password',resetPassword)
authRouter.get('/me', auth, getMe)

export default authRouter
