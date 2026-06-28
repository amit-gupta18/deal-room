# deal-room

AI Deal Room Operator for private equity analysts doing first-pass CIM screening.

This pod ingests a CIM, extracts structured financials, scores the deal, drafts an
investment memo, and pauses for human review before final approval or rejection.

## Build loop

```bash
lemma pods import ./deal-room --dry-run
lemma pods import ./deal-room
```

## Import order

1. Tables
2. Functions
3. Agents
4. Workflow
5. App

## Non-bundled setup

- Upload CIMs into `/deal-room/cims` from the app or CLI.
- If local app deployment is used outside bundle import, run the app build and deploy separately.

## Verify

```bash
lemma pods import ./deal-room --dry-run
lemma tables list
lemma functions list
lemma agents list
lemma workflows list
```
