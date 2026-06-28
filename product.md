# AI Deal Room Operator — Product Document

## One Line
Paste a CIM, get an investment memo in 15 minutes — with a human in the loop before anything is finalized.

---

## The Problem

Private equity and private credit analysts receive 50-100 CIMs (Confidential Information Memorandums) every month. Each CIM is a 40-80 page document packed with financials, business description, market analysis, risk factors, and management team details.

For every CIM, an analyst must:
- Read the entire document
- Extract key financial metrics (revenue, EBITDA, debt, growth)
- Cross-check numbers for inconsistencies
- Identify red flags (high debt, customer concentration, margin decline)
- Write a 1-2 page investment memo
- Present it to partners for a go/no-go decision

This takes **2-3 days per deal, manually**. 80% of deals get rejected anyway — meaning most of that analyst time is wasted on companies that were never going to pass screening.

### Why does it take 2-3 days?

Not because the thinking is hard. An experienced analyst knows exactly what to look for — the same checklist every time:
- Are revenues growing?
- What are the margins and are they healthy?
- How much debt relative to earnings?
- Is revenue concentrated in a few customers?
- What is the competitive moat?
- What are the biggest risks?

It takes 2-3 days because **reading, extracting, structuring, and writing is manual and sequential**. One human. One document. One output at a time.

---

## The Solution

An AI Deal Room Operator built on Lemma — a pod with 3 specialized agents running in sequence, mimicking exactly how an analyst thinks, but in minutes not days.

The human is not removed from the decision. They are freed from the grunt work so they can focus purely on judgment.

---

## Target User

**Primary:** Investment analysts at private equity funds, private credit funds, and venture debt firms

**Secondary:** Associates and VPs who review deal flow and need faster first-pass screening

**Specific fit:** Firms like Binocs's clients — institutional lenders and alternative investment funds processing high volumes of inbound deal flow

---

## Core Features

### Feature 1 — CIM Ingestion
- Analyst uploads a CIM document (PDF or text) to the pod
- Document is indexed and stored in the Lemma file store
- Upload triggers the deal-intake workflow automatically
- Supported formats: PDF, text, paste-in content

### Feature 2 — Document Parser Agent
- Reads the raw CIM
- Extracts only what matters into structured fields:
  - Revenue (last 3 years)
  - EBITDA and EBITDA margins
  - Total debt and debt-to-EBITDA ratio
  - Customer list and revenue concentration
  - YoY growth rate
  - Key risks mentioned by the company itself
  - Management team background
  - Business model summary
- Populates the `financials` table with extracted data
- Flags any fields it could not extract with confidence

### Feature 3 — Risk Analyst Agent
- Reads the structured financial profile from the `financials` table
- Applies investment-grade judgment rules:
  - Debt to EBITDA above 3x → high severity red flag
  - Top customer above 30% of revenue → medium severity red flag
  - Margins declining year on year → medium severity red flag
  - Revenue growth below 10% in a growth-stage company → red flag
  - Negative free cash flow with high burn → high severity red flag
  - Management team lacks relevant experience → medium severity red flag
- Scores the deal 0-100 based on weighted criteria
- Populates the `red_flags` table with each flag, severity, and reasoning
- Updates the deal score in the `deals` table

### Feature 4 — Memo Writer Agent
- Reads the financial profile and red flags for the deal
- Writes a structured 1-page investment memo:
  - **Executive Summary** — company overview, deal size, ask
  - **Financial Highlights** — key metrics, growth trajectory, margin profile
  - **Risk Assessment** — ranked red flags with context
  - **Recommendation** — approve for deeper diligence / conditional / reject — with reasoning
- Saves the memo as a draft in the `memos` table
- Does not finalize anything — human must approve

### Feature 5 — Human Approval Workflow
- Workflow pauses after memo is drafted
- Analyst receives notification that memo is ready for review
- Analyst opens the deal detail page in the app
- Reads the memo draft, financials, and red flags
- Can edit the memo inline before approving
- Clicks **Approve** → deal moves to `under_review` stage
- Clicks **Reject** → deal moves to `archived` stage with reason logged
- Decision is recorded with timestamp and reviewer name

### Feature 6 — Deal Pipeline App
- Clean dashboard showing all deals in the pipeline
- Columns: Company name, Stage, Score, Submitted date, Assigned analyst
- Color-coded scores: green (70+), yellow (40-70), red (below 40)
- Filter by stage, sort by score or date
- Click any deal → opens deal detail page

### Feature 7 — Deal Detail Page
- Company overview pulled from parser output
- Financial metrics table (revenue, EBITDA, debt, growth)
- Red flags list with severity badges
- Memo draft with inline edit capability
- Approve / Reject buttons
- Full audit trail of agent actions and timestamps

---

## User Journey

```
Analyst receives a CIM via email
        ↓
Uploads it to the Deal Room app
        ↓
Document Parser Agent reads CIM → extracts financials → populates table
        ↓
Risk Analyst Agent scores deal → identifies red flags → updates tables
        ↓
Memo Writer Agent drafts 1-page investment memo → saves as draft
        ↓
Analyst opens deal detail page → reviews memo, financials, red flags
        ↓
Analyst approves or rejects → deal moves to next stage
        ↓
Full audit trail logged
```

---

## What This Is Not

- **Not a replacement for deep diligence** — this is first-pass screening only
- **Not fully automated** — human approval is required before any decision is logged
- **Not a CRM** — it does not manage investor relationships or LP communications
- **Not a portfolio monitoring tool** — it handles deal intake, not post-investment tracking

---

## Before vs After

| | Before | After |
|---|---|---|
| Time per deal (first pass) | 2-3 days | 15 minutes |
| Analyst time spent on | Reading + extracting + writing | Reviewing + deciding |
| Deals screened per month | 10-15 | 50-100 |
| Risk of missing a red flag | High (human fatigue) | Low (agent checks every metric) |
| Memo consistency | Varies by analyst | Standardized every time |
| Audit trail | Inconsistent | Complete and timestamped |

---

## Judging Criteria Alignment

| Criterion | Weight | How This Scores |
|---|---|---|
| Problem clarity & real-world fit | 35% | Sharp user (PE analysts), documented pain, Binocs as a hiring partner validates the domain |
| Product judgment | 25% | 3 agents in sequence — not over-engineered. Human approval step shows maturity. Right interface for the user. |
| Execution quality | 25% | Core loop works end to end. Risk: PDF parsing quality. Mitigation: pre-cleaned demo CIM. |
| SDK utilisation | 15% | Uses every Lemma primitive: Tables, Files, Agents, Workflows with approval, Apps |

**Estimated score: 86/100**

---

## Hackathon Submission Summary

**Problem statement chosen:** Own problem statement — AI Deal Room Operator (aligned with Binocs hiring partner domain)

**Product:** A Lemma pod that automates CIM screening for private equity analysts — from document upload to investment memo draft — with a human approval step before any decision is finalized.

**External tools:** OpenAI GPT-4o (via OpenAI API), Lemma SDK v0.5.3

**Live product:** Hosted on lemma.work, pod access granted to ayush@gappy.ai
