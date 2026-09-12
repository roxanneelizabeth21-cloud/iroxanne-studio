# Activate the payment reminder Workflow

The reminder function and invoice controls are implemented and tested with mocks. No existing invoice was opted in during development. An active hourly trigger has NOT been verified or activated through this connection.

In the Base44 builder, request:

Create one active scheduled Workflow named "Studio payment reminders". Run the existing processPaymentReminders backend function every hour, with empty arguments and Base44's authenticated service context. Do not create a second reminder function or enable reminders on existing invoices. Verify that the function receives a service identity accepted by its authorization guard. Run a safe no-send check with no eligible invoices, then report the Workflow ID, active status, next run and successful run result. Do not send real client emails during this setup. Keep the current signatures, rush terms, handoff checklist, payment code and email formatting intact. Remove the reminder setup notice in InvoiceReminderSettings only after verification succeeds.

## Implementation
- Function: base44/functions/processPaymentReminders/entry.ts
- Invoice controls: src/components/admin/InvoiceReminderSettings.jsx
- Hourly sweep selects opted-in invoice IDs before changing flags, then rereads each invoice and payment ledger.
- Reminders target deposit or balance; the stage stops when fully paid or waived, invoice cancelled/paid, or chosen maximum reached.
- Default cadence: 7 days, maximum 3 sends; controls allow 1–30 days and 1–10 sends.
- Sends use the same Core.SendEmail html field and brand template as tested existing emails.
- An uncertain send disables the sequence; admin must check delivery before resuming.
- Avoid simultaneous executions. The pending state prevents automatic retries after uncertainty but is not an atomic lock across simultaneous workers.
- Tests: node scripts/delivery-checks.mjs (no external requests).
- No legacy function.jsonc automation is relied on; this app uses native Workflows.
