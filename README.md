# VERDICT

> **“Don’t just ask AI what to choose. Make it defend the choice.”**

VERDICT is a shared decision-negotiation board for humans and AI agents, built specifically for the **WebMCP Challenge**.

Unlike ordinary AI shopping assistants or chatbots that push unvetted suggestions, VERDICT establishes a rigorous bi-directional cockpit where an AI agent researches options, weights priorities, calculates recommendations, **challenges its own recommendation with counter-arguments and tipping points**, and prepares decisions—while the **human user maintains absolute cryptographic control over final commitment**.

---

## 1. What is Verdict?
VERDICT is not an e-commerce website, not a marketplace, and not a generic chatbot. It is a **decision-negotiation protocol and dashboard** where:
- The human and AI agent share a **single canonical state**.
- Priority weights are continuously normalized to strictly **100%**.
- Mathematical scores are derived in real-time from transparent criterion contributions.
- The AI agent is forced to perform **adversarial self-critique** (`challenge_top_pick`) to highlight runner-up advantages before asking for commitment.
- High-stakes decisions are **locked** until explicit human authorization is granted.

---

## 2. Why Ordinary AI Recommendations are Insufficient
Typical AI assistants suffer from critical failure modes:
1. **Blind Hallucinated Certainty**: They output a single recommendation without revealing the delicate tradeoffs or vulnerabilities.
2. **Hidden Criteria**: Users cannot see how specific priorities (e.g. battery vs performance) skew the outcome.
3. **Premature Action / Loss of Human Agency**: Agents with tool access may execute actions or commit choices without explicit human consent.
4. **Asymmetric State**: Chatbots maintain internal states disconnected from what the user is adjusting on screen.

VERDICT solves this by pairing **WebMCP tools** with an **adversarial self-defense loop** and **application-enforced human approval gates**.

---

## 3. Human + Agent Shared State Architecture
VERDICT operates on a single canonical decision store (`src/store/decisionStore.ts`).

```
              ┌──────────────────────────────────────────────┐
              │             CANONICAL STATE STORE            │
              │  - Title & Context                           │
              │  - Criteria & 100% Normalized Weights        │
              │  - Candidate Options & Raw Scores            │
              │  - Real-time Weighted Aggregations & Ranking │
              │  - Adversarial Challenge & Vulnerabilities   │
              │  - Commit Status & Human Approval Flag       │
              └──────────────────────┬───────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
     ┌────────────────────────┐             ┌─────────────────────────┐
     │      HUMAN UI          │             │       WEBMCP AGENT      │
     │  - Priority Sliders    │             │  - research_options     │
     │  - Matrix Inspection   │             │  - score_options        │
     │  - APPROVE Button      │             │  - challenge_top_pick   │
     │  - Scenario Switcher   │             │  - adjust_priority      │
     │                        │             │  - request_commit       │
     │                        │             │  - commit_decision      │
     └────────────────────────┘             └─────────────────────────┘
```

When an agent invokes `adjust_priority({ criterion: "battery", weight: 60 })`, the **actual visible UI slider shifts to 60%**, the remaining criteria normalize to sum to 100%, and the ranking recalculates instantaneously on screen.

---

## 4. Real WebMCP Implementation
VERDICT registers with the official WebMCP browser specification via:

```typescript
// src/webmcp/webmcp.ts
if ('modelContext' in document && typeof document.modelContext?.registerTool === 'function') {
  for (const tool of VERDICT_WEBMCP_TOOLS) {
    document.modelContext.registerTool({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.parameters,
      execute: tool.execute,
    }, { signal });
  }
}
```

No fake wrappers or simulated functions pretending to be WebMCP. If the host browser does not natively implement `document.modelContext`, VERDICT displays a transparent status badge while keeping the exact WebMCP schemas ready for execution in WebMCP-compatible clients (e.g. ChatGPT / WebMCP extensions).

---

## 5. The Six WebMCP Tools

| Tool Name | Parameters | Purpose | Safety Constraint |
| :--- | :--- | :--- | :--- |
| `research_options` | `{ query?: string }` | Retrieves candidate options for the active decision context into shared state. | Reads/Updates candidate pool |
| `score_options` | `{}` | Computes mathematical weighted scores from current weights and assigns #1 ranking. | Pure deterministic evaluation |
| `challenge_top_pick` | `{}` | Forces the agent to identify the runner-up, compare score vulnerabilities, and explain the priority tipping point where the runner-up wins. | Must run prior to commitment |
| `adjust_priority` | `{ criterion: string, weight: number }` | Directly modifies the exact priority sliders in shared state, redistributes remaining weight to guarantee 100% total. | Strict 0-100 bounds + normalization |
| `request_commit` | `{ justification?: string }` | Prepares the decision for human review. Transitions board into `pending_human_approval`. | **Does NOT finalize commit** |
| `commit_decision` | `{ reason?: string }` | Finalizes the decision and creates an immutable `VD-XXXX` record. | **STRICT: Fails with `HUMAN_APPROVAL_REQUIRED` if `humanApproved === false`** |

---

## 6. Adversarial Safety & Human Approval Enforcement
VERDICT enforces human security at the application engine layer (`src/engine/decisionEngine.ts`):

```typescript
export function validateCommitSecurity(state: {
  committedStatus: string;
  winner: RankedOption | null;
  challenge: ChallengeResult | null;
  humanApproved: boolean;
}): { canCommit: boolean; error?: string; errorCode?: string } {
  if (state.committedStatus === 'committed') {
    return { canCommit: false, errorCode: 'ALREADY_COMMITTED' };
  }
  if (!state.humanApproved) {
    return {
      canCommit: false,
      error: 'HUMAN_APPROVAL_REQUIRED: Explicit human approval must be granted before committing.',
      errorCode: 'HUMAN_APPROVAL_REQUIRED',
    };
  }
  return { canCommit: true };
}
```

If an AI agent attempts an unauthorized commit call:
```json
{
  "success": false,
  "error": "HUMAN_APPROVAL_REQUIRED",
  "message": "Explicit human approval is required before commitment."
}
```

---

## 7. Demo Scenarios & Data Model

### Scenario 1: Laptop Selection for AI Dev & Daily Commuting
- **Criteria**: Performance (35%), Battery (45%), Portability (20%)
- **Option A (Laptop A)**: Performance: 92, Battery: 71, Portability: 86
- **Option B (Laptop B)**: Performance: 87, Battery: 94, Portability: 91
- **Option C (Laptop C)**: Performance: 84, Battery: 89, Portability: 78
- **Initial Scores**:
  - A = $92 \times 0.35 + 71 \times 0.45 + 86 \times 0.20 = 81.4$
  - B = $87 \times 0.35 + 94 \times 0.45 + 91 \times 0.20 = 91.0$ (Winner 🥇)
  - C = $84 \times 0.35 + 89 \times 0.45 + 78 \times 0.20 = 85.1$

### Scenario 2: Apartment Selection for Hybrid Work
- Demonstrates generic decision engine support (Rent 40%, Commute 35%, Space 25%).

---

## 8. Installation & Running Locally

### Prerequisites
- Node.js 18+
- npm or yarn

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Run local development server (runs on port 3000)
npm run dev

# 3. Run automated tests (19 unit & adversarial tests)
npm test

# 4. Production build
npm run build
```

---

## 9. Verification & Testing

### Verification Scope & Local Test Harness
The in-browser **WebMCP Test Console** functions as a local development and evaluation harness. It allows developers and judges to simulate, inspect, and verify WebMCP tool executions, parameter schemas, and multi-step agent flows directly inside environments where native `document.modelContext` may not be present. In native WebMCP host environments (such as Chrome Origin Trial builds), the exact same underlying tools are registered natively on `document.modelContext`.

### Features of the Test Console
- Execute any of the 6 WebMCP tools with custom JSON payloads.
- Run the **Full 4-Step Agent Workflow**.
- Run the **Adversarial Safety Attack** to verify that unauthorized commits are strictly blocked.
- Inspect raw schemas and registration code.

---

## 10. License
Distributed under the **MIT License**. See `LICENSE` for details.
