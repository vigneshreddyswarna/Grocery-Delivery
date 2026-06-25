import { createTransport } from "nodemailer";
// Create a transporter using SMTP
const transporter = createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    disableFileAccess: true,
    disableUrlAccess: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendEmail = async ({ to, subject, body }) => {
    const senderEmail = process.env.SENDER_EMAIL?.trim();
    if (!senderEmail)
        throw new Error("SENDER_EMAIL is not configured");
    const response = await transporter.sendMail({
        from: { name: "FreshCart", address: senderEmail },
        to,
        subject,
        html: body,
        text: body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
    if (response.rejected.length) {
        throw new Error("Email provider rejected the recipient");
    }
    if (process.env.NODE_ENV !== "production") {
        console.info(`Email accepted by provider: ${response.messageId}; recipients=${response.accepted.length}`);
    }
    return response;
};
export default sendEmail;
