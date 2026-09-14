# Seven-payment plans — September 14, 2026

Studio app only: 6a94dbc673f0d144b6ed36bb.

## Use
Prepare a proposal or unsigned agreement. Use Dated payment plan, choose 1–7 total payments (first is deposit), build equal payments, then edit amounts and dates. Save and review before sending. Client acceptance copies the plan into the draft agreement. Signing copies it to the invoice. In Invoices & Payments, Send payment plan creates and publishes a native Square invoice; Square emails it and its configured reminders. Refresh Square plan reads the existing plan without another email.

Three or more payments require Square installment eligibility. Automatic card charging is NONE. Existing invoices and signed agreements are not migrated or changed.

## Accounting
For native Square plans, Square invoice payment-request cumulative totals are authoritative. The app stores square_payment_snapshot and derives its totals without appending duplicate Payment records. All plan payment history, offline entries, refunds and cancellations are managed in Square; local manual payment and separate checkout are blocked for planned invoices. Local client view shows cumulative paid/remaining by installment. Existing five-minute reconciliation workflow now also checks native plans. Refunds or provider changes to amounts/dates produce a visible review error rather than silently changing the signed schedule.

Existing non-plan ledger paths retain their preexisting behavior. This feature does not claim to resolve all previously audited legacy ledger concurrency/retry issues.

## Verification
- node tests/square-schedule.cjs: 9 mocked tests passed (1–7 counts, cents, invalid dates/sums, partial/final payments, binding mismatch, altered plan/refund rejection, retry recovery, existing-payment migration blocked).
- Additional isolated endpoint test passed: proposal acceptance → draft agreement → signing → seven-payment invoice; invalid token and re-signing rejected. No real records, emails, or payments.
- Targeted frontend ESLint passed.
- npm run build passed.
- No browser runtime installed; live browser/email/payment verification pending.
- Fixed clientContract invoice variable scope error. Existing signed-contract retry behavior retained.

## Activation pending
Square connection was active with PAYMENTS_READ, PAYMENTS_WRITE, ORDERS_READ, ORDERS_WRITE, MERCHANT_PROFILE_READ. Requested those same scopes plus CUSTOMERS_READ, CUSTOMERS_WRITE, INVOICES_READ, INVOICES_WRITE. User must complete OAuth consent, then verify granted scopes via list_connectors. Square subscription not verified. Publish frontend changes in Base44.

Automatic approval review rejected skipping legacy deposit/balance reminders. User approval was requested asynchronously; until answered, processPaymentReminders remains unchanged. New plan invoices default reminder_enabled=false, so do not enable legacy reminders on a native plan. After approval, skip legacy reminders ONLY for successfully published Square plans; leave other invoices unchanged and test it.

Existing Square workflow configuration is every five minutes. Actual scheduled execution and real payment reconciliation need live verification after OAuth.
