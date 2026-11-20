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
- Consultation record: agenda, notes, recommendations, follow-up and fee status.
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
Publish /home-project-clarity/, add enquiry qualification fields to CRM, consultation workflow, proposal template and service SOP. Track enquiry→consultation→appointment conversion.
### Phase 2 — client portal MVP
Token exchange/session, published project timeline, milestones, next actions, document register, client decisions and report publication. Read-only financial summary initially.
### Phase 3 — budget/change control
Versioned budget baseline, quote comparison, change request approvals and variance reporting.
### Phase 4 — operational quality
Site reports, snag workflows, handover, aftercare, client notifications and analytics.

## Success measures
Qualified enquiry rate; discovery-call booking/show rate; discovery-call→appointment conversion; proposal turnaround; approval cycle time; change requests approved before work; budget variance with reason codes; overdue client decisions; site report turnaround; snag closure time; client satisfaction/referrals. Do not optimize for portal logins alone.