# Vanilla & Somethin' Client Platform — Product & Operating Model

## Positioning
A design, budget and project-oversight partner for homeowners. The platform makes scope, decisions, money, responsibilities and progress visible. It does not promise guaranteed construction costs, contractor performance, statutory approvals or full-time supervision unless separately contracted.

## Service ladder
1. Complimentary Discovery Call — a no-fee initial conversation to understand the homeowner's goals, location, project stage, broad constraints and whether the studio may be a fit. It is not a paid consultation or professional assessment, and includes no drawings, estimates, quotation audit, structural advice, approvals, supervision or written technical deliverable.
2. Budget & Scope Advisory — defined review of client brief, options, assumptions, allowances, exclusions and third-party quotations. Indicative planning only; no guarantee or contractor certification.
3. Design Engagement — architecture/interiors/renovation scope, deliverables, revisions, fee stages, client decisions and exclusions in a written appointment.
4. Design Oversight — scheduled design/site reviews, decision records, observation reports, action owners and escalation. Explicitly distinguish periodic observation from construction supervision / PMC.
5. Handover & Aftercare — closeout checklist, final document register, open-item list and agreed post-handover review.

Fees are set by the studio per project complexity and appointment. Do not publish invented fixed prices or percentages. Any consultation credit against a larger appointment must be an explicit studio policy.

## Client journey
Enquiry → qualification → complimentary discovery call → written scope & fee (where there is a fit) → appointment / advance → brief freeze → concept → design development → approvals (where appointed) → tender / contractor comparison support (if separately scoped) → construction-stage design oversight (if contracted) → snag / handover → aftercare.

At every stage show current stage, next decision, owner, due date, client action required, approved scope, approved budget baseline, committed/actual/forecast amounts where reliable, changes awaiting approval, documents and meeting/site notes.

## Business model
- Revenue: fixed-fee or milestone-based design fees; separately scoped budget advisory; scheduled oversight retainers or visit packs; additional services/change orders. The initial discovery call is complimentary and is a qualification/conversion step, not a revenue line.
- Qualification: location and travel feasibility; project type/area; plot/property status; target timeline; budget range; decision makers; current stage; service sought.
- Proposal: scope, deliverables, exclusions, assumptions, timeline, fee schedule, payment milestones, revision allowance, client responsibilities, site visit frequency and reliance limitations.
- Guardrails: never present an indicative estimate as a quote; never compare contractor quotes without recording scope/specification differences; no hidden referral commissions; log conflicts; written client approval before scope or budget baseline changes.

## Client workspace (public, token-protected)
- Single-purpose private link, random 256-bit token, expiry/revocation, noindex/no-store/no-referrer.
- Client sees only explicitly published/approved project data: stage, milestones, next actions, approved budget summary, client-visible documents, approved meeting/site reports, decisions and change requests.
- Never expose internal notes, staff HR, margins, other clients, raw storage keys, private site photos, invoices or cost details by default.
- Client actions: submit brief, respond to decisions, approve/reject a proposal/change request, upload requested files, acknowledge reports. Each action records actor, timestamp and immutable activity event.
- Separate client-visible flag and publication workflow for every document/update. Default private.

## Admin workspace additions
- Qualification panel: fit indicators are advisory only; show missing data and follow-up date.
- Complimentary discovery call record: agenda, client questions, fit assessment, agreed follow-up and status. The call is always no-fee.
- Budget register: baseline version, line items, allowances, contingency, committed, actual, forecast, variance, source/date/confidence. Separate client-visible and internal values.
- Quote comparison: normalized line items, inclusions, exclusions, taxes, validity, payment terms and clarifications; never auto-select a contractor.
- Change control: request, reason, cost/time impact, attachments, status, client approval timestamp; revise baseline only after approval.
- Decision register: decision, options, recommendation, responsible party, deadline, status and evidence.
- Client publication: draft → preview → publish → revoke; audit trail.
- Site visit report: scope of visit, date, observations, photos, limitations, actions, responsible party and due date. Client-visible only after review.
- Handover: deliverables checklist, warranties/manuals, unresolved items, sign-off and aftercare.

## Proposed data collections
consultations, budgetVersions, budgetItems, quotes, quoteItems, changeRequests, decisions, clientUpdates, documents, approvals and auditEvents. Every record carries projectId, createdAt, updatedAt and createdBy. Client-visible records additionally carry visibility=client and publishedAt. Financial approvals store immutable approved snapshots and actor/time.

## Security & privacy
- Do not reuse onboarding tokens as portal credentials.
- Generate 32-byte random portal tokens; store only SHA-256 hash; enforce expiry, revocation, rate limiting and token rotation.
- Exchange URL token via POST for short-lived HttpOnly, Secure, SameSite=Lax cookie; immediately redirect to clean URL. Do not put tokens in analytics, logs, referrers or client-side storage.
- Server derives client/project relationship; never trust projectId/clientId from request body.
- Allowlist response fields. Separate admin APIs from portal APIs. Validate all writes server-side. Audit all approvals and financial baseline changes.
- Private documents use short-lived signed/download endpoints; never expose storage identifiers.
- Backups include all new collections and preserve numbering/approval history. Test restore and duplicate prevention.

## Delivery sequence
### Phase 1 — service & conversion
Publish /home-project-clarity/ and keep the first discovery call complimentary. **CRM qualification and discovery-call tracking are now implemented on `feat/consultation-qualification-workflow`**: project/property readiness, client-stated budget and timeline, decision participants, concerns, call booking/held status, call date/outcome, activity types and booked/held/appointment KPIs. Qualification data is retained when a lead converts to a client. **Proposal-template workflow is implemented** (Admin → Proposals): created from a CRM lead with the discovery-call notes prefilled; four scope templates (new home, home interiors, renovation, commercial interiors) with deliverables by stage, three scope levels, exclusions, assumptions, client responsibilities and standard terms; the studio enters every fee and the payment schedule splits it into whole-percentage stage payments; printable proposal; "Mark as sent" moves the lead to Pitched with a follow-up in 2 days; an accepted level becomes a GST quote in Billing. Standard terms should be reviewed once by the studio's lawyer. Public enquiry capture remains to be implemented and tested.
### Phase 2 — client portal MVP
Token exchange/session, published project timeline, milestones, next actions, document register, client decisions and report publication. Read-only financial summary initially.
### Phase 3 — budget/change control
Versioned budget baseline, quote comparison, change request approvals and variance reporting.
### Phase 4 — operational quality
Site reports, snag workflows, handover, aftercare, client notifications and analytics.

## Success measures
Qualified enquiry rate; discovery-call booking/show rate; discovery-call→appointment conversion; proposal turnaround; approval cycle time; change requests approved before work; budget variance with reason codes; overdue client decisions; site report turnaround; snag closure time; client satisfaction/referrals. Do not optimize for portal logins alone.

## Research translation — studio client-friction priorities

This is an internal studio workflow, not a marketplace. The research is qualitative and exploratory: individual homeowner accounts and regional context help identify design risks and service improvements, but do not establish how common each problem is. Treat these as hypotheses to validate through the studio's own enquiries, project reviews and client feedback.

### Client problems the studio can directly reduce

1. **Unclear first steps and professional responsibilities**
   - Explain what the studio does, what sits with the structural engineer, contractor and statutory authorities, and when each party becomes involved.
   - The complimentary discovery call clarifies fit and likely next step; it is not a technical assessment or a paid consultation.
   - Give clients a short, plain-language "what happens next" summary after the call.

2. **Unclear scope, fees and exclusions**
   - Use a consistent proposal structure: services, named deliverables, exclusions, assumptions, revision allowance, timeline, client responsibilities, fee stages and payment triggers.
   - State whether site visits, contractor coordination, procurement support, approval liaison and construction-stage observation are included, excluded or separately scoped.
   - Compare third-party quotations only when the client has separately engaged the studio for that work; normalize scope and specification differences rather than presenting headline totals as equivalent.

3. **Uncertainty about progress and who owes the next action**
   - Maintain a project stage, next milestone, next decision, responsible owner, due date and client action required.
   - Send concise meeting summaries with decisions, unresolved questions and action owners.
   - Make delays visible with a reason and revised next step rather than silently changing dates.

4. **Fear of hidden costs and uncontrolled changes**
   - Record the agreed budget as a dated baseline with assumptions and allowances.
   - Track known commitments, actuals and forecasts only where supported by reliable project information; label estimates and confidence.
   - Raise variations with reason, scope, cost/time impact and written client approval before treating the baseline as changed.
   - Do not imply the studio controls contractor pricing, material-market movements or construction outcomes.

5. **Limited visibility during site work, especially for clients who cannot visit**
   - For contracted site/design-oversight visits, create a dated report with visit purpose, observations, photographs where appropriate, action owner, due date and limitations.
   - Distinguish a periodic design observation from full-time supervision, quality certification or PMC.
   - Publish only reviewed, client-appropriate records; never promise remote monitoring where it is not part of the appointment.

6. **Stress at completion and handover**
   - Use a closeout register for agreed deliverables, open items, responsible parties, warranties/manuals where supplied, final decisions and follow-up.
   - Record unresolved items honestly; do not imply that a snag list is a guarantee of contractor rectification.

### Product rules

- Extend the existing CRM, onboarding and project records. Do not create a second CRM or a public directory.
- Keep the complimentary discovery call free, with no booking fee, consultation fee, credit or refund mechanism.
- Make client-facing commitments explicit and appointment-specific. Internal notes, staff information, margins and unapproved observations remain private.
- Every client-visible update must have an owner, date, review state and clear next action.
- Prefer a small number of dependable records over a large portal full of fields that the studio cannot keep current.
- No marketplace functions: no professional discovery/listings, public architect profiles, public reviews marketplace, lead brokerage, escrow, commissions or contractor matching.

### Delivery order for the studio

**First:** improve enquiry qualification and discovery-call follow-up; standardize proposal scope/fees/exclusions; record client decisions and action owners in the existing CRM.

**Next:** add a lightweight client-facing project summary with current stage, next milestone, pending client decisions and approved documents/updates. Only publish information the team can reliably maintain.

**Then:** add budget baseline and variation approval records; site-visit reports for contracted visits; and a structured handover checklist.

**Validate before expanding:** review actual enquiry drop-off, repeated client questions, proposal clarification cycles, overdue decisions, change approvals, site-report turnaround and handover issues. The research's anecdotes are prompts for these checks, not prevalence statistics.
