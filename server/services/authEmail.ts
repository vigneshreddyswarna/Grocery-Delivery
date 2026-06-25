import sendEmail from "../config/nodemailer.js"

const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[character]!))
const clientUrl=()=>process.env.CLIENT_URL?.split(",")[0]?.trim() || "http://localhost:5173"

export const sendVerificationEmail=(to:string,name:string,otp:string)=>
    sendEmail({
        to,subject:"Verify your FreshCart account",
        body:`<h2>Welcome, ${escapeHtml(name)}</h2><p>Use this verification code to activate your FreshCart account.</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>This code expires in 15 minutes.</p>`,
    })

export const sendPasswordResetEmail=(to:string,name:string,token:string)=>
    sendEmail({
        to,subject:"Reset your FreshCart password",
        body:`<h2>Hello, ${escapeHtml(name)}</h2><p><a href="${clientUrl()}/reset-password?token=${token}">Reset your password</a></p><p>This link expires in 30 minutes. Ignore this email if you did not request it.</p>`,
    })

export const sendPartnerVerificationEmail=(to:string,name:string,otp:string)=>
    sendEmail({to,subject:"Activate your delivery partner account",body:`<h2>Hello, ${escapeHtml(name)}</h2><p>Use this verification code to activate your delivery partner account.</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>This code expires in 15 minutes.</p>`})

export const sendPartnerPasswordResetEmail=(to:string,name:string,token:string)=>
    sendEmail({to,subject:"Reset your delivery partner password",body:`<h2>Hello, ${escapeHtml(name)}</h2><p><a href="${clientUrl()}/delivery/reset-password?token=${token}">Reset your password</a></p><p>This link expires in 30 minutes.</p>`})
