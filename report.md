# Deal Room Pod — Build Report

**Date:** 2026-06-28
**Pod:** `deal-room` (`019f0da3-cab5-740a-85b0-22c40d047d9e`)
**Org:** `amitgupta's Space` (`019f0d82-2ce8-7271-8f3a-1adb9d82db01`)

---

## Architecture

```
  Analyst submits deal via App
           │ INSERT deals
           ▼
  ┌───────────────────────┐
  │  DATASTORE_EVENT      │
  │  deal-intake-workflow │
  └──────┬────────────────┘
         │ start.metadata.record_id
         ▼
  ┌─────────────────┐
  │ document-parser │  AGENT: extract company info + 3-year financials
  │    -agent       │        from CIM PDF in /cims folder
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ persist_parser_ │  FUNCTION: INSERT financials row,
  │    output       │  UPDATE deals with company_name/industry
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  risk-analyst   │  AGENT: score deal 1-100, flag red flags
  │    -agent       │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ persist_risk_   │  FUNCTION: INSERT red_flags rows,
  │    output       │  UPDATE deals.risk_score
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  memo-writer    │  AGENT: draft structured investment memo
  │    -agent       │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ persist_memo_   │  FUNCTION: INSERT memos row,
  │    draft        │  UPDATE deals.latest_memo_id, status
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  analyst_review │  FORM: assignee = assigned_analyst_pod_member_id
  │                 │  fields: decision, edited_body, review_notes
  └────────┬────────┘
           │ analyst approves / rejects
           ▼
  ┌─────────────────┐
  │ record_review_  │  FUNCTION: UPDATE memos with edits,
  │    decision     │  INSERT audit_events,
  │                 │  UPDATE deals.status = reviewed
  └────────┬────────┘
           ▼
      ┌──────────┐
      │    END   │
      └──────────┘
```

---

## Resources Deployed (16 total)

### Tables (5 — all shared, no RLS)

| Table | Purpose |
|---|---|
| `deals` | Pipeline deals: company info, status, risk score, memo ref |
| `financials` | Fiscal-year financial data per deal |
| `red_flags` | Risk flags identified during scoring |
| `memos` | Investment memo drafts with edit history |
| `audit_events` | Timestamped trail of workflow actions |

### Functions (5 — Python, pydantic + lemma_sdk)

| Function | Tables Written |
|---|---|
| `create_deal_submission` | deals |
| `persist_parser_output` | financials, deals |
| `persist_risk_output` | red_flags, deals |
| `persist_memo_draft` | memos, deals |
| `record_review_decision` | memos, audit_events, deals |

All functions use `Pod.from_env()` for connection, `pod.tables.table(name)` for CRUD, and `ctx.user_id` for audit tracking.

### Agents (3 — toolsets: POD, output_schema enforced)

| Agent | Role | Grants |
|---|---|---|
| `document-parser-agent` | Extract company info + 3-year financials from CIM PDF | `folder.read` on `/cims` |
| `risk-analyst-agent` | Score deal (1–100), flag red flags, recommend | — |
| `memo-writer-agent` | Write structured investment memo | — |

### Workflow (1 — DATASTORE_EVENT on deals INSERT)

**`deal-intake-workflow`** — 9 nodes, sequential (no branching):

1. AGENT parse_cim → 2. FUNCTION persist_parsed_financials
3. AGENT score_risk → 4. FUNCTION persist_risk_assessment
5. AGENT draft_memo → 6. FUNCTION persist_memo
7. FORM analyst_review → 8. FUNCTION record_decision → 9. END

The FORM node carries UI schema for approve/reject + memo editing, assigned to the deal's `assigned_analyst_pod_member_id`.

### App (1 — Vite + React + lemma-sdk/react)

**`deal-room`** at `apps/deal-room/` — 4 pages:

| Route | Page | Purpose |
|---|---|---|
| `/` | Pipeline | Live deal list with status badges |
| `/create` | CreateDeal | Form: company name, industry, deal size, analyst, CIM file |
| `/deals/:dealId` | DealDetail | Full deal view: info, financials table, red flags, memo |
| `/review` | ReviewQueue | Pending workflow FORM assignments, approve/reject |

Built with `react-router-dom`, TanStack Query, `lucide-react` icons, `AuthGuard`, `useLiveRecords`, `useDatastoreQuery`, `useCreateRecord`, `useWorkflowRunWaitAssignments`, and `useWorkflowResume`.

### Files (1 folder)

| Folder | Path | Permission |
|---|---|---|
| `cims` | `/cims` | `document-parser-agent` has `folder.read` |

---

## Bundle Layout

```
deal-room/
├── pod.json
├── AGENTS.md
├── README.md
├── tables/
│   ├── deals/deals.json
│   ├── financials/financials.json
│   ├── red_flags/red_flags.json
│   ├── memos/memos.json
│   └── audit_events/audit_events.json
├── functions/
│   ├── create_deal_submission/{name.json, code.py}
│   ├── persist_parser_output/{name.json, code.py}
│   ├── persist_risk_output/{name.json, code.py}
│   ├── persist_memo_draft/{name.json, code.py}
│   └── record_review_decision/{name.json, code.py}
├── agents/
│   ├── document-parser-agent/{name.json, instruction.md}
│   ├── risk-analyst-agent/{name.json, instruction.md}
│   └── memo-writer-agent/{name.json, instruction.md}
├── workflows/
│   └── deal-intake-workflow/deal-intake-workflow.json
├── apps/
│   └── deal-room/
│       ├── lemma.app.json
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── index.html
│       └── src/
│           ├── main.tsx, Shell.tsx, lemma-client.ts, styles.css
│           └── pages/
│               ├── Pipeline.tsx
│               ├── CreateDeal.tsx
│               ├── DealDetail.tsx
│               └── ReviewQueue.tsx
└── files/
    └── cims/.folder.json
```

---

## Import Notes

- Import order (CLI): tables → files → functions → agents → workflows → surfaces → apps
- All folder resource grants in agent JSON use the full path (e.g. `/cims`), not just the folder name
- `lemma pods import ./deal-room --dry-run` validates the bundle without writing
- The app was scaffolded with `lemma apps init` and its dependencies installed with `npm install`

## End-to-End Flow

1. **Upload** CIM PDF to `/cims` folder via Lemma Files
2. **Create** deal via the app at `/create` (or via `create_deal_submission` function)
3. **Workflow** triggers automatically on `deals` INSERT, runs the 9-node pipeline
4. **Monitor** deal status in `/` Pipeline view with live updates
5. **Review** the memo in `/review` page when the workflow reaches the FORM node
6. **Decision** recorded — approved deals finalise the memo; rejected deals get an audit trail
