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
Scheduled automatic payment requests, drawn signatures, rush-specific contract templates, and detailed delivery checklists are not included in this pass.
Existing contract wording remains the owner's wording.
