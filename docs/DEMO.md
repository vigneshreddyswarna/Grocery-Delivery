# Demo walkthrough

Use this five-minute path when presenting FreshCart.

## Customer

1. Register and explain the single-use email verification link.
2. Browse categories, search for a product, and add items to the cart.
3. Select a saved address and point out coordinate validation.
4. Choose Stripe card or UPI and mention the visible test-mode notice.
5. Return to order history and open live tracking.

## Administrator

1. Show product and inventory management.
2. Open an order and assign an active delivery partner.
3. Explain the enforced order-state machine and securely generated OTP.

## Delivery partner

1. Sign in with a verified partner account.
2. Move the assigned order through Packed and Out for Delivery.
3. Share location and complete delivery using the customer OTP.

## Talking points

- Prices are recalculated from the database; the client cannot choose its own price.
- Stock reservation uses conditional updates inside a transaction to prevent overselling.
- Stripe webhooks and payment confirmation are idempotent.
- Customers cannot read another customer's order, and partners only see assigned deliveries.
- Test payments are intentional and safer for a public portfolio deployment.

Before recording screenshots or video, use seeded demo data and remove any personal email, address, location, or payment information.

