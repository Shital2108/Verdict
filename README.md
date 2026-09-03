# VERDICT

## The AI Decision Engine That Makes Agents Defend Their Choices.

> "AI can give you an answer. But should it be allowed to make the decision?
>
> VERDICT makes AI defend its choice, challenge its own recommendation, and earn human approval before committing."

![WebMCP](https://img.shields.io/badge/WebMCP-Native-6E56CF)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF)
![License](https://img.shields.io/badge/License-MIT-green)

---

## The Idea

Most AI decision systems stop at:

```
Input → AI → Answer
```

VERDICT asks a harder question:

> What happens when the AI's recommendation needs to be inspected, challenged, changed, and ultimately authorized by a human?

VERDICT is a WebMCP-powered decision-negotiation engine that gives AI agents structured access to a live decision state.

The agent can:

- Research available options
- Score candidates against explicit priorities
- Challenge its own recommendation
- Change decision priorities
- Calculate when the recommendation would change
- Request commitment
- Attempt to commit
- Be blocked when human authorization is missing
- Commit only after explicit human approval

**The human remains the final authority.**

---

## Why This Is a WebMCP Problem

Traditional web automation asks an agent to understand a UI:

> "Find the battery slider and move it to 10%."

That requires the agent to infer page structure, controls, and intent.

VERDICT exposes meaningful application capabilities as structured WebMCP tools instead.

The agent can reason in terms of:

```
adjust_priority
challenge_top_pick
request_commit
commit_decision
```

rather than manipulating arbitrary UI elements.

This changes the relationship between the agent and the application.

The website is no longer only a page to navigate.

**It becomes an agent-capable application surface.**

WebMCP is specifically designed around websites exposing structured tools that agents can use directly, which is why VERDICT's workflow is a strong fit for the platform.

---

## The Core Insight

**Recommendation ≠ Authorization**

VERDICT deliberately separates these two concepts.

```
             AI AGENT
                │
                ▼
          ┌───────────┐
          │  Research │
          └─────┬─────┘
                ▼
          ┌───────────┐
          │   Score   │
          └─────┬─────┘
                ▼
          ┌───────────┐
          │ Challenge │
          └─────┬─────┘
                ▼
          ┌───────────┐
          │ Priorities│
          └─────┬─────┘
                ▼
          ┌───────────┐
          │ Recommend │
          └─────┬─────┘
                ▼
         HUMAN APPROVAL
                │
      ┌─────────┴─────────┐
      │                   │
   REJECT               APPROVE
      │                   │
      ▼                   ▼
   STOP              COMMIT
```

An agent can analyze.
An agent can recommend.
An agent can challenge.

**But an agent cannot silently cross the final authorization boundary.**

---

## A Live Example

VERDICT ships with a hardware-selection scenario:

> Which laptop should I choose for AI development and daily commuting?

Three candidates:

| Option | Performance | Battery | Portability |
|--------|-------------|---------|-------------|
| Laptop A | 92 | 71 | 86 |
| Laptop B | 87 | 94 | 91 |
| Laptop C | 84 | 89 | 78 |

The decision engine uses explicit weighted priorities:

```
Performance: 35%
Battery:     45%
Portability: 20%
```

The resulting recommendation is:

**Laptop B — 91 points**

But VERDICT does not stop there. The agent challenges the recommendation. Then the priorities can change.

---

## Decisions Should Be Sensitive to Priorities

A major feature of VERDICT is dynamic priority negotiation.

For example, the agent can reduce battery priority:

```
Battery: 10%
```

VERDICT automatically normalizes the remaining criteria.

Later, performance can become the dominant criterion:

```
Performance: 65%
Battery:     24%
Portability: 11%
```

The recommendation is recalculated against the new state.

This makes the decision transparent:

> "The answer is not treated as an absolute truth."

It is a consequence of:

```
options × criteria × priorities
```

---

## The Challenge Engine

The most important question is not:

> "What is the winner?"

It is:

> "Why might the winner be wrong?"

`challenge_top_pick` examines the current recommendation and identifies weaknesses in the decision boundary.

In the demonstrated run:

```
Winner:       Laptop B
Score:        89.1

Runner-up:    Laptop A
Score:        86.3

Current gap:  2.8 points

A's advantage:
Performance: +5 points
```

VERDICT then calculates a tipping point:

```
Performance priority ≈ 78%
```

At that point, Laptop A overtakes Laptop B.

This transforms:

> "Laptop B wins."

into:

> "Laptop B wins under these priorities, but the recommendation changes when performance becomes sufficiently dominant."

**That is a fundamentally more useful decision.**

---

## Native WebMCP Surface

VERDICT exposes six native WebMCP tools:

| Tool | Purpose |
|------|---------|
| `research_options` | Retrieve and inspect candidate options |
| `score_options` | Score candidates against current priorities |
| `challenge_top_pick` | Adversarially challenge the current recommendation |
| `adjust_priority` | Change a criterion and normalize weights |
| `request_commit` | Request finalization while preserving human approval |
| `commit_decision` | Commit only when authorization requirements are satisfied |

The application registers these capabilities through the browser's WebMCP surface:

```javascript
document.modelContext.registerTool({
  name: "score_options",
  description: "Score decision options against current priorities",
  inputSchema: { /* structured schema */ },
  execute: async (input) => {
    // operate on canonical decision state
  }
});
```

The important architectural property is that these tools operate on the **same canonical decision state** used by the human UI.

---

## One Shared Decision State

VERDICT is not:

```
Human UI
    +
Separate AI Simulation
```

Instead:

```
             CANONICAL STATE
                   │
          ┌────────┴────────┐
          │                 │
      Human UI          WebMCP Agent
          │                 │
          └────────┬────────┘
                   │
             Decision Engine
```

The UI and WebMCP tools converge on the same state model.

That enables a human and an external agent to participate in the same decision workflow.

---

## Human Approval Is an Application Boundary

The most important safety property is enforced by the application itself.

An agent may call `request_commit` and receive:

```json
{
  "status": "pending_human_approval"
}
```

If the agent attempts `commit_decision` without approval, VERDICT returns:

```
HUMAN_APPROVAL_REQUIRED
```

No decision record is created.

Only after the human explicitly selects **APPROVE DECISION** can the commit operation succeed.

This is not a prompt instruction saying:

> "Please ask the human first."

**It is an application-enforced authorization boundary.**

---

## External Agent Demonstration

VERDICT was tested with an external Gemini agent against the deployed application.

The agent discovered the application's six WebMCP tools and executed the decision workflow through those tools:

```
Discover tools
      ↓
Research
      ↓
Score
      ↓
Challenge
      ↓
Adjust battery priority
      ↓
Score again
      ↓
Adjust performance priority
      ↓
Challenge again
      ↓
Request commit
      ↓
Attempt unauthorized commit
      ↓
HUMAN_APPROVAL_REQUIRED
      ↓
Human approves
      ↓
Commit succeeds
```

This is the core VERDICT experience:

**The agent participates in the decision without owning the decision.**

---

## Final Demonstrated Decision

After explicit human approval, the demonstrated run produced:

```
Decision ID: VD-MTLA9MEK-9427

Selected option: Laptop B
Final score:      89.1

Performance:      65%
Battery:          24%
Portability:      11%

Final ranking:
1. Laptop B — 89.1
2. Laptop A — 86.3
3. Laptop C — 84.5
```

The committed record is frozen to protect the recorded decision state.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VERDICT UI                       │
│                                                     │
│  Decision Board │ Priority Controls │ Approval UI   │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              CANONICAL DECISION STATE               │
│                                                     │
│ Options • Priorities • Scores • Challenges          │
│ Approval State • Commit State • Activity            │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                DECISION ENGINE                      │
│                                                     │
│ Scoring • Ranking • Normalization                   │
│ Challenge Analysis • Tipping Points                 │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  WebMCP SURFACE                     │
│                                                     │
│ research_options                                    │
│ score_options                                       │
│ challenge_top_pick                                  │
│ adjust_priority                                     │
│ request_commit                                      │
│ commit_decision                                     │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
                 External AI Agent
```

---

## Technology

**Frontend**
- React
- TypeScript
- Vite

**Agent Interface**
- Native WebMCP
- `document.modelContext.registerTool()`

**Decision Engine**
- Deterministic weighted scoring
- Dynamic weight normalization
- Ranking
- Adversarial challenge analysis
- Exact tipping-point calculation

**Deployment**
- Vercel

---

## Project Structure

```
src/
├── components/
│   ├── Header.tsx
│   ├── PrioritySliders.tsx
│   └── ...
│
├── engine/
│   └── decisionEngine.ts
│
├── store/
│   └── decisionStore.ts
│
├── types/
│   └── verdict.ts
│
├── webmcp/
│   └── webmcp.ts
│
└── App.tsx
```

The separation is intentional:

```
UI → State → Decision Engine → WebMCP
```

This keeps agent capabilities tied to actual application behavior rather than creating a second implementation of the product for the demo.

---

## Why This Matters Beyond Laptops

The laptop scenario is only the demonstration domain.

The same architecture applies anywhere a recommendation needs both reasoning and authorization.

| Domain | Question |
|--------|----------|
| Procurement | "Which vendor should we select?" |
| Hiring | "Which candidate best matches the role?" |
| Housing | "Which property best fits our priorities?" |
| Travel | "Which itinerary balances cost, time, and comfort?" |
| Business Operations | "Which action should we take given the current constraints?" |
| Financial Planning | "Which option best fits the selected objectives?" |

The underlying pattern remains:

```
Evaluate → Explain → Challenge → Negotiate → Authorize → Commit
```

---

## What WebMCP Makes Possible

Before an agent-aware application surface, an agent may need to infer how to operate a website.

With WebMCP, the application can expose intentional capabilities directly.

For VERDICT, that means an external agent can interact with concepts such as:

```
"change the priority"
"challenge the recommendation"
"request commitment"
"commit the decision"
```

instead of attempting to reconstruct those concepts from pixels and DOM elements.

The result is a cleaner human-agent interaction model:

- The UI is for humans.
- The tools are for agents.
- The underlying state is shared.

---

## Security & Trust Model

**Agent capabilities** — The agent can:
- Read decision state
- Calculate scores
- Challenge recommendations
- Change priorities
- Request commitment

**Human authority** — The human controls:
- Final approval
- Authorization to commit

**Enforcement** — Unauthorized commitment returns:

```
HUMAN_APPROVAL_REQUIRED
```

The authorization requirement is enforced inside the application's decision flow rather than relying solely on agent instructions.

---

## Verification Scope

VERDICT includes a local WebMCP test console for exercising the application's registered tools.

The project was also tested with an external Gemini agent against the deployed application.

The strongest verification path is:

```
External Agent
      ↓
Discover WebMCP tools
      ↓
Invoke native tools
      ↓
Observe shared decision state
      ↓
Attempt unauthorized commit
      ↓
Application rejects
      ↓
Human approves
      ↓
Commit succeeds
```

This demonstrates the intended human-agent interaction rather than merely displaying WebMCP-related UI.

---

## Running Locally

```bash
git clone <repository-url>
cd verdict
npm install
npm run dev
```

**Build:**

```bash
npm run build
```

**Test:**

```bash
npm test
```

The application can be tested in a WebMCP-compatible environment.

For Chrome-based testing, use `chrome://flags/#enable-webmcp-testing` as described by the WebMCP challenge documentation.

---

## Design Principles

**1. Shared State Over Parallel State**
Humans and agents should interact with the same decision state.

**2. Recommendation Is Not Authorization**
An agent can propose an action without automatically being allowed to finalize it.

**3. Challenge the Winner**
A recommendation becomes more useful when the system can explain how it could fail.

**4. Make Trade-offs Explicit**
Priorities should be visible, adjustable, and mathematically reflected in the outcome.

**5. Prefer Application-Level Enforcement**
Critical authorization rules should be enforced by the application, not merely requested through prompts.

**6. Demonstrate, Don't Just Describe**
Every important claim should be observable through the application or its tool execution.

---

## The Bigger Vision

VERDICT explores a future where websites are not passive interfaces consumed by AI.

They are decision environments designed for both humans and agents.

**The human brings:** Intent • Context • Values • Authority

**The agent brings:** Analysis • Exploration • Challenge • Execution

VERDICT provides the shared surface where those capabilities meet.

---

## Demo

**Live Application:** https://verdict-two-lac.vercel.app/

---

> *"AI should not only tell us what to choose.*
>
> *It should be able to explain why, challenge itself, show us when the answer changes, and know where human authority begins."*

---

# VERDICT

**Don't just ask AI what to choose. Make it defend the choice.**

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Decision Scenarios

VERDICT is designed as a domain-independent decision-negotiation engine.

The decision engine does not depend on laptops, apartments, or any single category. The same WebMCP tool surface operates against whichever decision scenario is active.

Currently, VERDICT includes two built-in scenarios:

### 💻 Hardware Selection

> "Which laptop should I choose for AI development and daily commuting?"

| Criterion | Example Weight |
|-----------|---------------|
| Performance | 35% |
| Battery | 45% |
| Portability | 20% |

The recorded external-agent demonstration uses this scenario to show the complete WebMCP workflow from tool discovery through human-approved commitment.

---

### 🏠 Housing Decision

> "Which apartment should I lease for hybrid work and city commute?"

| Criterion | Weight |
|-----------|--------|
| Rent & Value | 40% |
| Commute Ease | 35% |
| Space & Layout | 25% |

Current example options include Downtown Loft, Financial District Core, and Midtown Flat.

The current decision state produces: **Midtown Flat — 84.3 points**

---

### Domain-Agnostic WebMCP Architecture

The important architectural point is that the WebMCP protocol does not change when the scenario changes.

```
             VERDICT
                │
       Canonical Decision State
                │
      ┌─────────┴─────────┐
      │                   │
Hardware Selection    Housing Decision
      │                   │
      └─────────┬─────────┘
                │
         Same WebMCP Tools
                │
                ▼
research → score → challenge
    → adjust → request → commit
```

The same six tools remain available when switching between decision domains:

```
research_options
score_options
challenge_top_pick
adjust_priority
request_commit
commit_decision
```

Changing from Hardware Selection criteria (Performance, Battery, Portability) to Housing criteria (Rent & Value, Commute Ease, Space & Layout) does not require a different agent protocol.

The agent still follows the same decision lifecycle:

```
Research → Score → Challenge → Adjust Priorities
→ Re-score → Challenge Again → Request Human Approval → Commit
```

This separation between decision domain and decision protocol is a core design principle of VERDICT.

---

### Recorded Demonstration vs. Product Capability

The primary recorded demo uses Hardware Selection because it provides a clear, compact example of the complete workflow.

The application also contains the Housing Decision scenario to demonstrate that the underlying architecture generalizes beyond the recorded laptop example.

> "The laptop is the demonstration domain — not the limitation of the engine."

The product's reusable primitive is the decision protocol itself:

```
Evaluate → Explain → Challenge → Negotiate → Authorize → Commit
```

This allows future scenarios to be added without redesigning the agent interaction model.
