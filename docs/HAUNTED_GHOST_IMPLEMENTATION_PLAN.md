# HAUNTED_GHOST_IMPLEMENTATION_PLAN.md

Companion to [PHAS_GHOST_MASTER_SPEC.md](./PHAS_GHOST_MASTER_SPEC.md). Built **from** the master spec, not from prior plans. For each of the 27 ghosts, six sub-sections:
1. **Current Haunted Status** — what the in-repo `GHOST_REGISTRY` actually does today.
2. **Identity-Critical Features Missing** — what the master spec demands that Haunted does not yet implement.
3. **Systems Required** — engine-level changes (new helpers, new hooks, new state) needed to close the gap.
4. **Suggested Implementation Order** — the order to build within this ghost so each step is testable.
5. **Danger of Fake Implementation** — what goes wrong if the ghost is left as a stub or shipped without the identifying mechanic.
6. **Debug Hooks to Add** — concrete `window.__debug.<ghost>.*` surfaces required to validate the behaviour.

Code references point at [index.html](../index.html). Most relevant anchors:
- `GHOST_REGISTRY` declaration: [index.html:5078-5356](../index.html#L5078-L5356)
- `getHuntThreshold(ghost)`: [index.html:5857](../index.html#L5857)
- Per-ghost hunt-speed branches: [index.html:7440-7570](../index.html#L7440-L7570)
- `specialRules[]` consumers: scattered, lines 5734–8800.
- Default behaviour numbers (`huntThreshold`, `huntSpeedBase`, etc.): [index.html:355](../index.html#L355)

---

# Part I — Cross-Cutting Findings

## I.1 The `specialRules[]` pattern is the right shape

Every ghost carries an array of string flags read at runtime by behaviour gates. This is the right architecture — keep it. Do **not** refactor to subclasses; the flag-array preserves data-driven balance tweaks and lets the registry stay flat.

When adding new flags, prefix them by ghost type only when the rule is unique to that ghost (e.g., `obake_print_rate_75`, `revenant_no_los_accel`). For shared rules across multiple ghosts (e.g., `forced_evidence_freezing`), use a generic name and let the consumer key off `ghost.type` for tie-breaking.

## I.2 The `behavior` object hides numeric tuning

Tuning numbers (`huntThreshold`, `huntSpeedBase`, per-ghost speed tables) live on `ghost.behavior`. Defaults are at [index.html:355](../index.html#L355). When implementing a new behaviour, **prefer adding a number to `behavior`** over hard-coding a magic number in the consumer. Drop a single-line comment in the consumer that points back to the registry entry.

## I.3 Three custom-Haunted ghosts diverge from canonical Phasmophobia

The current registry authors **Dayan, Gallu, and Obambo** as Haunted-original variants (see [index.html:5328](../index.html#L5328)). Their evidence trios and signature mechanics do **not** match the canonical Phasmo data captured in `PHAS_GHOST_MASTER_SPEC.md`.

| Ghost | Haunted current (registry) | Canonical Phasmo (master spec) |
|---|---|---|
| Dayan | EMF 5 / Ghost Writing / Ghost Orb · "responds to name" mechanic · custom threshold | EMF 5 / Ghost Writing / Spirit Box · movement-tier 45/50/65 threshold · female-only model |
| Gallu | UV / Freezing / DOTS · "immune to smudge / silent" · custom | EMF 5 / Spirit Box / Freezing · 3-state pressure machine · 40/50/60 threshold |
| Obambo | Ghost Orb / Ghost Writing / Spirit Box · "mirror manifestation" mechanic | Spirit Box / Ghost Orb / DOTS · 2-min calm/aggressive cycle · 10/65 threshold |

**Decision required from user before any further work on these three.** Options:
- **(A) Align to canonical** — rewrite registry entries and bespoke abilities to match master spec. Lets Phasmo-literate players apply existing knowledge. **Default plan in this document.**
- **(B) Keep as Haunted-original** — leave them as-is; treat as project flavour. Strip them from the canonical-coverage scope.
- **(C) Co-exist** — rename Haunted's variants (e.g., "Mirror Lord" instead of Obambo) and add separate canonical entries.

The per-ghost sections below for Dayan/Gallu/Obambo plan for **(A)** but call out the diff explicitly. If the user picks (B) or (C), revise those three sections — the rest of the document is unaffected.

## I.4 Cross-cutting systems that block multiple ghosts

Build each once and several ghosts unlock at the same time:

| System | Currently | Blocks |
|---|---|---|
| Forced-evidence list (always-on regardless of difficulty) | Partial — handled inline in evidence randomiser | Deogen, Goryo, Hantu, Moroi, Obake, The Mimic |
| Active-electronics detection (within ~6–8 m) | Missing | Raiju (threshold + speed), partial Jinn (LOS + dist gate) |
| Voice-detection radius (with single-player fake-input fallback) | Missing | Yokai, Demon-Ouija interaction |
| Per-ghost smudge cooldown override | Partial | Spirit (180 s), Demon (60 s), Moroi (3/7.5 s blind), Yurei (favourite-room confine) |
| Per-ghost crucifix radius override | Missing | Demon (5/6), Banshee (always-blocks-target) |
| Forced flame-counter (with hunt trigger at N=3) | Missing | Onryo |
| Aging timer with proximity gate | Missing | Thaye |
| Phase timer (calm/aggressive) | Missing | Obambo |
| State machine (calm/provoked/enraged) with smudge/crucifix triggers | Missing | Gallu |
| Movement-tier query for nearby players (still/walk/sprint within 10 m) | Missing | Dayan |
| Multi-entity ghost spawn (two anchors, alternating control) | Missing | The Twins |
| Host-mirror behaviour delegation | Missing | The Mimic |
| Photo-vanish on flash-during-manifest | Missing | Phantom |
| Salt-pile no-print override | Partial | Wraith, partial Obake (75% miss) |
| In-room player check (suppress events) | Missing | Shade |
| Distance-curve speed override (no LOS-accel) | Missing | Deogen, Revenant |
| Sanity-curve speed override | Missing | Moroi, Thaye |
| Temperature-curve speed override + breaker gate | Missing | Hantu |
| Per-frame target-locked sanity drain (LOS on Phantom manifest) | Missing | Phantom, Yurei (event-LOS) |
| Camera-feed-only DOTS render | Missing | Goryo |
| Multi-throw single-event interaction | Missing | Poltergeist |
| Detection-state binary speed snap (no LOS-accel) | Missing | Revenant |
| Spirit-Box curse hook (double drain on listener) | Missing | Moroi |
| Parabolic 1/3 screech roll | Missing | Banshee |
| Hunt-time invisible-flicker on model | Missing | Phantom |
| Hunt-time model swap | Missing | Obake |
| Print probability override (75% rate, 1/6 abnormal) | Missing | Obake |
| Long-range flashlight flicker (15 m vs 10 m) | Missing | Raiju |
| Footstep audibility clamp (12 m) | Missing | Myling |
| Elevated paranormal-sound rate | Missing | Myling, Oni |

These twenty-something systems are the real work. Each per-ghost plan below identifies which subset it requires.

---

# Part II — Per-Ghost Implementation Plans

## Banshee

### 1. Current Haunted Status
Registry at [index.html:5116-5123](../index.html#L5116-L5123). Evidence trio matches master spec (DOTS / UV / Ghost Orb). `specialRules` already include `single_target`, `target_sanity_hunt`, `crucifix_always_works`, `wail_on_roam`, `signature_scream`. `behavior.crucifixRange` set to 5 — **incorrect** (canon is 3 m T1 / 4 m T2; the always-blocks rule does the heavy lifting).

### 2. Identity-Critical Features Missing
- Parabolic 1/3 screech roll: `signature_scream` flag exists but no consumer that fires unique screech audio with 33% probability when parabolic detects a paranormal sound.
- Target-sanity-vs-team-average gating: `target_sanity_hunt` flag exists, but `getHuntThreshold(ghost)` may not actually pull from the target player's sanity; verify path at [index.html:5857](../index.html#L5857).
- Crucifix-always-blocks-target: confirm a special-case in the crucifix proximity check that bypasses the standard hunt-roll when the **target** is in range, regardless of dice.
- Female model + female-only name pool: no sign of model/name gating.

### 3. Systems Required
- Target-player picker at contract start; persisted `ghost.targetPlayerId`.
- Sanity threshold reader path that branches on `target_sanity_hunt` to read `targetPlayer.sanity` instead of team average.
- Parabolic-microphone hook with per-event 33% screech roll; unique audio asset path (e.g., `audio/sfx/banshee_screech.*`).
- Crucifix-vs-target distance check that suppresses hunts unconditionally when the target is within range.
- Female-only model and name selection branch in the ghost-spawn pipeline.

### 4. Suggested Implementation Order
1. Add target-player picker and `targetPlayerId` field on Banshee spawn.
2. Wire `getHuntThreshold(ghost)` to read target sanity when `target_sanity_hunt` is present.
3. Implement crucifix-target check (small change, high payoff).
4. Add parabolic 1/3 screech roll with audio asset.
5. Lock model + name pool to female (lowest priority for gameplay; does affect identification flavour).

### 5. Danger of Fake Implementation
- Without target-sanity gating, the team passes "high-sanity hunts" tests against the Banshee — false-positives every run.
- Without 1/3 screech roll, the most distinctive signal in the canonical game is missing; the Banshee becomes indistinguishable from other DOTS+UV+Orb ghosts.
- Without crucifix-always-blocks-target, the Banshee strategy collapses to "use any crucifix" rather than "crucifix the target specifically".

### 6. Debug Hooks to Add
```
window.__debug.banshee = {
  target: () => ghost.targetPlayerId,
  forceScreech: () => __forceParabolicResult("screech"),
  testCrucifixBlock: () => __simulateHuntRoll({ playerInCrucifix: ghost.targetPlayerId }),
  setTarget: (id) => { ghost.targetPlayerId = id; },
};
```

---

## Dayan

### 1. Current Haunted Status
Registry at [index.html:5330-5337](../index.html#L5330-L5337). **Diverges from canonical Phasmo.** Current evidence: EMF / Ghost Writing / Ghost Orb. Canonical: EMF / Ghost Writing / Spirit Box. Mechanic: "responds to name". Speeds: `dayanStillSpeed=0.75`, `dayanMovingSpeed=1.40625`, `dayanFarSpeed=1.0625`. Threshold 55. Rules: `responds_to_name`, `name_provoke_hunt`, `speed_dayan_motion`.

### 2. Identity-Critical Features Missing (assuming alignment Option A)
- Evidence trio swap: Ghost Orb → Spirit Box.
- Tri-tier movement-driven threshold: 45 / 50 / 65 (still / walk / sprint within ~10 m).
- Tri-tier speed: 1.2 / 1.7 / 2.25 m/s by same trigger.
- Female-only model and name pool.
- Removal of bespoke "responds to name" mechanic (or keep as flavour layer on top of canonical behaviour if Option C).

### 3. Systems Required
- `getNearbyPlayerMovementTier(ghost, radius)` helper returning `"still" | "walk" | "sprint"` — picks the highest tier of any player within 10 m of the ghost.
- Threshold and speed branches keyed off the helper.
- Name-pool restriction in spawn pipeline (female only).

### 4. Suggested Implementation Order
1. Decide Option A/B/C with user. **Block all further Dayan work until decided.**
2. If A: rewrite registry entry — evidence, threshold, speeds, specialRules.
3. Implement movement-tier helper.
4. Wire threshold and speed off the helper.
5. Lock name/model to female.
6. Remove or refactor `responds_to_name` flag if canonical replaces it.

### 5. Danger of Fake Implementation
- Leaving the registry as-is makes Dayan unrecognisable to players coming from real Phasmo.
- Skipping movement-tier mechanic kills the puzzle entirely — the ghost just feels like a default 1.7 m/s ghost with a custom name.

### 6. Debug Hooks to Add
```
window.__debug.dayan = {
  tier: () => __nearbyMovementTier(ghost, 10),
  forceTier: (t) => { __dayanForcedTier = t; },
  threshold: () => getHuntThreshold(ghost),
  speed: () => __activeHuntSpeed(ghost),
};
```

---

## Demon

### 1. Current Haunted Status
Registry at [index.html:5161-5168](../index.html#L5161-L5168). Trio matches (UV / Ghost Writing / Freezing). `huntThreshold: 70` correct. `crucifixRange: 5` set on the registry entry but only Tier I is represented; no Tier II. `specialRules` include `hunt_any_sanity`, `frequent_hunts`, `ouija_safe`. **`ouija_safe` is the wrong direction** — canon: Ouija increases hunt likelihood, so the rule name and consumer must invert.

### 2. Identity-Critical Features Missing
- 20 s hunt cooldown override (vs default 25 s): not visible in current behaviour.
- 60 s smudge block override outside hunt (vs default 90 s): no consumer.
- Tier II crucifix radius (6 m): missing.
- Ouija interaction: must roll a hunt-attempt with elevated weight per Ouija question, not the opposite.

### 3. Systems Required
- Per-ghost `huntCooldownSeconds` field on `behavior` and a consumer in the hunt-roll loop.
- Per-ghost smudge-block-duration override (already partial for Spirit; generalise).
- Per-ghost crucifix radius lookup (T1 / T2) keyed by ghost type.
- Ouija-question hook → hunt-roll trigger with Demon-specific elevated weight.

### 4. Suggested Implementation Order
1. Add `behavior.huntCooldownSeconds = 20` to Demon entry; consume in cooldown logic.
2. Add `behavior.smudgeBlockSeconds = 60` and consume in smudge cooldown logic.
3. Add `behavior.crucifixTier1 = 5`, `crucifixTier2 = 6` and refactor crucifix range lookup.
4. Rename `ouija_safe` → `ouija_provokes_hunt`; wire Ouija-question events to a hunt-roll attempt.
5. Verify 70% threshold is actually being read (already correct in registry but check downstream).

### 5. Danger of Fake Implementation
- Without 20 s cooldown, the Demon plays identically to a default ghost outside of evidence trio — the team won't feel the pressure.
- Wrong-direction Ouija rule is worse than no rule — players using Ouija on a "Demon" expecting safety will *get hunted* in canon, but our rule says safe; this corrupts player expectations.
- Wrong crucifix radius makes the most-effective Demon counter underperform.

### 6. Debug Hooks to Add
```
window.__debug.demon = {
  cooldown: () => ghost.behavior.huntCooldownSeconds,
  crucifixRange: (tier) => tier === 2 ? ghost.behavior.crucifixTier2 : ghost.behavior.crucifixTier1,
  smudgeBlockDuration: () => ghost.behavior.smudgeBlockSeconds,
  testOuijaHuntRoll: () => __simulateOuijaHuntRoll(ghost),
};
```

---

## Deogen

### 1. Current Haunted Status
Registry at [index.html:5305-5312](../index.html#L5305-L5312). Trio matches (Spirit Box / Ghost Writing / DOTS). `huntThreshold: 40` correct. `huntSpeedBase: 1.875` and `huntSpeedClose: 0.25` are present. `specialRules` include `always_knows_player_pos`, `slows_near_target`. **No mid-tier speed (~1.6 m/s) — current is binary, canon is three-tier.**

### 2. Identity-Critical Features Missing
- Three-tier distance curve (0.4 / 1.6 / 3.0 m/s) at thresholds ~2.5 m and ~6 m. Currently only two-tier.
- Forced Spirit Box on every difficulty (including 0-evidence custom).
- Heavy-breathing audio loop on parabolic and at long range.
- LOS acceleration **must not** apply on top of distance-curve speed; verify the consumer.

### 3. Systems Required
- Distance-conditional speed function: `dist > 6 ? 3.0 : dist > 2.5 ? 1.6 : 0.4`.
- Forced-evidence list mechanism (cross-cutting; reuse across Goryo, Hantu, Moroi, Obake, Mimic).
- Heavy-breathing audio asset and emission hook tied to ghost position.
- Speed-resolver explicit branch: if ghost has `distance_curve_speed` flag, skip LOS-accel.

### 4. Suggested Implementation Order
1. Build the cross-cutting forced-evidence mechanism (used by 5+ ghosts).
2. Replace Deogen's two-tier speed with three-tier distance curve.
3. Disable LOS-accel for Deogen via a new `no_los_accel` flag (also reused by Revenant).
4. Add breathing audio loop and emission radius.

### 5. Danger of Fake Implementation
- Two-tier speed lets players outrun the Deogen at long range, defeating the entire "always finds you" identity.
- Without forced Spirit Box, Deogen on Nightmare/Insanity becomes indistinguishable from other Spirit-Box ghosts.
- Breathing audio missing → no behavioural identifier; only evidence trio remains.

### 6. Debug Hooks to Add
```
window.__debug.deogen = {
  distanceTier: () => __deogenDistanceTier(ghost),
  speed: () => __activeHuntSpeed(ghost),
  testForcedSB: (difficulty) => __evidenceListFor(ghost, difficulty).includes("Spirit Box"),
};
```

---

## Gallu

### 1. Current Haunted Status
Registry at [index.html:5339-5346](../index.html#L5339-L5346). **Diverges from canonical Phasmo.** Current evidence: UV / Freezing / DOTS. Canonical: EMF 5 / Spirit Box / Freezing. Mechanic: `immune_to_smudge`, `silent_approach`, `speed_gallu_state` (with `galluNormalSpeed`, `galluEnragedSpeed`, `galluWeakenedSpeed`). Canon uses three states: calm / provoked / enraged with thresholds 40/50/60 and speeds 1.36/1.7/1.96.

### 2. Identity-Critical Features Missing (assuming Option A)
- Evidence trio swap (UV → EMF, DOTS → Spirit Box).
- 3-state pressure machine triggered by **crucifix placement** and **smudge use** (currently smudge-immune — opposite direction).
- Per-state thresholds 40/50/60.
- Per-state speeds 1.36/1.7/1.96.
- Per-state smudge blind duration (~5 / ~3.75 / ~2.5 s).
- Salt-skip behaviour when Enraged.

### 3. Systems Required
- `gallu.state` enum field; transition hooks for crucifix-placed-near-room and smudge-used-outside-hunt.
- State-driven threshold and speed lookups.
- Salt-pile freshness window check; ignore-step rule for Enraged.
- Per-state smudge blind duration consumer.

### 4. Suggested Implementation Order
1. Decide Option A/B/C with user. **Block until decided.**
2. If A: rewrite registry — evidence, specialRules, behavior speeds.
3. Add `state` field, transition hooks, threshold/speed lookups.
4. Implement salt-skip when Enraged.
5. Implement state-modulated smudge blind duration.

### 5. Danger of Fake Implementation
- `immune_to_smudge` is backward to canon — players who Phasmo-test by smudging will read this as "wrong" rather than as a feature.
- Without state-machine, the ghost has no meaningful counter — strategic depth zero.
- Salt-skip is the second-most-distinctive Gallu signal after the smudge-escalation; missing it removes a key tell.

### 6. Debug Hooks to Add
```
window.__debug.gallu = {
  state: () => ghost.state,
  setState: (s) => { ghost.state = s; },
  threshold: () => getHuntThreshold(ghost),
  speed: () => __activeHuntSpeed(ghost),
  smudgeBlindSeconds: () => __galluSmudgeBlind(ghost),
  testSaltStep: () => __wouldStepInFreshSalt(ghost),
};
```

---

## Goryo

### 1. Current Haunted Status
Registry at [index.html:5217-5224](../index.html#L5217-L5224). Trio matches (EMF / UV / DOTS). `roomLoyalty: 0.95`, `roamTendency: 0.3` express the heavy room-stay tendency well. `specialRules` include `dots_camera_only` and `no_room_migration`. **The render-pipeline gating for `dots_camera_only` is the hard part — verify the consumer actually checks the camera-feed render path.**

### 2. Identity-Critical Features Missing
- Forced DOTS on every difficulty (cross-cutting forced-evidence list).
- Player-in-room gating: DOTS silhouette must be **suppressed entirely** when any player is in the room with the projector — currently flag exists but no per-frame occupancy check is verified.
- Camera-feed-only render: DOTS silhouette renders only on the truck/camera-feed render layer, not the in-world layer.

### 3. Systems Required
- Forced-evidence list (shared with Deogen/Hantu/Moroi/Obake/Mimic).
- Room-occupancy tracker keyed on player positions; per-frame query for "any player in this room".
- Camera-feed render layer separation; DOTS draws on feed only.

### 4. Suggested Implementation Order
1. Build the cross-cutting forced-evidence mechanism.
2. Add room-occupancy helper.
3. Refactor DOTS render so silhouette is layer-tagged; tag Goryo silhouette as "feed only".
4. Verify player-in-room suppression actually fires.

### 5. Danger of Fake Implementation
- Without camera-feed-only render, Goryo plays identically to Banshee on DOTS — the player-must-leave-room puzzle vanishes.
- Without forced DOTS, Goryo on reduced-evidence difficulties may show only EMF + UV with no DOTS, making ID by trio impossible.

### 6. Debug Hooks to Add
```
window.__debug.goryo = {
  dotsVisibleNakedEye: (playerInRoom) => __testGoryoDots(playerInRoom, "nakedEye"),
  dotsVisibleOnCamera: (playerInRoom) => __testGoryoDots(playerInRoom, "camera"),
  forceDots: () => __forceDotsEvent(ghost),
  roomOccupancy: () => __playersInRoom(ghost.room).length,
};
```

---

## Hantu

### 1. Current Haunted Status
Registry at [index.html:5197-5215](../index.html#L5197-L5215). Trio matches (UV / Ghost Orb / Freezing). The temperature curve table `hantuSpeedTable` exists with six tiers, mapped against `huntSpeedBase: 1.09375`. **The numbers are scaled to a different base** — verify they yield 1.4 / 1.75 / 2.1 / 2.3 / 2.5 / 2.7 m/s after applying the multiplier. `specialRules` include `speed_from_cold` and `no_emf5`. **Breaker-on slow-down to 1.4 m/s flat is missing.**

### 2. Identity-Critical Features Missing
- Forced Freezing on every difficulty.
- Breaker-on rule: when breaker is on, override speed to **1.4 m/s flat** regardless of temperature.
- Visible breath cloud particle effect during interactions and hunts.
- Verify the temperature-tier values resolve to canonical 1.4–2.7 m/s after multiplier; if they don't, retune the table.

### 3. Systems Required
- Forced-evidence list (shared cross-cutting).
- Breaker-state hook (already exists for Jinn — reuse).
- Speed override per tick: if breaker on, return 1.4 m/s; else read tier table.
- Particle/sprite asset for visible breath; emission tied to ghost position when room temp ≤ ~6 °C.

### 4. Suggested Implementation Order
1. Cross-cutting forced-evidence mechanism (already used for several ghosts; do once).
2. Verify temperature tier output values; retune table if needed.
3. Wire breaker-on slow-down (reuse Jinn's breaker hook).
4. Add visible-breath particle effect.

### 5. Danger of Fake Implementation
- Without breaker-on rule, the central Hantu defence ("turn the breaker on") doesn't work — strategic depth lost.
- Without forced Freezing, Hantu on Insanity may not show Freezing, defeating ID via trio.
- Wrong temperature tier output values mean the speed identification test (timing the ghost across two markers) gives the wrong answer.

### 6. Debug Hooks to Add
```
window.__debug.hantu = {
  tempTier: () => __hantuTempTier(ghost),
  speed: () => __activeHuntSpeed(ghost),
  breakerEffect: () => ({ on: 1.4, off: __hantuTierSpeed(ghost) }),
  testForcedFreezing: (difficulty) => __evidenceListFor(ghost, difficulty).includes("Freezing Temperatures"),
};
```

---

## Jinn

### 1. Current Haunted Status
Registry at [index.html:5125-5132](../index.html#L5125-L5132). Trio matches (EMF / Freezing / UV). `specialRules` include `jinn_power_chase`, `jinn_breaker_drain`, `cant_turn_off_breaker`. **Three-condition gate (breaker on AND LOS AND distance > 3 m) needs explicit implementation in the speed resolver.** Sanity-drain ability needs a hook.

### 2. Identity-Critical Features Missing
- Three-condition speed gate that resolves to **2.5 m/s** only when all of: breaker on, LOS on player, target distance > 3 m. Otherwise 1.7 m/s.
- LOS acceleration applies on top of the resolved tier (verify).
- Sanity-drain ability: when conditions hold, periodically drain ~25% from the LOS-targeted player.
- `cant_turn_off_breaker` rule: ghost cannot turn the breaker off itself; validate consumer prevents Jinn from generating breaker-off interactions.

### 3. Systems Required
- Breaker-state global hook.
- Per-tick three-condition evaluator for Jinn.
- Sanity-drain emit hook with target player and ~25% magnitude.
- LOS-on-player tracker per ghost (already needed for several ghosts).

### 4. Suggested Implementation Order
1. Breaker-state hook (reused with Hantu).
2. Three-condition speed resolver.
3. Sanity-drain ability with cooldown (mark cooldown as **Unknown — verify**).
4. Validate `cant_turn_off_breaker` consumer.

### 5. Danger of Fake Implementation
- Without three-condition gate, Jinn at long range with breaker on doesn't speed up — the "run at it" counter has no purpose.
- Without sanity-drain, the secondary identification signal disappears.

### 6. Debug Hooks to Add
```
window.__debug.jinn = {
  speed: () => __activeHuntSpeed(ghost),
  testSanityDrain: () => __jinnDrainAbility(ghost),
  breakerOn: () => __setBreaker(true),
  breakerOff: () => __setBreaker(false),
  conditionsMet: () => __jinnGateActive(ghost),
};
```

---

## Mare

### 1. Current Haunted Status
Registry at [index.html:5134-5141](../index.html#L5134-L5141). Trio matches (Spirit Box / Ghost Orb / Ghost Writing). `huntThreshold: 60` set as fixed — **canon is conditional 60 lights-off / 40 lights-on**. `specialRules` include `hunt_early_in_dark`, `turns_off_lights`. Bulb-pop on toggle not implemented.

### 2. Identity-Critical Features Missing
- Conditional threshold: 60% if room lights off, 40% if room lights on.
- Light-on prevention: Mare must be unable to select "turn light on" interactions; only "turn off" actions in the interaction roll.
- Bulb-pop interaction: when Mare interacts with a light, with elevated probability the bulb breaks.

### 3. Systems Required
- Room-lighting query: `room.lightOff` boolean per relevant room.
- Threshold reader branches on `room.lightOff` for Mare.
- Interaction-roll filter that excludes "turn on" actions for Mare.
- Bulb sprite/state with pop-and-break animation.

### 4. Suggested Implementation Order
1. Add room-lighting state where it doesn't already exist.
2. Wire threshold reader: 60 / 40 based on lighting.
3. Filter Mare's interaction pool to exclude "turn on".
4. Add bulb-pop effect (low priority — flavour).

### 5. Danger of Fake Implementation
- Fixed 60% threshold makes Mare easier than canon with lights on (would correctly hunt at 40, but ours stops at 60), and harder than canon with lights off (would only hunt at 60, no advantage).
- Without light-on prevention, Mare behaves identically to other ghosts that toggle lights both ways.
- Without bulb-pop, the visual "breaks bulbs" tell vanishes.

### 6. Debug Hooks to Add
```
window.__debug.mare = {
  threshold: () => getHuntThreshold(ghost),
  canTurnLightOn: () => false,
  testBulbPop: () => __forceBulbInteraction(ghost),
  roomLit: () => !ghost.room.lightOff,
};
```

---

## Moroi

### 1. Current Haunted Status
Registry at [index.html:5282-5303](../index.html#L5282-L5303). Trio matches (Spirit Box / Ghost Writing / Freezing). `moroiSpeedTable` table has 10 tiers stepping from `0.9375` up to `1.40625` against `huntSpeedBase: 0.9375`. **Verify the resolved speeds match canon endpoints 1.5 m/s at 50% sanity to 3.71 m/s at 0% sanity** — current numbers look scaled to a different unit system. `specialRules` include `spirit_box_curse` and `speed_scales_with_low_sanity`.

### 2. Identity-Critical Features Missing
- Forced Spirit Box on every difficulty.
- Sanity curse hook: when a Spirit Box response is generated by Moroi, mark all players within audio range as cursed; cursed players take **double passive sanity drain** until cured by Sanity Medication.
- Reduced smudge blind during hunt: 3 s (or 7.5 s — sources split; pick one and label as **Unknown — verify**).
- Verify speed-curve numbers map to canonical 1.5 → 3.71 m/s.

### 3. Systems Required
- Forced-evidence list (cross-cutting).
- Per-player `cursed` flag + double-rate drain consumer.
- Sanity Medication usage hook clears `cursed`.
- Per-ghost smudge blind duration override (cross-cutting; reused with Spirit/Demon/Yurei/Gallu).

### 4. Suggested Implementation Order
1. Cross-cutting forced-evidence mechanism.
2. Verify and retune speed table to hit 1.5/3.71 endpoints.
3. Add `cursed` per-player flag + drain consumer + medication-cure path.
4. Add smudge blind override (3 s for Moroi; mark Unknown).

### 5. Danger of Fake Implementation
- Without curse, the Spirit Box test for Moroi is identical to a Spirit's — no signal.
- Wrong speed-curve endpoints make the low-sanity speed test give the wrong reading.
- Wrong forced-evidence handling lets Moroi fail Spirit Box on Insanity.

### 6. Debug Hooks to Add
```
window.__debug.moroi = {
  speed: () => __activeHuntSpeed(ghost),
  cursed: (playerId) => __isCursed(playerId),
  testCurse: (playerId) => __setCursed(playerId, true),
  clearCurse: (playerId) => __setCursed(playerId, false),
  smudgeBlindSeconds: () => ghost.behavior.smudgeBlindSeconds,
};
```

---

## Myling

### 1. Current Haunted Status
Registry at [index.html:5226-5233](../index.html#L5226-L5233). Trio matches (EMF / UV / Ghost Writing). `visibilityDuringHunt: "stealth"` and `specialRules` include `silent_hunt_footsteps` and `high_parabolic_activity`. **The canonical "12 m footstep audibility" clamp and "elevated paranormal sound rate" multipliers need explicit consumers.**

### 2. Identity-Critical Features Missing
- Footstep audio falloff override: clamp Myling footsteps to ~12 m vs default ~20 m.
- Elevated paranormal-sound rate: Myling rolls paranormal sound interactions at ~1.5–2× the default rate (mark exact multiplier as **Unknown — verify**).

### 3. Systems Required
- Per-ghost footstep audibility radius override field.
- Per-ghost paranormal-sound rate multiplier on the interaction roll.

### 4. Suggested Implementation Order
1. Footstep clamp (small, surgical).
2. Paranormal-sound rate multiplier (cross-cutting; also affects Oni).

### 5. Danger of Fake Implementation
- Without footstep clamp, Myling sounds identical to a default ghost during hunts.
- Without elevated parabolic rate, the central Myling identifier is missing — players have only the trio to go on.

### 6. Debug Hooks to Add
```
window.__debug.myling = {
  footstepRange: () => ghost.behavior.footstepAudibilityMeters,
  paranormalSoundRate: () => ghost.behavior.paranormalSoundRateMultiplier,
  testParabolicHits: (durationSec) => __simulateParabolicHits(ghost, durationSec),
};
```

---

## Obake

### 1. Current Haunted Status
Registry at [index.html:5262-5269](../index.html#L5262-L5269). Trio matches (EMF / Ghost Orb / UV). `specialRules` include `six_finger_prints`, `fast_print_decay`, `shapeshift_during_hunt`. **75% print rate and 1/6 abnormal-print frequency need explicit consumers.** `fast_print_decay` is correct in direction — verify decay timing.

### 2. Identity-Critical Features Missing
- Forced UV on every difficulty.
- Print probability override: when Obake interacts with a print-eligible surface, leave a print only 75% of the time.
- Abnormal print probability: of the prints that do appear, 1/6 are six-fingered handprints (sprite swap).
- Hunt-time model swap: 5–10% chance per second during a hunt to render an alternate (more grotesque) model frame.
- Salt-step propagation of 25% miss rate: **Unknown — verify** whether to apply.

### 3. Systems Required
- Forced-evidence list (cross-cutting).
- Per-ghost print probability and abnormal-print probability fields.
- Abnormal-print sprite asset.
- Alternate Obake model frame asset.
- Hunt-time model-swap roll.

### 4. Suggested Implementation Order
1. Cross-cutting forced-evidence mechanism.
2. Print-roll override: 75% / 25% miss + 1/6 abnormal swap.
3. Abnormal-print sprite (asset).
4. Alternate model frame (asset).
5. Hunt-time model swap roll (small consumer).

### 5. Danger of Fake Implementation
- Without abnormal prints, the most distinctive Obake tell is gone; UV alone is shared with multiple ghosts.
- Without print-rate gating, Obake leaves a normal print every interaction — the "no print" / "abnormal print" disambiguation collapses.
- Without forced UV, Obake on Insanity may show only EMF + Orb, defeating ID.

### 6. Debug Hooks to Add
```
window.__debug.obake = {
  printRate: () => ghost.behavior.printProbability,
  abnormalRate: () => ghost.behavior.abnormalPrintProbability,
  testInteractionPrint: () => __obakePrintRoll(ghost),
  testHuntModelSwap: () => __obakeForceModelSwap(ghost),
};
```

---

## Obambo

### 1. Current Haunted Status
Registry at [index.html:5348-5355](../index.html#L5348-L5355). **Diverges from canonical Phasmo.** Current evidence: Ghost Orb / Ghost Writing / Spirit Box. Canonical: Spirit Box / Ghost Orb / DOTS (verify against current wiki). Mechanic: `mirror_manifestation`, `calmed_by_covered_mirrors`, `speed_obambo_state`. Speeds `obamboCalmSpeed: 0.903125`, `obamboAggressiveSpeed: 1.221875`. Canon: 1.45 / 1.96 m/s; thresholds 10 / 65; cycle is **time-driven**, not mirror-driven.

### 2. Identity-Critical Features Missing (assuming Option A)
- Evidence trio swap: Ghost Writing → DOTS.
- Time-driven calm/aggressive cycle: starts 60 s after first front-door open, flips every 120 s.
- Per-phase thresholds 10/65 (current is fixed).
- Per-phase speeds 1.45/1.96 (verify the current scaled numbers map to canon).
- Removal of mirror mechanic (or keep as flavour layer if Option C).

### 3. Systems Required
- Phase timer field with start trigger (first front-door open).
- Per-phase threshold and speed lookups.
- Front-door-open hook.

### 4. Suggested Implementation Order
1. Decide Option A/B/C with user. **Block until decided.**
2. If A: rewrite registry — evidence and bespoke flags.
3. Add phase timer + front-door hook.
4. Wire threshold and speed off the phase.

### 5. Danger of Fake Implementation
- Mirror mechanic isn't in canon at all; players who Phasmo-test by mirror-covering will not see expected behaviour vs the current registry.
- Without phase timer, the central wave-pattern identifier (sensors clustering every 2 minutes) is missing.
- Without 10/65 thresholds, the high-sanity hunt test gives the wrong reading.

### 6. Debug Hooks to Add
```
window.__debug.obambo = {
  phase: () => ghost.phase,
  phaseElapsed: () => ghost.phaseElapsedSeconds,
  forcePhase: (p) => { ghost.phase = p; ghost.phaseElapsedSeconds = 0; },
  threshold: () => getHuntThreshold(ghost),
  speed: () => __activeHuntSpeed(ghost),
};
```

---

## Oni

### 1. Current Haunted Status
Registry at [index.html:5179-5186](../index.html#L5179-L5186). Trio matches (EMF / DOTS / Freezing). `activityRate: 1.5` and `throwTendency: 0.7`. `specialRules` include `no_mist_form`, `more_active_near_players`. Threshold defaults to 50% (correct per current canon).

### 2. Identity-Critical Features Missing
- Elevated ghost-event manifestation duration (~+50–100% vs default; mark **Unknown — verify** for exact multiplier).
- Stronger throw force / distance for thrown objects.
- Verify activity rate consumer is actually scaling interaction roll output (not just stored).

### 3. Systems Required
- Per-ghost manifestation-duration multiplier.
- Per-ghost throw-force multiplier.

### 4. Suggested Implementation Order
1. Verify `activityRate` is consumed in interaction-roll output.
2. Add manifestation-duration multiplier.
3. Add throw-force multiplier.

### 5. Danger of Fake Implementation
- Without elevated manifestation, the "long manifestation" tell vanishes.
- Without elevated throw force, Oni feels identical to a slightly-active default ghost.

### 6. Debug Hooks to Add
```
window.__debug.oni = {
  interactionRate: () => ghost.behavior.activityRate,
  manifestDuration: () => ghost.behavior.manifestationDurationMs,
  testThrowForce: () => __simulateOniThrow(ghost),
};
```

---

## Onryo

### 1. Current Haunted Status
Registry at [index.html:5235-5242](../index.html#L5235-L5242). Trio matches (Spirit Box / Freezing / Ghost Orb). `huntThreshold: 60` correct. `specialRules` include `flame_blocks_hunt` and `hunt_on_flame_extinguish`. **Flame-blow counter (3 → forced hunt) needs explicit state.**

### 2. Identity-Critical Features Missing
- Per-contract `flamesBlown` integer counter.
- Forced hunt at counter == 3 (regardless of sanity).
- Per-flame hunt-block radius: 3 m for placed candles, 4 m for held lighter, stacks separately from crucifix.
- Counter persistence across hunts (do not reset; **Unknown — verify**).

### 3. Systems Required
- Flame entity with `lit` boolean and per-flame radius.
- Counter increment on Onryo-driven extinguish.
- Flame-proximity hunt-block check in the hunt-roll loop.
- Forced-hunt trigger when counter hits 3.

### 4. Suggested Implementation Order
1. Add flame entity model (lit, radius, source: candle/candelabra/lighter).
2. Implement flame proximity hunt-block.
3. Add Onryo flame-blow counter.
4. Wire forced-hunt at counter==3.

### 5. Danger of Fake Implementation
- Without counter, the Onryo's signature 3-flame puzzle is missing.
- Without flame proximity blocking individual hunts, candles do nothing — the only available defence vanishes.

### 6. Debug Hooks to Add
```
window.__debug.onryo = {
  flamesBlown: () => ghost.flamesBlown,
  testForcedHunt: () => { ghost.flamesBlown = 3; __triggerOnryoForcedHunt(ghost); },
  flameBlockActive: (playerId) => __playerInFlameRange(playerId),
};
```

---

## Phantom

### 1. Current Haunted Status
Registry at [index.html:5098-5105](../index.html#L5098-L5105). Trio matches (Spirit Box / DOTS / UV). `visibilityDuringHunt: "blink"` already gestures at the hunt invisible-flicker. `specialRules` include `disappears_on_photo` and `fast_sanity_drain_los`. **Photo-vanish hook needs to actually fire on flash; sanity-drain-on-LOS rate needs explicit number; reduced Spirit Box rate (~50%) is missing.**

### 2. Identity-Critical Features Missing
- Photo-flash hook: when the photo camera fires and Phantom is mid-manifest, end the manifest immediately and teleport ghost to favourite-room anchor.
- Sustained LOS-on-manifest sanity drain: while a player has unobstructed LOS on a manifested Phantom, apply additional drain (~+0.4 %/s; mark **Unknown — verify**).
- Reduced Spirit Box response rate: halve Phantom's response probability vs default.
- Hunt-time invisible flicker: every ~1.5 s render ghost as transparent for ~0.5 s (mark **Unknown — verify** for exact cadence).

### 3. Systems Required
- Photo-flash event with mid-manifest detection.
- Per-frame "player has LOS on manifest" check; conditional drain.
- Per-ghost Spirit Box response weight.
- Hunt-time render alpha modulation.

### 4. Suggested Implementation Order
1. Photo-flash → end-manifest hook (high-impact, surgical).
2. Spirit Box weight halving (one-line change in response roll).
3. LOS-on-manifest drain.
4. Hunt invisible flicker render.

### 5. Danger of Fake Implementation
- Without photo-vanish, Phantom is indistinguishable from any other Spirit-Box+DOTS+UV ghost on photo evidence.
- Without LOS drain, the "looking at it kills sanity" identifier vanishes.
- Without halved Spirit Box rate, players reading "a lot of Spirit Box hits" rule out Phantom incorrectly.

### 6. Debug Hooks to Add
```
window.__debug.phantom = {
  testPhotoVanish: () => __simulatePhotoMidManifest(ghost),
  testHuntFlicker: () => __forcePhantomFlicker(ghost),
  spiritBoxResponseRate: () => ghost.behavior.spiritBoxResponseMultiplier,
  testLosDrain: (ms) => __simulateLosDrain(ghost, ms),
};
```

---

## Poltergeist

### 1. Current Haunted Status
Registry at [index.html:5107-5114](../index.html#L5107-L5114). Trio matches (Spirit Box / Ghost Writing / UV). `throwTendency: 1.0`, `activityRate: 1.3`. `specialRules` include `mass_throw_sanity_drain` and `stronger_in_crowded_rooms`. **Multi-throw single-event mechanism needs explicit per-event implementation.**

### 2. Identity-Critical Features Missing
- Multi-throw event: when interaction roll passes for Poltergeist, select N (2–6) throwable objects in the room and throw them all simultaneously.
- Per-throw sanity penalty: each thrown object passing within 7.5 m of a player deducts ~2% sanity (mark **Unknown — verify** for exact rate).
- Empty-room suppression: if the favourite room has zero throwable objects, signature behaviour is suppressed (still rolls regular interactions, but no multi-throw).

### 3. Systems Required
- Throwable-object inventory per room.
- Multi-throw selector and physics nudge.
- Per-throw proximity drain consumer.

### 4. Suggested Implementation Order
1. Throwable-object inventory.
2. Multi-throw event.
3. Per-throw proximity drain.

### 5. Danger of Fake Implementation
- Without multi-throw, Poltergeist plays like a slightly-active default ghost — the visual signature ("rooms full of flying objects") is missing.
- Without per-throw drain, the sanity-drop tell vanishes.

### 6. Debug Hooks to Add
```
window.__debug.polter = {
  testMultiThrow: (n) => __forceMultiThrow(ghost, n),
  lastThrowCount: () => ghost.lastThrowCount,
};
```

---

## Raiju

### 1. Current Haunted Status
Registry at [index.html:5253-5260](../index.html#L5253-L5260). Trio matches (EMF / DOTS / Ghost Orb). `huntSpeedLOS: 1.2` and `electronicsAttraction: 1.0`. `specialRules` include `speed_near_electronics` and `disrupts_electronics`. **Active-electronics detection and threshold modulation are not yet implemented.**

### 2. Identity-Critical Features Missing
- Active-electronics detection helper: returns true if any active device is within ~6–8 m of the Raiju.
- Conditional threshold: 65% near electronics, 50% otherwise.
- Conditional speed: 2.5 m/s near electronics, 1.7 m/s otherwise. LOS-accel applies on top.
- Long-range flashlight flicker (~15 m vs default ~10 m).

### 3. Systems Required
- Active-device tracker: flashlights, EMF readers, video cameras, sensors, parabolic mics, head gear.
- Distance query helper between Raiju and nearest active device.
- Threshold and speed branches keyed off the helper.
- Per-ghost flashlight-flicker range override.

### 4. Suggested Implementation Order
1. Active-device tracker.
2. Threshold + speed branches.
3. Flashlight-flicker range override.

### 5. Danger of Fake Implementation
- Without active-electronics gating, Raiju plays as a default ghost — the central "drop your gear" counter has no effect.
- Without long-range flicker, flashlight behaviour is identical to other ghosts.

### 6. Debug Hooks to Add
```
window.__debug.raiju = {
  electronicsNearby: () => __raijuElectronicsCheck(ghost),
  threshold: () => getHuntThreshold(ghost),
  speed: () => __activeHuntSpeed(ghost),
  flashlightFlickerRange: () => ghost.behavior.flashlightFlickerRangeMeters,
};
```

---

## Revenant

### 1. Current Haunted Status
Registry at [index.html:5143-5150](../index.html#L5143-L5150). Trio matches (Ghost Writing / Freezing / Ghost Orb). Speeds `huntSpeedBase: 0.625`, `huntSpeedLOS: 1.875` — **verify these resolve to 1.0 / 3.0 m/s after the unit-system multiplier**. `specialRules` includes `speed_jumps_on_los`. **The "no LOS-accel applies" exception must be explicit.**

### 2. Identity-Critical Features Missing
- Binary detection model: detected (LOS OR audible footsteps within 20 m OR talked-near-recently) → 3.0 m/s; undetected → 1.0 m/s.
- LOS-accel must **not** apply on top.
- Snap transition (no ramp) on detection state change.

### 3. Systems Required
- Detection-state tracker per Revenant: re-evaluated every tick.
- Speed resolver explicitly skips LOS-accel for ghosts with `no_los_accel` flag.
- Audible-footstep detection (cross-cutting, also useful for general AI).

### 4. Suggested Implementation Order
1. Detection-state tracker.
2. `no_los_accel` flag (also used by Deogen).
3. Audible-footstep emitter on player movement.
4. Verify endpoint speeds.

### 5. Danger of Fake Implementation
- LOS-accel applied on top of 3.0 m/s would push Revenant to ~5 m/s — uncatchable.
- Without snap transition, the "hide and slow it down" puzzle takes seconds longer than expected, which can cost lives.
- Without audible-footstep detection, players who never break LOS but stay silent would still trigger detection — wrong behaviour.

### 6. Debug Hooks to Add
```
window.__debug.revenant = {
  detected: () => ghost.detected,
  speed: () => __activeHuntSpeed(ghost),
  testNoLOSAccel: () => __huntSpeedAfterNSeconds(ghost, 13) === 3.0,
};
```

---

## Shade

### 1. Current Haunted Status
Registry at [index.html:5152-5159](../index.html#L5152-L5159). Trio matches (EMF / Ghost Writing / Freezing). `huntThreshold: 35` correct. `activityRate: 0.6`, `roomLoyalty: 0.7`, `huntSpeedLOS: 0.95`. `specialRules` include `no_hunt_when_group` and `shy_activity`. **The `no_hunt_when_group` flag is the wrong direction** — canon: hunts proceed normally; only **events and interactions** are suppressed when a player is in the room.

### 2. Identity-Critical Features Missing
- Correct interaction/event suppression: suppress only events and interactions when any player is in the same room as the ghost; do **not** suppress hunts.
- Rename or repurpose `no_hunt_when_group` → `no_events_when_player_in_room`.

### 3. Systems Required
- Room-occupancy helper (cross-cutting, also Goryo).
- Interaction/event roll guard that branches on occupancy.

### 4. Suggested Implementation Order
1. Room-occupancy helper.
2. Replace `no_hunt_when_group` consumer with the corrected behaviour.

### 5. Danger of Fake Implementation
- Current `no_hunt_when_group` (if it actually suppresses hunts) makes Shade objectively safer than canon — players who Phasmo-test by staying in the room will not be hunted, which is wrong.
- Without correct suppression, Shade looks indistinguishable from a slightly-shy default ghost.

### 6. Debug Hooks to Add
```
window.__debug.shade = {
  threshold: () => getHuntThreshold(ghost),
  interactionsSuppressed: () => __anyPlayerInRoom(ghost.room),
  testStepOutResume: () => __simulateStepOut(ghost),
};
```

---

## Spirit

### 1. Current Haunted Status
Registry at [index.html:5079-5087](../index.html#L5079-L5087). Trio matches (EMF / Ghost Writing / Spirit Box). `behavior.incenseDuration: 180` and `specialRules: ["smudge_extended_pacify"]` — **this looks correct** for the 180 s smudge block. Verify the consumer at the smudge cooldown logic actually reads `incenseDuration` for next-hunt scheduling.

### 2. Identity-Critical Features Missing
- Verify `incenseDuration` is actually wired to next-hunt-block scheduling. If it's only used for "blind during hunt" duration, that's wrong — canon is for **outside-hunt** smudge to delay next hunt.
- All other Spirit behaviour is default; nothing else missing.

### 3. Systems Required
- Cross-cutting per-ghost smudge-block-duration override (already partial; generalise).

### 4. Suggested Implementation Order
1. Audit smudge-cooldown consumer; ensure `incenseDuration` resolves the next-hunt unblock at +180 s outside hunts (vs default 90 s).

### 5. Danger of Fake Implementation
- If `incenseDuration` is wired to in-hunt blind duration, then Spirit's smudge during hunts blinds the ghost for 3 minutes — overpowered relative to canon and defeats the puzzle.
- If neither path uses 180, players who Phasmo-test will think Spirit is "broken".

### 6. Debug Hooks to Add
```
window.__debug.spirit = {
  smudgeBlockDuration: () => ghost.behavior.incenseDuration,
  testSmudgeBlock: () => __simulateSmudgeOutsideHunt(ghost),
};
```

---

## Thaye

### 1. Current Haunted Status
Registry at [index.html:5314-5326](../index.html#L5314-L5326). Trio matches (Ghost Writing / DOTS / Ghost Orb). `huntThreshold: 75` — that's the **starting** threshold; canon decays to 15. `activityRate: 1.6`. `thayeSpeedTable` has 11 tiers stepping from 1.71875 down to 0.625; verify these resolve to canonical 2.75 → 1.0 m/s endpoints. `specialRules: ["ages_over_time", "age_reducses_speed_and_activity"]` (note: typo "reducses").

### 2. Identity-Critical Features Missing
- Per-tick aging timer with proximity gate: while at least one player is within ~6 m of Thaye, accumulate proximity time; on threshold (60–120 s, mark **Unknown — verify**), increment `age` (max 10).
- Threshold reader: `75 - age * 6` (15 at age 10).
- Speed reader: pull from `thayeSpeedTable` indexed by age.
- Verify endpoint speeds match canon 2.75 / 1.0 m/s.
- Activity-rate decay: `activityRate` should also fall as age rises (current is fixed at 1.6).

### 3. Systems Required
- `ghost.age` integer (0–10).
- `ghost.proximityTimer` accumulator.
- Proximity-gated tick: only accumulate while a player is within 6 m.
- Threshold-by-age reader.
- Activity-rate-by-age reader.
- Visual aging on manifest (asset).

### 4. Suggested Implementation Order
1. Verify `thayeSpeedTable` endpoints; retune if needed.
2. Add `age` and `proximityTimer` fields.
3. Wire threshold reader to `75 - age * 6`.
4. Wire speed reader off table by age.
5. Add per-age activity-rate decay.
6. Optional: visual aging on manifest model (asset work).

### 5. Danger of Fake Implementation
- Without aging timer, Thaye stays "young" forever → the highest threshold + highest speed for the entire contract → unfairly punishing.
- Without activity decay, the "ghost calms down" tell is missing.
- Without per-age speed reading, the timing test gives a constant value instead of a decay curve.

### 6. Debug Hooks to Add
```
window.__debug.thaye = {
  age: () => ghost.age,
  threshold: () => getHuntThreshold(ghost),
  speed: () => __activeHuntSpeed(ghost),
  forceAge: (n) => { ghost.age = n; },
  proximityTimer: () => ghost.proximityTimer,
};
```

---

## The Mimic

### 1. Current Haunted Status
Registry at [index.html:5271-5280](../index.html#L5271-L5280). Trio matches (Spirit Box / Freezing / UV). `mimicFakeOrb: true` and `specialRules` include `copy_random_ghost` and `false_ghost_orb`. **Behaviour-mirror layer needs explicit host delegation; fake-Ghost-Orb gating across difficulties needs to verify the orb appears even at 0-evidence.**

### 2. Identity-Critical Features Missing
- Host selection at contract start: pick a host ghost type at random (excluding Mimic and possibly Twins; mark exclusion list as **Unknown — verify**).
- Behaviour delegation: speed, threshold, per-mechanic hooks all route through the host's logic for the duration of the contract.
- Always-Ghost-Orb fake-fourth: orb appears regardless of evidence-count difficulty, on top of whatever else is shown.
- Host's forced evidences: **Unknown — verify** whether they propagate (e.g., does a Hantu-host Mimic also force Freezing?).

### 3. Systems Required
- Host picker at contract start.
- Behaviour-module dispatcher that reads host-specific logic.
- Fake-Ghost-Orb evidence injection that bypasses the standard count.

### 4. Suggested Implementation Order
1. Host picker.
2. Behaviour delegation (read host's speed/threshold/specialRules at runtime).
3. Verify fake-Ghost-Orb appears at 0-evidence custom.
4. Verify (and document) whether host forced evidences propagate.

### 5. Danger of Fake Implementation
- Without host delegation, the Mimic plays as a generic ghost with the Mimic trio — the "behaviour matches another ghost" puzzle is missing.
- Without fake-Ghost-Orb at 0-evidence, the Mimic's only reliable identifier disappears on Insanity.
- Wrong handling of host-forced evidences leads to mismatched ID — players see Hantu-trio behaviour but no Freezing.

### 6. Debug Hooks to Add
```
window.__debug.mimic = {
  host: () => ghost.host,
  testGhostOrbForced: (difficulty) => __evidenceListFor(ghost, difficulty).includes("Ghost Orb"),
  behaviourDelegate: () => ghost.host,
  setHost: (type) => { ghost.host = type; },
};
```

---

## The Twins

### 1. Current Haunted Status
Registry at [index.html:5244-5251](../index.html#L5244-L5251). Trio matches (EMF / Spirit Box / Freezing). Speeds `twinsSlowSpeed: 0.9375`, `twinsFastSpeed: 1.1875` — **verify these resolve to 1.5 / 1.9 m/s after the unit-system multiplier**. `specialRules` include `dual_presence`, `decoy_lure`, `speed_twins_variant`. **No multi-entity spawn — currently only one ghost entity exists.**

### 2. Identity-Critical Features Missing
- Two simultaneous ghost entities at separate `favouriteRoom` anchors.
- Alternating-interaction logic: each interaction roll alternates which Twin executes.
- Alternating-hunt logic: each hunt event picks a different Twin.
- Per-Twin LOS state and per-Twin speed (Main 1.5, Decoy 1.9).
- Per-Twin crucifix and smudge effects.

### 3. Systems Required
- Multi-entity ghost spawn pipeline.
- Per-Twin state (room, position, LOS, etc.).
- Alternation flag on interaction/hunt rolls.
- Per-Twin AOE checks for crucifix and smudge.

### 4. Suggested Implementation Order
1. Spawn two ghost entities for Twins; tag them `main` / `decoy`.
2. Alternation logic for interactions and hunts.
3. Per-Twin speed.
4. Per-Twin AOE for crucifix / smudge.
5. Verify endpoint speeds.

### 5. Danger of Fake Implementation
- Single-entity Twins is just a default ghost with an "EMF / SB / Freezing" trio — no two-room signal at all.
- Without alternation, the speed-pattern test (one slow hunt, one fast) gives a constant.
- Without per-Twin AOE, crucifix-blocks-one-Twin-but-not-the-other puzzle is missing.

### 6. Debug Hooks to Add
```
window.__debug.twins = {
  main: () => ghost.main.position,
  decoy: () => ghost.decoy.position,
  activeHunter: () => ghost.activeHunter,
  testAlternation: () => __forceTwinsAlternation(ghost),
};
```

---

## Wraith

### 1. Current Haunted Status
Registry at [index.html:5089-5096](../index.html#L5089-L5096). Trio matches (EMF / DOTS / Spirit Box). `roamTendency: 1.5`. `specialRules` include `no_footprints`, `teleport_to_player`, `salt_immune`. **`teleport_to_player` is not in canon** — Wraiths in current Phasmophobia do not teleport (older patches had this; current mechanic is salt-immunity only).

### 2. Identity-Critical Features Missing
- Confirm `salt_immune` consumer: when Wraith would step on a salt pile, suppress the UV-revealable footprint sprite generation.
- Optional salt-adjacent sanity drain (~+drain rate while player stands in salt with Wraith within 7.5 m). Mark **Unknown — verify** for direction and magnitude.
- Remove `teleport_to_player` (not in canon) or keep as flavour-flag with no consumer.

### 3. Systems Required
- Salt-step suppression hook on Wraith ghost type.
- Optional salt-adjacent drain consumer.

### 4. Suggested Implementation Order
1. Audit `salt_immune` consumer — ensure no print sprite is created.
2. Remove or document `teleport_to_player` rule (flavour or stub).
3. Optional: salt-adjacent drain.

### 5. Danger of Fake Implementation
- If `teleport_to_player` is actually wired, Wraith plays unfairly relative to canon (uncatchable).
- Without `salt_immune` audit, Wraith may leave salt prints — defeats the central identification.

### 6. Debug Hooks to Add
```
window.__debug.wraith = {
  testSaltPass: () => __wraithSaltCross(ghost),
  saltSanityDrain: () => ghost.behavior.saltSanityDrainRate,
};
```

---

## Yokai

### 1. Current Haunted Status
Registry at [index.html:5188-5195](../index.html#L5188-L5195). Trio matches (Spirit Box / DOTS / Ghost Orb). `huntThreshold: 80` correct (high tier). `specialRules` include `hunt_on_voice`, `short_range_hearing_during_hunt`. **For single-player Haunted, voice-detection needs a fake-input simulation** (mock voice button or NPC line trigger).

### 2. Identity-Critical Features Missing
- Voice-detection radius helper: `voiceDetectedWithin(ghost, 2)` returns true if any "talking" event happened recently within 2 m.
- Conditional threshold reader: 80% if voice-detected within 2 m, 50% otherwise.
- Reduced hunt-LOS radius: ~5 m (vs default ~15 m). Mark **Unknown — verify** for exact value.
- Single-player fake-input: a "talk" button or scripted NPC line that triggers `voiceRecentlyEmittedAt(position, time)`.

### 3. Systems Required
- Voice emission hook (single-player: bind to a key or to specific NPC dialogue).
- Per-ghost hunt-LOS radius override.
- Threshold reader branches on voice-emission proximity.

### 4. Suggested Implementation Order
1. Voice emission hook with single-player fake-input fallback.
2. Threshold branch (80 / 50).
3. Hunt-LOS radius override.

### 5. Danger of Fake Implementation
- Without voice-detection, Yokai plays at 50% threshold permanently — the "shut up" puzzle is missing.
- Without reduced hunt-LOS, Yokai feels like a default-hunt ghost during hunts.

### 6. Debug Hooks to Add
```
window.__debug.yokai = {
  threshold: () => getHuntThreshold(ghost),
  voiceDetected: () => __voiceWithin(ghost, 2),
  huntLosRadius: () => ghost.behavior.huntLosMeters,
  testCrouchHide: () => __simulateCrouchSilent(ghost),
  emitVoice: () => __emitVoiceEvent(playerPos),
};
```

---

## Yurei

### 1. Current Haunted Status
Registry at [index.html:5170-5177](../index.html#L5170-L5177). Trio matches (DOTS / Freezing / Ghost Orb). `roomLoyalty: 0.9`, `doorInteraction: 0.9`. `specialRules` include `smudge_room_trap` and `autonomously_closes_doors`. **`smudge_room_trap` is the right idea** — needs verification that the consumer actually confines the ghost to favourite room for 90 s.

### 2. Identity-Critical Features Missing
- Verify `smudge_room_trap` consumer: when smudged in favourite room, set `confineUntil = now + 90 s` and prevent pathfinding outside the room.
- Event-LOS extra sanity drain: when a player has LOS on a Yurei ghost event within 7.5 m, deduct ~+15% sanity (mark **Unknown — verify** for exact value).

### 3. Systems Required
- Per-ghost confinement state with timer.
- Pathfinding override that respects confinement.
- Per-event LOS sanity-drain consumer.

### 4. Suggested Implementation Order
1. Audit `smudge_room_trap` consumer.
2. Add per-event LOS extra-drain consumer.

### 5. Danger of Fake Implementation
- If `smudge_room_trap` actually blocks the next hunt for 90 s (instead of confining the ghost), Yurei behaves as a default ghost with respect to smudge — the "smudge to clear adjacent rooms" puzzle is missing.
- Without event-LOS extra drain, Yurei feels like a default ghost; the "look away during events" tell vanishes.

### 6. Debug Hooks to Add
```
window.__debug.yurei = {
  eventSanityDrain: () => ghost.behavior.eventLosDrainPercent,
  confined: () => ghost.confineUntil > now(),
  testSmudgeConfine: () => __simulateYureiSmudge(ghost),
};
```

---

# Part III — Build Order, Scaffolding, Validation

## III.1 Tiered build order

Ghosts share systems. Build the systems once and several ghosts unlock at the same time. The four-tier order below minimises total work by stacking dependencies.

### Tier 1 — Cross-cutting foundations (do first)

These unlock the largest number of downstream ghosts and require no ghost-specific work to land:

1. **Forced-evidence list mechanism** — unlocks Deogen, Goryo, Hantu, Moroi, Obake, The Mimic.
2. **Per-ghost smudge-block-duration override** — unlocks Spirit (180 s), Demon (60 s), Moroi blind, Yurei (favourite-room confine).
3. **Per-ghost crucifix radius override (T1/T2)** — unlocks Demon (5/6) and Banshee (always-blocks-target).
4. **Per-ghost hunt-cooldown override** — unlocks Demon (20 s).
5. **Active-electronics tracker** — unlocks Raiju (threshold + speed) and Jinn (LOS+dist+breaker).
6. **Breaker-state hook** — unlocks Hantu, Jinn.
7. **Voice-emission hook (with single-player fake-input)** — unlocks Yokai, Demon Ouija interaction.
8. **Room-occupancy helper** — unlocks Goryo (DOTS suppression) and Shade (event suppression).
9. **`no_los_accel` flag in speed resolver** — unlocks Deogen, Revenant.
10. **Audible-footstep emitter on player movement** — unlocks Revenant detection model and tightens Yokai/Myling auditory tells.

### Tier 2 — Per-ghost mechanics that don't require new systems

After Tier 1 is in place, these ghosts can be wired up purely by reading the existing helpers and adding one or two consumers:

1. **Spirit** — verify `incenseDuration` consumer reads as outside-hunt smudge block.
2. **Demon** — wire 20 s cooldown, 60 s smudge block, 5/6 crucifix; rename `ouija_safe` → `ouija_provokes_hunt`.
3. **Banshee** — target-player picker, target-sanity threshold reader, crucifix-target check, parabolic 1/3 screech roll.
4. **Mare** — room-lighting query + 60/40 threshold branch + interaction-roll filter (no "turn on" actions).
5. **Shade** — event/interaction suppression keyed off room-occupancy helper. Rename `no_hunt_when_group` → `no_events_when_player_in_room`.
6. **Wraith** — audit `salt_immune` consumer; remove `teleport_to_player` flag.
7. **Yurei** — audit `smudge_room_trap` consumer; add event-LOS extra drain.
8. **Hantu** — wire breaker-on slow-down (1.4 m/s flat) using breaker hook.
9. **Jinn** — three-condition speed gate using active-electronics + breaker hook + LOS tracking; sanity-drain ability.
10. **Raiju** — threshold + speed branches using active-electronics tracker; flashlight-flicker range override.
11. **Yokai** — threshold branch using voice-emission hook; reduced hunt-LOS radius.

### Tier 3 — Per-ghost mechanics that require new ghost-specific state

These ghosts each need a new field or new state machine but no large cross-cutting system:

1. **Onryo** — `flamesBlown` counter; flame-radius hunt-block; forced-hunt at 3.
2. **Thaye** — `age` and `proximityTimer`; threshold-by-age, speed-by-age, activity-by-age.
3. **Obambo** (Option A) — `phase` timer (calm/aggressive); first-front-door-open hook; per-phase threshold/speed.
4. **Gallu** (Option A) — `state` machine (calm/provoked/enraged); transition hooks for crucifix-placed and smudge-used; per-state threshold/speed/blind.
5. **Dayan** (Option A) — `nearbyMovementTier` helper; tri-tier threshold/speed.
6. **Phantom** — photo-flash → end-manifest hook; LOS-on-manifest drain; halved Spirit Box weight; hunt-time invisible flicker.
7. **Moroi** — sanity-curse hook tied to Spirit Box response; medication cure; speed table verification.
8. **Obake** — print probability override (75% / 1/6 abnormal); abnormal-print sprite; alternate model frame.
9. **Myling** — footstep audibility clamp; elevated paranormal-sound rate.
10. **Oni** — manifestation duration multiplier; throw force multiplier.
11. **Poltergeist** — throwable-object inventory per room; multi-throw event; per-throw drain.

### Tier 4 — Multi-entity / delegation work

These are the heaviest implementation tasks; do them last.

1. **The Twins** — multi-entity ghost spawn (two anchors, alternating control, per-Twin AOE).
2. **The Mimic** — host picker + behaviour-module dispatcher; fake-Ghost-Orb at every difficulty.
3. **Deogen** — distance-curve speed (uses `no_los_accel`); breathing audio.
4. **Revenant** — detection-state tracker (uses `no_los_accel` and audible-footstep emitter).

## III.2 Cross-cutting decisions to surface to user

Block on these before further work:

1. **Dayan / Gallu / Obambo canonical-vs-custom (Option A/B/C)** — see §I.3. Default plan is Option A. If user picks B or C, those three per-ghost plans need rewriting.
2. **Forced-evidence on Mimic-host** — does host's forced evidence (e.g. Hantu-host's Freezing) propagate to the Mimic? Currently **Unknown**. Decide and document.
3. **Onryo flame counter persistence** — does the counter reset on hunt end, contract end, or never? Currently **Unknown**.
4. **Moroi smudge blind during hunt** — 3 s vs 7.5 s? Sources split. Pick one.
5. **Thaye age-up timer** — pick a default in the 60–120 s range.
6. **Obake salt-step miss propagation** — do salt steps inherit the 25% miss rate?
7. **Voice-emission single-player fake-input** — UI design for the "talk" trigger. Hotkey? NPC line? Unscripted ambient line?

## III.3 Validation strategy

Each ghost's identity-critical mechanic must be testable via:

1. **A Playwright smoke test** in `tests/` that boots the static server, picks a ghost via URL flag (`?ghost=<name>&seed=<n>`), exercises the mechanic via `window.__debug.<ghost>.*`, and asserts the expected output. The existing harness at [tests/run-smoke.js](../tests/run-smoke.js) and [tests/debug-postcontract.test.js](../tests/debug-postcontract.test.js) is the reference pattern.
2. **A journal-visible behaviour entry** so a human player can verify by reading the in-game journal that the mechanic fired. (E.g., "Banshee screech captured" entry distinct from a generic parabolic hit.)
3. **A Confidence/Source notes line in the master spec** flagging any **Unknown — requires current Phasmophobia Wiki verification** value as needing live-wiki verification before final tuning.

## III.4 File-by-file action plan

Within [index.html](../index.html):

- [index.html:355](../index.html#L355) — Default `behavior` numbers: add `huntCooldownSeconds`, `smudgeBlockSeconds`, `crucifixTier1`, `crucifixTier2`, `printProbability`, `abnormalPrintProbability`, `paranormalSoundRateMultiplier`, `footstepAudibilityMeters`, `flashlightFlickerRangeMeters`, `huntLosMeters`, `manifestationDurationMs` defaults.
- [index.html:5078-5356](../index.html#L5078-L5356) — `GHOST_REGISTRY`: per-ghost overrides per the per-ghost plans above. Special attention to Dayan, Gallu, Obambo (canonical realignment if Option A).
- [index.html:5734-8800](../index.html#L5734-L8800) — `specialRules` consumers: refactor scattered handlers to a centralised dispatcher keyed on rule name; add new rules per the per-ghost sections.
- [index.html:5857](../index.html#L5857) — `getHuntThreshold()`: branch on conditional rules (Banshee target sanity, Mare lights, Yokai voice, Raiju electronics, Dayan movement tier, Gallu state, Obambo phase, Thaye age, Onryo forced).
- [index.html:7440-7570](../index.html#L7440-L7570) — Hunt-speed branches: route through a single resolver that respects `no_los_accel`, conditional curves (Hantu, Moroi, Thaye, Deogen, Revenant), and ghost-specific tier tables.

New files (only if necessary):

- `tests/ghost-mechanics.test.js` — one combined Playwright test per ghost that exercises the unique mechanic via debug hooks.

## III.5 Memory of unknowns (link to master spec gap list)

The master spec's `P4.2 Known gaps` list is the single source for verification work. Before final balance pass, walk that list and either confirm against the live Phasmophobia Wiki or pick conservative defaults, with comments tagging each as "verified <date>" or "estimated, see master spec gap N".

---

*End of document.*
