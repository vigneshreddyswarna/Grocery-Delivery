import express from "express"
import { getMe, login, register } from "../controllers/authController.js";
import auth from "../middleware/auth.js";


const authRouter=express.Router();

authRouter.post('/register', register)
authRouter.post('/login',login)
authRouter.get('/me', auth, getMe)

export default authRouter
