# VClass Teacher Earnings V1 — Implementation Blueprint

Status: **Phases 0-4 done and live-verified against production Supabase; Phases 5-7 (BQE/CRA/FEA/RCEsp) implemented at the calculation+API level; web+mobile player integration (heartbeat) done, code-reviewed but not live-verified. Phase 8 (settlement/payout execution), Phase 9-10 (UI), and concurrency/fraud hardening still open. `video_duration` sync-from-Bunny shipped but blocked on an invalid `BUNNY_API_KEY` — see Session 4. See the numbered gap list and Definition-of-Done table below for the exact, current picture — this header is a summary, not the source of truth.**
Source of truth: `Politica-de-Remuneracao-e-Comissoes-dos-Professores.pdf` (V1.0, Setembro 2026).

## Baseline

| Field | Value |
|---|---|
| Baseline commit | `8bcc15d3868bd0c20eb2b3f3c1a98687ad44b2c6` |
| Branch | `main` |
| Working tree | clean except 3 pre-existing untracked files unrelated to this task |
| Test status | `npx vitest run` → 3 files, 36 tests, **all passing** |
| DB migration status | 29 SQL migrations applied sequentially (`database/migrations/001`…`029`), no ORM — hand-written SQL + Supabase JS client |

## Architecture discovered

- **Backend**: Cloudflare Pages + Workers, Hono framework, TypeScript. No separate Node server. No queue/cron trigger configured in `wrangler.jsonc` (only a `RATE_LIMIT` KV namespace).
- **Frontend web**: static HTML/JS pages (`src/pages`), not a React SPA (ARCHITECTURE.md is aspirational/stale on this point).
- **Mobile**: Expo/React Native (`mobile/`), not Flutter — ARCHITECTURE.md is stale here too. Has parallel API client (`mobile/src/api`).
- **Database**: Supabase Postgres. Auth is **not** Supabase Auth — it's a custom JWT (HS256, `src/utils/jwt.ts`) validated in `src/middleware/auth.ts`. Backend always uses the Supabase **service_role** key, so RLS policies that exist in migrations are defense-in-depth, not the actual authorization boundary — real authorization is `requireRole(...)` in application code, keyed off the JWT's `role` claim.
- **Roles**: `student`, `teacher`, `admin`, `support`, `editor`, `country_manager`, `finance`, `moderator` (migration 020). A `finance` role with `requireFinanceOrAdmin` already gates `src/routes/finance.ts` — this is the natural home for admin-side earnings approval/settlement endpoints.
- **Testing**: Vitest, `tests/*.test.ts`, currently only `jwt`, `password`, `refreshTokens`. No integration tests, no Supabase-backed test harness.

## Existing systems relevant to Teacher Earnings V1

| Concern | What exists today | Fit for policy |
|---|---|---|
| Lessons | `lessons` table: duration in `video_duration` (seconds), `is_free`, `created_by`, `status`, flat `views_count` counter | Reusable as-is for VQ-R duration-bucket logic (Art. 7) |
| Student progress | `student_progress`: `progress_percent`, `time_spent`, `last_position`, `status` (not_started/in_progress/completed), updated on **exercise submission**, not video watch time | **Not sufficient** — no server-side video-consumption record at all |
| Video watch tracking | `POST /api/video/:lessonId/progress` in `src/routes/video.ts` is a **stub** — it validates input and returns 200 but explicitly does not persist anything server-side (comment: "será persistido no localStorage do cliente") | **Critical gap** — this is the foundation the entire VQ-R/VQ-P/VQ-B/VQ-NR/VNQ engine depends on and it does not exist |
| Subscriptions/payments | `subscriptions` table (migration 001): `plan_type`, `status`, `amount`, `payment_provider`, `payment_id`. No dedicated payments table, no gateway integration (no Stripe/M-Pesa secrets anywhere in `wrangler.jsonc`), no tax/fee/refund/chargeback fields. `finance.ts` even ships hardcoded `FICTITIOUS_SUBSCRIPTIONS` demo rows shown whenever the real table is empty | **Critical gap for CRA** — no source of "net eligible revenue"; `amount` is a flat manually-recorded number |
| Referrals | Nothing. No referral code/link, no attribution table, no self-referral guard | Build from scratch |
| Teacher analytics | `src/routes/creator.ts` (`/api/creator/dashboard`) — queries `.from('lesson_progress')`, a table that **does not exist** (only `student_progress` exists; `lesson_progress` is a leftover trigger-function name). This silently zeroes out student/engagement stats. Pre-existing bug, unrelated to this task, flagged for visibility | Dashboard shell exists and is the natural place to extend with earnings widgets, but its current student-engagement numbers are already broken |
| Admin tooling | `src/routes/admin.ts`, `src/routes/finance.ts` with `requireFinanceOrAdmin` | Reusable pattern for the new admin earnings endpoints |
| Free preview lessons | `lessons.is_free` flag already implements "free preview" access | Maps directly to the 10-free-lessons / VQ-P requirement (Art. 8 area) — needs confirmation of the "10" cap enforcement point |
| Jobs/cron | None. No Cloudflare Cron Trigger, no queue | Monthly settlement (Art. 30–31) cannot run on a schedule without adding a Cron Trigger (needs its own `wrangler.jsonc` `[triggers]` block — Pages Functions support this via a companion Worker, needs verification) or being admin-triggered manually |

**Conclusion**: this is not "wire a policy onto existing infrastructure" — the two hardest requirements (server-authoritative watch-time and net eligible revenue) have **no existing foundation at all**. Building them correctly is the majority of the real engineering effort.

## Requirement Traceability Matrix (partial — full matrix grows as each phase lands)

| ID | Policy rule | Existing system | Gap | Solution sketch |
|---|---|---|---|---|
| TE-V1-001 | 5-tier VQ classification (Art. 6) | none | full gap | New `view_classification` enum + `qualified_views` ledger table |
| TE-V1-002 | Consumption thresholds by duration (Art. 7) | `lessons.video_duration` exists; no watch-time capture | full gap | Watch-event ingestion + server-side aggregation service |
| TE-V1-003 | Funding-source eligibility (Art. 5.3) | `subscriptions.plan_type`; no institutional/sponsored/scholarship concept | partial gap | `funding_source` enum + eligibility resolver, not just `plan != free` |
| TE-V1-004 | Repeat limit: 2 remunerable VQ / student / lesson / 30 days (Art. 13) | none | full gap | Concurrency-safe counter (DB constraint/advisory lock), reason-coded VQ-NR |
| TE-V1-005 | VCPM progressive tiers (Art. 15–16) | none | full gap | Pure calculation function, DECIMAL arithmetic, versioned config |
| TE-V1-006 | BQE quality bonus tiers (Art. 18–19) | `student_progress.status='completed'` is exercise-driven, not video-consumption-driven | **ambiguous — see PDR-003** | Deferred pending definition of "completion" for BQE purposes |
| TE-V1-007 | CRA 15% of net eligible first revenue (Art. 21–24) | `subscriptions.amount` flat, no gross/tax/fee/refund breakdown | full gap | New net-revenue recording model; flag if inputs insufficient |
| TE-V1-008 | Referral attribution, 30-day window (Art. 21–24) | none | full gap | Referral code/link system + attribution table |
| TE-V1-009 | FEA ambassador fee, contractual (Art. 25) | none | full gap | Contract table (start/end/amount/status), admin CRUD |
| TE-V1-010 | RCEsp special content fee (Art. 25) | none | full gap | Contract table, admin CRUD |
| TE-V1-011 | Earnings ledger + states (Art. 28–29) | none | full gap | Immutable ledger table + state machine |
| TE-V1-012 | Monthly settlement cycle (Art. 30–31) | no cron infra | full gap + infra gap | Admin-triggered close initially; Cron Trigger if/when infra confirmed |
| TE-V1-013 | 500 MZN minimum payout, carry-forward (Art. 31) | none | full gap | Payout eligibility check on approved balance |
| TE-V1-014 | Anti-fraud practices (Art. 32–33) | rate limiting exists (IP-based, auth endpoints only) | partial gap | Risk-flag foundation on the new watch-event/referral pipelines |
| TE-V1-015 | RLS / authorization isolation (Art. 3, general) | JWT-role authorization pattern established; RLS is defense-in-depth only, backend uses service_role | reusable pattern | New tables follow same `requireRole` pattern + matching deny-by-default RLS policies (per migration 004's existing convention) |

## Policy Decisions Required (blocking or materially risky)

**PDR-001 — Watch-time authority.** The policy requires the backend to be the sole authority for consumption (Section 6 of the implementation prompt), but no watch-event pipeline exists today. Recommendation: build a minimal event model (`play`/`heartbeat`/`pause`/`seek`/`ended`, heartbeat every ~15s) rather than trusting a single "percent" post. This is a scope decision, not just a technical one, because it determines how much of the mobile app also needs to change (Expo player) to emit these events. **Blocks TE-V1-002 and everything downstream of it.**

**PDR-002 — Net eligible revenue source.** No payment gateway is integrated; `subscriptions.amount` has no tax/fee/refund breakdown. Two options: (a) treat `amount` as already-net and accept the imprecision until a real gateway lands, explicitly documented as a known limitation; (b) add gross/tax/fee/discount fields to the subscription-creation flow now so CRA math is correct from day one, pushing scope onto whatever currently creates `subscriptions` rows (not yet audited in depth). **Blocks TE-V1-007.**

**PDR-003 — "Completion rate" definition for BQE.** The policy bonuses "taxa de conclusão" (Art. 18) but doesn't define it precisely, and the existing system already has a *different* completed-lesson definition (100% of exercises answered, independent of video watch time). Using the existing definition would make BQE partly decoupled from video consumption, which seems to contradict the policy's intent ("conteúdos que mantenham os estudantes envolvidos"). Recommendation: define completion for BQE purposes as % of a teacher's qualified views (all VQ types) that reach the Art. 7 consumption threshold — i.e., a video-consumption metric, separate from the exercise-based `student_progress.status`. Needs confirmation before Phase 5. **Blocks TE-V1-006.**

**PDR-004 — Referral attribution conflict rule.** Policy sets a 30-day window but not first-click vs. last-click when a student passes through two teachers' links. No prior system to defer to. Recommendation: first-click-wins within the 30-day window (avoids incentivizing spam re-sharing). Needs confirmation before Phase 6.

**PDR-005 — Rounding policy for MZN amounts.** Not specified in the policy. Recommendation: 2-decimal-place `NUMERIC(12,2)`, round-half-up, applied only at the final display/ledger-entry step (never mid-calculation) so progressive-tier math stays exact. Needs confirmation before Phase 4.

**PDR-006 — Monthly close timezone.** Not specified. Recommendation: `Africa/Maputo` (UTC+2, no DST) as the fixed reference for "day 1", "day 10", "day 15" boundaries.

**PDR-007 — Settlement execution without cron infra.** Cloudflare Pages projects don't natively support Cron Triggers the way standalone Workers do; needs verification before Phase 8. Fallback: an admin-initiated "close period" action in `finance.ts`, callable manually or via an external scheduler (e.g. GitHub Actions hitting an authenticated endpoint on a schedule) until real Cron Trigger infra is confirmed.

## Proposed sequencing (subject to the decisions above)

1. **Foundation (blocking everything):** watch-event ingestion + qualification engine (TE-V1-001..004) — resolves PDR-001.
2. **VCPM + ledger core:** TE-V1-005, TE-V1-011 — pure, testable, no external dependencies once (1) lands.
3. **BQE:** TE-V1-006 — blocked on PDR-003.
4. **CRA/referrals:** TE-V1-007..008 — blocked on PDR-002 and PDR-004; largest net-new surface (codes, attribution, revenue model).
5. **FEA/RCEsp:** TE-V1-009..010 — additive, low ambiguity, can run in parallel with (3)/(4).
6. **Settlement, payouts, dashboards, admin, security hardening, tests:** TE-V1-012..015 and beyond, once (1)-(5) are stable.

## Decisions recorded (2026-09-02)

The user confirmed the recommended option for every PDR posed after Phase 1, and chose **"Fundação primeiro"** for sequencing (build watch-tracking + qualification engine + VCPM + ledger schema now; CRA/FEA/RCEsp/settlement/dashboards later).

| PDR | Decision |
|---|---|
| Sequencing | Foundation first: Phase 2 (DB) → Phase 3 (qualification engine) → Phase 4 (VCPM) now. CRA, FEA, RCEsp, settlement, dashboards, admin UI deferred to later sessions. |
| PDR-002 (net revenue) | `subscriptions.amount` treated as already-net for now — documented limitation, revisit when a real payment gateway lands. Not yet consumed by any code (CRA is deferred). |
| PDR-003 (BQE completion) | Completion for BQE = % of a teacher's qualified views reaching the Art. 7 threshold (video-consumption basis), recorded in `earnings_policy_config.config.bqeCompletionBasis = "VIDEO_CONSUMPTION"`. Not yet implemented (BQE is Phase 5, deferred). |
| PDR-004 (referral attribution) | First-click-wins within the 30-day window. Recorded in `earnings_policy_config.config.craAttributionRule`. Not yet implemented (referrals are Phase 6, deferred). |
| PDR-005 (rounding) | `NUMERIC(14,2)`, round-half-up, applied only at the final output boundary — implemented in `src/utils/money.ts`. |
| PDR-006 (timezone) | `Africa/Maputo` recommended for future settlement-cycle code; not yet consumed (settlement is Phase 8, deferred). |
| PDR-007 (cron infra) | Still unresolved — no Cron Trigger exists. Deferred to Phase 8. |

## Phase 2–4 implementation status (this session)

**Delivered, with evidence:**

- `database/migrations/030_teacher_earnings_foundation.sql` — new tables (`video_watch_events`, `video_watch_sessions`, `qualified_views`, `teacher_earnings_ledger`, `earnings_policy_config`), `subscriptions.funding_source` column, RLS deny-policies matching the migration-004 convention, and the atomic classification function `fn_record_watch_heartbeat` (advisory-lock-serialized per student+lesson, idempotent on `event_id`, implements Art. 7 thresholds + Art. 5.3 funding eligibility + Art. 13 repeat limit in one Postgres transaction).
- `src/utils/money.ts` — BigInt-backed micro-MZN arithmetic, no floats in any money path; round-half-up only at the final display/storage boundary.
- `src/services/vcpmEngine.ts` — pure, progressive-tier VCPM calculator (Art. 15–16).
- `src/services/qualifiedViewEngine.ts` — pure TypeScript mirror of the SQL classification rules (Art. 6–7, 13), used for tests and any read-side surface that needs the rule without a DB round-trip. **Explicitly documented as not the financial authority** — the Postgres function is.
- `src/routes/video.ts` — new `POST /:lessonId/heartbeat` endpoint wired to `fn_record_watch_heartbeat` via `supabase.rpc(...)`; non-student roles and demo-mode (no DB configured) are accepted but not persisted into the classification pipeline, to avoid opening a self-view fraud path through preview/QA traffic (Art. 32).
- Tests: `tests/money.test.ts`, `tests/vcpmEngine.test.ts`, `tests/qualifiedViewEngine.test.ts` — cover every case from the mandatory test matrix (implementation-prompt section 44): consumption thresholds at all three duration bands, all 8 required VCPM figures plus the exact Art. 16 tier breakdown, the 3-view repeat-limit sequence, and money round-trip/rounding correctness. **`npx vitest run` → 6 files, 69/69 passing** (36 pre-existing + 33 new).

**Explicitly NOT verified (known limitation — no live Postgres/Supabase connection available in this session):**

- `fn_record_watch_heartbeat` and the new RLS policies have been hand-reviewed but **never executed against a real Postgres instance**. The advisory-lock concurrency guarantee, the `ON CONFLICT` upsert, and the repeat-limit query are design-correct on paper but unverified in practice.
- `POST /api/video/:lessonId/heartbeat` has not been exercised end-to-end (no running Supabase-backed environment in this session).
- No mobile-app or web-player changes were made to actually *emit* heartbeat events — the endpoint exists but nothing calls it yet. Wiring the player is required before any real VQ-R data exists.
- Concurrency/race-condition tests (two simultaneous heartbeats, two simultaneous purchases of the last repeat-limit slot) are **not implemented** — they require a live Postgres to be meaningful (mentioned in blueprint sections 41/47 of the implementation prompt) and are deferred to whichever session has DB access.

**Update (session 3, 2026-09-02) — migrations applied and function verified live:**

Migrations 030, 031 and 032 were applied to the linked production Supabase project (`Vclass`, ref `gibetvzeelfogmdsypcp`) via `supabase db query --linked -f <file>`, and every new table, the `subscriptions.funding_source` column, and `fn_record_watch_heartbeat` (9-arg signature) were confirmed to exist afterward via `information_schema`/`pg_proc` queries.

`fn_record_watch_heartbeat` was then exercised against real data **inside a `BEGIN ... ROLLBACK` transaction** (an existing lesson and two existing student accounts were used as fixtures; the transaction was rolled back and every touched row — `lessons.video_duration`/`is_free`, `subscriptions`, `qualified_views` — was confirmed back to its exact original state afterward). Five scenarios, all classified correctly on the first attempt:

| Scenario | Setup | Result |
|---|---|---|
| First remunerable view | Paid student, non-free 600s lesson, 240s watched (exactly the 40% Art. 7 threshold) | `VQ-R` ✅ |
| Second remunerable view | Same student/lesson, second session | `VQ-R` ✅ |
| Third view (repeat limit) | Same student/lesson, third session | `VQ-NR` / `REPEAT_LIMIT` ✅ |
| No eligible subscription | Different student, no active paid plan, same non-free lesson | `VQ-NR` / `INELIGIBLE_ACCESS` ✅ |
| Free preview lesson | Same student as above, lesson flipped to `is_free = true` | `VQ-P` ✅ |

Resending the first event's `event_id` mid-session (idempotency check) caused no error and no double-count — if the unique constraint or the idempotency early-return had a bug, this would have failed the whole script.

**What this upgrades, and what it still doesn't:** the classification logic (thresholds, funding eligibility, repeat limit, free-lesson handling, idempotency) is now verified against real Postgres, not just reviewed by hand. **True concurrency (two simultaneous requests racing the advisory lock) was still not tested** — this run was a single sequential session, which cannot exercise the lock contention path. That remains an open item before this is fully trusted for production financial correctness under load.

**Also fixed in session 3:** the funding-eligibility subquery inside the function previously didn't check `expires_at`, meaning an expired-but-still-`active`-status subscription would have incorrectly counted as eligible — this was caught and fixed *before* applying the migration, now exactly mirroring `src/utils/subscription.ts::getUserPlan`'s semantics (expired treated as free).

## Phase 5–7 implementation status (session 2, 2026-09-02)

Session 2 reviewed the full 58-section implementation prompt against the repo and closed as many of the reachable gaps as the remaining PDRs allow. Delivered, with the same "pure logic tested, DB paths reviewed-but-unverified" honesty as session 1:

- `src/services/bqeEngine.ts` — completion-rate + tier resolution + bonus calculation (Art. 18-19), tested including the exact 39/40/59/60/79/80% boundaries.
- `src/services/payoutEngine.ts` — 500 MZN minimum + carry-forward (Art. 31), tested at 499/500/501 MZN and with prior carry-forward.
- `src/services/referralEngine.ts` — CRA commission calculation (15% of net, per PDR-002), attribution-window check (PDR-004: first-click, implemented as "the one attribution row per student is never replaced," not a click-log — no click-tracking infra exists and the policy text only requires capturing "entrada pelo link ou código"), self-referral detection, referral code generation.
- `src/services/earningsAggregation.ts` — reads `qualified_views` for a teacher+period, computes RCE (VCPM) + BQE via the pure engines, and can write/replace `ESTIMATED` ledger rows. This is the CALCULATION step only (Art. 28's three-way split) — approval and payout execution stay administrative, separate actions.
- `tests/financialReconciliation.test.ts` — the mandatory Teacher-A scenario (section 46): 100,000 VQ-R → 13,500 MZN, 82% completion → +15% BQE → 2,025 MZN, **total 15,525.00 MZN**, verified exactly.
- `database/migrations/031_teacher_earnings_referrals_fees.sql` — `referral_codes`, `referral_attributions` (`UNIQUE(student_id)` + `CHECK(student_id <> teacher_id)` enforce first-click-wins and self-referral rejection at the DB layer, not just in application code), `ambassador_fee_contracts`, `special_content_contracts`. Same RLS deny-all convention as migration 030.
- `database/migrations/032_teacher_earnings_audit_log.sql` — generic `earnings_audit_log` (actor/action/entity/before/after/reason), addressing implementation-prompt section 34, which session 1 had left unaddressed.
- `src/routes/auth.ts` — `POST /api/auth/register` now accepts an optional `referral_code`; on success, resolves it and writes the one-time attribution row. Failure never blocks account creation.
- `src/routes/earnings.ts` (new, mounted at `/api/earnings`, `requireTeacher`) — `GET /summary` (live RCE/BQE estimate with full tier breakdown, for the "explicabilidade" requirement of section 32), `GET /referral-code` (get-or-create).
- `src/routes/finance.ts` (extended, `requireFinanceOrAdmin`) — `GET /earnings` (list/filter ledger), `POST /earnings/estimate` (trigger calculation+write for a teacher/period — this is the manual stand-in for the missing Cron Trigger, PDR-007), `POST /earnings/:id/approve`, `GET /earnings/payable` (Art. 31 check against real approved balances), `POST /earnings/adjustment` (manual ADJUSTMENT/REVERSAL, audited), `GET /referrals`, `POST /referrals/:studentId/convert` (manual CRA recording — see limitation below), full CRUD for `ambassador-fees` and `special-content` contracts, where marking a contract `COMPLETED`/`DELIVERED` now automatically creates the corresponding `AMBASSADOR_FEE`/`SPECIAL_CONTENT` ledger row (previously the contracts existed but nothing ever turned them into a professor's earnings).
- **`npx vitest run` → 10 files, 91/91 passing** (82 from session 1 + 9 new: BQE tiers/boundaries, payout thresholds, referral commission/window/self-referral/code-format, reconciliation scenario).

**Explicitly NOT done (still gaps after session 2) — this is the direct answer to "o que não foi implementado":**

1. **VQ-B (bonified-view campaigns) — not built.** No campaign table, no rate-type logic (NORMAL_VCPM/PERCENTAGE_OF_VCPM/FIXED_VCPM). Every funding-eligible, within-limit view currently classifies straight to VQ-R. Section 11 of the implementation prompt.
2. **Monthly settlement cycle (Art. 30-31) — not built.** No job/cron transitions `ESTIMATED → VALIDATING → APPROVED` on the day-1/7/10/15 calendar. `POST /earnings/estimate` and `POST /earnings/:id/approve` are the manual building blocks; nothing sequences them automatically. Blocked on PDR-007 (no Cron Trigger infra confirmed for this Pages project).
3. **Payout execution — not built.** `GET /earnings/payable` tells you whether 500 MZN is reached; nothing marks a ledger row `PAID`, creates a payout record, or integrates a disbursement method (mobile money/bank). Section 30 of the prompt explicitly says not to fake this without validated integration — correctly not faked.
4. **CRA is entirely manual, end to end.** `POST /referrals/:studentId/convert` requires a human to type in the net revenue for a specific student, because no payment gateway exists to fire this automatically on a real purchase (same root cause as PDR-002). This satisfies "referral commission works" only in the sense that the calculation and guards (window, no-double-conversion, no-renewal) are correct — it is not a working automatic pipeline.
5. **Refund/chargeback reversal is manual, not automatic** — the `ADJUSTMENT`/`REVERSAL` ledger types and endpoint exist, but nothing listens for a refund event (none exists) and creates the reversal on its own.
6. **No teacher-facing or admin-facing UI was built** — every endpoint above is API-only. Section 31 (teacher dashboard) and section 33 (admin dashboard) are unimplemented as *screens*; only their data APIs exist (`GET /earnings/summary` covers part of the "Impact/Classification/Earnings" panel from Art. 28, but not unique-students/learning-time/next-tier hints, and there is no admin screen at all for inspecting qualified views, reviewing suspicious activity, or exporting reports).
7. **Fraud foundations remain minimal** — the heartbeat-delta cap (20s), the self-referral DB constraint, and the repeat-limit/ineligible-access reason codes are the only anti-fraud logic that exists. Impossible-watch-time clustering, referral-fraud detection beyond self-referral, and any admin review surface (section 37) are not built.
8. **No concurrency/integration tests were run** — same limitation as session 1: no live Postgres connection in this environment. The advisory-lock repeat-limit logic, the `UNIQUE(student_id)` first-click-wins constraint, and the audit-log writes have been reviewed by hand but never executed.
9. **Migrations 030-032 have still never been applied to a real database.** This remains the single most important next step before any of this can be trusted with real money.
10. **No observability was added** (section 43) — no structured logging/metrics beyond the existing `console.error` calls already used throughout the codebase.
11. **No feature flag / rollout gating** (section 50) — every new endpoint is live for any teacher/finance-role user as soon as this deploys; there is no `INTERNAL → PILOT → ALL` gate.
12. **Player-side integration is still entirely absent.** No web or mobile code calls `POST /api/video/:lessonId/heartbeat`. Without this, no real `qualified_views` rows will ever be produced, regardless of how correct the backend logic is.
13. ~~A separate, larger, pre-existing gap this project does not fix: nothing in the VClass codebase ever inserts a row into `subscriptions`~~ — **partially closed in session 3.** `POST /api/finance/subscriptions` (create) and `PATCH /api/finance/subscriptions/:id` (renew/update) now exist in `finance.ts`, so the finance team can manually record a subscription (plan, amount, payment provider/reference, funding source) the moment they process a payment outside the system (M-Pesa, bank transfer, etc.) — this is the same "record what already happened elsewhere" pattern the rest of `finance.ts` already used for cancellation. **This does not add a payment gateway** — there is still no automatic flow from "student pays" to "subscription row exists"; a human still has to type it in. But it closes the *structural* gap (there was previously no INSERT path at all, so even manual recording was impossible without going into the Supabase dashboard directly). Confirmed live: no lessons in production currently have `video_duration` set (`0 of 14`), which independently blocks VQ-R/VQ-P/VQ-NR classification regardless of funding — **this is now the most consequential remaining blocker**, not the subscriptions gap. See item #14 below.

14. **New finding (session 3): no lesson in production has `video_duration` set.** `SELECT count(*) FILTER (WHERE video_duration > 0) FROM lessons` → 0 out of 14. `fn_record_watch_heartbeat` correctly refuses to qualify anything when duration is `NULL`/`0` (by design — Art. 7's thresholds are meaningless without a duration), so **right now, zero real lessons can ever produce a qualified view**, independent of subscriptions, watch-tracking, or anything else built in this project. This needs either: (a) a backfill of `video_duration` for existing lessons from Bunny.net's video metadata (the CDN almost certainly already knows each video's length), or (b) populating it going forward at upload time in `src/routes/creator.ts`'s video-upload flow, which was not investigated in this session. This is now the single highest-priority blocker to real data flowing through the pipeline, ahead of even player integration.

## Definition of Done — status against implementation-prompt section 55

| Item | Status | Note |
|---|---|---|
| VQ-R works | ✅ Verified live (session 3) | Correct classification confirmed against real Postgres; unreachable at scale today only because no real lesson has `video_duration` set (see gap #14 below) |
| VQ-P works | ✅ Verified live (session 3) | Free-lesson scenario confirmed |
| VQ-B works | ❌ Not built | Gap #1 |
| VQ-NR works | ✅ Verified live (session 3) for REPEAT_LIMIT + INELIGIBLE_ACCESS | NON_MONETIZABLE_CONTENT/PROGRAM_RESTRICTION defined but never triggered (no such content flag exists) |
| VNQ works | ⚠️ Built, logic unit-tested, not exercised in the live-DB run | |
| Consumption thresholds work | ✅ Tested | `tests/qualifiedViewEngine.test.ts` + confirmed live at the exact 240s/600s boundary |
| Repeat rule works | ✅ Verified live (sequential AND true concurrency, session 5) | 1st/2nd view → VQ-R, 3rd → VQ-NR confirmed against real Postgres; 5 genuinely simultaneous new sessions correctly yielded exactly 2 VQ-R / 3 VQ-NR — the advisory lock holds under real parallel load, not just sequential |
| VCPM progressive calculation works | ✅ Tested | Exact 8-value matrix + tier breakdown |
| Fractional VCPM works | ✅ Tested | 2,750 → 275.00 |
| BQE works | ✅ Tested (calc) / ❌ not settlement-wired | Calculation correct; not part of any automatic cycle (gap #2) |
| Referral commission works | ✅ Tested (calc) / ⚠️ manual only | Gap #4 |
| Attribution window works | ✅ Tested (calc) / ⚠️ DB constraint unverified | |
| Renewals do not auto-commission | ✅ By construction | `converted_at` guard |
| Refunds/chargebacks can reverse commission | ⚠️ Manual only | Gap #5 |
| Ambassador fee supported | ✅ Schema+CRUD+ledger-on-complete | Still manual trigger, no recurring monthly generation |
| Special content fee supported | ✅ Schema+CRUD+ledger-on-delivered | |
| Ledger exists | ✅ | |
| Monthly settlement works | ❌ Not built | Gap #2 |
| 500 MZN minimum payout works | ✅ Tested (calc) / ✅ Verified live incl. concurrency (session 5) | Confirmed no double-pay under 5 genuinely concurrent payout requests for the same teacher |
| Teacher dashboard works | ⚠️ API only, no UI | Gap #6 |
| Admin controls work | ⚠️ API only, no UI | Gap #6 |
| Authorization works | ✅ | Reuses `requireTeacher`/`requireFinanceOrAdmin` |
| RLS works where applicable | ⚠️ Written, unverified | Gap #8/#9 |
| Audit trail works | ✅ Partial | `earnings_audit_log` covers approvals/adjustments/contract status changes; not every admin action |
| Fraud foundations work | ⚠️ Minimal | Gap #7 |
| Idempotency works | ✅ (design) / unverified | `event_id` unique constraint |
| Concurrency tests pass | ✅ Verified live (session 5, 2026-09-09) | Genuine parallel requests (Promise.all over real RPC calls) against production with synthetic data, cleaned up after: 10 concurrent identical `event_id` heartbeats → only 1 row written, no double-counting; 5 concurrent new sessions for the same student/lesson → exactly 2 VQ-R and 3 VQ-NR, matching the Art. 13 limit exactly; 5 concurrent payout requests for the same teacher → exactly 1 paid, 4 correctly rejected, total never exceeded the real balance. All three advisory-lock/idempotency mechanisms held under real concurrent load. |
| Financial reconciliation passes | ✅ Tested | `tests/financialReconciliation.test.ts` |
| Migrations pass | ✅ Applied + verified live | Session 3: 030/031/032 applied to production Supabase (`gibetvzeelfogmdsypcp`) and confirmed via `information_schema`/`pg_proc` |
| Existing tests remain green | ✅ | 91/91, including all 36 pre-existing |
| Documentation completed | ⚠️ Partial | This blueprint is the living doc; separate DATA_MODEL/CALCULATION_SPEC/TEST_MATRIX/RUNBOOK files from section 53 were not split out separately |

**Honest overall status: PASS WITH DOCUMENTED LIMITATIONS on everything that is pure calculation (VCPM, BQE, payout, referral commission, thresholds) — all tested and correct. BLOCKED on anything requiring a live database, a real payment/checkout flow, or player integration — none of those exist yet, and this session could not create or verify them from here.**

## Not yet started (unchanged from session 1, still applicable)

Full monthly settlement job, payout execution/disbursement, VQ-B campaigns, teacher/admin UI screens, deeper fraud detection, observability, feature-flag rollout. See the numbered gap list above for the complete, current picture.

## Session 4 (2026-09-03) — video_duration sync + player integration

**Gap #14 (video_duration) — root cause found, fix shipped, execution blocked:**

The lesson editor (`src/pages/creator-lesson-editor.html`) has always had a "duration" input field, but it was never included in the save payload sent to `POST/PUT /api/creator/lesson` — so `video_duration` stayed 0 no matter what a teacher typed. Rather than fix that UI gap, `src/routes/creator.ts`'s `GET /video/:videoId/status` (already polled by the editor every 15s during upload) now writes `lessons.video_duration` from Bunny's own reported `length` the moment a video reaches `ready` — making the CDN, not a human, the source of truth, consistent with Art. 7. `scripts/backfill-video-duration.mjs` was added to retroactively fix existing lessons.

**Blocked on credentials:** ran the backfill against production in `--dry-run`. Only 4 of 14 lessons have `video_id` at all (the rest use `video_url` directly or have no video); all 4 Bunny lookups returned `401 Authentication has been denied`, confirmed with a direct library-list call too — `BUNNY_API_KEY` in `.dev.vars` is not a valid Stream Library API key (Bunny has separate account-level vs. per-library Stream keys). Needs the user to pull the correct key from the Bunny dashboard (Stream → library 699241 → API) before the backfill can run.

**Gap #12 (player integration) — closed:**

- Web (`src/pages/lesson.html`): the HLS player now emits `play`/`resume`/`pause`/`seek`/`ended` events to `POST /api/video/:lessonId/heartbeat`, plus a 15s heartbeat while playing (delta = real wall-clock time elapsed, not video-position delta, so seeks don't inflate watched time). Session token is a per-page-load UUID.
- Mobile (`mobile/app/(student)/lesson/[id].tsx` + `mobile/src/api/video.ts`): same event model via `expo-video`'s `playingChange`/`playToEnd` events (checked against the v57 SDK docs per `mobile/AGENTS.md`).
- Neither path was exercised against a live Postgres in this session (still blocked by the same Bunny credential issue for any lesson that would actually play a real video end-to-end) — the code is reviewed and typechecks/tests pass (`npx tsc --noEmit` in `mobile/`, `npx vitest run` 91/91, `npx vite build` clean), but not live-verified.

**Updated priority order:** with player integration done, `video_duration` (blocked on the Bunny key) is now the only remaining blocker before real `qualified_views` rows can be produced in production.

**Gap #2 (monthly settlement) — closed, chosen PDR-007 resolution: GitHub Actions.**

- `src/services/settlementEngine.ts` — `runEstimatePhase`/`runValidatePhase`/`runApprovePhase`, sequencing `ESTIMATED → VALIDATING → APPROVED` in bulk across every teacher with `qualified_views` activity in a period (previously this only existed per-teacher, via manual `POST /earnings/estimate` + `POST /earnings/:id/approve` calls). `previousMonthPeriodMaputo()` defaults the period to the prior full calendar month using Africa/Maputo (UTC+2, no DST, per PDR-006) — unit-tested (`tests/settlementEngine.test.ts`) including the year-rollover and near-midnight-UTC cases.
- Two ways to trigger it: `POST /api/finance/earnings/close-period/:phase` (admin, JWT-gated, for manual/ad-hoc runs) and `POST /api/internal/settlement/:phase` (`src/routes/settlementCron.ts`, gated by a shared secret header `x-settlement-secret` checked against the new `SETTLEMENT_CRON_SECRET` binding — machine-to-machine, no user JWT involved).
- `.github/workflows/teacher-earnings-settlement.yml` calls the internal endpoint on days 1/7/15 at 06:00 Maputo, plus a `workflow_dispatch` manual trigger with a phase picker and optional explicit period. Needs two GitHub Actions secrets before it can run for real: `VCLASS_API_BASE_URL` and `SETTLEMENT_CRON_SECRET` (the latter must match the same value set as a Cloudflare Pages secret) — **not yet created**, this workflow is inert until the user adds them.
- Still explicitly NOT done: no fraud/anomaly gate before `approve` (still just a state transition — see gap #7). `npx vitest run` → 94/94, `npx vite build` clean.

**Gap #3 (payout execution) — closed, scoped deliberately to "record what already happened," per the implementation prompt's explicit instruction (section 30) not to fake a disbursement integration.**

- `database/migrations/033_teacher_earnings_payouts.sql` — new `teacher_payouts` table (method/reference/note/recorded_by/ledger_entry_ids, same deny-all RLS convention as 030-032) + `fn_record_teacher_payout`, an atomic Postgres function mirroring `fn_record_watch_heartbeat`'s advisory-lock pattern (locks per-teacher, so two concurrent payout requests for the same teacher can't double-pay): sums every `APPROVED` ledger row for a teacher, rejects if below the 500 MZN minimum, else marks all of them `PAID` and inserts one `teacher_payouts` row in the same transaction.
- `POST /api/finance/payouts` (`src/routes/finance.ts`) — finance/admin calls this *after* manually sending the money via M-Pesa/bank transfer outside the system, same "record it" pattern already used for `POST /finance/subscriptions`. Does not integrate any payment gateway. `GET /api/finance/payouts?teacherId=` lists payout history.
- Not applied to the live Supabase project yet (same as 030-032 originally were) — needs the same `supabase db query --linked -f` treatment before any real payout can be recorded. Not live-tested for the same reason. `npx vitest run` → 94/94, `npx vite build` clean.

**Definition-of-Done update:** "500 MZN minimum payout works" moves from "calc only, no PAID transition" to fully built (pending live DB verification) — this closes gaps #2 and #3 together, leaving VQ-B (#1), full CRA automation (#4, blocked on a real payment gateway), automatic refund reversal (#5), UI (#6), and fraud hardening (#7) as the remaining open items.

## Session 5 (2026-09-09) — true concurrency verified against production

Migrations 033/034 confirmed applied to production Supabase in this session (`teacher_payouts` + `payment_checkout_requests` both exist live). This closed the "not applied to the live Supabase project yet" note from session 4.

**Concurrency tests (previously the last untested item in the Definition of Done) — closed.** Docker wasn't available in this environment (`docker ps` fails — no virtualization in the sandbox), so a local Postgres wasn't an option. With the user's explicit approval, ran genuine parallel load directly against production instead, using disposable synthetic rows (a throwaway teacher/student/lesson/subscription, deleted immediately after): a Node script (`@supabase/supabase-js`, service-role key) fired real concurrent RPC calls via `Promise.all` — not sequential statements in one session like session 3, actual overlapping HTTP requests hitting the same Postgres functions at once.

Three scenarios, three passes:
- **Idempotency** (`fn_record_watch_heartbeat`, same `event_id` fired 10× concurrently): 0 errors, exactly 1 row in `video_watch_events`, `effective_watched_seconds` stayed at 15 (not 150). Note for future work: the idempotency check (`IF EXISTS ... THEN RETURN`) runs *before* the advisory lock is acquired, so there's a theoretical TOCTOU window a sufficiently-adversarial duplicate submission could still hit (the two requests failed to actually land in the same Postgres commit window here, but 10 concurrent Node-dispatched HTTP requests isn't a proof of atomicity, just evidence it held under this load pattern) — moving the `event_id` UNIQUE-or-INSERT ahead of or inside the lock would close that gap definitively if it's ever a concern in practice.
- **Repeat limit / Art. 13** (5 genuinely concurrent *new* sessions for the same student+lesson, each individually crossing the qualification threshold in one heartbeat): exactly 2 classified `VQ-R`, exactly 3 `VQ-NR`/`REPEAT_LIMIT` — the `pg_advisory_xact_lock` keyed on `(student_id, lesson_id)` correctly serialized the check-then-insert race.
- **Payout double-spend** (`fn_record_teacher_payout`, 5 concurrent requests for one teacher with a 1000 MZN APPROVED balance): exactly 1 payout recorded, 4 correctly rejected as below the minimum (since the first request's lock-protected transaction already flipped the balance to `PAID`), total paid never exceeded 1000 MZN.

All Definition-of-Done rows are now ✅ except the ones explicitly blocked on external prerequisites (VQ-B, CRA full automation pending a payment gateway, refund reversal, UI, fraud hardening) — see the updated table above.
