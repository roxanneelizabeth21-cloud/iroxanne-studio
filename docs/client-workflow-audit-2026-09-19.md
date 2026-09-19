# iRoxanne Studio — client workflow audit
Date: September 19, 2026
App: 6a94dbc673f0d144b6ed36bb

## Result
The source, saved business records, and owner preview were audited. Verified defects were repaired. This is a code/data audit with isolated regression tests and selected browser checks; it is not certification of live email delivery, calendar booking, uploads, or payment processing.

## The daily workflow
| Step | Customer experience | Your action | Connected record |
|---|---|---|---|
| Inquiry | Choose the $650 Business Website, a custom application, mobile work, or help deciding; select possible add-ons | Review the request and save consultation notes/status | Lead |
| Proposal | Review itemized scope, price, timeline and payment terms; accept or request changes | Quote approved additions; review and send proposal | Proposal.lead_id |
| Agreement | Review and sign the agreed scope | Open the agreement created from the accepted proposal; review and send | Contract.proposal_id and lead_id |
| Payment | Receive the invoice link after signing | Review/request payment; recover a missing invoice if needed | Invoice.contract_id and proposal_id; Payment.invoice_id and contract_id |
| Content intake | Save answers and return using the private link; see purchased scope | Send the linked intake; review answers and mark reviewed | ClientIntake.contract_id and lead_id; scope_snapshot |
| Build and review | Provide feedback on agreed work | Build/test the approved scope; quote changes separately | Agreement scope, intake and delivery checklist |
| Final handoff | Review checklist, request changes or acknowledge delivery | Confirm payment in full, complete checklist, release handoff, resolve feedback, then mark complete | Contract.handoff_* and delivered_at |
| Support | Receive the agreed support instructions | Define ongoing support separately in the proposal/agreement | Delivery checklist; no new subscription was created |

The existing application requires full payment before releasing final handoff. Work-in-progress review and final handoff are different steps. This audit did not change signed payment terms.

## Repairs made
- Corrected the project board's obsolete handoff status, missing change-request action, signed/intake progression and cancelled-project handling.
- Added direct links to the relevant request, proposal, agreement, invoice or intake, including navigation within the same Projects screen.
- Added consultation review and internal notes before proposal preparation.
- Prevented the proposal editor from saving changes over an accepted proposal.
- Hid the pipeline when its record queries fail rather than showing misleading partial next steps.
- Added an owner workflow guide.
- Replaced silent invoice failures with a customer warning, truthful owner notification and an admin-only Prepare missing invoice action.
- Reused an existing invoice on sequential recovery retries and stopped recovery when multiple or cancelled invoices need review.
- Replaced the unsupported drawn-signature upload call with the SDK UploadFile API. Upload failure leaves the agreement unsigned.
- Reconciled invoice and project status on payment retries without a second ledger entry.
- Preserved milestone indexes; partial milestones remain unpaid until fully funded. Corrected the remaining-amount input and the other-payment overpayment check.
- Required an actual, non-cancelled agreement for client intake access; client answers cannot replace the scope snapshot or relationship IDs.
- Required a signed active agreement before sending an intake; a failed lookup can no longer be mistaken for “no intake” and create another.
- Copied purchased scope into new intakes and display existing linked agreement scope for older intakes.
- Ensured Business Website intakes include Home, About, Services and Contact content sections.
- Added the approved $650 Business Website to saved pricing. Both proposal and agreement creation use the package and calculate the deposit from the existing 50% setting.
- Distinguished included website features from possible paid add-ons in the quote form and proposal review.
- Routed business-workflow email code through the existing Studio Gmail connection, since prospective clients may not be registered app users. Verified sender address, encoded HTML/Unicode correctly and exposed provider failures.
- Added authentication checks and test-record suppression to lead notification/follow-up handlers.

## Saved-data findings
Owner clarification: all agreements currently in the app are demo/fake agreements. They may be removed if needed. They were retained as useful fixtures during this audit; preserving them was not a constraint on the repairs.

Reviewed 3 leads, 2 proposals, 3 agreements, 2 invoices and 4 intakes.
Two unlinked intakes were explicitly identified in their existing data as TEST ONLY. Both were preserved and marked as test records. One test lead was similarly marked and excluded from the active inquiry queue.
Both invoices link to existing agreements. One missing invoice-to-proposal ID was backfilled from its agreement's explicit proposal link. The other agreement was created directly and has no proposal to link.
No signed scope, accepted price, payment amount, or customer response was rewritten.

## Internal pricing rules
- Business Website: $650 one-time, up to four pages, client-supplied content/branding, mobile layout, service-request form, owner dashboard/inquiry tracking, social links, supported call scheduling for one owner/calendar/appointment type, one revision round and launch handoff.
- Domain, platform, business email and third-party charges are separate.
- Inventory, in-app service scheduling, customer portals, billing, marketing automation, PWA and other business functions are separately scoped additions.
- Native/mobile application delivery requires its own scope and quote.
- The existing $65 internal hourly rate, 50% deposit default and older package/add-on settings were preserved. Earlier suggested add-on prices were not silently adopted as approved prices.
- For each new addition, estimate consultation, configuration, data setup, integration, testing, revisions and handoff time; add incremental project costs; remove duplicated setup when bundling. Record the agreed selling price as a proposal line item.
- A selected add-on on an inquiry is an expression of interest, not purchased scope. The itemized proposal and signed agreement control delivery.

## Verification completed
- Production build passed.
- ESLint passed for the changed frontend files.
- Document/signature regression tests: token/consent guards, unchanged agreement text, invoice links, repeat signature block, failed upload, failed invoice creation.
- Workflow regression tests: next actions, website intake pages, invoice relationship/reuse/duplicate guards, payment-write failure recovery, contract activation, partial milestone cap, protected intake fields, submitted intake lock, missing agreement guard, handoff changes, acceptance and admin-only completion.
- Existing voluntary-payment tests passed.
- Nine existing isolated Square payment-plan tests passed, including retry and reconciliation failures.
- Studio Gmail tests passed with mocked network responses: correct sender, external recipient, HTML/Unicode encoding, header injection prevention and failure reporting.
- Browser preview confirmed the active pipeline, direct customer-intake navigation, accepted-proposal agreement links, preserved accepted prices and selectable $650 package.
No live customer email, payment or signature was submitted by this audit.

## Remaining acceptance checks and limits
- Confirm actual delivery to a designated test inbox through Studio Gmail, including quote confirmation, proposal, agreement, invoice, intake and receipt.
- Confirm the deployed drawn-signature/file-upload integration with a clearly identified test agreement.
- Confirm configured calendar availability, booking and confirmation end-to-end with a designated test booking.
- Confirm live provider permissions/webhooks or the provider's sandbox payment round trip. Mocked tests cannot establish that credentials or webhooks are healthy.
- Check published-site anonymous/private-link behavior after deployment. Publish App was not clicked during this audit; frontend changes were checked in the editor preview. Source/resource edits and saved pricing/data changes were applied through Base44.
- Existing list queries have finite page limits. The current data is below those limits; full pagination and multi-user concurrent-write guarantees were not established.
- Sequential retries are tested. These changes do not create database-level uniqueness or transaction guarantees across concurrent requests.
- Dedicated per-add-on questionnaires, a full versioned change-order system and a support-ticket/subscription system were not built in this audit. The current intake shows the signed scope and collects workflow/data details.
