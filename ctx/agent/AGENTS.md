# Agent External Context

- Path: `ctx/agent/AGENTS.md`
- Template Version: `20260702`
- Changed: `20260807`

## Purpose

This file marks `ctx/agent/` as a project-local branch for agent and tool materials.

## Bootstrap Marker

- This branch exists in an ADSM-managed context.
- Use skill `adsm-ctx` for methodology rules about the boundary of `ctx/agent/`.

## Level Map

- `AGENTS.md` — boundary definition for `ctx/agent/`.

## Level Boundary

Defines:

- `ctx/agent/` as the local branch for project-specific agent and tool materials.
- The boundary between the reusable ADSM baseline and project-local operational content.
- The rule that only this file belongs to the template-managed baseline for `ctx/agent/`.

Does NOT define:

- Product meaning or user-facing project requirements.
- Architecture ownership or code-level implementation constraints.
- The required shape of future project-local subdirectories under `ctx/agent/`.

## Local Rule

Project-specific subdirectories and files under `ctx/agent/` are local project material rather than part of the reusable template baseline.
