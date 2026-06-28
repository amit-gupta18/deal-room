# Gappy AI Hackathon — Complete Build Instructions
**Stack:** OpenCode CLI (WSL) + GLM 5.2 (Z.ai) + Lemma Local Stack (WSL/Docker) → lemma.work

---

## Prerequisites checklist

Before starting, confirm you have these in WSL:

- [ ] WSL installed and running (Ubuntu recommended)
- [ ] Docker installed and running inside WSL
- [ ] Z.ai GLM Coding Plan API key (get at z.ai)
- [ ] lemma.work account (sign up free at lemma.work/start)

---

## Phase 0 — Environment Setup in WSL

### 0.1 Install uv (Python package manager)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
uv --version   # should print a version number
```

### 0.2 Install OpenCode CLI

```bash
curl -fsSL https://opencode.ai/install | bash
source ~/.bashrc
opencode --version   # confirm it installed
```

### 0.3 Configure OpenAI

Add to `~/.bashrc` so it persists across sessions:

```bash
echo 'export OPENAI_BASE_URL="https://api.openai.com/v1"' >> ~/.bashrc
echo 'export OPENAI_API_KEY="sk-proj-your-key-here"' >> ~/.bashrc
echo 'export OPENAI_MODEL="gpt-4o-mini"' >> ~/.bashrc
source ~/.bashrc
```

Verify:

```bash
echo $OPENAI_BASE_URL    # should print the OpenAI URL
echo $OPENAI_MODEL       # should print gpt-4o-mini
```

### 0.4 Install Lemma local stack

This runs the entire Lemma product inside Docker containers on your machine:

```bash
curl -fsSL https://raw.githubusercontent.com/lemma-work/lemma-platform/main/install.sh | bash
```

Wait for it to finish. Then open in your Windows browser:

```
http://127-0-0-1.sslip.io:3711
```

Create your account here. Use this exact URL — not localhost.

### 0.5 Install Lemma CLI

```bash
uv tool install lemma-terminal
lemma --version   # confirm it installed
```

### 0.6 Point CLI at local stack and login

```bash
lemma servers select local
lemma auth login
# browser will open — complete login
```

### 0.7 Install Lemma skills into OpenCode

This teaches OpenCode/GLM all the Lemma CLI commands automatically:

```bash
lemma skills install
# if it errors on symlinks, safe to ignore — just press enter
```

---

## Phase 1 — Create Your Pod

### 1.1 Create the pod

```bash
lemma pod create deal-room --with-starter
lemma pods select deal-room --save-default
lemma pod describe   # shows what was created
```

### 1.2 Open OpenCode and start building

In your WSL terminal, navigate to a working folder:

```bash
mkdir ~/deal-room-project
cd ~/deal-room-project
opencode
```

OpenCode will launch in your terminal. OpenAI (gpt-4o-mini) is now your agent and it knows all Lemma CLI commands via the installed skills.

### 1.3 Paste this prompt into OpenCode to build the full pod

```
Build a Lemma pod called "deal-room" for an AI Deal Room Operator 
for private equity analysts.

Create the following tables:
- deals: columns = name (text), company (text), stage (select: screening/review/approved/archived), score (number), submitted_at (date)
- financials: columns = deal_id (text), revenue (number), ebitda (number), debt (number), growth_rate (number), notes (text)
- red_flags: columns = deal_id (text), flag (text), severity (select: low/medium/high), flagged_by (text)
- memos: columns = deal_id (text), content (text), status (select: draft/approved/rejected), reviewed_by (text)

Create the following agents:
- document_parser: reads uploaded CIM files, extracts key financials, populates the financials table
- risk_analyst: reads financials table, scores the deal 0-100, identifies red flags, populates red_flags table
- memo_writer: reads financials and red_flags for a deal, drafts a 1-page investment memo, saves to memos table as draft

Create a workflow called deal-intake:
- Trigger: new row in deals table
- Step 1: run document_parser agent
- Step 2: run risk_analyst agent  
- Step 3: run memo_writer agent
- Step 4: human approval step — analyst reviews memo draft and approves or rejects
- Step 5: update deal stage to approved or archived based on decision

Create a simple app called deal-room-app with:
- A deals list view showing all deals with their stage and score
- A deal detail page showing financials, red flags, and the memo draft
- Approve and Reject buttons that trigger the approval workflow step
- An upload area to drop a CIM document

Use the lemma CLI to create all of these. Run each command and verify it works before moving to the next.
```

OpenCode + GLM 5.2 will now run the Lemma CLI commands automatically. Watch it build your pod step by step. Approve each command when prompted.

---

## Phase 2 — Test Locally

### 2.1 Seed test data

```bash
# Create a test deal
lemma record create deals --data '{"name":"Acme Corp Deal","company":"Acme Corp","stage":"screening","score":0}'

# Check it was created
lemma record list deals
```

### 2.2 Upload a test CIM (dummy PDF)

Create a simple test file:

```bash
echo "Company: Acme Corp. Revenue: 50Cr. EBITDA: 8Cr. Debt: 12Cr. Growth: 40% YoY. Risk: High customer concentration." > test-cim.txt
lemma file upload test-cim.txt
```

### 2.3 Run the workflow manually

```bash
lemma workflow start deal-intake
```

Watch the agents run in sequence — parser → analyst → memo writer → approval step.

### 2.4 Chat with your pod to test agents directly

```bash
lemma chat "what deals are in the pipeline?"
lemma chat "what are the red flags for Acme Corp?"
lemma chat "show me the memo draft for Acme Corp"
```

### 2.5 Open the app and click through it

In your Windows browser:

```
http://127-0-0-1.sslip.io:3711
```

Navigate to your pod → Apps → deal-room-app. Click through it exactly like a judge would. Make sure:

- [ ] Deals list loads
- [ ] Deal detail page shows financials and red flags
- [ ] Memo draft is visible
- [ ] Approve/Reject buttons work
- [ ] Workflow runs end to end

Fix any issues by prompting OpenCode again.

---

## Phase 3 — Seed Demo Data

Before pushing to cloud, seed realistic data so judges see a working product:

```bash
# Seed 3 realistic deals
lemma record create deals --data '{"name":"RetailCo Acquisition","company":"RetailCo Ltd","stage":"review","score":72}'
lemma record create deals --data '{"name":"FinTech Series B","company":"PaySwift India","stage":"screening","score":0}'
lemma record create deals --data '{"name":"EdTech Buyout","company":"LearnFast Pvt Ltd","stage":"approved","score":88}'

# Seed financials for RetailCo
lemma record create financials --data '{"deal_id":"<retailco-id>","revenue":120,"ebitda":18,"debt":35,"growth_rate":22,"notes":"Stable retail chain, 3 city presence"}'

# Seed red flags for RetailCo
lemma record create red_flags --data '{"deal_id":"<retailco-id>","flag":"High debt to EBITDA ratio","severity":"high","flagged_by":"risk_analyst"}'
lemma record create red_flags --data '{"deal_id":"<retailco-id>","flag":"Customer concentration >40% in one client","severity":"medium","flagged_by":"risk_analyst"}'

# Seed a memo draft for RetailCo
lemma record create memos --data '{"deal_id":"<retailco-id>","content":"Investment Memo — RetailCo Ltd\n\nExecutive Summary: RetailCo presents moderate opportunity with strong revenue but elevated debt. EBITDA margins at 15% are below sector average of 20%. Key risk is debt load at 1.9x EBITDA.\n\nRecommendation: Conditional approval pending debt restructuring plan.","status":"draft","reviewed_by":""}'
```

Replace `<retailco-id>` with the actual record ID from `lemma record list deals`.

---

## Phase 4 — Push to lemma.work (Submission)

### 4.1 Export local pod

```bash
cd ~/deal-room-project
lemma pod export ./my-pod
```

This creates a `my-pod/` folder with all your tables, agents, workflows, and apps as plain files.

### 4.2 Switch CLI to Lemma Cloud

```bash
lemma servers cloud --use
lemma auth login
# login with your lemma.work account
```

### 4.3 Create matching pod on cloud and push

```bash
lemma pod create deal-room
lemma pod import ./my-pod
```

### 4.4 Deploy the app

```bash
lemma apps deploy deal-room-app ./my-pod/apps/index.html
```

This gives you a live URL on lemma.work. Copy it.

### 4.5 Grant judge access

```bash
lemma pod share --email ayush@gappy.ai --role viewer
```

### 4.6 Verify everything works on cloud

Open your lemma.work app URL in browser. Click through the full flow. Make sure all seeded data is visible and the workflow runs.

---

## Phase 5 — Submit

Fill the Google Form (deadline: July 1, 2026):

| Field | What to write |
|---|---|
| Problem statement | AI Deal Room Operator — automates CIM document parsing, financial risk scoring, and investment memo generation for private equity analysts with human approval before finalizing |
| Product description | A Lemma pod with 3 sequential agents (document parser, risk analyst, memo writer), a human-in-the-loop approval workflow, and a deal review app. Analyst uploads a CIM → agents extract financials, score the deal, flag risks, draft a memo → analyst approves or rejects in the app |
| Live product link | your lemma.work app URL |
| Demo video | Screen recording showing: upload CIM → workflow runs → memo appears → approve in app |
| External tools | OpenAI API (gpt-4o-mini), OpenCode CLI, Lemma SDK |

---

## Timeline

| When | What |
|---|---|
| Today (June 28) | Phase 0 + 1 — full setup and build core pod |
| Tomorrow morning (June 29) | Phase 2 + 3 — test, fix, seed demo data |
| Tomorrow evening | Phase 4 — push to lemma.work, verify live |
| June 30 | Buffer — fix anything broken on cloud |
| July 1 | Phase 5 — submit before deadline |

---

## Useful commands reference

```bash
# Pod management
lemma pod describe                          # see everything in your pod
lemma pod export ./my-pod                   # export to local folder
lemma pod import ./my-pod                   # import from local folder

# Data
lemma record list <table>                   # list all records
lemma record create <table> --data '{...}'  # create a record
lemma record update <table> <id> --data '{...}'

# Agents
lemma agent list                            # list all agents
lemma agent run <agent-name> --input '{...}' # run an agent

# Workflows
lemma workflow list                         # list all workflows
lemma workflow start <workflow-name>        # start a workflow run

# Apps
lemma apps list                             # list all apps
lemma apps deploy <name> <path>             # deploy an app

# Switch servers
lemma servers select local                  # build against local stack
lemma servers cloud --use                   # push to lemma.work

# Stack management
lemma-stack start                           # start local stack
lemma-stack stop                            # stop local stack
lemma-stack status                          # check if running
lemma-stack logs                            # tail logs
```

---

## Troubleshooting

**Local app not loading at 127-0-0-1.sslip.io:3711**
```bash
lemma-stack status   # check if containers are running
lemma-stack start    # restart if stopped
```

**OpenAI not responding**
```bash
echo $OPENAI_API_KEY   # check key is set
echo $OPENAI_BASE_URL  # check base URL
source ~/.bashrc       # reload env vars
```

**Lemma CLI not found**
```bash
uv tool install lemma-terminal
export PATH="$HOME/.local/bin:$PATH"
```

**Pod import fails on cloud**
```bash
lemma servers cloud --use
lemma auth login        # re-authenticate
lemma pod import ./my-pod --upsert   # use upsert flag
```

**OpenCode not finding Lemma skills**
```bash
lemma skills install    # reinstall skills
# restart opencode after
```
