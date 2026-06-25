# Portfolio notes

## Résumé description

**FreshCart — Full-stack grocery delivery platform**

- Built three role-specific React/TypeScript experiences for customers, administrators, and delivery partners on an Express, Prisma, and PostgreSQL backend.
- Implemented verified email authentication, Google Sign-In, password recovery, Stripe test payments, signed webhooks, atomic inventory reservation, and OTP delivery completion.
- Added 11 automated API and business-logic tests plus GitHub Actions CI; reduced initial JavaScript by roughly 49% and category-image weight by roughly 90%.

## Interview questions to prepare

- Why reserve inventory before redirecting to Stripe?
- How does the application prevent duplicate webhook fulfillment?
- Why are reset tokens hashed in the database?
- How is authorization different from frontend route protection?
- What trade-offs would be needed for multiple warehouses or delivery zones?

## Honest scope

FreshCart is a portfolio system using seeded catalog data and payment-provider test mode. It demonstrates production-oriented patterns without claiming to operate as a real retailer.
