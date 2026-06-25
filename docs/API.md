# API overview

All endpoints are prefixed with `/api`.

## Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create customer account and send verification |
| POST | `/auth/verify-email` | Consume email verification token |
| POST | `/auth/login` | Customer/admin password login |
| POST | `/auth/google` | Verify Google identity server-side |
| POST | `/auth/forgot-password` | Request generic password-reset response |
| POST | `/auth/reset-password` | Consume reset token and replace password |
| GET | `/auth/me` | Return current customer session |

Delivery equivalents are available under `/delivery`, including verification and password recovery.

## Commerce

- `/products`: browse products; administrators can create, update, and delete
- `/addresses`: customer-owned address CRUD
- `/orders`: create and list customer orders
- `/orders/payment/confirm`: verify Stripe Checkout return
- `/orders/:id/location`: customer-authorized delivery location
- `/stripe`: signed Stripe webhook receiver

## Operations

- `/admin/stats`: dashboard metrics
- `/admin/delivery-partners`: onboard and manage delivery accounts
- `/admin/orders/:id/assign`: assign an active partner
- `/delivery/my-deliveries`: partner-scoped delivery operations

Protected endpoints require a bearer token. Authorization is checked server-side; hiding a frontend route is not treated as security.

