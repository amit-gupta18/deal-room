# Plan

## Goal

Build the AI Deal Room Operator pod in clear phases so the core screening loop works end to end before adding polish.

---

## Phase 1: Pod Foundation

Phase 1 will set up the base pod structure and data model.

This phase includes:

- Create the shared file folders:
  - `/deal-room/cims`
  - `/deal-room/memos`
- Create all core shared tables:
  - `deals`
  - `financials`
  - `red_flags`
  - `memos`
  - `audit_events`
- Define all enums and foreign keys correctly.
- Verify that the schema imports cleanly.

Deliverable:

- A working Lemma pod with the full base file and table model imported.

---

## Phase 2: Deterministic Functions

Phase 2 will implement the backend functions that persist and coordinate data changes.

This phase includes:

- Implement `create_deal_submission`
- Implement `persist_parser_output`
- Implement `persist_risk_output`
- Implement `persist_memo_draft`
- Implement `record_review_decision`
- Add workload grants for every function.
- Test each function independently with sample payloads.

Deliverable:

- All deterministic business logic working correctly and safely writing to the right tables.

---

## Phase 3: Agents

Phase 3 will implement the three specialized agents.

This phase includes:

- Create `document-parser-agent`
- Create `risk-analyst-agent`
- Create `memo-writer-agent`
- Write strong system prompts for each agent.
- Add `output_schema` for each agent.
- Add exact workload grants for tables and folders.
- Test each agent standalone before wiring it into the workflow.

Deliverable:

- All three agents producing reliable structured outputs for their specific jobs.

---

## Phase 4: Workflow Orchestration

Phase 4 will wire the functions and agents into one end-to-end workflow.

This phase includes:

- Create `deal-intake-workflow`
- Configure the `DATASTORE_EVENT` trigger on `deals` inserts.
- Add workflow steps in order:
  - parser agent
  - parser persistence function
  - risk agent
  - risk persistence function
  - memo agent
  - memo persistence function
  - human review form
  - final review decision function
- Validate the workflow graph.
- Test a full run from deal creation through human review pause.

Deliverable:

- A working workflow that automates deal screening and pauses for human approval.

---

## Phase 5: App UI

Phase 5 will build the operational app for analysts.

This phase includes:

- Build the Pipeline Dashboard page
- Build the New Deal Intake page
- Build the Deal Detail page
- Build the My Review Queue page
- Show live deal status, memo drafts, financials, and red flags.
- Allow memo editing and human approve/reject actions.
- Connect the UI to the workflow review step.

Deliverable:

- A usable app that analysts can use for intake, review, and decisioning.

---

## Phase 6: End-to-End Testing And Demo Readiness

Phase 6 will make the pod stable and demo-ready.

This phase includes:

- Upload a sample CIM and run the full flow end to end.
- Verify table updates at each stage.
- Verify memo drafting quality.
- Verify the human approval path.
- Verify audit trail completeness.
- Fix edge cases for missing or low-confidence extraction.
- Prepare sample data and a clean demo path.

Deliverable:

- A stable, demo-ready AI Deal Room Operator pod.

---

## Suggested Execution Order

1. Finish Phase 1 first.
2. Then complete Phase 2.
3. Then build and test Phase 3.
4. Then wire everything in Phase 4.
5. Then build the app in Phase 5.
6. Then do full QA and polish in Phase 6.

---

## Success Criteria

The plan is complete when:

- A CIM can be uploaded into the pod.
- The workflow runs automatically.
- Financials are extracted and saved.
- Red flags and score are generated and saved.
- A memo draft is created.
- A human analyst can review, edit, approve, or reject.
- Every step is auditable in the pod.
