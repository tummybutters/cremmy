<!-- Pipeline Logic Specification v1 -->

# Pipeline Logic Specification v1 — engagement.pipeline_stage

## Summary
- Customer-facing lifecycle built as deterministic state machine; no direct stage jumps that bypass required intent checkpoints.
- Every transition emits structured activities and automation payloads so downstream agents (tasks, comms, analytics) stay synchronized.
- Staleness heuristics tiered by stage bands (lead, evaluation, deal, delivery) with escalating nudges and auto-reassignment hooks.
- Reversals allowed only when risk is acceptable; hard stops guard against skipping discovery or negotiation except via explicit overrides.
- Verification checklist ensures each stage enforces entry prerequisites, automation coverage, and stale timers before production release.

## State Machine Diagram (text form)
```
cold_lead
  → contacted
contacted
  → cold_lead (qualified rejection)
  → interested
interested
  → warm
  → contacted (if engagement regresses)
warm
  → discovery_scheduled
  → interested
discovery_scheduled
  → discovery_done
  → warm (if meeting cancels)
discovery_done
  → proposal_drafting
  → discovery_scheduled (needs redo)
proposal_drafting
  → proposal_sent
proposal_sent
  → negotiation
  → warm (if major scope change)
negotiation
  → closed_won
  → closed_lost
  → proposal_sent (if edits required)
closed_won
  → onboarding
closed_lost
  → cold_lead (if re-qualified later)
onboarding
  → delivering
delivering
  → maintenance
  → onboarding (if onboarding issues recur)
maintenance
  → delivering (for new scope)
  → cold_lead (if churned; treated as net-new)
```

## Stage Definitions

### cold_lead
- **Enter**: record created via import/webhook; minimal qualification; no human outreach yet.
- **Exit**: outbound touch logged or lead disqualified.
- **Valid transitions**: `contacted`, `closed_lost` (self-disqualified), `cold_lead` (noop), `maintenance` (recycled dormant client), `closed_won` (hard stop, see policies).
- **Forbidden**: direct to `warm`, `discovery_*`, `proposal_*`, `negotiation`, `onboarding`, `delivering`.
- **Intent**: prioritize research and first contact.
- **Automations**: auto-create “Research lead” task; log activity; schedule stale timer (3 days) for outreach reminder.

### contacted
- **Enter**: outbound activity logged; awaiting response.
- **Exit**: intent qualified (interest) or no response leading back to cold.
- **Valid transitions**: `interested`, `cold_lead`, `closed_lost`.
- **Forbidden**: forward skip to `warm+` without marking interest.
- **Intent**: confirm fit, secure response.
- **Automations**: auto-create follow-up task 48h later; log contact attempt.

### interested
- **Enter**: prospect signaled curiosity (reply, click, referred).
- **Exit**: deeper qualification achieved (`warm`) or interest cools (`contacted`).
- **Valid transitions**: `warm`, `contacted`, `closed_lost`.
- **Forbidden**: jumping to discovery/proposal without warm handoff note.
- **Intent**: align on pain, confirm authority/timing.
- **Automations**: start interest nurture sequence; log interest flag; set SLA 4d to advance.

### warm
- **Enter**: BANT-style qualification satisfied; decision maker engaged.
- **Exit**: meeting booked (`discovery_scheduled`) or regression to `interested`.
- **Valid transitions**: `discovery_scheduled`, `interested`, `proposal_sent` (soft stop), `closed_lost`.
- **Forbidden**: `proposal_drafting` or beyond unless discovery scheduled (policy-managed exception).
- **Intent**: prep discovery, align expectations.
- **Automations**: create “Discovery prep” checklist; assign owner.

### discovery_scheduled
- **Enter**: calendar event confirmed with required participants.
- **Exit**: meeting completed (`discovery_done`) or canceled (`warm`).
- **Valid transitions**: `discovery_done`, `warm`.
- **Forbidden**: proposal/negotiation before discovery performed.
- **Intent**: ensure meeting happens.
- **Automations**: auto-create “Finalize agenda” task; send internal reminder; log schedule event.

### discovery_done
- **Enter**: discovery call completed; notes captured.
- **Exit**: move to proposal drafting or re-run discovery.
- **Valid transitions**: `proposal_drafting`, `discovery_scheduled`, `closed_lost`.
- **Forbidden**: direct to `proposal_sent` without drafting stage recorded.
- **Intent**: capture requirements, confirm budget.
- **Automations**: enforce note attachment; create “Draft proposal” task; update lifecycle → qualified.

### proposal_drafting
- **Enter**: discovery notes approved, solutioning underway.
- **Exit**: proposal delivered to client.
- **Valid transitions**: `proposal_sent`, `discovery_done` (if missing info).
- **Forbidden**: jumping to `negotiation` without sending proposal.
- **Intent**: craft offer, internal approvals.
- **Automations**: start drafting checklist; set deadline (5 business days); log internal review activity.

### proposal_sent
- **Enter**: proposal delivered, awaiting feedback.
- **Exit**: negotiation begins or scope reset.
- **Valid transitions**: `negotiation`, `warm`, `proposal_drafting`, `closed_lost`.
- **Forbidden**: `closed_won` without negotiation step (hard stop except micro-deals flagged).
- **Intent**: track client reactions, schedule review.
- **Automations**: create follow-up tasks (24h & 5d); send read-receipt webhook; update lifecycle → evaluation.

### negotiation
- **Enter**: client discussing terms, pricing, legal.
- **Exit**: win or loss, or revert for revised proposal.
- **Valid transitions**: `closed_won`, `closed_lost`, `proposal_sent`.
- **Forbidden**: `onboarding` without `closed_won`.
- **Intent**: resolve objections, finalize contract.
- **Automations**: create “Negotiation tracker”; escalate to exec sponsor after 10 days; log every counter-offer.

### closed_won
- **Enter**: contract signed, deposit/PO received.
- **Exit**: start onboarding.
- **Valid transitions**: `onboarding`, `maintenance` (if immediate handoff), `delivering` (soft stop when onboarding waived).
- **Forbidden**: revert to deal stages without explicit reopen workflow.
- **Intent**: confirm revenue, kick off delivery.
- **Automations**: update client lifecycle → active; trigger billing webhook; create onboarding task bundle.

### closed_lost
- **Enter**: opportunity terminated or prospect unresponsive after negotiation attempts.
- **Exit**: re-engage later as `cold_lead`.
- **Valid transitions**: `cold_lead`, `contacted` (if immediate retry), `interested`.
- **Forbidden**: direct to `proposal_sent+` without net-new cycle.
- **Intent**: capture loss reason, tidy records.
- **Automations**: log loss reason mandatory; notify owner; schedule recycle review (90 days).

### onboarding
- **Enter**: kickoff form completed; internal team assigned.
- **Exit**: go-live tasks complete (`delivering`) or revert to `closed_won` if contract issue.
- **Valid transitions**: `delivering`, `closed_won`.
- **Forbidden**: `maintenance` without delivery history.
- **Intent**: implement solution, configure tooling.
- **Automations**: task bundle for onboarding checklist; lifecycle stays active; send welcome notification.

### delivering
- **Enter**: active fulfillment in progress (campaigns, services).
- **Exit**: move to `maintenance` after steady-state, or back to `onboarding` if scope resets.
- **Valid transitions**: `maintenance`, `onboarding`, `closed_lost` (if terminated mid-delivery).
- **Forbidden**: return to lead stages.
- **Intent**: execute engagement, monitor KPIs.
- **Automations**: weekly status task; client health score updates; webhook to analytics worker.

### maintenance
- **Enter**: engagement in steady-state retainer/post-delivery support.
- **Exit**: upsell/new scope (`delivering`), churn (→ `cold_lead`), or closure (→ `closed_lost` via churn flow).
- **Valid transitions**: `delivering`, `cold_lead`, `closed_lost`.
- **Forbidden**: `proposal_sent` without requalification.
- **Intent**: retain, upsell, monitor satisfaction.
- **Automations**: quarterly business review task; churn-risk watcher (60-day inactivity); log lifecycle → retained.

## Transition Rules

| From → To | Allowed? | Preconditions | Forbidden Reason (if any) |
|-----------|----------|---------------|---------------------------|
| cold_lead → contacted | Yes | At least one outbound task logged. | — |
| cold_lead → closed_won | No (hard stop) | Requires sequential path through negotiation; override flag needed. | Skips qualification and contract flow. |
| contacted → interested | Yes | Prospect responded with interest signal. | — |
| contacted → warm | No | Requires interest confirmation. | Prevents jumping without qualification. |
| interested → warm | Yes | Qualification form complete; champion identified. | — |
| warm → discovery_scheduled | Yes | Meeting booked with required roles. | — |
| warm → proposal_sent | Soft stop | Allowed only if discovery waived per policy and executive approval. | Maintains discovery discipline. |
| discovery_scheduled → discovery_done | Yes | Meeting held, notes captured. | — |
| discovery_done → proposal_drafting | Yes | Requirements documented, pricing model selected. | — |
| proposal_drafting → proposal_sent | Yes | Internal approvals recorded. | — |
| proposal_sent → negotiation | Yes | Client acknowledged receipt or meeting scheduled. | — |
| negotiation → closed_won | Yes | Signed agreement + payment evidence. | — |
| negotiation → closed_lost | Yes | Loss reason captured. | — |
| closed_won → onboarding | Yes | Kickoff prerequisites satisfied. | — |
| onboarding → delivering | Yes | Onboarding checklist complete. | — |
| delivering → maintenance | Yes | Delivery steady-state for 30 days. | — |
| maintenance → cold_lead | Soft stop | Use when churned but future re-engagement expected. | Prefer closed_lost churn for analytics. |

Forbidden transitions not listed are implicitly disallowed; attempting them should raise validation error referencing this table.

## Side-Effects & Automations
- **Task Creation**: Each stage has default task bundles (research, follow-ups, prep, drafting, onboarding, delivery, QBR). Post-transition logic checks if tasks already exist to avoid duplicates.
- **Activity Logging**: Every transition emits `pipeline_stage_changed` activity with metadata `{from, to, actor, timestamp, reason}` plus stage-specific fields (e.g., meeting_id, deal_value).
- **Lifecycle Changes**:
  - `discovery_done` → lifecycle `qualified`.
  - `proposal_sent` → lifecycle `evaluation`.
  - `closed_won`/`onboarding`/`delivering`/`maintenance` → lifecycle `active`.
  - `closed_lost` → lifecycle `inactive`.
- **Notifications/Webhooks**:
  - `proposal_sent`, `negotiation`, `closed_won`, `closed_lost` trigger webhook events for integrations (billing, analytics, BI).
  - `discovery_scheduled` sends ICS payload to calendar service.
  - `negotiation` stagnation triggers escalation webhook after 10 days idle.
- **Client Ownership**: Transitioning into `warm+` locks owner; reassign requires admin override recorded in activity log.

## Staleness Rules
- **Lead band (cold/contacted/interested)**: Flag stale after 3/5/7 days without outbound activity respectively; auto-create follow-up task and notify owner. After 14 days untouched, auto-move to `cold_lead` with “stale” note unless snoozed.
- **Evaluation band (warm → proposal_sent)**: SLA 5 days per stage. If `warm` idle >5 days, escalate to manager. `proposal_drafting` idle >7 days triggers reminder to ops; `proposal_sent` idle >10 days triggers negotiation escalation workflow.
- **Deal band (negotiation)**: Idle >10 days → escalate; >20 days auto-move to `closed_lost` with reason “timed out” unless manual override.
- **Delivery band (onboarding/delivering)**: `onboarding` idle >14 days without progress → alert implementation lead; may revert to `closed_won` pending start. `delivering` idle >21 days (no status updates) triggers risk flag.
- **Maintenance**: If no touchpoints for 60 days, mark “at-risk” and schedule QBR; 120 days idle auto-prompt churn workflow (option to move to `cold_lead` or `closed_lost`).

## Operational Guidelines
- **Stage Reversals**: Allowed within adjacent stages (e.g., `warm` ↔ `interested`, `proposal_sent` ↔ `proposal_drafting`). Non-adjacent reversals require admin note referencing reason.
- **User Confirmation**: Required when moving backward from revenue stages (`closed_won`, `onboarding`, `delivering`, `maintenance`) to any deal stage; prompt to confirm financial implications.
- **Hard Stops**: Prevent `cold_lead → closed_won`, `contacted → negotiation`, `discovery_* → closed_won`, `proposal_sent → onboarding`. Override only via `force_transition` flag with audit trail.
- **Soft Stops**: `warm → proposal_sent`, `maintenance → cold_lead`, `delivering → onboarding`. System warns but allows with justification text.
- **Escalations**: Manager alerts for repeated reversals (>2) within 30 days; automation to suggest coaching.
- **Ownership**: Stage change requires explicit assignee; system blocks transition if owner missing.

## Verification Checklist
- [ ] Every stage enforces entry preconditions in validation layer.
- [ ] Transition graph implemented with explicit allowlist.
- [ ] Automation hooks (tasks, activities, lifecycle, webhooks) covered by tests per stage.
- [ ] Staleness timers configured and observable metrics exposed.
- [ ] Override workflows log actor, reason, timestamp.
- [ ] Documentation synced with go-to-market playbooks.

## Next Steps
- Align with backend agent to wire state machine into rules engine.
- Provide UI agent with stage-specific intent copy and warning prompts.
- Configure analytics dashboards for SLA & staleness metrics.
- Pilot with small CSM cohort, gather feedback on reversals/escalations.

