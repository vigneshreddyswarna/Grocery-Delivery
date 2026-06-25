const normalizeEmail = (email: string) => email.trim().replace(/^["']|["']$/g, "").toLowerCase();

export const getAdminEmails = () => {
    const envEmails = process.env.ADMIN_EMAILS
        ? process.env.ADMIN_EMAILS.split(",").map(normalizeEmail).filter(Boolean)
        : [];

    return Array.from(new Set(envEmails));
};

export const isAdminEmail = (email: string | null | undefined) => {
    if (!email) return false;
    return getAdminEmails().includes(normalizeEmail(email));
};
