# Product

## Register

product

## Users

AgentFlight is used by developers, reviewers, and coding agent operators during local software development. They are usually inside an agentic engineering session, reviewing what a coding agent changed, deciding whether the work is safe to continue, or handing the next action to another agent or human reviewer.

## Product Purpose

AgentFlight is a local-first review layer for coding agent sessions. It records what the coding agent did, captures verification evidence, shows failure excerpts, identifies proof gaps, checks whether proof is still fresh for the current changed files, and helps reviewers decide what should happen next.

Success means a developer can trust the artifact quickly: what changed, what proof exists, whether that proof still applies, what failed or is missing, and whether the work is ready for review.

## Brand Personality

Precise, calm, trustworthy.

The UI should use exact labels, concrete evidence, low visual noise, honest readiness states, and visible verification details. It should never imply confidence that the recorded evidence does not support.

## Anti-references

AgentFlight replay and report surfaces should not look like SaaS dashboard clutter, flashy terminal cosplay, AI hype UI, marketing cards, gamified badges, dark-neon hacker screens, generic observability dashboards, over-designed analytics products, or travel/airline software despite the flight metaphor.

## Design Principles

- Treat evidence as the primary interface.
- Make risk and readiness skimmable without hiding the underlying facts.
- Flag stale proof directly instead of making reviewers infer it from timestamps.
- Keep the surface calm until the evidence says something is wrong.
- Prefer developer-native review patterns over decorative product metaphors.
- Optimize for screenshots, handoffs, and incident-style reconstruction.

## Accessibility & Inclusion

Use clear contrast, readable system typography, semantic document structure, and text-first evidence. Do not rely on color alone for verification or risk state. Keep motion optional and minimal.
