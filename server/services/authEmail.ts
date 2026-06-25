import sendEmail from "../config/nodemailer.js"

const clientUrl=()=>process.env.CLIENT_URL?.split(",")[0]?.trim() || "http://localhost:5173"
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[character]!))

export const sendVerificationEmail=(to:string,name:string,token:string)=>
    sendEmail({
        to,subject:"Verify your FreshCart account",
        body:`<h2>Welcome, ${escapeHtml(name)}</h2><p>Verify your email to activate your account.</p><p><a href="${clientUrl()}/verify-email?token=${token}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
    })

export const sendPasswordResetEmail=(to:string,name:string,token:string)=>
    sendEmail({
        to,subject:"Reset your FreshCart password",
        body:`<h2>Hello, ${escapeHtml(name)}</h2><p><a href="${clientUrl()}/reset-password?token=${token}">Reset your password</a></p><p>This link expires in 30 minutes. Ignore this email if you did not request it.</p>`,
    })

export const sendPartnerVerificationEmail=(to:string,name:string,token:string)=>
    sendEmail({to,subject:"Activate your delivery partner account",body:`<h2>Hello, ${escapeHtml(name)}</h2><p><a href="${clientUrl()}/delivery/verify-email?token=${token}">Verify your email</a></p><p>This link expires in 24 hours.</p>`})

export const sendPartnerPasswordResetEmail=(to:string,name:string,token:string)=>
    sendEmail({to,subject:"Reset your delivery partner password",body:`<h2>Hello, ${escapeHtml(name)}</h2><p><a href="${clientUrl()}/delivery/reset-password?token=${token}">Reset your password</a></p><p>This link expires in 30 minutes.</p>`})
