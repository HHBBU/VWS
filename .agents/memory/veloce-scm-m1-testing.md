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

The checked-in Playwright CLI can discover Module 1 specs, but its downloaded Chromium binary may be unable to start in the Nix shell because browser shared libraries are unavailable.

**Why:** The managed browser testing agent completed the same preset-and-map flow successfully while the local CLI runner failed before executing a test due to missing Chromium runtime libraries.

**How to apply:** Use the managed browser testing agent as the authoritative UI run unless the workspace intentionally adds and maintains the complete Chromium runtime. Do not add broad browser system dependencies solely to work around a one-off local test invocation.

## Deployment build separation

The deployment pre-build must not run API-dependent browser tests: publishing builds do not start the API server, so registration-based E2E setup returns gateway errors even when the app and tests work locally.

**Why:** A publish attempt failed because the root deployment hook invoked the full validation build, including E2E tests that require a live API service.

**How to apply:** Keep deployment hooks limited to dependency-safe checks such as typechecking, and let the artifact-specific production build create the static bundle. Run the full E2E suite separately with the development services running.
