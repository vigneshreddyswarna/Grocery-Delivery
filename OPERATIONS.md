# FreshCart Operations Runbook

## Monitoring

- GitHub Actions checks the storefront, API process health, and database readiness every 30 minutes.
- Vercel Web Analytics records privacy-conscious page views and Web Vitals after it is enabled for the web project.
- API responses include `x-request-id`; Vercel logs receive structured JSON containing request ID, route, status, and duration.
- `/api/health` verifies the API process. `/api/ready` additionally verifies the database connection and returns HTTP 503 when unavailable.

Investigate any failed production-monitor run immediately. Check the matching `x-request-id` in Vercel logs, then verify Vercel, Neon, Stripe, Brevo, Cloudinary, and Inngest service status as applicable.

## Database backups

The database provider remains the source of truth for backups. Enable Neon point-in-time restore for the production branch and retain at least seven days. Once per month:

1. Create an isolated restore branch from a recent restore point.
2. Point a temporary local API instance at the restored branch.
3. Run Prisma migrations and verify customer, product, order, address, and delivery-partner counts.
4. Record the restore time and any errors in a private operations log.
5. Delete the isolated restore branch after validation.

Never restore over production as a test. Never commit database URLs or exported customer data.

## Incident response

1. Confirm impact using `/api/health` and `/api/ready`.
2. Freeze risky deployments and preserve logs.
3. Roll back the affected Vercel deployment when the application caused the incident.
4. Restore to an isolated Neon branch first when data corruption is suspected.
5. Document timeline, root cause, recovery, and a prevention action.

## Real-user validation

Review Vercel Web Analytics and Web Vitals weekly. Record failed searches, checkout abandonment, payment failures, address-detection failures, and delivery completion time using aggregated, non-sensitive metrics. Do not send addresses, coordinates, tokens, email addresses, or payment information to analytics.
