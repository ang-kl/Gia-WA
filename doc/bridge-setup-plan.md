# Handoff plan — wire the §8.1 read-only bridge to `ang-kl/gia`

> **Purpose.** A one-off runbook for the *next* Claude Code session. The
> current session is access-scoped to `ang-kl/gia-wa` only and physically
> cannot reach `ang-kl/gia`; setting up the `BUILD-PLAN §8.1` bridge requires
> an environment reconfigured to authorize `ang-kl/gia` read-only.
>
> **Status.** Pending. Obsolete once the bridge PR merges — at that point move
> this file to `doc/Archive/` (Rule N-3: never overwrite, archive unchanged).
> Not a `CLAUDE-FULL.md §1` versioned doc, hence the `doc/` root placement
> (same as the non-§1 `decisions/` folder).
>
> **Created.** 22-05-26, session #006. Pairs with `BUILD-PLAN.md §8.1`.

---

## A. Before the session (operator)

1. Reconfigure the environment so the git proxy authorizes **`ang-kl/gia`
   read-only** — Claude Code web app → environment settings. Reference:
   https://code.claude.com/docs/en/claude-code-on-the-web
2. Start a new session on that environment.

## B. Verify access (first thing in the new session)

3. **Orient.** Read `CLAUDE.md` and `BUILD-PLAN.md` §0, §2 (D-1 / D-2), §8.1,
   §12, §14, plus the latest `doc/Journal/` entry. Note PR #3 (R.E.D = Phase 5)
   may still be an open draft.
4. **Probe `gia`.** Run `git ls-remote` against `ang-kl/gia` (derive the URL
   from `git remote -v` — same proxy host/port as `origin`, repo path swapped
   to `ang-kl/gia`). If it returns `repository not authorized` or prompts for
   auth → **STOP**: the reconfiguration did not take. Report to the operator;
   do not proceed.

## C. Decide the submodule URL (the one real gotcha)

5. The Gia-WA `origin` URL uses a **proxy port that changes between
   containers**. A submodule records its URL in `.gitmodules` permanently, so
   a proxy-port URL will break on the next container. Before adding the
   submodule, choose one:
   - canonical `https://github.com/ang-kl/gia.git` in `.gitmodules` + a git
     `insteadOf` rewrite to the proxy (set in the environment setup script); or
   - a **stable** path if the reconfigured environment exposes one.
   If neither is clean, reconsider `BUILD-PLAN §8.1` **Option C** (cached copy)
   over **Option B** (submodule), and record the reasoning.

## D. Set up the bridge

6. `git submodule add <stable-url> vendor/soleat` — pin it. The `gia` vault is
   large (~150 MB across versions, `1st_Setup.MD §6`); use `--depth 1` or
   sparse-checkout to pull only `data/` + the newest `vault/<version>/`.
7. Ensure CI runs `git submodule update --init` (`BUILD-PLAN §8.1`, "Con").
8. Defer the `src/data/vault.js` / `cuisines.js` loaders to Phase 4 — this task
   lands the **bridge structure only**, not the loader code.

## E. Document & commit

9. Write **ADR-003** — setting up the bridge ahead of Phase 4 (deviation from
   §12), confirming **Option B / submodule**. This resolves the `§14` "vault
   bridge" open question. Record the step-5 URL decision.
10. Update `BUILD-PLAN §14` (mark the vault-bridge question resolved) and §8.1
    if the chosen mechanism differs from the default.
11. Bump `doc/.serial-state.yml` counters; append a Journal HDR; commit with a
    serial-numbered message; push; open a **draft PR**.

## F. The actual goal — audit `gia`'s substantial changes

12. With `gia` readable under `vendor/soleat/`, diff reality against
    `BUILD-PLAN §3`'s audit (dated ~2026-05-15): the §3a engine file
    inventory, the Telegram surface (§3.1), the AI integration points (§3.2),
    the data layer + vault version (§3.3).
13. Produce an impact assessment — which `BUILD-PLAN` sections / phases are now
    stale — and log ADRs for anything that shifts a directive or the phase plan.

---

## Copy-paste kickoff prompt for the new session

```
Task: wire the BUILD-PLAN §8.1 read-only bridge to ang-kl/gia, then audit
gia's recent substantial changes.

Context: this is Gia-WA, the WhatsApp port of Soleat. The environment has
just been reconfigured to authorize ang-kl/gia read-only. D-2 is absolute:
gia is READ-ONLY, never edit or PR it. Follow doc/bridge-setup-plan.md.

Steps:
1. Read CLAUDE.md and BUILD-PLAN.md §0, §2, §8.1, §12, §14.
2. Verify ang-kl/gia is reachable via git ls-remote. If not, stop and tell me.
3. Resolve the URL-stability issue before adding the submodule: the proxy
   port changes per container, so .gitmodules must use a stable URL (canonical
   github URL + insteadOf, or a stable env path). If neither works cleanly,
   compare §8.1 Option B vs Option C and recommend.
4. Add gia as a submodule under vendor/soleat/ (shallow / sparse — the vault
   is ~150MB; pull only data/ + the newest vault/<version>/).
5. Write ADR-003 (bridge set up ahead of Phase 4; confirms §8.1 Option B;
   resolves the §14 vault-bridge open question). Update BUILD-PLAN §14/§8.1,
   bump doc/.serial-state.yml, append a Journal HDR.
6. Commit (serial-numbered message), push, open a draft PR.
7. Then audit gia vs BUILD-PLAN §3's ~2026-05-15 audit and report what changed
   and which BUILD-PLAN sections/phases are now stale.
```
