# ADR-003 — §8.1 data bridge wired early as a `vendor/soleat` git submodule

- **Status:** Accepted
- **Date:** 2026-05-22
- **Serial:** (№ 7 - 22-05 '26 06:25 SGT)

## Context

`BUILD-PLAN.md §8.1` requires a read-only bridge to `ang-kl/gia` for the
cuisine catalogue + versioned vault, with **Option B (git submodule)** as the
default. `§14` listed the bridge as an open question and `§12` scheduled the
work for Phase 4.

The operator directed setting the bridge up **now** (2026-05-22) and made
`ang-kl/gia` **public** to enable it. This matters: the environment's git
proxy authorizes only `ang-kl/gia-wa` ("repository not authorized" for `gia`),
and direct GitHub access has no credentials — but a *public* `gia` is
reachable over the canonical `https://github.com/ang-kl/gia.git` URL with no
proxy and no auth. A canonical URL is also **stable**, which a submodule
requires (the proxy URL carries a per-container port).

## Decision

1. **Option B confirmed and wired.** `ang-kl/gia` is a git submodule at
   `vendor/soleat/`, URL `https://github.com/ang-kl/gia.git`, pinned at
   **`v0.61.99`** (commit `ddf5f37`). This resolves the `§14` vault-bridge
   open question.
2. **Deviation from `§12`.** The bridge was a Phase 4 item; it is wired at
   Phase 1 per operator direction. Logged here per `§0.2`.
3. **Tooling isolation.** `vendor/` is excluded from `npm run syntax`
   (`package.json`) and from vitest (new `vitest.config.js`). Without this,
   Gia-WA's preflight pulls in Soleat's ~85 root `.js` files and its test
   suite — which needs `@anthropic-ai/sdk` and Soleat's own modules and fails.
4. **D-2 holds.** `vendor/soleat` is strictly read-only — never edited,
   never committed into, never PR'd.

## Consequences

- The full submodule checkout is **~920 MB**: `vault/` is 766 MB across 16
  versions (`v0.58.49` … `v0.61.90`), `geoloc/` is 119 MB. Gia-WA's own repo
  does **not** bloat — only `.gitmodules` + a gitlink SHA are committed; the
  size is borne by anyone running `git submodule update --init`.
- **Recommendation for Phase 4 consumers / CI:** sparse-checkout the submodule
  to `data/` + the newest `vault/<version>/` only (`1st_Setup.MD §6`,
  "newest only") — cuts ~900 MB to tens of MB. Not encoded in `.gitmodules`
  (sparse-checkout is a per-clone setting); apply via the setup script.
- A fresh `git clone` of Gia-WA is unaffected — submodules are not fetched
  unless `--recurse-submodules` / `submodule update --init` is run.
- The clone used `GIT_LFS_SKIP_SMUDGE=1` (the account Git LFS budget is
  exhausted). The 766 MB vault appears to be plain files, not LFS — so this is
  likely moot — but Phase 4 should confirm before relying on vault contents.
- The submodule is **pinned**, not tracking `gia`'s HEAD. `gia` is a live
  production repo; the pin is bumped only on a deliberate re-sync.

## Revisit when

- Phase 4 wires `src/data/vault.js` + `src/data/cuisines.js` against
  `vendor/soleat/` (and applies the sparse-checkout).
- The operator green-lights `§8.1` Option A (a published `soleat-vault`
  package), at which point the submodule is retired.
