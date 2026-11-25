# Firestore Security Specification

## 1. Data Invariants
1. **Admin Authority**: Only the verified exporter administrator (`sak1990487@gmail.com` with `email_verified == true` or `/admins/{uid}`) may create, update, or delete `/products`, manage `/clients` status/creditTier, update/delete `/shipments`, or read/manage all `/orders` and `/inquiries`.
2. **Client Profile Isolation**: A client account at `/clients/{clientId}` can only be created when `clientId == request.auth.uid`, `data.uid == request.auth.uid`, and `data.role == 'client'`. Clients can never elevate their own `role`, `status`, or `creditTier`.
3. **Order Ownership & State Machine**: A client can only create `/orders/{orderId}` with `clientUid == request.auth.uid` and initial `status == 'pending_review'`. Clients can only read their own orders and can only cancel an order while it is still `pending_review`. Terminal states (`delivered`, `cancelled`) are locked against non-admin mutations.
4. **Shipment Lookup Isolation**: Public visitors can fetch a single shipment by exact `trackingNumber` (`get`), while `list` queries are strictly restricted to `isAdmin()` or `resource.data.clientUid == request.auth.uid`. Shipments contain zero personal email/phone PII.
5. **Inquiry PII Protection**: Contact inquiries (`/inquiries/{inquiryId}`) require authentication or verified submission constraints and cannot be read (`get`/`list`) by unrelated users; only `isAdmin()` or the authenticated `submitterUid` can read them.
6. **Temporal & ID Integrity**: All document IDs match `^[a-zA-Z0-9_-]+$` (`<= 128` chars). `createdAt` and `updatedAt` must equal `request.time` on creation, and `createdAt` is immutable on update.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Self-Admin Escalation**: Client creates `/clients/{uid}` with `role: "admin"` or updates `creditTier: "LC-Verified"`.
2. **Cross-Tenant Order Read/List**: Client A attempts `list` on `/orders` without filtering `clientUid == auth.uid` or attempts `get` on Client B's order.
3. **Order Status Bypass**: Client creates `/orders/{id}` with `status: "delivered"` or updates a `confirmed` order to `cancelled`.
4. **Product Catalog Tampering**: Non-admin user attempts to create, update `fobPriceUsd`, or delete `/products/{productId}`.
5. **Shadow Field Injection**: Payload includes an undeclared key `isVerified: true` on `/clients` or `/orders`.
6. **Email Spoofing**: Token with `email: "sak1990487@gmail.com"` and `email_verified: false` attempts admin write.
7. **ID Poisoning**: Attempt to write `/products/../../invalid` or a 500-character document ID.
8. **Payload Exhaustion**: Attempt to write a 20KB `sku` or unbounded `milestoneLog` array (`> 10` items) on `/shipments`.
9. **Shipment Scraping**: Anonymous or unrelated client runs `list` on `/shipments` without `clientUid == auth.uid`.
10. **Inquiry PII Scraping**: Non-admin user attempts `get` or `list` on `/inquiries`.
11. **Backdated Timestamp Forgery**: Client creates `/orders/{id}` with `createdAt` in the past instead of `request.time`.
12. **Immutable Owner Tampering**: Client attempts to update `clientUid` or `createdAt` on an existing order.
