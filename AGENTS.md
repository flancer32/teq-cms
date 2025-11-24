# AGENTS.md — entry instruction for LLM agents

Version: 20251124

## Purpose

This file is the root entry point for projects that use ADSM (Agent-Driven Software Management).
It defines the roles of the Human and the Agent, the structure of the cognitive context, and the methodology invariants.
It is read by the Agent first, before any local instructions.

---

## ADSM Principles

### Project Spaces

A project consists of two interconnected spaces:

- **Cognitive context** (`./ctx/`) — documentation, rules, specifications.
- **Software product** (everything outside `ctx/`) — source code and executable artifacts.

The context defines the rules for modifying the product; the product reflects the applied context.

### Interaction

- The Human formulates goals, maintains the context, and approves changes.
- The Agent interprets the context and modifies the product within its boundaries.
- Every iteration ends with an Agent report.

---

## Roles

**Human:** goals, context management, approval of changes, structural development.  
**Agent:** task execution within the context, correct modification of the product, maintaining consistency, preparing iteration reports.

---

## Minimal Project Structure

```text
/
├─ ctx/         ← cognitive context
├─ AGENTS.md    ← instruction for agents
└─ README.md    ← human-readable project description
```

---

## Context Dependencies

Agent behavior is defined by documents located in:

```txt
./ctx/
```

Recommended files:

- `ctx/agent/AGENTS.md` — local agent rules;
- `ctx/product/overview.md` — product purpose;
- `ctx/rules/architecture.md` — architectural principles;
- `ctx/rules/language.md` — language policy;
- `ctx/rules/privacy.md` — personal-data handling rules.

### AGENTS.md instructions in other directories

If the project contains additional `AGENTS.md` files (e.g., `ctx/rules/AGENTS.md`, `src/module/AGENTS.md`), the Agent must treat them as part of the cognitive context **within their respective space**.

**ADSM Rule:**  
When performing a task in directory `X`, the effective working context for the Agent consists of all `AGENTS.md` files located along the path from the project root to directory `X`.

The Agent must:

- treat all these files as a unified system of rules;
- resolve overlaps according to directory hierarchy (deeper directories have higher priority within their space).

---

## `@LLM-DOC` Comments

`@LLM-DOC` is embedded context inside the source code.  
It records architectural decisions and is protected.

Rules:

1. The marker is used only inside source files.
2. All comments must be written in English.
3. The Agent must detect, preserve, and never modify or delete any `@LLM-DOC` comment, using it as authoritative context.

**ADSM Invariant:** modifying `@LLM-DOC` = `execution error`.

---

## Reporting

Each iteration ends with a report:

```txt
./ctx/agent/report/YYYY/MM/DD/HH-MM-{title}.md
```

A report includes the iteration goal, performed actions, and resulting artifacts.  
Missing report = `execution error`.  
If `ctx/agent/report-template.md` exists, the Agent uses it.

**Protection Rule:**  
All files inside `ctx/agent/report/` are immutable.  
The Agent must **never modify, delete, rewrite, or rename** any file in this directory.  
Attempting to alter a historical report = `execution error`.

---

## Historical Reports (`ctx/agent/report/`)

The `ctx/agent/report/` directory is a **historical archive** of past human–agent interactions.

Rules:

1. Reports are **read-only artifacts**.  
   They must never be modified, reprocessed, regenerated, or merged by the Agent.

2. The directory is **not part of the active cognitive context**.  
   The Agent must **not read, scan, analyze, summarize, or infer rules** from historical reports unless the Human explicitly instructs otherwise.

3. Only the Human may restructure or reorganize past reports.  
   The Agent creates **only a new report for the current iteration** and does not touch previous ones.

---

## Compatibility

This file defines ADSM invariants and is used unchanged across all projects.  
Project-specific specifications are placed in `./ctx/` and in `@LLM-DOC` comments.

---

## `output.md` Files

`output.md` files are not part of the cognitive context and must be ignored by the Agent.
