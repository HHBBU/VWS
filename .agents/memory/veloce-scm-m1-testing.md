---
name: Veloce SCM Module 1 e2e testing quirks
description: Why Playwright-based e2e tests struggle with the M1 supplier allocation form, and a more reliable verification path for module1Engine changes.
---

The Module 1 decision form (`artifacts/veloce-scm/src/pages/student/module1.tsx`) has several UI patterns that repeatedly trip up the Playwright-based `runTest` tool, independent of any actual app bug:

- The SKU A/B forecast number inputs and the per-row allocation "Qty (kg)" input are plain controlled `<input type="number">` fields with no formatting/masking logic. Naive `fill()` calls can append to existing text instead of replacing it (observed values like "50004000050005000"), and sometimes the typed value fails to commit before the next action reads it back as blank/0. Always select-all + delete before typing, and re-verify the field's displayed value before proceeding.
- Transport mode and "Batches" are `Select` dropdowns with a small fixed set of options that are derived from the chosen supplier's region (nearshore -> truck/rail, offshore -> ocean/air) and from preset business rules (batches may only offer options like 1/2/4, not arbitrary numbers). Don't assume free-form values are selectable — inspect `SUPPLIERS`/`getTransportOptions` in the component source for the actual allowed values first.

**Why:** Multiple e2e attempts to verify a backend KPI change (supplier reliability variance / received-vs-allocated kg) failed repeatedly on unrelated form-interaction issues, not on the actual feature.

**How to apply:** For changes to `module1Engine.ts` (or other engine logic) whose effect surfaces through the M1 practice/submit KPIs, prefer verifying via a direct authenticated API call (`POST /api/student/modules/M1/practice` after `/api/auth/register`) with a hardcoded valid payload, rather than trying to drive the full allocation form through browser automation. Reserve UI e2e for testing the form/interaction logic itself, and remember the API server's `dev` script does not watch/reload — restart the `API Server` workflow after backend code changes before testing.

## Unit test infrastructure
This monorepo has no shared test runner — each package must add its own (e.g. `vitest`) plus a `test` script; the root `test`/`build` scripts only pick packages up via `--if-present`, they don't provide one.

**Why:** `artifacts/api-server` had zero test coverage despite containing grade-affecting scoring logic; there was nothing to build on when adding coverage for `module1Engine.ts`.

**How to apply:** When adding tests to a package here, check first whether it already has a `test` script before assuming a monorepo-wide convention exists.

## Local Playwright browser runtime

The checked-in Playwright CLI requires Chromium and its Linux shared libraries to be present in the Nix environment.

**Why:** UI tests can fail before reaching application code when the browser runtime is incomplete, which can be mistaken for a product regression.

**How to apply:** Keep the local runtime dependencies aligned with the checked-in Playwright version, and use the managed browser tester as an independent verification pass.

## Deployment build separation

The deployment build must produce every artifact consumed by the production run command while excluding browser tests that require live development services.

**Why:** Publishing does not start the API service during the build phase, but the production runtime still needs both the compiled API server and the static web bundle.

**How to apply:** Run dependency-safe checks, then explicitly build the API and web artifacts with their required build-time environment. Run the full E2E suite separately with development services running.

## Artifact readiness retries

Replit's artifact coordinator may log failed route probes before a runnable artifact has bound its port; application code cannot answer requests before its process is listening.

**Why:** These pre-bind retries can look like API failures even when the process starts normally and the same readiness route returns 200 immediately afterward.

**How to apply:** Judge startup health from the sequence: require a successful port/listen event and a dependency-free readiness response after binding. Keep readiness routes ahead of session and database middleware, and treat only post-bind failures as application regressions.
