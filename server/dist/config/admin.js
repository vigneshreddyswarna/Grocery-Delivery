const defaultAdminEmails = ["vigneshreddyswarna1907@gmail.com", "admin@example.com"];
const normalizeEmail = (email) => email.trim().replace(/^["']|["']$/g, "").toLowerCase();
export const getAdminEmails = () => {
    const envEmails = process.env.ADMIN_EMAILS
        ? process.env.ADMIN_EMAILS.split(",").map(normalizeEmail).filter(Boolean)
        : [];
    return Array.from(new Set([...envEmails, ...defaultAdminEmails]));
};
export const isAdminEmail = (email) => {
    if (!email)
        return false;
    return getAdminEmails().includes(normalizeEmail(email));
};
