# HAUNTED — HUNT IMPLEMENTATION PLAN

**Scope:** This document is the implementation companion to `PHAS_HUNT_MASTER_SPEC.md`.
It is concerned ONLY with hunt behaviour: hunt start conditions, hunt presentation,
target acquisition, line-of-sight, movement, hiding, electronics during hunts,
audio/visibility, hunt ending, and per-ghost hunt identity.

**Source of truth:** Each numeric value referenced here is taken from the spec. If a
value disagrees with the spec, the spec is correct and the code is wrong; this plan
exists to bring the code into agreement.

**File touched:** Almost all changes land in [`index.html`](../index.html). Where a
change requires a new asset (e.g. a six-finger fingerprint sprite for Obake), this
plan flags it explicitly so the asset gap is visible up front.

**Audit baseline:** This plan was written against the state of `index.html` as of
2026-04-29. Line numbers cited are approximate and will drift as edits land — they
exist to orient the reader, not to be load-bearing.

**Confidence shorthand:** Each section ends with one of `HIGH / MEDIUM / LOW`,
mirroring the spec's confidence glossary so we can flag where canonical behaviour
itself is uncertain (Banshee crucifix range, post-Winter's-Jest tweaks, etc.).

---

## PART 1 — CROSS-CUTTING (GLOBAL) DELTAS

These changes affect every ghost. Land them first; per-ghost work assumes they exist.

### 1.A  Hunt-roll probability formula

**Current:** `getHuntRollChance(sanity, threshold)` returns a quadratic ramp
`0.05 + 0.55 * t²` where `t = 1 − sanity/threshold`. This produces a 5–60% per-roll
probability scaling sharply at low sanity.

**Canonical:** Fixed flat probability per check, evaluated at a fixed cadence.
The community-validated value is **10% per check** (commonly described as
"1-in-6 over a few seconds" because of the cadence, not a 16.7% per-roll number).
Threshold gates the ENTRY to rolling — below threshold the ghost can roll, above
threshold it cannot, with the threshold itself adjusted by per-ghost rules.

**Required change:**
1. Replace `getHuntRollChance` body with `return 0.10` (constant).
2. Verify the call site only fires when `sanity ≤ effectiveThreshold(ghost)`; today
   the gate is implicit in the quadratic decaying to zero at sanity≥threshold.
3. Move all per-ghost threshold adjustments into a single `effectiveThreshold(ghost,
   ctx)` helper so per-ghost rules (Demon 70, Onryo flame counter, Mare lit/dark,
   Obake 75, Onryo 60, Polt 100, Raiju electronics 65, Yokai SB 80, etc.) are
   discoverable in one place.
4. Hunt-roll cadence (`huntCheckTimer`) stays sanity-scaled (tighter at low sanity);
   that is canonical.

**Risk if shipped shallow:** Wrong per-ghost identity across the entire roster —
a flat 10% formula plus correct thresholds is the canonical Phasmophobia feel; the
quadratic curve currently masks per-ghost differences because every ghost ends up
with similar "low-sanity surge" behaviour.

**Confidence:** HIGH.

### 1.B  Line-of-sight acceleration cap

**Current:** `_huntLosT` accumulates while LOS is held; speed multiplier is
`1.0 + 0.20 * losT/5` capped at `1.20×` after 5 s of continuous LOS.

**Canonical:** `+0.05× per second of held LOS, capped at 1.65×` over ~13 s.
Decay while LOS is broken: `-0.01× per second`, never below 1.0×.

**Required change:**
1. Update accumulator: `losMult = clamp(1.0, 1.65, losMult + 0.05 * dt * losHeld − 0.01 * dt * losBroken)`.
2. Reset `losMult` to 1.0 when a hunt ends, not on every chase→search transition.
3. Per-ghost overrides (Revenant binary, Twins variant base, Deogen distance lerp,
   Hantu temp, Moroi sanity, Thaye age, Dayan motion-conditional) must compose
   with the global LOS multiplier — final speed = `baseModel(ghost) * losMult`,
   where Revenant/Deogen/Hantu/etc. produce `baseModel`.

**Risk if shipped shallow:** Hunts feel "flat" because the ghost never reaches the
sprint speed players expect after a sustained chase; survival counterplay (running
in straight lines) reads wrong.

**Confidence:** HIGH.

### 1.C  Per-ghost smudge prevention duration

**Current:** Default `incenseDuration = 90`, with explicit overrides for Spirit (180)
and Gallu (0). Demon override missing.

**Canonical:**
- Default: 90 s.
- Spirit: 180 s.
- Demon: 60 s.
- Yurei: 90 s **plus** confines the ghost to its favourite room for 90 s.
- Banshee/Yokai: same 90 s but Banshee target-only matters separately.
- Wraith: same 90 s but additionally must "skip salt" — never step on salt piles.

**Required change:**
1. Add `incenseDuration: 60` to the Demon entry.
2. Add `smudge_room_trap: true` flag to Yurei and implement a `confinedToRoom`
   timer that suppresses room-migration logic for 90 s after a successful smudge.
3. Add `skip_salt: true` flag to Wraith; salt-pile collision must early-return
   without leaving a footprint.
4. Surface effective smudge duration in `__debug.smudgeState()` so tests can
   verify per-ghost values.

**Risk if shipped shallow:** Demon "smudge resistance" is one of its three core
identity traits; without it Demon plays like a generic ghost with a low threshold.
Yurei smudge-confine is the only counterplay players have that exploits room
identity — missing it removes the only ghost where room behaviour matters during a
hunt.

**Confidence:** HIGH.

### 1.D  Crucifix range tier table

**Current:** `crucifixRange` defaults to 3 m, Banshee 5 m, Demon 5 m. Tier scaling
(T1 3 m / T2 4 m / T3 5 m) is implicit in the Banshee/Demon overrides but not
generalised; there is no `crucifix.tier` concept on the equipment side.

**Canonical:**
- T1 3 m / T2 4 m / T3 5 m base.
- Demon: ×1.5 of base tier (4.5 / 6.0 / 7.5).
- Banshee: fixed 5 m at any tier (community-medium-confidence).
- Gallu (enraged): −2 m. Gallu (weakened): +1 m.

**Required change:**
1. Promote crucifix tier to a first-class field on the player's crucifix item:
   `worldItems[].tier ∈ {1,2,3}`. Currently only one tier is wired.
2. Replace the per-ghost `crucifixRange` numeric with a `crucifixRangeFn(ghost, tier)`
   helper that returns metres given the equipped tier and ghost rules.
3. Wire Gallu `gallu_state` into crucifixRangeFn (state ∈ {calm, hunting, enraged}).

**Risk if shipped shallow:** Tier 2/3 crucifixes are the main Phasmophobia "skill
expression" item — flat range gives a Tier 1 feel forever and erases buy-progression.

**Confidence:** HIGH for tier table; MEDIUM for Banshee fixed-5m.

### 1.E  Hiding-spot ray cast

**Current:** `_huntState.chase` uses a single ray from ghost head to player head
(approximated as a 1-cell test). When chasing.

**Canonical:**
- Chasing: 1 ray, ghost `raycastPoint` → player **head bone**.
- Not-chasing (target-search mode): 2 rays — ghost raycastPoint → head, plus a
  second ray with the player offset 0.167 m to the right (≈ 8 px at 48 px/m).
  Either ray hitting clear air = "spotted".

**Required change:**
1. Verify the existing ray uses the ghost's `raycastPoint` (eye/head, not centre)
   and the player's head bone (not centre). Likely needs offsetting both endpoints.
2. Add the second offset ray for non-chase-state checks.
3. Hidey-hole occlusion must use the same wall-cast that everyday LOS uses, not a
   bbox check; many hidey-holes today read as "unsafe" because the wall isn't an
   occluder in this code path.

**Risk if shipped shallow:** Players cannot reliably hide. Because every ghost uses
the same hiding code, this is the single change with the broadest survivability
impact — a wrong implementation breaks 27 ghosts at once.

**Confidence:** HIGH.

### 1.F  Hunt grace period

**Current:** `gracePeriodSeconds` is read from the difficulty profile (5/4/3 for
Amateur/Intermediate/Pro). Verified present.

**Canonical:** Same. Grace blocks ghost from initiating chase movement, but the
hunt-start audio/visual (heartbeat, EMF-4 pulse, electronics flicker, door lock,
candle/UV/etc. behaviour) all fire immediately at hunt-start — only the chase
position update is suppressed.

**Required change:**
1. Audit the hunt-start path to confirm grace ONLY suppresses position update,
   not lights/audio/electronics.
2. Add `__debug.huntGraceTimer()` returning seconds remaining for tests.

**Risk if shipped shallow:** Grace already exists; risk is regression on
adjacent edits. Low priority.

**Confidence:** HIGH.

### 1.G  Hunt-end teardown

**Current:** Hunt ends when its duration timer expires; `huntCooldown` set; doors
unlock; lights re-enable.

**Canonical:** Same, plus:
- Exit-door behaviour: front door re-unlocks at hunt-end.
- Crucifix preventions reset (a successful crucifix block ends the hunt-attempt
  immediately and applies cooldown; this is already wired).
- LOS multiplier resets to 1.0×.
- Per-ghost timers reset (Onryo flame counter does NOT reset — that persists across
  hunts; Obake shapeshift roll re-fires at next hunt-start; Thaye age progression
  continues; Twins active-twin selection re-rolls at next hunt-start).

**Required change:**
1. Centralise hunt-end into `endHunt(ghost, reason)` and have all exit paths
   (timer, crucifix, smudge, dev abort) call it.
2. In `endHunt`, explicitly reset `losMult`, `_huntLosT`, `_huntRampT`, and clear
   chase target; do NOT reset Onryo `flameCounter`, Thaye `ageStep`, Twins
   `activeTwin` (re-roll at next start instead).

**Risk if shipped shallow:** Cross-hunt state bleed (Twins pinned to the same twin
forever, Obake never re-rolls into shapeshift, etc.). Subtle, hard to test.

**Confidence:** HIGH.

### 1.H  Heartbeat and footstep audibility

**Current:** Heartbeat radius is fixed at 10 m; footsteps use a single fixed
attenuation curve.

**Canonical:**
- Heartbeat 10 m default; **Raiju 15 m**.
- Footsteps 20 m default; **Myling 12 m**.
- Footsteps DURING hunt only — the ghost is silent outside hunts in this engine.
- Hunt-start EMF-4 pulse on the closest electronic ghost-event device.

**Required change:**
1. Promote heartbeat radius to per-ghost `heartbeatRangeMetres`, default 10,
   Raiju override 15.
2. Promote footstep audible radius to per-ghost `footstepRangeMetres`, default 20,
   Myling override 12.
3. Verify the hunt-start EMF pulse already exists; if not, add it.

**Risk if shipped shallow:** Two of the most common "audio identification"
strategies (Myling-quiet, Raiju-loud) silently produce wrong evidence. Players
can't trust their audio.

**Confidence:** HIGH.

### 1.I  Electronics flicker radius during hunts

**Current:** Hunt-flicker radius single-source, ~10 m equivalent.

**Canonical:** 10 m default; Raiju 15 m. Affects: torches, video cameras, head-mounted
cameras, EMF readers, motion sensors, sound sensors, parabolic mics, salt UV view
inversions. Strobing rate 1–2 Hz with random jitter; equipment is functional but
visually corrupted.

**Required change:**
1. Promote flicker radius to per-ghost `electronicsFlickerRangeMetres`.
2. Apply flicker as a render-side effect, not a state-disable — the device still
   reads correctly; only the player's view of it is corrupted.

**Confidence:** HIGH.

### 1.J  Light switch lockout

**Current:** Light switches disabled during hunts. Verified.

**Canonical:** Same. No change required.

**Risk if shipped shallow:** N/A — verified working.

**Confidence:** HIGH.

### 1.K  Door behaviour during hunts

**Current:** Hunt locks all doors on hunt-start. Player cannot open closed doors.
Ghost can pass through doors.

**Canonical:**
- Closed doors lock immediately.
- Currently-opening doors finish their swing then lock.
- Open doors do not slam shut.
- Yurei: 15 % chance to slam-shut a door per pass within 7.5 m, draining 15 sanity
  for a player within audible range.

**Required change:**
1. Implement Yurei `door_slam` event in the hunt-tick path, gated by 7.5 m proximity
   to a door + 15% per-pass roll + sanity drain to nearby players.
2. Verify open-doors-stay-open invariant — likely already correct.

**Confidence:** HIGH for general; MEDIUM for the exact 15% Yurei figure.

### 1.L  Identity-flag inventory

These flags exist on `GHOST_REGISTRY` entries today but are inconsistently consumed
by the hunt code. Audit each one and ensure a hunt-tick consumer exists:

| Flag                              | Owner ghost(s)            | Hunt-tick consumer required |
|-----------------------------------|---------------------------|-----------------------------|
| `target_sanity_hunt`              | Banshee                   | Threshold uses target sanity, not lowest |
| `single_target`                   | Banshee                   | Chase target locked to designated victim |
| `hunt_on_flame_extinguish`        | Onryo                     | Counter +1 per flame; ≥3 → forced hunt |
| `jinn_power_chase`                | Jinn                      | Speed boost when breaker on AND ≥3 m |
| `slows_near_target`               | Deogen                    | Distance lerp 3.0 → 0.4 m/s |
| `disrupts_electronics`            | Mimic, Raiju              | Already global, keep as marker |
| `speed_near_electronics`          | Raiju                     | +0.5 m/s within 6 m of any active electronic |
| `speed_from_cold`                 | Hantu                     | Per-tile temp curve |
| `speed_scales_with_low_sanity`    | Moroi                     | 1.5 → 2.25 m/s as targeted player sanity drops |
| `age_reducses_speed_and_activity` | Thaye                     | (typo: keep flag, fix in code) |
| `speed_jumps_on_los`              | Revenant                  | 1.0 not-chasing / 3.0 chasing |
| `speed_twins_variant`             | The Twins                 | Active twin re-roll per hunt-start |
| `speed_dayan_motion`              | Dayan                     | 0 still / 1.7 moving |
| `speed_gallu_state`               | Gallu                     | calm/hunting/enraged speed table |
| `speed_obambo_state`              | Obambo                    | calm/aggressive 2-min cycle |
| `no_hunt_when_group`              | Shade                     | Block hunt if ≥2 players in 80 px |
| `no_room_migration`               | Yurei (smudged), Wraith?  | Used by smudge-confine path |
| `smudge_room_trap`                | Yurei                     | Add — does not exist yet |
| `stronger_in_crowded_rooms`       | Spirit?                   | Reserved; not currently consumed |
| `frequent_hunts`                  | Demon                     | Used by threshold + cooldown |
| `skip_salt`                       | Wraith                    | Add — does not exist yet |
| `target_only_crucifix`            | Banshee                   | Crucifix only blocks if held by Banshee target |

**Required change:** Implement the two new flags (`smudge_room_trap`, `skip_salt`)
and verify each existing flag has a consumer in the hunt-tick path. Remove dead
flags without consumers.

**Confidence:** HIGH.

---

## PART 2 — PER-GHOST IMPLEMENTATION DELTAS

Each ghost has six sub-sections, in this order:
1. **Current Haunted hunt status** — what the code does today
2. **Missing hunt-critical mechanics** — what the spec requires that code lacks
3. **Dependencies** — Part 1 cross-cutting items + other ghosts/systems this depends on
4. **Recommended implementation order** — how to land changes in safe slices
5. **Risk of shallow implementation** — what breaks if we ship a partial fix
6. **Exact debug hooks to add** — `__debug.*` accessors needed for tests

### 2.1  Banshee

**1. Current Haunted hunt status**
- `target_sanity_hunt` flag set on registry entry; threshold path branches on it.
- `single_target` flag set; chase target select is wired but uses lowest-sanity
  player as fallback, not the locked target.
- `crucifixRange: 5` set, but applies for any holder, not just the Banshee target.
- Standard 50% threshold applied to the target player's sanity (not group lowest).

**2. Missing hunt-critical mechanics**
- Crucifix should only block the hunt when **the Banshee target** holds it; another
  player holding a crucifix in range does nothing.
- Banshee scream ghost-event should occur on first ghost-event roll while target is
  alive; this is identification, not hunt — flagged for cross-system work.
- Speed model is canonical 1.7 m/s but currently routes through default speed; OK,
  but the LOS multiplier must still apply.

**3. Dependencies**
- Part 1.A (threshold helper).
- Part 1.D (crucifix range + holder-aware block path).
- Targeting system: must expose `getBansheeTarget(ghost)` returning a stable PlayerId
  for the duration of the contract.

**4. Recommended implementation order**
1. Stabilise Banshee target selection at contract start (lowest-sanity at first
   contact OR randomised — go with lowest-sanity-at-tick-0; spec is ambiguous).
2. In `effectiveThreshold`, when ghost has `target_sanity_hunt`, evaluate threshold
   against `players[banshee.targetId].sanity`.
3. In the crucifix block path, gate the block check by
   `holderId === banshee.targetId` when ghost has `target_only_crucifix`.

**5. Risk of shallow implementation**
- Without target-locking, Banshee plays exactly like a generic 50% ghost — its only
  identity (target obsession + crucifix-target gating) is invisible.
- Without crucifix gating, players defeat Banshee by sharing a crucifix — wrong
  Phasmophobia behaviour.

**6. Debug hooks**
- `__debug.bansheeTarget()` → `{ playerId, sanity, distance }`
- `__debug.crucifixHolder()` → `{ playerId, tier, range }`

**Confidence:** HIGH (target gating); MEDIUM (5 m fixed range vs +2 m tier bonus).

---

### 2.2  Dayan

**1. Current Haunted hunt status**
- `speed_dayan_motion` flag in registry; speed dispatcher branches on it.
- Per-ghost speed: 0 m/s while still, 1.7 m/s while moving — already implemented.
- 50% standard threshold.
- Female-only target rule **not implemented** — chase target is selected by distance.
- ±10 m teleport-on-LOS-loss not implemented.

**2. Missing hunt-critical mechanics**
- **Female-only target lock:** only player avatars marked `gender === "female"` are
  valid hunt targets. If no female player exists, Dayan reverts to standard targeting
  (canon ambiguous; spec defaults to standard).
- **±10 m teleport on LOS loss:** when chase LOS is broken for ≥3 s while chasing,
  Dayan teleports to a position 10 m from the last seen player, biased away from
  walls. Not currently in code.

**3. Dependencies**
- Player avatar `gender` field — exists in some single-player codebases as
  `playerProfile.character`; verify Haunted has this. If not, this becomes a no-op
  fallback to standard targeting.
- Part 1.B (LOS multiplier) so the still/moving model composes correctly.

**4. Recommended implementation order**
1. Wire `gender` into target selection. If no female exists, log a debug warning
   and fall back to nearest-player.
2. Add a `_dayanLastSeenT` accumulator alongside `_huntLosT`. When `_huntLosT` resets
   AND `_dayanLastSeenT > 3`, reposition ghost 10 m from `lastSeen.x/y`.
3. Verify still/moving speed gating uses ghost-frame velocity, not desired velocity
   (the dispatcher should freeze speed at 0 if `|vel| < 0.05 m/s`).

**5. Risk of shallow implementation**
- Without female-only targeting, Dayan = generic 50% ghost.
- Without LOS-teleport, Dayan can't reach hidden players in deep maps and the
  threat curve flattens dramatically — players just outrun her.

**6. Debug hooks**
- `__debug.dayanTarget()` → `{ playerId, gender, distance }`
- `__debug.dayanTeleportArmed()` → `{ lastSeenT, willTeleportInS }`
- `__debug.dayanState()` → `{ moving, speed }`

**Confidence:** HIGH (still/moving model); MEDIUM (teleport exact rule — spec
sources varied between "10 m" and "near last seen").

---

### 2.3  Demon

**1. Current Haunted hunt status**
- Threshold = 100 in `getHuntThreshold` — INCORRECT.
- Cooldown override missing — uses default 25 s. Canonical is 20 s.
- Crucifix range = 5 (fixed). Should be tier × 1.5.
- `incenseDuration` missing — defaults to 90. Should be 60.
- Smudge prevention duration also defaults — should be 60 s.
- `frequent_hunts` flag set; consumed by threshold path.
- No "ability hunt" path (Demon's signature: can hunt at any sanity once per
  contract via the ouija-board ability or a forced hunt event).

**2. Missing hunt-critical mechanics**
- Threshold 70% (not 100%).
- Cooldown 20 s (not 25 s).
- Crucifix range = base × 1.5 (T1 4.5 / T2 6.0 / T3 7.5).
- Incense/smudge duration 60 s.
- "Ability hunt" path: a forced hunt that ignores sanity once per contract; trigger
  is a Demon-specific ghost event window (high activity + ouija interaction).

**3. Dependencies**
- Part 1.A (threshold helper).
- Part 1.C (smudge duration table).
- Part 1.D (crucifix tier function).
- Ouija board interaction system (canonical Demon ability hunt is partially
  ouija-driven). If no ouija system exists, this fallback to "high-activity-event
  triggers ability hunt" is acceptable.

**4. Recommended implementation order**
1. Fix threshold: `getHuntThreshold(demon) = 70`.
2. Fix cooldown: per-ghost `huntCooldownSeconds` field, default 25, Demon 20.
3. Fix smudge: add `incenseDuration: 60`.
4. Wire `crucifixRangeFn(demon, tier) = tierBase[tier] * 1.5`.
5. Add `ghost.abilityHuntFired = false` registry field; on a once-per-contract
   eligible event, force-trigger a hunt regardless of sanity and set the flag.

**5. Risk of shallow implementation**
- Threshold-100 means Demon hunts immediately at any sanity — too aggressive,
  flattens the difficulty profile (currently in code).
- Without 1.5× crucifix range, Demon plays as a generic frequent-hunter; the
  defensive counterplay (carry T3 crucifix) is the canonical answer to Demon
  identification.
- Without ability hunt, Demon never produces its signature "huh, sanity was 80% and
  it still hunted" identification cue.

**6. Debug hooks**
- `__debug.demonAbilityHuntFired()` → boolean
- `__debug.demonForceHunt()` → triggers ability hunt for repro tests

**Confidence:** HIGH for all four numerics (threshold/cooldown/smudge/crucifix);
MEDIUM for ability-hunt trigger condition.

---

### 2.4  Deogen

**1. Current Haunted hunt status**
- 50% standard threshold.
- `slows_near_target` flag in registry; speed dispatcher branches on it.
- Speed lerp: 3.0 m/s far → 0.4 m/s close. Already implemented.
- "Always knows where players are" — currently chase target = nearest player; OK
  but does not honour the "no LOS required for target acquisition" rule strongly.

**2. Missing hunt-critical mechanics**
- Spec says: Deogen ALWAYS has the targeted player's position regardless of LOS,
  occlusion, or hiding. Today, Deogen still loses chase target on LOS-break and
  drops into search.
- Spec confirms: speed curve should be smooth lerp, not stepped. Verify code is
  smooth.
- Hiding spots: spec confirms hiding still works (slows ghost down to 0.4 m/s) —
  this is the canonical counterplay. Verify hiding does not break Deogen's tracking.

**3. Dependencies**
- Part 1.B (LOS multiplier). Deogen's distance-based speed should NOT compose with
  LOS multiplier (spec is clear: distance is the only modulator). Implement as a
  per-ghost override that bypasses the global LOS path.
- Hiding system (Part 1.E).

**4. Recommended implementation order**
1. Force chase-state to `chase` for Deogen always — never drop to `search` or
   `lastSeen`. Target reacquired every tick from current player position.
2. Implement piecewise speed: at d≥6 m → 3.0; at d≤2 m → 0.4; lerp linearly
   between. Confirm with `easeInOutQuad`-like smoothing.
3. Skip global LOS multiplier in Deogen branch.

**5. Risk of shallow implementation**
- If Deogen drops to search on LOS loss, players can break LOS and hide — but
  Deogen's identity is "you can hide but you cannot escape, only stall". A search
  drop turns it into a generic 50% ghost.

**6. Debug hooks**
- `__debug.deogenSpeed()` → `{ distance, computedSpeed }`
- `__debug.deogenChaseLocked()` → boolean (always true during hunt)

**Confidence:** HIGH.

---

### 2.5  Gallu

**1. Current Haunted hunt status**
- `speed_gallu_state` flag set; speed dispatcher has 3-state branch.
- State machine `calm/hunting/enraged` exists at the registry level; transition
  conditions partially wired.
- `incenseDuration: 0` — the spec says Gallu **is** still smudgeable (calm/hunting
  states), only enraged Gallu ignores incense. This is currently wrong.
- Crucifix range — enraged should be base −2 m, weakened (Gallu-specific
  "weakened" sub-state) should be base +1 m. Not implemented.

**2. Missing hunt-critical mechanics**
- Smudge duration must depend on state: 0 s while enraged, 90 s otherwise.
- Crucifix range must depend on state: −2 m enraged, +1 m weakened, base elsewhere.
- "Weakened" state trigger: drops below a sanity threshold (community sources
  diverge — use ≤25% target sanity as a working assumption; flag low-confidence).
- Enraged trigger: typically after enough failed crucifix blocks OR a ghost-event
  cluster. Needs a counter.

**3. Dependencies**
- Part 1.C (smudge duration helper that can read state).
- Part 1.D (crucifix range fn that reads state).
- Per-ghost state machine harness — extend `_huntState` to carry `galluSubState`.

**4. Recommended implementation order**
1. Add `galluSubState ∈ {calm, hunting, enraged, weakened}`; default `calm`.
2. Drive transitions:
   - `calm → hunting` on any hunt-start
   - `hunting → enraged` after N (≈3) hunts in one contract OR target sanity ≤ 25%
   - `enraged → weakened` after a successful smudge against `enraged` (no-op today
     because smudge is 0 s) — needs the smudge to register as a "missed attempt"
     even though it had no effect, OR allow a partial smudge.
3. Wire smudge duration helper to read sub-state.
4. Wire crucifix range to read sub-state.

**5. Risk of shallow implementation**
- Gallu without state-aware smudge plays as either always-immune or always-90s;
  both are wrong and remove the "press calmly during early hunts, prep crucifix
  for enraged" gameplay loop.

**6. Debug hooks**
- `__debug.galluState()` → `{ subState, hunts, sanityFloor }`
- `__debug.galluForceState(s)` → setter for tests

**Confidence:** MEDIUM (state transitions; community sources for Gallu specifics
were sparser than for legacy ghosts).

---

### 2.6  Goryo

**1. Current Haunted hunt status**
- 50% standard threshold.
- DOTS evidence guaranteed.
- DOTS visible **only via video camera (DOTS through camera viewfinder)**:
  spec says Goryo's DOTS appearances are camera-only. Current code shows DOTS
  on naked-eye check too — INCORRECT for hunt and non-hunt evidence.
- Standard 1.7 m/s speed.
- No special hunt rule beyond targeting.

**2. Missing hunt-critical mechanics**
- DOTS appearance must be gated: visible only if a player is actively viewing
  through a video-camera entity (handheld or tripod) AND the camera frustum
  contains the DOTS spawn point.
- Goryo prefers to remain in or near its **favourite room** during hunts; tends
  not to roam far. Verify chase logic allows but does not require migration.

**3. Dependencies**
- Camera viewing system: must expose `isCameraViewActive()` and
  `cameraFrustumContains(point)`.
- DOTS render path must consume those.
- This is mostly identification rather than hunt — but Part 2 of the spec covers
  hunt identity, and Goryo's hunt identity is "DOTS-camera-only sighting during
  the hunt", so it stays here.

**4. Recommended implementation order**
1. Refactor DOTS render to: `if (visible) { if (ghost.dotsCameraOnly && !cameraView) return; }`
2. Add `dotsCameraOnly: true` to Goryo registry entry.
3. Verify favourite-room bias in chase pathing — may already be present via
   Yurei's path code; reuse.

**5. Risk of shallow implementation**
- DOTS visible to naked eye = Goryo is indistinguishable from Wraith/Phantom/Banshee
  for DOTS-related identification. Players can't isolate Goryo.

**6. Debug hooks**
- `__debug.goryoDotsVisible()` → `{ inFrustum, cameraActive, naked }`

**Confidence:** HIGH.

---

### 2.7  Hantu

**1. Current Haunted hunt status**
- 50% standard threshold.
- `speed_from_cold` flag; speed dispatcher has Hantu branch with per-tile temp.
- Temperature curve appears to match spec's six-tier table:
  - ≥12°C → 1.4 m/s
  - 9–12°C → 1.75 m/s
  - 6–9°C → 2.05 m/s
  - 3–6°C → 2.3 m/s
  - 0–3°C → 2.5 m/s
  - <0°C → 2.7 m/s
- Breaker-off boost not separately implemented; relies on temp curve indirectly.

**2. Missing hunt-critical mechanics**
- Cold breath visual: when breaker is off, a brief puff of breath should render
  near the ghost during freezing-temp ticks. Not implemented.
- Verify: when breaker is ON, Hantu is **slower** than baseline (1.4 m/s) — spec
  confirms this; today's curve already does this via temp ≥12°C bucket. OK.
- Light interaction: light bulbs near Hantu shatter more frequently. Not strictly
  hunt-only, flag for cross-system later.

**3. Dependencies**
- Tile temperature system already exists (Hantu can read it).
- Part 1.B (LOS multiplier) composes onto base Hantu speed.
- Breaker on/off state already tracked.

**4. Recommended implementation order**
1. Verify temperature → speed lookup matches spec exactly. Add unit comment
   linking to `PHAS_HUNT_MASTER_SPEC.md` §2.7.
2. Add `cold_breath_puff` particle effect on hunt-tick when ambient ≤3°C and
   breaker off.
3. Verify LOS multiplier composes (final speed = tempSpeed × losMult, capped at
   reasonable max — spec says no per-ghost cap).

**5. Risk of shallow implementation**
- Curve drift (e.g. wrong slope) would make Hantu indistinguishable from Demon at
  certain temp ranges. The signature "Hantu = breaker-off → fast" identification
  test depends on curve fidelity.

**6. Debug hooks**
- `__debug.hantuSpeed()` → `{ tileTempC, baseSpeed, losMult, finalSpeed }`
- `__debug.hantuBreakerCheck()` → `{ breakerOn, expectedTempBucket }`

**Confidence:** HIGH.

---

### 2.8  Jinn

**1. Current Haunted hunt status**
- 50% standard threshold.
- `jinn_power_chase` flag; speed dispatcher branches.
- Power chase: when breaker on AND distance ≥3 m, Jinn boosts to 2.5 m/s.
- Breaker-off behaviour: cannot use power chase; default 1.7 m/s.
- "Cannot turn off the breaker" canonical rule — spec confirms — currently not
  enforced (Jinn could in principle interact with breaker; verify the breaker
  interaction API excludes Jinn).

**2. Missing hunt-critical mechanics**
- Distance gating verified: 3 m minimum. Below 3 m Jinn defaults to 1.7 m/s even
  with breaker on. Confirm in code.
- Crucifix range: spec says Jinn uses standard tier table (3/4/5 m). Verify no
  override.
- Cannot-turn-off-breaker: a `ghostMayInteractWithBreaker(ghost)` gate.

**3. Dependencies**
- Breaker state.
- Part 1.D (crucifix tier table).
- Distance to nearest player computed per-tick (already done).

**4. Recommended implementation order**
1. Verify the speed branch: `breaker.on && distance >= 3 ? 2.5 : 1.7`.
2. Add `ghostCanToggleBreaker(jinn) === false` and consume in breaker interaction
   path (likely in `selectGhostInteractionTarget`).
3. Verify hunt-start does NOT toggle breaker for Jinn even if it would be a
   "useful" interaction.

**5. Risk of shallow implementation**
- Without distance gating, Jinn boosts at 0 m and is uncatchable.
- Without breaker-toggle prohibition, identification cue "Jinn can't turn off the
  breaker" is invisible.

**6. Debug hooks**
- `__debug.jinnSpeed()` → `{ breakerOn, distance, finalSpeed }`
- `__debug.jinnBreakerLock()` → boolean (true means breaker control is locked from
  Jinn)

**Confidence:** HIGH.

---

### 2.9  Mare

**1. Current Haunted hunt status**
- Threshold path branches on lights: lit room → 40, dark room → 60. Already wired.
- Standard 1.7 m/s.
- "Lights mostly off" identification cue is environmental and exists.

**2. Missing hunt-critical mechanics**
- Verify per-ROOM (not per-tile, not per-house) light state determines threshold.
  Today the gate may be using the room the ghost is in vs the room the player is
  in — spec is ambiguous; current convention: ghost's current room's light state.
- Light-switch interaction prefers turning lights OFF; spec confirms. Verify
  `ghostInteractionWeights[mare]` biases off-toggles. Probably already correct.
- Crucifix and smudge: standard. Verify no overrides leaking from other ghosts.

**3. Dependencies**
- Room light state lookup (`isRoomLit(ghostRoomId)`).
- Part 1.A threshold helper.

**4. Recommended implementation order**
1. Confirm `effectiveThreshold(mare)` reads ghost's current-room light state.
2. Confirm interaction weight bias for off-toggles.
3. Add tests around the 40/60 boundary.

**5. Risk of shallow implementation**
- Wrong room read = Mare identification breaks (player tests "lights on, see if
  hunt happens" and gets false positives).

**6. Debug hooks**
- `__debug.mareLitCheck()` → `{ ghostRoomId, isLit, threshold }`

**Confidence:** HIGH.

---

### 2.10  Mimic

**1. Current Haunted hunt status**
- 50% standard threshold.
- `disrupts_electronics` flag set; consumed by global flicker path.
- Mimic mirrors **another ghost's behaviour each contract** — spec confirms.
  Currently not implemented; Mimic plays as a generic 50% ghost.
- Fake-orb evidence (extra orb-like aura) — identification, not hunt — flagged
  for cross-system.

**2. Missing hunt-critical mechanics**
- At contract start, Mimic must select a hidden "mimicked ghost" from the roster
  and adopt that ghost's hunt-tick behaviour for the duration. Behaviour adoption
  must include: threshold rules, speed model, smudge duration, crucifix range,
  identity flags — but NOT the mimicked ghost's evidence set.
- Mimic still emits orb-like aura regardless of mimicked ghost's evidence.

**3. Dependencies**
- All other 26 ghost behaviours must be addressable as a function of `(ghostKey)`,
  not hardcoded by registry index — i.e. the hunt-tick must be re-entrant on
  ghostKey. This is a significant refactor.
- Part 1.A/B/C/D all required.

**4. Recommended implementation order**
1. Refactor hunt-tick into `runGhostHuntTick(ghost)` that accepts `ghost.key`
   plus optional `ghost.mimicAs` override. Where `mimicAs` is set, every per-ghost
   branch reads `mimicAs` instead of `ghost.key`.
2. At contract start, set `mimic.mimicAs = randomChoice(GHOST_REGISTRY.filter(g =>
   g.key !== "mimic"))`.
3. Persist `mimicAs` across hunts within a contract; re-roll at next contract.
4. Surface `__debug.mimicAs()` for tests.

**5. Risk of shallow implementation**
- A non-mimicking Mimic is identification-flat — the only ghost-event flag is
  fake orbs. Without behavioural mimicry, Mimic is unidentifiable except by
  process-of-elimination on evidence, which hides bugs in other ghosts (because
  every Mimic encounter looks like the test case for whichever ghost was active).

**6. Debug hooks**
- `__debug.mimicAs()` → `{ key, name }`
- `__debug.mimicForceAs(key)` → setter for tests
- `__debug.mimicHasOrb()` → boolean (independent of mimicked ghost's evidence)

**Confidence:** HIGH for the design; refactor cost is the actual risk.

---

### 2.11  Moroi

**1. Current Haunted hunt status**
- 50% standard threshold (target-sanity-driven; spec confirms target sanity, not
  group lowest, drives Moroi's threshold).
- `speed_scales_with_low_sanity` flag; speed dispatcher branches.
- Speed curve: 1.5 m/s at 100% target sanity → 2.25 m/s at 0% target sanity.
  Already implemented.
- 7 s smudge-blind (vs default 5 s) — not currently implemented; uses default 5 s.
- Spirit Box curse — community sources suggest using SB while Moroi haunts
  accelerates sanity drain. Not implemented.

**2. Missing hunt-critical mechanics**
- Smudge-blind duration override: 7 s for Moroi (standard ghosts: 5 s).
- 28 s stack: when smudged repeatedly within 7 s, the blind stacks up to 28 s
  cumulative. Not implemented.
- SB curse: SB usage increases sanity drain rate by 25% while Moroi is the ghost
  AND the SB has registered any response. Not implemented.

**3. Dependencies**
- Smudge-blind timer (per-ghost duration).
- Sanity drain rate modifiers system.

**4. Recommended implementation order**
1. Add `smudgeBlindSeconds: 7` (default 5) to ghost registry.
2. Implement stacking: each smudge applies max(remaining, 7), capped at 28.
3. Wire SB-curse modifier (multiply sanity drain by 1.25 while
   `moroi.sbResponded === true`).

**5. Risk of shallow implementation**
- Without 7 s smudge-blind, "Moroi punishes mid-hunt smudge attempts" cue is
  invisible — Moroi plays like a fast Wraith.
- Without SB curse, the only sanity identifier is "speed scales with sanity"
  which overlaps with Moroi/Thaye/etc. — unidentifiable.

**6. Debug hooks**
- `__debug.moroiSmudgeBlind()` → `{ secondsRemaining, stackedTo }`
- `__debug.moroiSpeed()` → `{ targetSanity, speed }`
- `__debug.moroiSbCurseActive()` → boolean

**Confidence:** HIGH for speed curve and 7 s blind; MEDIUM for 28 s stack and
SB curse exact multiplier.

---

### 2.12  Myling

**1. Current Haunted hunt status**
- 50% standard threshold.
- Standard 1.7 m/s.
- Footstep audio range default (~20 m). INCORRECT — should be 12 m.
- Ghost-event "talk" frequency 64–127 s — flagged as identification, not hunt;
  the in-hunt aspect is that footsteps are quieter.

**2. Missing hunt-critical mechanics**
- Footstep range: 12 m, not 20.
- Hunt-start audio cues: heartbeat normal range (10 m), but footsteps quieter.

**3. Dependencies**
- Part 1.H (per-ghost footstep range).

**4. Recommended implementation order**
1. Set `footstepRangeMetres: 12` on Myling registry entry.
2. Verify the rest of the audio pipeline (parabolic mic, sound sensor) reads the
   per-ghost range, not a hard-coded 20 m.

**5. Risk of shallow implementation**
- Footstep parity with other ghosts erases Myling identity entirely; Myling is
  the only "audio-based-identification" ghost in the roster.

**6. Debug hooks**
- `__debug.mylingFootstepRange()` → metres

**Confidence:** HIGH.

---

### 2.13  Obake

**1. Current Haunted hunt status**
- 50% standard threshold. INCORRECT — Obake's threshold is 50% but it has a
  1-in-6 (≈16.7%) hunt roll rather than the 10% default. Currently Obake uses the
  global hunt-roll formula. After Part 1.A this becomes a per-ghost roll
  override.
- Standard 1.7 m/s.
- Six-finger fingerprint: not implemented.
- 9-second flicker shapeshift (Obake briefly takes a different model during a
  ghost-event): not implemented.
- "Halve existing fingerprint duration" rule: not implemented.

**2. Missing hunt-critical mechanics**
- Per-ghost roll: 1-in-6 (16.67%) per check. Implement as
  `huntRollChance(ghost) → 1/6` overriding the 10% default.
- Six-finger fingerprint: 1-in-6 chance of any deposited fingerprint sprite to be
  the six-finger variant. Halve the duration of all fingerprints (default 120 s
  → 60 s for Obake).
- Shapeshift visual: during a non-hunt ghost-event, 1-in-9 chance the ghost
  appears as a different ghost model for the duration of the event.

**3. Dependencies**
- Part 1.A (huntRollChance helper that supports per-ghost override).
- Fingerprint sprite asset: six-finger variant (NEW ASSET REQUIRED).
- Ghost-event apparition system (existing).

**4. Recommended implementation order**
1. Add `huntRollChance: 1/6` to Obake registry; consume in roll path.
2. Add `fingerprintDurationMultiplier: 0.5` to Obake registry; consume in
   fingerprint sprite spawn.
3. Add `sixFingerFingerprintChance: 1/6` to Obake registry; on fingerprint spawn,
   roll → use six-finger sprite if win.
4. Add `apparitionShapeshiftChance: 1/9` to Obake registry; on ghost-event
   visible-spawn, roll → render with another ghost's apparition asset for the
   event duration.
5. Asset task: produce `sprites/ghost/obake_sixfinger.png` matching art-style
   directive (Pixel Lab top-down 48px medium shading black outline).

**5. Risk of shallow implementation**
- Without 1-in-6 roll, Obake plays as a generic 50% ghost — the cue "Obake hunts
  more often than other 50% ghosts" is invisible.
- Without six-finger print, the canonical identification test (UV the prints,
  count fingers) is unverifiable.

**6. Debug hooks**
- `__debug.obakeRollChance()` → number
- `__debug.obakePrintDuration()` → seconds
- `__debug.obakeForceSixFinger(true)` → setter for next print spawn
- `__debug.obakeShapeshiftActive()` → `{ active, mimickedKey, secondsRemaining }`

**Confidence:** HIGH for 1-in-6 and halve-prints; MEDIUM for shapeshift exact
1-in-9 figure (sources varied).

---

### 2.14  Obambo

**1. Current Haunted hunt status**
- `speed_obambo_state` flag set; speed dispatcher has Obambo branch.
- Calm/aggressive 2-minute cycle present in registry; transition timer wired.
- 50% standard threshold.
- Calm-state speed slow (~0.8 m/s); aggressive-state speed faster (~2.0 m/s) —
  currently implemented.
- Spec note: Obambo is the December-2025 addition; community sources for hunt
  behaviour are sparse; current code matches the available sources.

**2. Missing hunt-critical mechanics**
- Verify the cycle is **120 s on / 120 s off** with a fixed phase from contract
  start. Some sources indicate randomised offset; spec defers to fixed for
  testability.
- Aggressive-state hunt threshold may be elevated above 50% per some sources;
  spec leaves at 50%. Flag low-confidence.
- Hunt-start during calm state: should be possible but rare; during aggressive
  state, threshold mechanics behave normally.

**3. Dependencies**
- Per-ghost timer field already exists.
- Part 1.A.

**4. Recommended implementation order**
1. Add `obamboCycleSeconds: 120` and `obamboPhase: 0` registry fields. Phase
   advances in hunt-tick.
2. Verify speed branch reads phase: `(phase < 60) ? calmSpeed : aggressiveSpeed`
   (or whatever cycle code expects — confirm against current implementation).
3. Add a debug toggle to force phase for testing.

**5. Risk of shallow implementation**
- Without the cycle, Obambo plays as a slow generic ghost; the canonical "wait
  for the calm window then move" counterplay is gone.

**6. Debug hooks**
- `__debug.obamboState()` → `{ phase, isAggressive, secondsToToggle }`
- `__debug.obamboForcePhase(n)` → setter for tests

**Confidence:** MEDIUM (Obambo is the newest ghost; sources thinnest).

---

### 2.15  Oni

**1. Current Haunted hunt status**
- 50% standard threshold.
- Standard 1.7 m/s.
- "Stronger when more players in room" — `stronger_in_crowded_rooms` flag exists
  but not consumed. Spec says Oni is canonically a Spirit-style ghost: ghost
  events drain 2× as much sanity, and full-form apparitions are more common
  when 2/3 players are co-located.
- No hunt-mist suppression — spec says Oni does not produce its hunt's swirling
  particle effect ("no mist").

**2. Missing hunt-critical mechanics**
- Ghost-event sanity drain × 2 when ≥2 players within 1.5 m of one another.
- Apparition frequency boost during co-location (full-body apparitions in 2/3 of
  ghost events vs canonical 1/3).
- Hunt visuals: skip the misty/foggy hunt particle effect. The hunt is otherwise
  identical to a standard hunt.

**3. Dependencies**
- Co-location detection (cluster of players within 1.5 m).
- Particle system: per-ghost `huntMistEnabled` flag.

**4. Recommended implementation order**
1. Add `huntMistEnabled: false` to Oni registry; verify hunt particle code reads
   this flag.
2. Add `eventSanityDrainMultiplier: 2.0` (single-player Haunted simplifies
   "co-located" to "default; only one player").
3. Add `apparitionFullFormChance: 2/3` (vs default 1/3).

**5. Risk of shallow implementation**
- Oni without the apparition / event boost is invisible vs Spirit; no
  identification path beyond evidence, which makes Oni the most
  unidentifiable-by-feel ghost in the game.

**6. Debug hooks**
- `__debug.oniMistOff()` → boolean
- `__debug.oniEventDrain()` → multiplier
- `__debug.oniApparitionFullForm()` → boolean (last event was full-form)

**Confidence:** HIGH for mist-off and event drain; MEDIUM for 2/3 fraction.

---

### 2.16  Onryo

**1. Current Haunted hunt status**
- Threshold base 60% set in `getHuntThreshold`.
- `hunt_on_flame_extinguish` flag; on flame extinguish, 65% chance to trigger
  hunt — INCORRECT, not the canonical mechanic.
- 4 m flame block — currently not implemented (flames don't suppress hunt
  progression within 4 m of ghost).
- Standard 1.7 m/s.

**2. Missing hunt-critical mechanics**
- **Three-flame counter:** Onryo tracks a per-contract counter incremented by 1
  each time a candle/lighter/firelight is extinguished. When the counter reaches
  3, force a hunt regardless of sanity. Counter does not reset between hunts.
- **4 m flame block:** while any active flame is within 4 m of Onryo, the
  60% threshold is suppressed (effectively 0% — no hunt-roll). The flame must be
  the canonical "lit candle, lit lighter, working firelight"; smudge sticks count
  while burning.
- Threshold: 60% remains canonical.

**3. Dependencies**
- Flame entity tracking (already partial — candles, lighters exist).
- Part 1.A threshold helper.
- Part 1.G hunt-end teardown explicitly NOT resetting `flameCounter`.

**4. Recommended implementation order**
1. Replace `hunt_on_flame_extinguish` 65% behaviour with counter increment +1.
2. Add `if (flameCounter >= 3) forceHunt(); flameCounter = 0;` (counter
   consumed on force-trigger).
3. Add 4 m flame block to `effectiveThreshold(onryo)`: if any active flame within
   4 m of ghost, threshold = 0.
4. Update debug hook to surface counter.

**5. Risk of shallow implementation**
- Random 65%-on-extinguish is too unpredictable for the canonical "manage your
  candles to control Onryo" gameplay loop.
- Without 4 m flame block, the counterplay (drop a candle near the ghost room)
  doesn't work — Onryo identification breaks.

**6. Debug hooks**
- `__debug.onryoFlameCounter()` → integer
- `__debug.onryoFlameBlock()` → `{ activeFlamesIn4m, blocked }`
- `__debug.onryoForceFlame(n)` → setter

**Confidence:** HIGH.

---

### 2.17  Phantom

**1. Current Haunted hunt status**
- 50% standard threshold.
- Standard 1.7 m/s.
- Apparition rendered continuously during hunts (default behaviour). INCORRECT —
  Phantom blinks: visible for 1.0–2.0 s, invisible for ~0.3–0.5 s, repeating.
- Photo-vanish: taking a photo of Phantom causes the apparition to vanish for
  the rest of the current hunt and drops the player who took the photo by 25%
  sanity. Not implemented.
- Spirit Box drain: half the rate of canonical ghosts. Not implemented (this is
  identification, but it manifests during hunts when SB is active).

**2. Missing hunt-critical mechanics**
- Blink visibility cycle: visible 1.0–2.0 s (random), invisible 0.3–0.5 s (random).
- Photo-vanish: when photographed during a hunt, apparition disabled for hunt
  duration; photographer sanity −25%.
- Halved SB sanity drain.

**3. Dependencies**
- Apparition render system (per-ghost visibility timer).
- Photo capture system (already exists).

**4. Recommended implementation order**
1. Add `apparitionVisibilityCycle: { visMs: [1000, 2000], invMs: [300, 500] }` to
   Phantom registry.
2. In hunt-tick, advance an `apparitionPhase` timer; render apparition only when
   `phase.visible`.
3. Hook photo-capture: if subject was Phantom-during-hunt, set
   `phantom.photographedThisHunt = true` and apply −25% to photographer sanity;
   reset on hunt-end.
4. Add `sbSanityDrainMultiplier: 0.5` for Phantom.

**5. Risk of shallow implementation**
- Continuous-visible Phantom is identical to Wraith/Banshee/Goryo from a "look at
  the ghost" identification standpoint. The blink IS the identifier.
- Without photo-vanish, the canonical "use a photo to neutralise Phantom" tactic
  is gone.

**6. Debug hooks**
- `__debug.phantomBlink()` → `{ phaseMs, visible }`
- `__debug.phantomPhotographedThisHunt()` → boolean

**Confidence:** HIGH for blink; HIGH for photo-vanish.

---

### 2.18  Poltergeist

**1. Current Haunted hunt status**
- 50% standard threshold.
- Standard 1.7 m/s.
- Throw mechanic: rate is currently lower than canonical, governed by a
  per-second probability with no hunt-specific override. INCORRECT.
- 4 s startup delay before throwing during a hunt: not implemented.
- 2% sanity drain per item thrown when within audible range: not implemented.

**2. Missing hunt-critical mechanics**
- **Hunt-throw rate: 100% per 0.5 s while ≥1 throwable in 4 m of ghost** — i.e.
  every 0.5 s the ghost picks the nearest throwable in range and throws it.
- **4 s startup delay** at hunt-start before the first throw.
- **2% sanity drain per item thrown** to all players within audible range
  (~12 m).
- Verify throwables are actually present in the level — Polt without throwables
  is a generic 50% ghost with no identification cue, so this also depends on
  level design.

**3. Dependencies**
- Throwable entity system (`worldItems[].throwable === true`).
- Sanity drain hookup.
- Audible range query.

**4. Recommended implementation order**
1. Add `huntThrowIntervalSeconds: 0.5`, `huntThrowStartupSeconds: 4`,
   `huntThrowSanityPerItem: 0.02`, `huntThrowRangeMetres: 4` to Polt registry.
2. In hunt-tick, accumulate a startup timer; once past 4 s, every 0.5 s pick
   nearest throwable in 4 m and throw it.
3. On throw, drain sanity for all players within 12 m by 2%.
4. Audit level prefabs to ensure each Polt-eligible map has ≥10 throwables
   reachable within ghost room + adjacent rooms.

**5. Risk of shallow implementation**
- Polt without 100% throw rate plays as Spirit-with-extra-steps. The throw
  spectacle IS the identification.
- Without sanity drain, the cue "Polt eats your sanity by throwing" is gone.

**6. Debug hooks**
- `__debug.poltThrowState()` → `{ startupSecondsRemaining, intervalSecondsLeft, lastThrownItem }`
- `__debug.poltCountThrowsThisHunt()` → integer
- `__debug.poltSanityDrainedThisHunt()` → number

**Confidence:** HIGH for 100% / 0.5 s; MEDIUM for 4 s startup; HIGH for 2 %
per-item drain.

---

### 2.19  Raiju

**1. Current Haunted hunt status**
- Threshold 50%; raised to 65% when "near electronics" — already wired via
  `getHuntThreshold` Raiju branch.
- `speed_near_electronics` flag; speed dispatcher branches.
- Speed: +0.5 m/s within 6 m of any active electronic.
- Heartbeat 10 m default — INCORRECT, should be 15 m for Raiju.
- Electronics flicker radius 10 m — INCORRECT, should be 15 m for Raiju.

**2. Missing hunt-critical mechanics**
- 65% threshold while within 6 m of an active electronic; verify code uses ACTIVE
  state (powered on, batteries) not merely "device exists in 6 m".
- Speed boost: 1.7 + 0.5 = 2.2 m/s within 6 m of active electronic; 1.7 m/s
  otherwise. LOS multiplier composes on top.
- Per-ghost heartbeat 15 m.
- Per-ghost electronics flicker radius 15 m.
- "Near electronics" threshold check should use **ghost's** position, not target
  player's.

**3. Dependencies**
- Part 1.H (heartbeat range table).
- Part 1.I (electronics flicker range table).
- Active electronic list with powered/battery state.

**4. Recommended implementation order**
1. Add `heartbeatRangeMetres: 15`, `electronicsFlickerRangeMetres: 15` to Raiju
   registry.
2. Verify `effectiveThreshold(raiju)` uses 65 when `nearActiveElectronics(ghost,
   6m) === true`.
3. Verify speed branch composes: `(near ? 2.2 : 1.7) * losMult`.

**5. Risk of shallow implementation**
- Same-radius-as-default ghosts means Raiju's audible range is its only
  identification — and that identification is wrong.

**6. Debug hooks**
- `__debug.raijuNearElectronics()` → `{ within6m, nearestDeviceKey, distanceM }`
- `__debug.raijuRanges()` → `{ heartbeatM, flickerM }`

**Confidence:** HIGH.

---

### 2.20  Revenant

**1. Current Haunted hunt status**
- 50% standard threshold.
- `speed_jumps_on_los` flag; speed dispatcher has Revenant branch.
- Speed: 1.0 m/s when not chasing, 3.0 m/s when chasing. Already implemented as a
  binary switch.
- Hiding interaction: spec confirms hiding works against Revenant **strongly**
  because the binary speed model means losing LOS drops Revenant to crawl.

**2. Missing hunt-critical mechanics**
- Verify "chasing" definition matches spec: chasing = ghost has a current LOS
  hit on a player target, OR is within `_huntState.chase` window since last LOS
  hit (≤2 s buffer to prevent flicker).
- LOS multiplier: spec says Revenant's binary speed REPLACES the LOS multiplier
  rather than composing — the 3.0 m/s is the chase ceiling. Verify code does NOT
  also multiply by `losMult`.
- Revenant 3.0 m/s exceeds the in-engine maximum; verify physics stepping
  doesn't tunnel through walls at this speed (cap step distance per tick).

**3. Dependencies**
- Part 1.B with the explicit "Revenant overrides global LOS multiplier".
- Tick-stepping for high-speed entities.

**4. Recommended implementation order**
1. Mark Revenant's speed branch with a comment: "Binary; bypass losMult."
2. Add a `revenantChaseGracePeriodSeconds: 2.0` so chase doesn't flicker
   between 1.0 and 3.0 every frame on LOS edge.
3. Verify physics step max-distance per tick.

**5. Risk of shallow implementation**
- If LOS multiplier composes onto Revenant, peak speed becomes 3.0 × 1.65 = 4.95
  m/s — wall-tunnelling, deeply unfair, breaks identification.
- If chase-flicker isn't smoothed, players observe oscillation.

**6. Debug hooks**
- `__debug.revenantChase()` → `{ chasing, chaseGraceSecondsRemaining, speed }`

**Confidence:** HIGH.

---

### 2.21  Shade

**1. Current Haunted hunt status**
- Threshold 35%. Already wired in `getHuntThreshold` Shade branch.
- `no_hunt_when_group` flag; consumed in hunt-roll gate to suppress hunt when
  ≥2 players within 80 px (~1.7 m).
- Standard 1.7 m/s.
- Same-room suppression: spec says ANY presence in ghost's current room
  suppresses Shade. Currently uses player-cluster check, which is single-player
  fine but doesn't read ghost's room.

**2. Missing hunt-critical mechanics**
- Same-room suppression: while a player is in the **ghost's current room**,
  Shade may not start a hunt regardless of sanity. (In single-player Haunted,
  this is the practical implementation.)
- Verify 35% threshold is consumed before the suppression check (suppression
  takes precedence — even at 0% sanity, Shade won't hunt with players in room).

**3. Dependencies**
- Room ID lookup for ghost and players.
- Part 1.A.

**4. Recommended implementation order**
1. Replace `no_hunt_when_group` with `no_hunt_in_same_room` in
   `effectiveThreshold(shade)`.
2. If ghost's room contains any player, threshold = 0 (effectively impossible to
   hunt).

**5. Risk of shallow implementation**
- Wrong suppression means Shade hunts when player is at the doorway with the
  ghost — the canonical "stand in the ghost room to be safe" Shade tactic
  is broken.

**6. Debug hooks**
- `__debug.shadeRoomSuppress()` → `{ ghostRoomId, playersInRoom, suppressed }`

**Confidence:** HIGH.

---

### 2.22  Spirit

**1. Current Haunted hunt status**
- 50% standard threshold.
- Standard 1.7 m/s.
- `incenseDuration: 180` set on registry — CORRECT.
- No other special hunt rules.

**2. Missing hunt-critical mechanics**
- None for the hunt itself — Spirit IS the canonical baseline (180 s smudge is
  its only identity flag, and it's already wired).
- Verify smudge re-application during the 180 s window EXTENDS the timer (resets
  to 180 s), not stacks.

**3. Dependencies**
- Part 1.C smudge duration helper.

**4. Recommended implementation order**
1. Confirm `incenseDuration: 180` is consumed.
2. Confirm smudge re-application extends rather than stacks.

**5. Risk of shallow implementation**
- If 180 s isn't honoured, Spirit identification breaks (the smudge-duration
  test is the canonical cue).

**6. Debug hooks**
- `__debug.spiritSmudgeRemaining()` → seconds

**Confidence:** HIGH.

---

### 2.23  Thaye

**1. Current Haunted hunt status**
- Threshold curve in `getHuntThreshold`: 75 → 20 step 5 every 60 s. INCORRECT —
  spec says 75 → 15, step 6 every game-minute, max 10 ages, age advances on
  player-room-presence trigger (not pure timer).
- Speed curve: starts 2.75 m/s, decays to 1.0 m/s. Step size and trigger may
  differ — spec says step 0.175 m/s per age, 10 ages max.
- Hunt-roll: 1-in-8 (12.5%) per check (Thaye-specific override). Currently uses
  global formula.

**2. Missing hunt-critical mechanics**
- Threshold curve correction: 75 → 15, step −6 per age, 10 ages.
- Speed curve correction: 2.75 → 1.0, step −0.175 per age, 10 ages.
- Hunt-roll: 1-in-8 (12.5%) per check.
- Age-advance trigger: each game-minute the player has spent in Thaye's room +1
  age (cumulative across hunts). Current code uses pure timer.
- Activity scaling: ghost activity (event frequency) drops with age — flagged
  for cross-system, not strict hunt scope.

**3. Dependencies**
- Player-presence-in-ghost-room timer (separate from hunt-tick).
- Part 1.A.
- Game-clock minute tick.

**4. Recommended implementation order**
1. Replace timer-driven age advance with presence-driven: increment `thaye.age`
   by 1 per game-minute the player has spent ≥50% of in Thaye's room.
2. Compute threshold: `max(15, 75 - 6 * age)`.
3. Compute speed: `max(1.0, 2.75 - 0.175 * age)`.
4. Override `huntRollChance(thaye) = 1/8`.
5. Cap age at 10.

**5. Risk of shallow implementation**
- Wrong curve means Thaye's identification cue ("Thaye gets weaker as you stay
  in the room") becomes random vs experiential. Experienced players won't
  recognise Thaye.

**6. Debug hooks**
- `__debug.thayeState()` → `{ age, threshold, speed, rollChance }`
- `__debug.thayeForceAge(n)` → setter

**Confidence:** HIGH for curve numerics; MEDIUM for the age-advance trigger
(some sources timer-only, some presence-only).

---

### 2.24  The Mimic

(Cross-references §2.10 Mimic.)

**1. Current Haunted hunt status**
Same as §2.10. The roster has 27 unique ghosts; "The Mimic" is the canonical
Phasmophobia name and "Mimic" is the engineering shorthand. No additional
implementation work beyond §2.10.

**2. Missing hunt-critical mechanics** — see §2.10.

**3. Dependencies** — see §2.10.

**4. Recommended implementation order** — see §2.10.

**5. Risk of shallow implementation** — see §2.10.

**6. Debug hooks** — see §2.10.

**Confidence:** HIGH (see §2.10).

---

### 2.25  The Twins

**1. Current Haunted hunt status**
- 50% standard threshold.
- `speed_twins_variant` flag; speed dispatcher has Twins branch.
- Active twin: spec says one of two twins is "active" per hunt (50/50 random),
  the other is the variant. Active twin: 1.5 m/s. Variant twin: 1.9 m/s.
  Both types may take turns triggering hunts.
- Teleport: when one twin is far from the player and the other initiates a
  hunt, the previously-distant twin may teleport to the player's last seen
  position. Not implemented.
- 20% chance of a paired (decoy) interaction: when an interaction fires, 20% to
  also fire a near-simultaneous interaction in a different room. Not
  implemented.

**2. Missing hunt-critical mechanics**
- Active-twin re-roll at every hunt-start; verify code does this.
- Teleport on hunt-start: the non-active twin teleports to the active player's
  current room (or last-known). Implementation: at hunt-start, set ghost
  position to a valid spawn within the active player's current room.
- 20% paired-interaction chance: on every interaction event roll, additional 20%
  to fire a phantom interaction in a different randomly-selected room.

**3. Dependencies**
- Room spawn-point lookup.
- Interaction system: must support "phantom" interactions (sound + brief
  particle) at remote rooms.

**4. Recommended implementation order**
1. Add `activeTwin: "elder" | "younger"` field; re-roll at every hunt-start.
2. Speed branch reads `activeTwin`.
3. Add hunt-start teleport: ghost position = random valid tile in
   `currentTargetRoomId`.
4. In interaction roll path, after a successful interaction, 20% to spawn a
   phantom interaction in `randomChoice(otherRooms)`.

**5. Risk of shallow implementation**
- Without teleport, Twins behave as a single-speed ghost; the canonical
  "interactions in two rooms at once" identification cue is gone.
- Without speed variation, Twins are indistinguishable from a generic 50% ghost.

**6. Debug hooks**
- `__debug.twinsActive()` → `{ active, speed }`
- `__debug.twinsPairedInteractionsThisContract()` → integer
- `__debug.twinsForceTeleport()` → triggers a teleport for repro

**Confidence:** HIGH for speed model and teleport; MEDIUM for 20% paired
interaction figure.

---

### 2.26  Wraith

**1. Current Haunted hunt status**
- 50% standard threshold.
- Standard 1.7 m/s.
- Salt interaction: ghosts can step on salt and leave footprints by default.
  INCORRECT for Wraith — Wraith never steps on salt and leaves no salt
  footprints.
- Smudge duration default 90 s — CORRECT.
- Crucifix range default 3 m base — CORRECT.

**2. Missing hunt-critical mechanics**
- `skip_salt: true` flag must be added (Part 1.L).
- Pathfinder must treat salt piles as soft-avoid for Wraith (cost +∞ on salt
  tiles) so Wraith routes around even at the cost of longer paths.
- Footprint emission must early-return when ghost has `skip_salt`.

**3. Dependencies**
- Pathfinding must support per-ghost tile-cost overrides.
- Salt entity tracking with footprint-emission hook.

**4. Recommended implementation order**
1. Add `skip_salt: true` flag to Wraith.
2. In pathfinding cost function, return `Infinity` for salt tiles when ghost has
   `skip_salt`.
3. In footprint-emission, early-return when ghost has `skip_salt`.

**5. Risk of shallow implementation**
- Wraith stepping on salt = wrong Phasmophobia behaviour and removes the only
  meaningful Wraith identification cue (drop salt, see if ghost steps on it).

**6. Debug hooks**
- `__debug.wraithSaltStep()` → boolean (last hunt: did the ghost touch a salt
  tile? — should be false)
- `__debug.wraithSaltAvoided()` → integer (count of avoided salt tiles this
  contract)

**Confidence:** HIGH.

---

### 2.27  Yokai

**1. Current Haunted hunt status**
- Threshold raised to 80% when SB has been used in the room — already wired in
  `getHuntThreshold` Yokai branch.
- Standard 1.7 m/s.
- Voice radius (player voice triggers ghost-event): 2 m. Currently uses default
  ~5 m. INCORRECT.
- Hunt voice radius: 2.5 m (during hunt, only voice within 2.5 m of ghost
  triggers Yokai's enhanced detection). Not implemented.
- Default 50% threshold when SB has not been used.

**2. Missing hunt-critical mechanics**
- Voice radius reduction during hunt to 2.5 m (canonical: Yokai cannot hear
  voice from far during hunts; this nerf is part of identity).
- Hearing range outside hunt: 2 m to trigger ghost-events on speech. Currently
  the player-voice-detection radius isn't per-ghost; needs to be.
- Verify SB-used threshold path correctly tracks "SB used in this room this
  contract" (not "SB ever used") — spec is ambiguous, treat as
  per-current-room flag with reset on contract end.

**3. Dependencies**
- Voice/microphone detection (already partial via SB).
- Per-ghost voice-radius field.

**4. Recommended implementation order**
1. Add `voiceRangeMetres: 2`, `huntVoiceRangeMetres: 2.5` to Yokai registry.
2. Wire ghost-event voice trigger to read `voiceRangeMetres`.
3. During hunts, swap to `huntVoiceRangeMetres`.
4. Verify `getHuntThreshold(yokai)` reads per-room SB-used flag.

**5. Risk of shallow implementation**
- Wrong voice radii erase the Yokai identification cue ("speak nearby to draw
  it / stay quiet to be safe"). Yokai becomes a generic 50%-or-80% ghost.

**6. Debug hooks**
- `__debug.yokaiVoice()` → `{ outOfHuntRangeM, inHuntRangeM, sbUsedThisRoom }`

**Confidence:** HIGH.

---

### 2.28  Yurei

**1. Current Haunted hunt status**
- 50% standard threshold.
- Standard 1.7 m/s.
- `incenseDuration: 90` (default) — CORRECT for the duration; missing the
  smudge-room-trap consequence.
- Door-slam ghost-event: not implemented as a per-ghost behaviour.
- Sanity drain on door-slam audible: not implemented.

**2. Missing hunt-critical mechanics**
- `smudge_room_trap: true` flag (Part 1.L) — when smudged, Yurei is confined to
  its favourite room for the duration of the smudge (default 90 s). Migration
  is suppressed.
- Door-slam: 15 % chance per pass within 7.5 m of a door to slam it shut.
  Slamming drains 15 sanity from any player within audible range (~12 m).
- Verify "favourite room" is a stable identifier per contract.

**3. Dependencies**
- Part 1.C (smudge duration) plus Part 1.K (door slam).
- Room-confine implementation (`no_room_migration` while smudged).
- Audible-range query.

**4. Recommended implementation order**
1. Add `smudge_room_trap: true` flag to Yurei.
2. Extend smudge effect: when smudged, set `yurei.confinedRoomId = favouriteRoomId`
   and `yurei.confinedTimer = 90`. Pathing must honour confinement (reject
   destinations outside `confinedRoomId`).
3. Implement door-slam: in hunt-tick, if ghost passes within 7.5 m of a closed-or-open
   door, 15% per-pass roll → close door + sanity-drain players in 12 m by 15.
4. Confirm favourite-room ID is stable for the contract.

**5. Risk of shallow implementation**
- Without smudge-room-trap, Yurei smudge plays exactly like Spirit smudge
  but shorter — no identity.
- Without door-slam, Yurei has no environmental tell beyond evidence; identification
  by feel is impossible.

**6. Debug hooks**
- `__debug.yureiConfine()` → `{ confinedRoomId, secondsRemaining }`
- `__debug.yureiDoorSlamCount()` → integer (this contract)

**Confidence:** HIGH for smudge-confine; MEDIUM for 15 % / 7.5 m / 15 sanity figures
(community sources varied between 10 % and 20 %).

---

## PART 3 — TIERED IMPLEMENTATION ORDER

This is a dependency-aware sequencing of the work. Land lower tiers before higher
ones. Each tier should pass its own smoke tests before the next begins.

### Tier 0 — Foundation (must land first)

These are Part 1 cross-cutting items. Everything else depends on them.

- 1.A  Hunt-roll formula (flat 10%) + per-ghost override hook
- 1.B  LOS multiplier cap (1.65×) + per-ghost compose/override
- 1.C  Smudge duration helper (per-ghost field + state-aware for Gallu/Yurei)
- 1.D  Crucifix tier function (T1/T2/T3 + Demon ×1.5 + Gallu state offset)
- 1.E  Hiding-spot ray cast (head bone + 0.167 m offset)
- 1.G  Centralised `endHunt(ghost, reason)` teardown
- 1.L  Identity-flag inventory + add `smudge_room_trap`, `skip_salt`

Smoke target: hunt-tick still works for Spirit baseline; debug hooks show
correct numbers; existing smoke tests pass.

### Tier 1 — Identity-critical (ship first to preserve roster fidelity)

These ghosts are most-broken by current code; players cannot identify them
today. Each is a small change after Tier 0 lands.

- §2.3  Demon — threshold 70, cooldown 20, smudge 60, crucifix ×1.5, ability hunt
- §2.16 Onryo — three-flame counter + 4 m flame block
- §2.17 Phantom — blink visibility cycle + photo-vanish
- §2.18 Poltergeist — 100% / 0.5 s throw rate + 4 s startup + 2% sanity drain
- §2.19 Raiju — heartbeat/flicker 15 m
- §2.21 Shade — same-room suppression
- §2.26 Wraith — `skip_salt` flag + footprint suppression
- §2.27 Yokai — voice radius 2 m / 2.5 m
- §2.28 Yurei — smudge-room-trap + door-slam

### Tier 2 — Significant identity (after Tier 1)

These ghosts work today but with wrong numerics; identification possible but
unreliable.

- §2.1  Banshee — target-only crucifix gating
- §2.7  Hantu — verify temp curve + add cold-breath puff visual
- §2.8  Jinn — breaker-toggle prohibition
- §2.11 Moroi — 7 s smudge-blind + stack to 28 s + SB curse
- §2.12 Myling — footstep range 12 m
- §2.13 Obake — 1-in-6 roll + halve prints + six-finger sprite asset
- §2.20 Revenant — verify binary speed bypasses LOS multiplier
- §2.23 Thaye — curve correction (75→15, 2.75→1.0, 1/8 roll)
- §2.25 Twins — teleport on hunt-start + 20% paired interaction

### Tier 3 — Cleanup / supporting systems

- §2.2  Dayan — female-only target + ±10 m teleport (depends on player gender
  field)
- §2.4  Deogen — chase-locked override + skip global LOS
- §2.5  Gallu — sub-state machine (calm/hunting/enraged/weakened)
- §2.6  Goryo — DOTS-camera-only render gate
- §2.9  Mare — verify lit-room read uses ghost room
- §2.10 Mimic — full mimicry refactor (largest scope; ship last because it
  depends on every other ghost being addressable)
- §2.14 Obambo — confirm calm/aggressive cycle phase
- §2.15 Oni — mist-off + event drain ×2 + apparition full-form 2/3
- §2.22 Spirit — verify smudge re-application extends rather than stacks
- §2.24 The Mimic — see §2.10

### Tier 4 — Asset work (parallel to coding)

- Six-finger fingerprint sprite for Obake (§2.13)
- Verify hunt-mist particle is suppressible per-ghost (§2.15 Oni)
- Verify cold-breath particle exists or create it (§2.7 Hantu)

These can happen in parallel with code work but will block test confidence on
the matching ghosts.

---

## PART 4 — KNOWN GAPS & DEFERRED ITEMS

These items are out of strict hunt scope but block full identity for at least
one ghost. Track them but do not block hunt rollout on them.

- **Mimic full mimicry refactor** — runtime-replaceable per-ghost behaviour;
  large refactor (§2.10).
- **Demon ability hunt trigger** — needs ouija board interaction system or a
  proxy event (§2.3).
- **Polt throwables in level prefabs** — level-design audit, not code.
- **Phantom photo-vanish** — depends on photo-capture API existing for
  apparition entities (§2.17).
- **Twin paired interactions** — depends on cross-room interaction event API
  (§2.25).
- **Yurei door-slam sanity-drain** — depends on audible-range query API
  (§2.28).
- **Polt sanity-drain on throw** — same audible-range query (§2.18).
- **Hantu cold-breath particle asset** — Tier 4 art.
- **Obake six-finger sprite asset** — Tier 4 art.

## PART 5 — ACCEPTANCE CRITERIA SUMMARY

The hunt rebuild is done when, for each ghost, all of the following hold:

1. The Tier-0 cross-cutting deltas land and existing smoke tests pass.
2. The per-ghost section's "Recommended implementation order" steps each have
   landed and the matching `__debug.*` hooks return values consistent with the
   spec.
3. A new test file `tests/hunt-identity.test.js` walks each ghost through:
   - threshold check at sanity above and below the canonical threshold,
   - speed at canonical conditions (still / chasing / per-ghost trigger),
   - smudge duration honoured,
   - crucifix range honoured per tier,
   - identity flag's hunt-tick consumer fired.
4. `docs/SESSION_LOG.md` notes which ghosts now match canon and which still
   require missing systems.

---

*End of HAUNTED_HUNT_IMPLEMENTATION_PLAN.md.*

