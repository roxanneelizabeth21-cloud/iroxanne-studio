# iRoxanne Studio workflow
Implemented in the existing Base44 app, without publishing the site or sending client emails during development.

## Where to find it
- Admin → Quotes & Proposals: new leads, proposal creation, client change requests, private proposal links.
- Admin → Contracts: draft agreements, signatures, pricing settings, intake, and explicit delivery completion.
- Admin → Invoices: deposit and balance requests, manual partial payments, payment history.

## Behavior
- New proposal links expire 72 hours after sending by default. Settings can change the interval.
- Saving an edited proposal returns it to draft; sending opens it to responses again.
- Accepted proposals carry scope, deliverables, timeline, pricing, and the saved agreement terms into a draft contract.
- Signature consent is checked by the backend and stored with signature audit details.
- Money uses cent rounding. Historic manual paid statuses are retained when starting the payment ledger.
- Repeated payment requests with the same request ID are recognized. This is retry protection, not a transactional guarantee across simultaneous sessions.
- Recording payment never marks a project delivered.
- Contract and invoice emails use the shared brand template.
- Six supplied project feature lists are populated. Bonded was left unchanged because no feature list was supplied.

## Verification
- Production frontend build passed.
- ESLint passed for changed frontend files.
- 16 isolated workflow tests passed, including partial/full payments and retry handling.
- Entity schema and portfolio record readbacks confirmed the saved changes.
- Tests use mocks; live browser, live email delivery, simultaneous request handling, and real payment-provider callbacks have not been verified.

## Still deferred
Payment-provider setup and automatic payment reconciliation. No payment provider was connected.
## Added September 12
- Contract signing supports typed names or drawn PNG signatures with name, consent and timestamp. The signature is visible on the signed agreement.
- Contracts → New/Edit has a target date and standard/rush schedule selection. Dates under 30 days away suggest the editable rush addendum. Master rush wording is in Pricing Settings; each agreement saves its own wording. Signed agreements cannot be edited through the admin form.
- Contracts → Handoff checklist includes 12 items spanning scope, testing, launch, access, documentation, training and support. Customize required items and client-visible notes; keep internal notes separate. Save and create a private link, collect client acceptance or follow-up, then mark delivered. Reopening requires acceptance again.
- Invoices → Payment reminders has opt-in controls, stage, start time, frequency, limit and pause. The backend stops after payment or cancellation and pauses uncertain sends.
- Reminder function/controls are implemented, but hourly Workflow activation remains unverified. See payment-reminder-activation.md for the exact final setup request.
- Existing invoices were not opted into reminders. No real client emails were sent in these tests.
- Production build, changed-file ESLint and 6 additional mocked delivery test groups passed, alongside the earlier 16 workflow tests. Browser interactions and the live scheduled dispatch still require verification.
- Separate payment-provider changes appeared in the shared app during this pass and were preserved; their readiness is outside this verification.
