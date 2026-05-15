# ADR-001 — All bootstrap phases land on a single session branch

- **Status:** Accepted
- **Date:** 2026-05-15
- **Serial:** (№ 1 - 15-05 '26 14:44 SGT)

## Context

`BUILD-PLAN.md` §12 prescribes one branch + one draft PR per phase
(`claude/phase-<N>-<slug>`). The receiving Claude Code session was, however,
launched with a session-level instruction locking all changes to a single
branch named `claude/build-gia-wa-StD7x`, with explicit guidance not to push
elsewhere without operator permission.

The two instructions conflict. Per BUILD-PLAN §0.2 ("if a section conflicts
with what the operator says in chat, the operator wins — but log the
deviation"), the session-level instruction takes precedence, and this ADR
records the deviation so it is auditable from `doc/decisions/`.

## Decision

Bootstrap (Phase 0) and skeleton/transport (Phase 1) ship as a single,
sequential set of commits on `claude/build-gia-wa-StD7x`. The PR opened from
that branch is the v0.1.0 bootstrap PR. Subsequent phases (Phase 2 onward) may
be split into their own branches once the operator confirms the per-phase
branching convention should resume — but that is a future decision, not
this one.

## Consequences

- Reviewers see Phase 0 + Phase 1 in one PR diff rather than two; the diff is
  modest (~700 LoC of new code + tests + docs) so this is tolerable.
- The Journal HDR block for this work bundles both phases in one entry rather
  than two (`#001`), which is consistent with the single-PR shape.
- If a hot-fix is needed for Phase 1 transport code after Phase 2 lands, it
  cannot be reverted by reverting a single Phase-1-only branch. Mitigation:
  the relevant Phase 1 commits are isolated commits inside the merged branch,
  so a per-file `git revert` remains viable.
- This deviation does not affect any operator directive D-1 through D-6.

## Revisit when

The operator green-lights Phase 2 entry. At that point we either (a) confirm
the single-branch model continues, or (b) switch to one-branch-per-phase from
Phase 2 onward. If (b), append an `ADR-002` here.
