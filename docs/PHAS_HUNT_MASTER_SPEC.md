# PHAS_HUNT_MASTER_SPEC.md

> **Scope.** This is a HUNT-only specification of current Phasmophobia (post-Winter's-Jest, v0.15.x, sourced April 2026). Anything not directly related to a ghost _hunting_ — evidence acquisition, journal mechanics, contract objectives, cursed possessions, photo-capture details, voice commands, equipment unrelated to surviving a hunt — is intentionally **out of scope** here. For the broader 20-section per-ghost reference, see `PHAS_GHOST_MASTER_SPEC.md`.
>
> **Purpose.** Frozen reference for what the Haunted (this project) ghost-hunt logic must mirror. Companion document `HAUNTED_HUNT_IMPLEMENTATION_PLAN.md` translates each line here into Haunted-specific code work.
>
> **Source policy.** Direct WebFetch of `phasmophobia.fandom.com` returns HTTP 403 from this environment, so primary numbers were aggregated from current community sources cross-referenced against multiple independent guides (March–April 2026): Pro Game Guides ghost-speed chart, Steam community guide #3464855117 (2025 Ghost ID & Mechanics), Steam guide #3645681334 (2026 quick-guide), Steam guide #3650323222 (Ultimate Evidence 2026), Pro Game Guides per-ghost pages, Dot Esports per-ghost pages, ScreenRant, GameRant, KeenGamer, ScreenHype, Dualshockers, Destructoid, Game-Rezone, ExitLag, ReportAFK, FindingDulcinea, BrbPlay, Phasmophobia Assistant (phasmo.co.uk), Pro Game Guides hunt sanity threshold cheat sheet, dontfightducks TikTok corpus (used as a data-cross-check, not a primary source). Where two reputable sources disagreed within rounding tolerance (e.g. 1.5 vs 1.53 m/s for the Twins' slow speed), the value most consistent with the wiki-derived majority was used. **Items where current data was inconclusive are flagged `⚠ confidence: low — verify against current Wiki`** — those are the things to fix first when Wiki access is restored.
>
> **Snapshot date.** April 2026. Roster size: 27 ghosts after the Dec 16 2025 Winter's Jest update added Dayan, Obambo, and Gallu.

---

# PART 1 — GLOBAL HUNT RULES

The nine subsections below describe what is true _for every ghost type_ unless that ghost's identity row in Part 2 explicitly overrides it.

## 1.1  Hunt Start Conditions

**Sanity-roll model.**
* Every "ghost-idle exit" event, the ghost rolls for a hunt attempt.
* If the **average** team sanity is at or below the ghost's `huntThreshold`, the roll succeeds at **10 %**.
* If the average team sanity is at or below `huntThreshold − 25` percentage points, the roll succeeds at **1 / 6** (~16.67 %).
* The ghost cannot hunt while the contract is still in **setup phase**, regardless of sanity.
* The ghost cannot hunt while a **smudge cleansing window** is active on it.
* The ghost cannot hunt if the **hunt cooldown** since the last hunt has not expired.
* At least one living player must be inside the contract's investigation area (truck/van does not count).

**Default thresholds.**
* `huntThreshold` default: **50 % avg team sanity** for most ghosts.
* Per-ghost overrides — see Part 2.

**Default cooldown.**
* `huntCooldown` default: **25 s** between hunt attempts (start-to-start, gated until cooldown elapses).
* Demon override: **20 s**.

**Idle-exit gate.** The ghost has internal idle/roam/event states. The hunt roll only fires immediately after exiting an idle period — not continuously, not while already roaming, not while performing a ghost event.

**Cursed-possession bypasses.** Any cursed possession that the design lets fire a forced hunt (Voodoo Doll heart-pin, Music Box completion, Tarot 10-of-Swords, Summoning Circle, Ouija "die" question, Monkey Paw "I want to die") **skips** the sanity-roll path entirely and starts a hunt that is gated only by setup-phase. These hunts respect normal smudge/crucifix blocks at hunt-start time.

**Thaye special-case roll.** Thaye replaces the 10 % / 1-in-6 roll with a flat **1 / 8** chance regardless of how far the team's sanity is below threshold (i.e. Thaye does not get more aggressive at very low sanity, only via aging).

## 1.2  Hunt Start Presentation

When a sanity-roll succeeds (or a forced-hunt path fires), the following happens **simultaneously**:

* The ghost **manifests** at its current world position (no pre-warp). Forced hunts inherit whatever spawn the cursed possession dictates.
* An **EMF Level 4** pulse is emitted at the ghost's location. (This is not the EMF-5 evidence pulse; it's a hunt-start cue.)
* All **exit doors** on the contract are forcibly closed and locked for the entire hunt's duration. Locked doors slam audibly.
* All **map lights and active electronic equipment** within **10 m** of the ghost (15 m for Raiju) on the same floor begin flickering rapidly.
* **Light switches** become non-interactable; any lights that were on are forced to flicker, and at hunt end any lights still under hunt-flicker are toggled off.
* **Global voice chat / radio chat** within the malfunction radius gets static / cuts out.
* The **grace period** begins (see §1.9). The ghost is fully spawned and visible-flickering, but cannot kill until grace ends.
* The player's "hunt heartbeat" SFX layer enables: audible to a player whenever the ghost is within **10 m** with no walls/floors/doors blocking (15 m for Raiju). Loudness scales inversely with distance.
* Per-player **fear / breathing-acceleration** layer ramps in (cosmetic, not a kill driver).

A hunt is visually distinct from a **ghost event**: a ghost event also flickers some lights but does **not** lock doors, does **not** trigger heartbeat, does **not** start a grace timer, and ends when the manifestation animation finishes. Players inside a ghost event can still be drained but cannot be killed.

## 1.3  Hunt Target Acquisition

**Initial target.** When a hunt starts, the ghost picks a target by the following priority:
1. **Banshee:** the pre-rolled "banshee target" player — chosen at contract start, ignored entirely if dead/disconnected, in which case a new banshee target is rolled.
2. **Deogen:** the **nearest** living player by straight-line distance, regardless of LOS. Deogen always knows where every player is.
3. **All other ghosts:** the closest living player who satisfies the standard ray-trace LOS check (see §1.4) at hunt-start. If no player is in LOS at hunt-start, the ghost picks a **last-known-position** point of any living player and walks toward it; once LOS is acquired the ghost begins the chase.

**Target retention.**
* Banshee never re-targets while target is alive.
* Deogen rechecks the nearest player every **5–10 s** during the hunt and re-targets accordingly.
* Other ghosts hold their current target until LOS is broken AND a different player enters LOS, or until the current target is dead. They will not switch off a player just because that player is now further away.

**Hunt-from-roam vs. hunt-from-room.** The ghost begins the hunt at whatever position it occupies at the moment of the roll — this means a ghost roaming the kitchen can begin a hunt from the kitchen, not from its favorite room. Twins are an explicit exception (see Part 2).

## 1.4  Line-of-Sight Rules

Phasmophobia uses a **single ray-trace** model on a per-tick basis to determine whether a ghost has LOS on a player.

**While chasing.** One ray from the ghost's `raycastPoint` (head height, near the model's eyes) directly to the **player's head bone**. If the ray is unobstructed → LOS true.

**While not chasing.** Two rays:
* Ray A: ghost `raycastPoint` → player head.
* Ray B (only if Ray A failed): ghost `raycastPoint` → player head **+0.167 m offset to the ghost's right**. (Used so the ghost can re-acquire targets peeking around corners.)
* If both rays fail → the ghost continues to its last-known target position and resumes the not-chasing behavior on arrival.

**LOS blockers.**
* Solid walls and floors.
* Closed doors. (Opened doors do **not** block.)
* Furniture above player head height (counters, beds, tables block crouched players whose head clips below the obstacle).
* Hiding-spot interiors (locker, closet, wardrobe, certain cabinets, gym lockers, certain beds and sheets) — **only** while the player's head model does not protrude.
* Smudge-incense smoke (effectively blinds the ghost for 5 s standard / 7 s Moroi, see §1.7).

**LOS non-blockers.**
* Open doors.
* Glass / windows.
* Salt piles / footprints.
* Salt lines (block nothing).
* Other players' models (do not block ray to head; do not give "shielding").
* DOTS particles, projector beams, smudge wand (unlit), candles (unlit), all journal/UI overlays.

**Player head as the sole hitbox.** Even crouched, even prone, even huddled into a corner — if the head bone is exposed, the ghost has LOS. Players' bodies and arms below head height do not register.

## 1.5  Hunt Movement (default)

**Base speed.** Most ghosts walk at **1.7 m/s** while a hunt is active.

**LOS acceleration.** Whenever the ghost has continuous LOS on its target:
* Speed multiplier increases at **+0.05 × base / s**.
* Capped at **1.65 × base** (i.e. **2.805 m/s** for a 1.7-m/s ghost).
* Time to cap: **13 s** of uninterrupted LOS.

**LOS decay.** When LOS is lost:
* Multiplier decreases at **−0.01 × base / s**.
* Decay-to-base time: ~**65 s** (0.65 multiplier shed over 65 s at 0.01/s).
* Multiplier never falls below 1.0 × (i.e. ghost never goes below its base hunt speed during a hunt).

**Per-ghost speed exceptions** (override default entirely; see Part 2 for full numbers):
* **Hantu** — temperature-driven curve, no LOS acceleration.
* **Thaye** — age-driven decay, no LOS acceleration.
* **Deogen** — distance-driven (slow when close, fast when far), no LOS acceleration.
* **Revenant** — binary (1.0 m/s when not chasing, 3.0 m/s the instant any player is detected), no LOS acceleration.
* **Moroi** — base scales with sanity; LOS acceleration applies on top, capped at ~3.71 m/s.
* **Jinn** — fixed 2.5 m/s when (breaker ON) AND (LOS) AND (target distance ≥ 3 m); standard 1.7 + LOS-accel otherwise.
* **Raiju** — fixed 2.5 m/s while within map-size-dependent range of any active electronic; standard 1.7 + LOS-accel otherwise.
* **Twins** — main twin 1.5 m/s, decoy twin 1.9 m/s, picked 50/50 at each hunt-start (with a teleport in the fast case).
* **Dayan** — within 10 m of nearest player: 1.2 m/s if that player is still, 2.25 m/s if walking; outside 10 m: 1.7 + LOS-accel.
* **Obambo** — calm phase 1.445 m/s, aggressive phase 1.955 m/s; phase cycles independently of LOS.
* **Gallu** — normal 1.7, enraged 1.96, weakened 1.36; LOS-accel still applies on top of base.
* **Mimic** — inherits whatever the currently mimicked ghost would do.

## 1.6  Hiding Rules

**What counts as a hiding spot.**
* **Lockers** (school, gym, factory) — preferred; opens fast; can use the door to break LOS during a chase.
* **Closets / wardrobes** with hinged doors that fully close.
* **Free-standing cupboards** with doors marked as "hiding" by the map.
* **Specific beds** (a small subset, mostly twin/single beds where the player can crouch under and remain head-occluded).
* **Specific shower stalls** (with curtains).
* **Specific tents / lean-tos** on outdoor maps.
* Note: piles of clutter, behind-a-couch corners, "behind a door" — these are NOT designated hiding spots; the ghost's ray-trace will hit the player head normally.

**What the ghost does at a hiding spot.**
* The ghost does not magically know you are inside a closed locker. It must have an LOS ray hit through the open door, OR see you enter and arrive at the locker before LOS-decay takes the chase aggression off.
* If the ghost arrives at a closed locker/closet while it has LOS-aggression on you (e.g. it saw you enter), it will play the "locker open" animation, the door swings open, and the ray re-acquires you at point-blank range — almost always a kill.
* If the ghost has lost LOS (e.g. broken twice around corners) before you entered the spot, it will not stop at your hiding spot — it will continue to its last-known position and roam past.

**Always-knows-location ghosts.**
* **Deogen** — hiding is pointless against Deogen. The only survival option is to keep distance and loop. Hiding inside a locker against a Deogen is usually a death.

**Recommended technique (consensus across all current sources).** Break LOS at least **twice** on different obstacles before entering the hiding spot, ensuring the ghost cannot ray-trace your head through the entrance.

## 1.7  Electronics During Hunts

**Flashlight / torch.** Strobes erratically for any player within **10 m** of the ghost on the same floor (15 m for Raiju). The flashlight cannot be turned off cleanly; it will continue to pulse. UV light flickers identically.

**Video camera, head cam, photo camera.** Static / heavy interference within the same radius.

**EMF reader.** Reads at level 2–4 inside the radius. Does not produce evidence-grade EMF-5 from hunt activity alone.

**Spirit Box.** Continues to function but holding it active makes the player audible to the ghost at up to **7.5 m** (2.5 m for Yokai); a Spirit Box response during a hunt does not occur (responses gate on non-hunt phase).

**Sound recorder / parabolic mic.** Captures the hunt audio as a paranormal-sound event; otherwise neutral.

**Map lights.** Flicker rapidly within the 10 m / 15 m radius. Cannot be toggled by light switches during the hunt. Lights that were on prior to hunt remain on (with flicker); lights that were off cannot be turned on.

**Breaker / fuse box.** Cannot be toggled during a hunt. Hantu cannot turn ON the breaker at any time and is twice as likely to flip it OFF outside hunts.

**Smudge / incense.** Incense has two distinct hunt effects:
* **Smudging during a hunt:** the ghost is **blinded** (cannot ray-trace, cannot kill) for **5 s** standard / **7 s** for Moroi. Multiple incense uses stack with no diminishing returns (Moroi up to 28 s observed).
* **Smudging not in a hunt:** prevents the next `huntPreventDuration` seconds of hunt attempts. Standard **90 s**, Demon **60 s**, Spirit **180 s**, Yurei **90 s** AND Yurei is locked to its favorite room for the same 90 s. Cursed-possession-driven hunts ignore this prevention.

**Crucifix.** A lit crucifix within range of the ghost at the moment a hunt is rolled aborts that hunt before it can begin.
* Range tier I = **3 m**, tier II = **4 m**, tier III = **5 m**.
* Demon: **× 1.5** range (so 4.5 / 6 / 7.5 m).
* Banshee: **5 m fixed** baseline (functions as a tier-III crucifix at any tier — recent change; older guides treat this as a +2 m bonus, ⚠ confidence: medium — verify on current wiki).
* Gallu enraged: **−2 m** range.
* Gallu weakened: **+1 m** range.
* Tier I has 1 charge; Tier II–III have 2 charges; a charge is consumed each time it blocks a hunt.
* The block triggers only at hunt-start; an in-progress hunt is not interrupted by lighting a crucifix.

**Salt.**
* Salt piles produce UV-revealable footprints when the ghost steps in them — except the **Wraith** (never steps in salt) and **Mimic-while-mimicking-Wraith**.
* Tier III salt during a hunt does **not** stop a Wraith.
* Walking through salt outside a hunt slightly reduces the ghost's activity for ~30 s (slightly longer than a smudge stick).

**Candles, lighters, fireplaces, campfires (Onryo only).** Any lit flame within **4 m** of the Onryo at the moment of a hunt-roll blocks that hunt attempt and snuffs the flame. Counter resets per blowout — see §Onryo in Part 2.

## 1.8  Hunt Audio & Visibility

**Heartbeat.** Plays for any player within 10 m of the ghost on the same floor, with no LOS blockers between player head and ghost. Volume scales inversely with distance. **Raiju** extends this to 15 m.

**Footsteps.** Audible up to 20 m from any player on the same floor. **Myling** is reduced to 12 m (notably less than the 10-m electronic-flicker radius).

**Vocalizations / breath.** Up to 20 m from the ghost on the same floor. Specific ghosts add layered audio:
* **Banshee** — periodic wail on parabolic / sound recorder, 33 % chance of 1 of 20 unique screams in place of any normal paranormal sound.
* **Hantu** — visible cold-breath puff coming from the model's mouth whenever the breaker is OFF, regardless of room temp.
* **Deogen** — heavy bull-like breathing on Spirit Box at any range; 33 % chance for unique breathing response when the player is within 1 m and asks any question.
* **Myling** — emits a paranormal sound on parabolic / recorder every **64–127 s** (vs 80–127 s standard). Two paranormal sounds within 80 s on a parabolic confirms Myling.
* **Yurei** — sharply slams doors fully closed without the usual creak.

**Flicker / blink intervals (default).**
* Visible per cycle: 0.30 – 1.00 s
* Invisible per cycle: 0.00 – 0.70 s
* Total cycle: ≤ 1.0 s
* **Phantom**: visible 1.0 – 2.0 s per cycle (much longer visible periods — but the visible periods themselves are normal, the *total cycle time* is longer because the invisible portion is also longer; net effect: Phantom is invisible for longer between flickers, making it appear less often).
* **Oni**: blinks less often (more visible across the same cycle window) — appears almost continuously visible.
* **Phantom photo**: when photographed, instantly invisible for the rest of that flicker, then resumes flickering.

**Materialization model.**
* Some ghosts have a 2/3 chance to manifest in **full form** during a hunt; others manifest as **shadow** or **translucent** silhouettes.
* **Oni**: full-form preferred (~2/3); cannot use **mist form**.
* **Phantom**: standard manifest; lower visibility on average; cannot be in photo if a photo is taken (vanishes).
* **Obake**: shape-shifts into a different ghost-model of the same gender on specific flicker indices: **12, 27, 39, 54, 62, 80, 105, 120, 132**.

## 1.9  Hunt Ending

**Grace period.** Once a hunt starts, the ghost cannot kill for:
* Amateur: **5 s**
* Intermediate: **4 s**
* Professional: **3 s**
* Nightmare / Insanity / custom — match the difficulty's setting.

During grace, the ghost still ray-traces, still moves, still locks doors, still plays heartbeat / flicker. It just cannot deal lethal damage on contact. Grace ticks down even if a player is being chased and inside a hiding spot.

**Hunt duration.** The hunt's lifetime is set at hunt-start as a function of difficulty and map size:
* Amateur: **15 – 40 s**
* Intermediate: **20 – 50 s**
* Professional: **30 – 60 s**
* Larger maps push toward the upper end of the range.
* **Obambo** that started in aggressive state: duration × 0.8.

**Mid-hunt resets.** A hunt does **not** end early because the ghost loses LOS, smudges, retreats, or fails repeatedly to reach a player. Smudging the ghost during a hunt only blinds it temporarily; the timer keeps running.

**Hunt-end actions.**
* Doors unlock.
* Light switches re-enable. Lights that were toggled into the flicker state at hunt-start turn fully **off**.
* Heartbeat layer fades out.
* Ghost de-manifests (becomes invisible / non-corporeal).
* `huntCooldown` timer starts (25 s default, 20 s Demon).
* `huntPreventDuration` from any active smudge continues running independently.
* Cursed-possession activation count and any item-specific timers (Music Box, Voodoo Doll) are unaffected.

**Cursed hunts.** Cursed-possession hunts end identically — same duration band, same grace, same audio/visual presentation.

---

# PART 2 — EVERY GHOST'S HUNT IDENTITY

Eleven sub-sections per ghost. Section template:

1. **Standard hunt threshold** — the avg-team-sanity number on which a normal hunt-roll fires.
2. **Special hunt threshold changes** — anything that moves the threshold.
3. **Hunt speed model** — base, conditional formulas, max, LOS interaction.
4. **Hunt detection / tracking** — anything that changes target-pick, LOS, or sense radii.
5. **Hunt visibility / blink / audio clues** — what looks/sounds different from default.
6. **Hiding interaction** — what happens when a player enters a hiding spot during this ghost's hunt.
7. **Equipment interaction during hunts** — flashlight, smudge, crucifix, salt, item-specific modifiers.
8. **Practical identification tests** — what a player does to confirm this ghost via hunt-only behavior.
9. **Common misreads / misconceptions** — things players mis-assert about this ghost's hunt.
10. **Haunted implementation notes** — short, target-specific notes on what Haunted should compute differently.
11. **Debug needs** — debug hooks Haunted should expose so this ghost is testable.

Order is alphabetical for ease of cross-reference.

## 2.1  Banshee

1. **Standard hunt threshold.** Target-only sanity ≤ **50 %** (the Banshee compares its pre-rolled "target" player's sanity, **not** average team sanity).
2. **Special hunt threshold changes.** None beyond the target-only rule. If the team-average is 80 % but the targeted player is at 30 %, the Banshee can hunt.
3. **Hunt speed model.** Standard 1.7 m/s base, +0.05× LOS accel, 1.65× cap = 2.805 m/s. No conditional speed.
4. **Hunt detection / tracking.** Locked onto its single target. Will pursue the target across the map. Other players in LOS while the target is also visible are **not** killed in preference; the Banshee will preferentially path toward the target. Ignores closer non-target players in target acquisition.
5. **Hunt visibility / blink / audio clues.** Standard flicker. **Wails** at random while roaming and during hunts. Parabolic / sound recorder: 33 % chance per paranormal-sound roll to play 1 of ~20 unique scream samples instead of a generic sound.
6. **Hiding interaction.** Standard — target hiding inside a locker still works if the Banshee never had LOS-aggression on the target before the locker closed. Other players don't need to hide as urgently (they cannot be killed unless they are the target).
7. **Equipment interaction during hunts.** Crucifix radius **5 m** (acts at tier-III range regardless of crucifix tier — recent change; older guides treated this as a flat +2 m bonus over each tier — ⚠ confidence: medium). Standard smudge 90 s.
8. **Practical identification tests.** Parabolic mic in the ghost room; if a scream is captured, Banshee is highly likely. Multiplayer-only behavior test: lure the highest-sanity player to the ghost; if the Banshee declines to hunt despite avg-team < 50 %, the lowest-sanity player is the target — confirms Banshee. Also a hunting Banshee should never attack non-target teammates standing between it and the target.
9. **Common misreads / misconceptions.** "Banshee hunts at the team's lowest sanity" — close but inaccurate; it specifically uses the *target* player's sanity, regardless of who has the lowest sanity. "Banshee always screams" — only ~33 % per parabolic-sound roll, plenty of contracts pass without one.
10. **Haunted implementation notes.** Pre-roll a `banshee.targetIdx` at contract start. Use `players[targetIdx].sanity` as the threshold check, not `avgSanity`. Crucifix range hard-set to 5 m. Add a parabolic-scream sample bank.
11. **Debug needs.** Expose `__debug.banshee.target()` returning current target index and target sanity. Expose `__debug.banshee.forceScream()` to test parabolic capture. Expose `__debug.banshee.targetReroll()` to simulate target death.

## 2.2  Dayan

1. **Standard hunt threshold.** Default **50 %** (when no player is within 10 m).
2. **Special hunt threshold changes.** If the **closest** player is within 10 m of the Dayan (same floor or not):
   * Closest player **standing still**: threshold drops to **45 %** AND speed becomes a fixed 1.2 m/s.
   * Closest player **walking** (any movement, including sprint per current sources): threshold rises to **65 %** AND speed becomes a fixed 2.25 m/s.
3. **Hunt speed model.** Outside 10 m: standard 1.7 m/s + LOS acceleration. Inside 10 m: speed is **fixed** (no LOS acceleration applied) at 1.2 (still) or 2.25 (moving). 2.25 is below the player's default sprint cap, so a moving player can outrun a Dayan in a straight line.
4. **Hunt detection / tracking.** Standard ray-trace, but the in-range mechanic uses the closest player's velocity to drive both threshold and speed.
5. **Hunt visibility / blink / audio clues.** Standard flicker, standard audio. **Always female** model, always female vocalizations.
6. **Hiding interaction.** Standard. Crouching counts as "still" — players in 10-m range entering a hiding spot at zero velocity will see the Dayan slow to 1.2 m/s.
7. **Equipment interaction during hunts.** Tier III salt and incense are highly recommended — both buy time to leave the 10-m bubble.
8. **Practical identification tests.** During a hunt, stop dead. If the ghost slows visibly within 10 m, almost certainly a Dayan. Conversely, walking near the ghost should make it visibly faster (faster than a normal +LOS ramp).
9. **Common misreads / misconceptions.** "Dayan slows when you sprint" — wrong; sprint counts as movement, makes her faster, not slower. "Dayan is just like a Hantu but movement-driven" — Hantu's curve is temperature-driven and applies map-wide; Dayan only triggers within 10 m of the closest player.
10. **Haunted implementation notes.** Track `closestPlayer` and `closestPlayer.speed` per tick. Add a `dayan.inRange` flag updated whenever distance ≤ 10 m. Override speed and threshold from inside that gate. Ensure female-only model is enforced. Hard-block hunt-roll if the male-name list is selected.
11. **Debug needs.** `__debug.dayan.distance()`, `__debug.dayan.closestPlayerVel()`, `__debug.dayan.activeThreshold()`, `__debug.dayan.activeSpeed()`.

## 2.3  Demon

1. **Standard hunt threshold.** **70 %** avg team sanity — the highest standard threshold of any ghost.
2. **Special hunt threshold changes.** Demon's "ability hunt" bypasses the threshold entirely: pick a target, walk toward them, wait 20 s, if it has LOS within that window initiate a hunt regardless of sanity. (The 20-s window is the Demon's hunt cooldown coincidentally — see below.)
3. **Hunt speed model.** Standard 1.7 m/s base + LOS acceleration to 2.805 m/s.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** Standard.
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.**
   * Hunt cooldown reduced to **20 s**.
   * Crucifix range **× 1.5**: tier I = 4.5 m, tier II = 6 m, tier III = 7.5 m.
   * Smudge prevent-duration reduced to **60 s** (vs 90 s standard).
   * Ouija board questions cause **no sanity drain** for the Demon (key non-hunt tell, but informs which contracts will allow Demons to hunt early — keep in mind during identification).
8. **Practical identification tests.** A hunt that fires at >70 % avg sanity strongly implies Demon (a Mimic also possible). Crucifix that blocks at obviously larger-than-tier range = Demon. Smudge a hunt and time the next hunt — if next hunt fires inside 90 s, Demon. Ouija questions without sanity drop = Demon (tells you Demon is on the board even before hunts start).
9. **Common misreads / misconceptions.** "Demon hunts faster" — its base speed is identical to other ghosts; only the *frequency* (cooldown 20 s and 70 % threshold) is higher. "Crucifix doesn't work on Demons" — the opposite: it works at increased range. "Demon ability is on a fixed timer" — current sources do not specify a fixed cadence; treat the ability as a non-deterministic special.
10. **Haunted implementation notes.** Set `huntThreshold = 0.70`, `huntCooldown = 20`, `crucifixRangeMul = 1.5`, `smudgePreventS = 60`. The "ability hunt" can be approximated by allowing one forced hunt per `abilityCooldown` (suggest 60–90 s) that ignores sanity gating — flag explicitly so it doesn't accidentally fire under 70 % threshold path twice.
11. **Debug needs.** `__debug.demon.abilityArmed()`, `__debug.demon.forceAbilityHunt()`, `__debug.demon.crucifixRangeAt(tier)`.

## 2.4  Deogen

1. **Standard hunt threshold.** **40 %** avg team sanity.
2. **Special hunt threshold changes.** None beyond default.
3. **Hunt speed model.** Distance-driven, **no** LOS acceleration:
   * Player straight-line distance ≥ ~6 m: **3.0 m/s** (very fast).
   * Player straight-line distance ≤ ~2.5 m: **0.4 m/s** (almost stopped).
   * Smooth interpolation between the two ranges.
   * Smudge-blinding override: 0.4 m/s for 50 / 75 / 100 % difficulty speeds; 1.6 m/s for 125 / 150 % difficulty speeds.
4. **Hunt detection / tracking.** **Always knows where every player is.** Hiding does not break LOS in the conventional sense — the Deogen will still walk straight to your locker. Picks the **nearest** player at hunt-start, holds for 10 s, then re-picks the nearest player every **5–10 s** afterward.
5. **Hunt visibility / blink / audio clues.** Heavy bull-like breathing audio whenever close to a player. **33 %** chance on Spirit Box queries from within **1 m** of the Deogen to produce a unique heavy-breathing response in place of a normal SB response (this is also identifiable outside hunts).
6. **Hiding interaction.** Hiding is **counterproductive** — the Deogen will arrive and the only survival is to keep moving and loop. Inside a locker, the Deogen will arrive at 0.4 m/s, but it will arrive, and at point-blank range hiding-spot LOS-block does not save the player.
7. **Equipment interaction during hunts.** Standard smudge / crucifix / salt mechanics. Incense is uniquely valuable because it buys looping time at point-blank.
8. **Practical identification tests.** Listen for the breathing — the moment you hear it on a Spirit Box and the room is empty of players, Deogen. During a hunt, it slows visibly the closer you are; sprint to maintain distance and the Deogen moves at full 3 m/s — clear identification by speed-vs-distance.
9. **Common misreads / misconceptions.** "Deogen always moves at 3 m/s" — only at distance; almost trivial to outrun if you keep moving. "Hiding works against a Deogen if it can't see you enter" — false; Deogen always knows your position regardless of LOS. "Deogen can be smudged into stopping" — incense slows it to 0.4 m/s (effectively stopped) but doesn't end the hunt.
10. **Haunted implementation notes.** Compute `distFromPlayer` per tick. Speed = lerp(0.4, 3.0, clamp((dist - 2.5) / (6.0 - 2.5), 0, 1)). Set `losAccel = 0` (no LOS acceleration). Override target-acquisition to "nearest player by raw straight-line", recheck every 5–10 s, ignoring LOS gates. SB breathing event 33 % within 1 m.
11. **Debug needs.** `__debug.deogen.distance()`, `__debug.deogen.activeSpeed()`, `__debug.deogen.lastTargetSwitch()`, `__debug.deogen.forceBreath()`.

## 2.5  Gallu

1. **Standard hunt threshold.** **50 %** in normal state.
2. **Special hunt threshold changes.**
   * **Enraged**: **60 %** threshold (more likely to hunt).
   * **Weakened**: **40 %** threshold.
3. **Hunt speed model.**
   * Normal: 1.7 m/s + LOS acceleration to 2.805.
   * Enraged: 1.96 m/s + LOS acceleration (still applies on top, capped at 1.96 × 1.65 if implemented straightforwardly).
   * Weakened: 1.36 m/s + LOS acceleration.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** Standard. Visual model may signal state via posture changes (game-specific, ⚠ confidence: low — verify on current Wiki).
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.**
   * Salt, incense, OR crucifix usage triggers **Enraged** state if Gallu was Normal/Weakened. Specifically, Gallu enrages **2 s** after stepping in salt while Normal, **3 s** while Weakened.
   * If a hunt **ends** while Gallu is Enraged → it instantly switches to **Weakened**.
   * Crucifix radius: enraged **−2 m**, weakened **+1 m**.
8. **Practical identification tests.** Throw down salt; if the ghost's hunt threshold appears to spike (hunt fires shortly after at higher sanity), Gallu. Time consecutive hunts: an Enraged → Weakened cycle should yield distinctly different speeds.
9. **Common misreads / misconceptions.** "Gallu always moves at 1.96 m/s" — only while Enraged. "Stepping in salt scares the Gallu away" — opposite; provokes it.
10. **Haunted implementation notes.** Add a `gallu.state` enum (`normal | enraged | weakened`) with delayed transitions (2/3 s salt-step delays; instant on hunt-end if enraged). Speeds and thresholds gated by state. Crucifix range override.
11. **Debug needs.** `__debug.gallu.state()`, `__debug.gallu.forceState(name)`, `__debug.gallu.activeSpeed()`, `__debug.gallu.activeThreshold()`, `__debug.gallu.crucifixRange()`.

## 2.6  Goryo

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Standard 1.7 m/s + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace during hunts. Outside hunts, heavily restricted to its favorite room (does not roam far).
5. **Hunt visibility / blink / audio clues.** Standard during hunts.
6. **Hiding interaction.** Standard. Goryo is not always-knowing.
7. **Equipment interaction during hunts.** Standard.
8. **Practical identification tests.** **DOTS-on-camera-only** is Goryo's identifying tell, evident outside hunts: place a video camera + DOTS projector in the ghost room, leave the room, watch the live feed. If a DOTS silhouette appears on the camera feed but is invisible to the naked eye when standing in the room, Goryo. Goryo will refuse to use DOTS while any player is in its room.
9. **Common misreads / misconceptions.** "Goryo can hunt anywhere" — yes during a hunt, but its non-hunt presence stays close to its favorite room. "DOTS silhouette in person = Goryo" — wrong; Goryo's DOTS is video-only.
10. **Haunted implementation notes.** Hunt code itself is unmodified default. The Goryo identity hangs entirely on the DOTS-camera-only and room-locked-roam logic, both outside hunts; if Haunted's DOTS or roam systems are absent, Goryo's hunt mechanics alone are not distinguishable from a Spirit/etc.
11. **Debug needs.** None hunt-specific. (Defer to evidence-system debug for DOTS rendering.)

## 2.7  Hantu

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Temperature-driven curve. **No LOS acceleration.**
   | Room temp | Speed |
   |---|---|
   | ≥ 15 °C | 1.4 m/s |
   | ~12 °C | 1.75 m/s |
   | ~9 °C | 2.1 m/s |
   | ~6 °C | 2.3 m/s |
   | ~3 °C | 2.5 m/s |
   | 0 °C | 2.7 m/s |
   Speed is recomputed **per room the Hantu is currently in** as it traverses; it can rapidly slow down moving from a freezing bedroom into a warm hallway.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** When the breaker is OFF, Hantu emits a visible **cold-breath puff** from its head model in any room, regardless of room temp. Distinct from the player's own breath which only appears when the player is in a room ≤ 5 °C.
6. **Hiding interaction.** Standard. The temp-speed mechanic does not change hiding logic.
7. **Equipment interaction during hunts.**
   * Hantu **cannot turn ON** the breaker.
   * Outside hunts, Hantu is twice as likely to flip the breaker OFF.
   * Standard smudge / crucifix.
8. **Practical identification tests.** Turn the breaker ON and keep it ON; observe hunt speed in a known-cold room. If the ghost still hunts fast in cold and slow in warm, Hantu. Cold breath visible from the ghost while breaker OFF is a near-confirmation.
9. **Common misreads / misconceptions.** "Hantu hunts faster than other ghosts" — only in cold rooms; in a 20 °C room it's strictly slower than a normal ghost (1.4 vs ~1.7+). "Hantu has LOS acceleration" — no; turning the breaker ON kills both the cold-source and stops the speed boost.
10. **Haunted implementation notes.** Need a per-room (or per-tile) temperature value and a breaker state. Hunt speed = `tempCurve(roomTemp)`. `losAccel = 0`. Breaker-off → spawn a small particle puff at the ghost's mouth bone every ~1 s. Breaker toggle hooks: Hantu cannot change it from off to on; Hantu's "favorite to flip" weight ×2 for off-actions.
11. **Debug needs.** `__debug.hantu.roomTemp()`, `__debug.hantu.activeSpeed()`, `__debug.hantu.breaker()`.

## 2.8  Jinn

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Conditional fixed boost:
   * If breaker is **ON** AND ghost has **LOS** AND target distance **≥ 3 m**: **2.5 m/s** fixed.
   * Otherwise: standard 1.7 + LOS accel to 2.805.
   * Distance < 3 m drops Jinn to standard speed (so it cannot melt a player at point-blank with the boost — this is intentional design).
4. **Hunt detection / tracking.** Standard ray-trace. The Jinn's speed boost requires LOS, so peeking around a corner immediately kills the 2.5-m/s state.
5. **Hunt visibility / blink / audio clues.** Standard.
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.**
   * Breaker ON enables the speed boost.
   * Jinn cannot turn the breaker OFF (key non-hunt tell).
   * Sanity-drain ability: when the fuse box is on and a player is in the same room or within 3 m of the ghost, Jinn occasionally drops that player's sanity by 25 % (this is independent of hunting and is the most reliable behavior tell).
   * Standard smudge / crucifix.
8. **Practical identification tests.** Stand 5+ m from the Jinn during a hunt with breaker on; you should see a noticeable speed step-up over a normal ghost (because there is no 13-s ramp). Verify breaker manipulation: leave the breaker on, observe the ghost; if it never turns it off, suspect Jinn. Periodic sanity drops without ghost events = Jinn ability firing.
9. **Common misreads / misconceptions.** "Jinn always moves at 2.5 m/s" — only with the boost gate satisfied. "Jinn is fast at point-blank" — no; the 3-m gate intentionally drops it to standard at close range.
10. **Haunted implementation notes.** Add the three-gate check (`breakerOn && hasLOS && dist >= 3`). When all three true → speed = 2.5 (fixed, no LOS-accel). Else fall through to default. Add a periodic `sanityAbility` trigger that fires while breaker on and a player is within 3 m or same room. Block any "ghost flips breaker off" path for Jinn.
11. **Debug needs.** `__debug.jinn.boostActive()`, `__debug.jinn.breaker()`, `__debug.jinn.distance()`, `__debug.jinn.lastSanityAbility()`.

## 2.9  Mare

1. **Standard hunt threshold.** **60 %** when the lights in the Mare's current room are OFF.
2. **Special hunt threshold changes.**
   * Lights **ON** in the Mare's current room: threshold drops to **40 %**.
   * Below 40 % avg sanity: Mare hunts regardless of light state.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** Standard. The Mare cannot turn lights on; it pops light bulbs (ghost event) and flips switches off. During hunts, light interaction is the standard hunt-flicker.
6. **Hiding interaction.** Standard. Note: turning a light ON in the Mare's current room raises its hunt threshold (40 % to hunt = harder to satisfy at higher sanity), so leaving lights on outside hiding spots is a soft-counter.
7. **Equipment interaction during hunts.** Standard.
8. **Practical identification tests.** Walk through and turn ON every light; if hunts continue at 50–60 % avg sanity, Mare can be ruled out (it would only hunt at 40 % with lights on). Lights repeatedly popping or being switched off without a player nearby are Mare-positive ghost events.
9. **Common misreads / misconceptions.** "Mare always hunts at 60 %" — only with lights off. "Mare can turn lights off but not on" — correct, but specifically: ghost events involve switching off, popping bulbs, never turning on.
10. **Haunted implementation notes.** Need per-room (or per-ghost-current-room) light state. Compute Mare's effective threshold from `lightsOnInGhostRoom ? 0.40 : 0.60`. Ghost-event preference: bulb-pop > switch-off > other.
11. **Debug needs.** `__debug.mare.activeThreshold()`, `__debug.mare.lightInRoom()`, `__debug.mare.bulbCount()`.

## 2.10  Mimic

1. **Standard hunt threshold.** **Variable** — inherits the threshold of whichever ghost it is currently mimicking. Can be 35 % (Shade), 70 % (Demon), 80 % (Yokai with voice), etc.
2. **Special hunt threshold changes.** Switching mimicked ghost mid-contract changes the threshold immediately.
3. **Hunt speed model.** Inherits the mimicked ghost's speed model entirely. Mimicking a Hantu = temperature curve. Mimicking a Revenant = 1.0/3.0 binary. Etc.
4. **Hunt detection / tracking.** Inherits.
5. **Hunt visibility / blink / audio clues.** Inherits, but layered on top: a Mimic always shows **Ghost Orbs** as a "fake fourth evidence" (visible on a video camera in a dark room with a tripod or held). The orb is always present regardless of which three real evidences the Mimic uses.
6. **Hiding interaction.** Inherits.
7. **Equipment interaction during hunts.** Inherits. The Mimic's own contract-defining tell is the **fake ghost orb** alongside its three actual evidences.
8. **Practical identification tests.** If you observe behaviors that conflict between two known ghost archetypes within one contract — e.g. a hunt at 70 % avg sanity AND another hunt where the ghost slowed to 0.4 m/s up close — strongly suspect Mimic. Confirm via "fourth evidence" Ghost Orb when the journal shows three other evidences. Note: D.O.T.S., EMF-5, and Ghost Writing are evidences a Mimic cannot have, so confirming any of those three rules out Mimic.
9. **Common misreads / misconceptions.** "Mimic shows four real evidences" — no, exactly three; the orb is fake. "Mimic mimics one ghost the entire contract" — it can switch mid-contract. "Spirit Orbs as evidence ⇒ Mimic" — Ghost Orb (singular evidence card) does not appear on Mimic's three-evidence card; the orb is generated from the fake-fourth code path.
10. **Haunted implementation notes.** Implement Mimic as a thin shim that delegates to a `mimickedGhost` reference. Add a `Mimic.swap(targetGhost)` helper that retargets at random intervals. Generate Ghost Orb particles as an always-on cosmetic regardless of the underlying ghost.
11. **Debug needs.** `__debug.mimic.currentMimic()`, `__debug.mimic.swap(name)`, `__debug.mimic.orbActive()`.

## 2.11  Moroi

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None on threshold itself, but the **Spirit Box curse** doubles passive sanity drain on the player who got the SB response, so the threshold gets reached faster in practice.
3. **Hunt speed model.** Sanity-driven, plus standard LOS acceleration on top:
   * Base = **1.5** + 0.083 m/s for every **5 percentage points** of avg-team sanity below 50 %.
   * At 50 % avg: 1.5 m/s. At 25 % avg: 1.5 + 5 × 0.083 = ~1.92 m/s. At 0 % avg: 1.5 + 10 × 0.083 = ~2.33 m/s.
   * LOS acceleration applies on top, capped roughly at 1.65 × base. With base 2.33 + cap, max observable ~**3.71 m/s**.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** Standard.
6. **Hiding interaction.** Standard, but Moroi has a longer smudge-blind window (see below) which buys hiding time.
7. **Equipment interaction during hunts.**
   * Smudge-blind during hunt: **7 s** instead of 5 s. Multiple incenses stack (up to 28 s observed).
   * Outside hunts: smudge prevents hunts for default 90 s.
   * Spirit Box: getting any response curses the responding player — passive drain doubles, lit areas no longer protect from drain.
8. **Practical identification tests.** Smudge during a hunt and time the blind window — > 5 s suggests Moroi. Watch sanity drop curves: a player who used the Spirit Box drops twice as fast as teammates.
9. **Common misreads / misconceptions.** "Moroi gets faster only at 0 %" — false; it accelerates linearly all the way down. "Moroi cannot be smudged" — it can; the blind is just longer-than-default in your favor.
10. **Haunted implementation notes.** `huntSpeed = 1.5 + 0.083 * max(0, (50 - avgSanity) / 5)` then apply standard LOS-accel multiplier. Track `cursedBySB[playerIdx]` flag; when true, double passive drain and ignore lit-area drain reduction. Smudge-blind value override → 7 s.
11. **Debug needs.** `__debug.moroi.baseSpeed()`, `__debug.moroi.cursedPlayers()`, `__debug.moroi.curseFromSB(playerIdx)`, `__debug.moroi.smudgeBlindTime()`.

## 2.12  Myling

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.**
   * Footsteps and vocalizations audible only **within 12 m** during hunts (vs 20 m default — quieter, more dangerous).
   * Paranormal sound on parabolic / sound recorder every **64–127 s** (vs 80–127 s default — more frequent than typical).
   * The 12-m footstep range is intentionally just above the 10-m electronic-flicker range, creating a small but learnable cue gap.
6. **Hiding interaction.** Standard. Critically, you cannot rely on hearing the Myling approach — many hides die because the player thought the ghost was further away.
7. **Equipment interaction during hunts.** Standard.
8. **Practical identification tests.** Set up parabolic mic; if two paranormal sounds fire within 80 s, almost certainly Myling. Compare audible-footstep distance to flashlight-flicker onset distance — if footsteps appear simultaneously with electronic flicker rather than 10 m before, suspect Myling.
9. **Common misreads / misconceptions.** "Mylings make no sound" — they do; just at shorter range. "Mylings hunt early" — no, threshold is standard 50 %.
10. **Haunted implementation notes.** Override `hunt.footstepRangeM = 12` for Myling. Override `paranormalSoundIntervalRange = [64, 127]`.
11. **Debug needs.** `__debug.myling.lastParanormalSoundT()`, `__debug.myling.footstepRange()`.

## 2.13  Obake

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** **Shape-shifts into a different ghost-model of the same gender** during hunts on specific flicker indices: 12, 27, 39, 54, 62, 80, 105, 120, 132. Counted from the first flicker-in.
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.**
   * Fingerprint rate **75 %** (vs 100 % standard) per interaction with a fingerprint-able surface.
   * **1 / 6** chance a fingerprint appears with **six fingers** instead of five — the Obake's signature evidence.
   * Periodically halves the remaining time on all existing fingerprints on the map (a 70-s and 40-s print become 35 / 20 s).
   * Standard smudge / crucifix / salt during hunts.
8. **Practical identification tests.** UV every fingerprint surface; if a six-fingered print is ever found, almost certainly Obake (Mimic can also produce one, see §2.10). Watch for prints that disappear far faster than the 60-s baseline. During hunts, the visible model swap on specific flicker indices is hard to time-confirm in practice — the print evidence is the workable test.
9. **Common misreads / misconceptions.** "Obake always leaves prints" — only 75 % per interaction. "Six-finger print confirms Obake outright" — Mimic-mimicking-Obake also produces it; rule out Mimic by checking that one of the impossible-Mimic evidences (DOTS, EMF-5, Ghost Writing) is part of the case.
10. **Haunted implementation notes.** `printRateP = 0.75`, `sixFingerP = 1/6`, halves-existing-print-times tick every N seconds. Hunt code itself unchanged. Add the flicker-index shape-shift hook if Haunted has multiple ghost models; otherwise omit and document as "requires multiple ghost-model assets".
11. **Debug needs.** `__debug.obake.lastPrintWasSixFinger()`, `__debug.obake.flickerIndex()`, `__debug.obake.shapeshiftNext()`.

## 2.14  Obambo

1. **Standard hunt threshold.** Variable by phase.
2. **Special hunt threshold changes.**
   * **Calm phase**: threshold **10 %**, activity 25.
   * **Aggressive phase**: threshold **65 %**, activity 90.
   * Phase cycles independently of player actions.
3. **Hunt speed model.**
   * Calm: **1.445 m/s** + LOS accel.
   * Aggressive: **1.955 m/s** + LOS accel.
   * Phase can switch mid-hunt.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** Standard. Phase change has no overt visual tell per current sources (⚠ confidence: low — verify on current Wiki).
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.** Standard.
8. **Practical identification tests.**
   * Sit in the truck and watch the activity meter — if it visibly oscillates between very-low (~25) and very-high (~90) on a clean 2-min cycle, Obambo.
   * Time the first hunt: an Obambo will hunt at 65 % avg sanity if the contract has run long enough for the aggressive phase to land. A hunt at 65 %+ that is not a Demon → strong Obambo signal.
   * If a hunt fires and is **noticeably shorter** than other hunts at the same difficulty, that hunt started in aggressive phase (× 0.8 duration).
9. **Common misreads / misconceptions.** "Obambo only hunts at 65 %" — only in aggressive phase; it can also hunt at 10 % during long calm stretches. "Obambo hunts forever" — aggressive-start hunts are 20 % shorter, not longer.
10. **Haunted implementation notes.** Add a `obambo.phase` enum + a 2-minute cycle timer that starts 1 minute after the first exit-door open. State drives both threshold and base speed. Hunt-start: if entering hunt while aggressive, set `huntDurationS *= 0.8`.
11. **Debug needs.** `__debug.obambo.phase()`, `__debug.obambo.phaseSwitchT()`, `__debug.obambo.activeThreshold()`, `__debug.obambo.activeSpeed()`.

## 2.15  Oni

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.**
   * **Less blinking** than other ghosts during hunts → appears almost continuously visible.
   * **2/3** chance to manifest in **full form** (vs the standard variety distribution that often produces shadow / translucent).
   * Cannot perform **mist form** ghost events (a player who sees a mist-form event has ruled out Oni).
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.** Standard.
8. **Practical identification tests.** Sustained visible silhouette during hunts → likely Oni or Obake (Obake shape-shifts; Oni stays one model). Many ghost events with full-form manifestations and no mist events → Oni.
9. **Common misreads / misconceptions.** "Oni throws harder than other ghosts" — current sources do not confirm a unique throw-strength multiplier; the visible identifier is its visibility/event behavior, not throw force. "Oni has stronger hunts" — its hunt logic is otherwise standard.
10. **Haunted implementation notes.** Override blink interval: extend visible-on time, shorten invisible-off. Bias manifestation roll toward full-form (~2/3). Block mist-form events. Sanity drain on event collision **× 2** (20 % vs 10 % standard).
11. **Debug needs.** `__debug.oni.blinkParams()`, `__debug.oni.lastManifestForm()`, `__debug.oni.eventDrainMul()`.

## 2.16  Onryo

1. **Standard hunt threshold.** **60 %**.
2. **Special hunt threshold changes.** **Three-flame counter** path:
   * Each time the Onryo blows out a flame (lit candle, lighter, fireplace, campfire) outside hunts, an internal counter increments.
   * When the counter reaches **3**, the next hunt-roll (subject to setup-phase, smudge, crucifix gates) **fires regardless of avg sanity**, and the counter resets to 0.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** Standard.
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.**
   * Any **lit flame within 4 m** of the Onryo at the moment of a hunt-roll **blocks** that hunt attempt and snuffs the flame in the process (the flame is consumed; counter still increments).
   * Onryo cannot lit any flame on its own (forced via Voodoo Doll only).
   * Standard smudge / crucifix.
8. **Practical identification tests.**
   * Place several lit candles around the ghost room. If the ghost extinguishes them rapidly and a hunt fires shortly after the third blow-out at high sanity, Onryo.
   * Multiple successive hunts each preceded by exactly three flame blow-outs is a near-confirmation.
9. **Common misreads / misconceptions.** "Crucifix is the best counter" — flames are actually preferred for an Onryo because flames also block hunt-attempts and have far greater coverage. "Onryo only hunts at 60 %" — wrong; the flame counter forces hunts regardless of sanity at the third blow-out.
10. **Haunted implementation notes.** Add `onryo.flameCount` integer. Increment on each flame extinguish event by the ghost. On reaching 3, queue a forced hunt-attempt that bypasses sanity-roll. Add `onryo.flameBlockRadius = 4` for hunt-start blocking; consume one flame per block.
11. **Debug needs.** `__debug.onryo.flameCount()`, `__debug.onryo.forceFlameInc()`, `__debug.onryo.lastHuntCause()` (`sanity` vs `flame3` vs `cursed`).

## 2.17  Phantom

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.**
   * Visible per flicker cycle: **1.0 – 2.0 s** (much longer visible OFF time vs default 0.3–1.0 visible / ≤ 0.7 invisible).
   * Net effect: the Phantom appears for shorter total fraction of the hunt — many players experience it as "barely visible".
   * **Photo capture during a hunt**: the ghost is forced **invisible for the rest of that flicker**, then resumes flickering normally on the next.
   * **Photo capture outside a hunt**: ghost vanishes physically, photo contains no ghost AND no interference — distinct from a normal "interfered photo".
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.**
   * Photo camera as an offensive tool: snap a photo to push the Phantom into invisibility briefly.
   * Spirit Box: Phantom's chance of producing an SB response per question is **halved** (relevant outside hunts; informs ID).
   * Standard smudge / crucifix.
8. **Practical identification tests.**
   * Take a photo of the ghost during a hunt — if the ghost vanishes for a noticeably long beat after the flash, Phantom is highly likely.
   * Outside hunts, photograph a manifesting ghost; if the photo shows neither the ghost nor any "ghost interference" image, Phantom.
   * Spirit Box that takes "too long" to produce a response is a soft Phantom signal.
9. **Common misreads / misconceptions.** "Phantom is invisible during hunts" — no; it's just visible for shorter total time per cycle. "Photographing a Phantom permanently un-summons it" — only briefly; it returns to flickering.
10. **Haunted implementation notes.** Override blink interval: visible 1.0–2.0 s, invisible 0.5–1.5 s. On photo-capture event, set `phantom.invisibleUntil = now + currentFlickerCycleLength`. Halve SB response probability outside hunts.
11. **Debug needs.** `__debug.phantom.flickerParams()`, `__debug.phantom.forcePhotoVanish()`, `__debug.phantom.lastPhotoVanishMs()`.

## 2.18  Poltergeist

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** Standard.
6. **Hiding interaction.** Standard, but objects in the hiding-spot's vicinity may be flying through your view (purely cosmetic / sanity-noisy).
7. **Equipment interaction during hunts.**
   * **Throws an object every 0.5 s at 100 % chance** during hunts (vs 50 % default for other ghosts). Starts ~4 s into the hunt.
   * Multi-throw ability (outside hunts as well): can throw multiple objects from a pile simultaneously; for each item, drains nearby player sanity by **2 percentage points × number of items thrown**.
8. **Practical identification tests.** Set up multiple loose objects in a small area; trigger a ghost event or wait for a hunt; if many objects are thrown together rapidly (visibly more than other ghosts), Poltergeist. During hunts, the constant throw cadence is audibly distinct.
9. **Common misreads / misconceptions.** "Poltergeist hunts more often" — its threshold is standard 50 %; its identifier is **what it does during** a hunt, not when it hunts. "Sanity drops 2 % per object always" — only when it uses the multi-throw ability on a pile near a player.
10. **Haunted implementation notes.** Override hunt-throw chance to 100 % per 0.5-s tick. Multi-throw ability outside hunts: roll periodically; pick a nearby pile; throw N items; drain sanity = N × 2 % of any player within ~3 m.
11. **Debug needs.** `__debug.polt.huntThrowsPerSec()`, `__debug.polt.lastMultiThrowItems()`, `__debug.polt.lastSanityDrainFromMultiThrow()`.

## 2.19  Raiju

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** While the Raiju is within map-size-dependent range of any **active** electronic equipment placed by players (or map fixtures like map-lights), threshold rises to **65 %**.
   * Activation distance: small map = **6 m**, medium = **8 m**, large = **10 m**.
3. **Hunt speed model.**
   * In activation range of an active electronic: **2.5 m/s** fixed (no LOS accel).
   * Outside that range: standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace, but Raiju is constantly drawn toward active electronics.
5. **Hunt visibility / blink / audio clues.**
   * **Heartbeat audible 15 m** instead of 10 m.
   * Electronics distort and flicker within **15 m** instead of 10 m; global chat / radio static at the same range.
6. **Hiding interaction.** Standard. Note: leaving an active electronic next to your hiding spot will draw the Raiju directly to you.
7. **Equipment interaction during hunts.**
   * Turn off all electronics to deny the speed boost.
   * Keep distance from the truck-side and map-side breaker if you want to deny constant-flicker telegraphing.
   * Standard smudge / crucifix.
8. **Practical identification tests.**
   * Drop a powered-on EMF reader far from the ghost room and time hunt-speed observed: faster than 2.805 m/s in proximity to the EMF reader = Raiju.
   * Confirm via heartbeat audible distance: pace away from the ghost; if heartbeat persists at >10 m, Raiju.
9. **Common misreads / misconceptions.** "Raiju always moves at 2.5 m/s" — only near active electronics. "Hunting at 65 % means Demon" — could also be Raiju in proximity of electronics; check heartbeat range.
10. **Haunted implementation notes.** Per tick: scan active electronics for any within `mapActivationRange`; if any → use `huntSpeed = 2.5`, `huntThreshold = 0.65`. Heartbeat radius override 15 m. Electronic-flicker radius override 15 m.
11. **Debug needs.** `__debug.raiju.nearActiveElectronic()`, `__debug.raiju.activeSpeed()`, `__debug.raiju.activeThreshold()`, `__debug.raiju.heartbeatRange()`.

## 2.20  Revenant

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Binary, **no LOS acceleration**:
   * **1.0 m/s** when not actively pursuing a player.
   * **3.0 m/s** the instant any player is detected (visually, by speech, or by electronics use).
   * Holds 3.0 m/s while moving toward the last detected position; on arrival, decelerates at **0.75 m/s²** (~2.7 s) back to 1.0 m/s and resumes wandering.
4. **Hunt detection / tracking.** Detection latches the chase to a last-seen point; the Revenant does not re-trace from a current position once it loses you, it walks to your last-known and re-acquires from there.
5. **Hunt visibility / blink / audio clues.** Standard.
6. **Hiding interaction.** Standard. Hiding works well against Revenant if you can break LOS first — its 1.0-m/s wander state passes by hiding spots harmlessly.
7. **Equipment interaction during hunts.** Standard.
8. **Practical identification tests.**
   * Crouch behind cover and stay still; if the hunt feels noticeably slow (1.0 m/s wander) when you're not in LOS, then explosive (3.0 m/s) the moment you are visible — Revenant.
   * Run continuously; the Revenant maintains 3.0 m/s but cannot exceed it (no LOS accel), so a player at sprint can pull ahead from ~3.5 m+ start gap.
9. **Common misreads / misconceptions.** "Revenant always sprints" — only when it has detection. "Revenant has a very high threshold" — no, standard 50 %.
10. **Haunted implementation notes.** Override speed model to binary (1.0 / 3.0). Add `revenant.detected` flag updated by LOS, by player-voice, by player-electronic-use. Add deceleration from 3.0 to 1.0 over ~2.7 s upon `detected = false`.
11. **Debug needs.** `__debug.revenant.detected()`, `__debug.revenant.activeSpeed()`, `__debug.revenant.lastDetectionT()`.

## 2.21  Shade

1. **Standard hunt threshold.** **35 %** — the lowest standard threshold in the game (Thaye fully aged matches 15 %, otherwise Shade is the latest hunter).
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace **once a hunt has begun**.
5. **Hunt visibility / blink / audio clues.** Standard.
6. **Hiding interaction.** Standard during hunts. **Outside hunts**, Shade refuses to perform interactions, ghost events, OR hunt rolls if at least one player is in the same room as it. The Shade-hunt-suppression rule applies to the **room the Shade is currently in**, not the favorite room.
7. **Equipment interaction during hunts.** Standard.
8. **Practical identification tests.**
   * Stand next to the ghost in its current room. If activity drops to zero (no events, no interactions, no hunts despite low sanity), Shade.
   * If hunts only fire when the team is split or far from the ghost room, Shade.
   * Conversely, Shade can still hunt from a roamed-into room where no players are present, so a stalker player following the ghost from outside the room is the safest behavior.
9. **Common misreads / misconceptions.** "Shade never hunts if anyone is in the building" — wrong; only same-room presence suppresses. "Shade hunts at 35 % even with players nearby" — false; same-room player blocks the roll regardless of sanity.
10. **Haunted implementation notes.** Add a per-tick check: `if any player is in shade.currentRoom → suppress hunt-roll, ghost-event roll, interaction-roll`. Outside hunts. Hunt-roll runs as normal once roaming has moved Shade out of the player's current room.
11. **Debug needs.** `__debug.shade.suppressed()`, `__debug.shade.currentRoom()`, `__debug.shade.playersInRoom()`.

## 2.22  Spirit

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** Standard. Spirit is the **default reference** ghost — every other ghost is described as "Spirit ± something".
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.** Smudge prevent-duration **180 s** (vs 90 s standard). All other equipment standard.
8. **Practical identification tests.** Smudge while not in a hunt. Time the next hunt-roll. If no hunt fires for 180 s+ even at < 50 % avg sanity, very likely Spirit. Otherwise inconclusive on hunt-only basis (rely on evidence).
9. **Common misreads / misconceptions.** "Spirit's smudge is permanent" — only 180 s, then standard hunting resumes. "Spirit is the slowest / weakest" — same speed and threshold as most ghosts; only the smudge prevent-duration is different.
10. **Haunted implementation notes.** Set `smudgePreventS = 180`. All other parameters default.
11. **Debug needs.** `__debug.spirit.smudgePreventEndsAt()`, `__debug.spirit.smudgeRemaining()`.

## 2.23  Thaye

1. **Standard hunt threshold.** **75 %** at age 0 (initial spawn).
2. **Special hunt threshold changes.** Threshold drops by **6 percentage points per age**, down to **15 %** at age 10 (final).
   * Aging trigger: the Thaye attempts to age **1 minute** after an exit door is opened for the first time.
   * If at the age-attempt moment a player is in the same room as the ghost OR within **3 m**: age increments by 1, and the next age attempt is scheduled in **1–2 minutes**.
   * Else: age does **not** increment, and the next attempt is scheduled in **30 s** (Thaye keeps trying).
   * Total ages: 10. Beyond age 10, no further changes.
3. **Hunt speed model.** Starting **2.75 m/s** at age 0. Drops by **0.175 m/s** per age. Floor at **1.0 m/s** at age 10. **No LOS acceleration.**
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** Per current sources, no per-age visual signal beyond model age cosmetics (⚠ confidence: low — verify on current Wiki).
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.** Standard.
8. **Special hunt-roll formula.** Thaye uses a **fixed 1 / 8** chance per idle-exit when below threshold, replacing the 10 % / 1-in-6 default ramp. So Thaye does not get more aggressive at very low sanity — only via aging.
9. **Other notes.**
   * **−15 % ghost event chance** per age.
   * **−15 % interaction rate** per age.
   * Maximum age stats: 50 % event chance, 50 % interaction rate (i.e. clamped at 50 % of base).
10. **Practical identification tests.**
    * Hunt that fires at >70 % avg sanity early in the contract (without other Demon tells) → strong Thaye signal at age 0.
    * Force aging by camping the ghost room for several minutes; if the ghost noticeably becomes less active and slower, Thaye.
    * Time hunts and compare speeds; the speed should monotonically drop.
11. **Common misreads / misconceptions.** "Thaye gets faster over time" — opposite; it slows. "Thaye won't age if no one is there" — partial; if no one is there, age doesn't increment but Thaye keeps re-rolling the age attempt every 30 s, so eventually a transient room-visit triggers the increment.
12. **Haunted implementation notes.** Add `thaye.age` integer (0..10) and `thaye.nextAgeAttemptT` timer. Threshold = `0.75 - 0.06 * age`. Speed = `2.75 - 0.175 * age`. `losAccel = 0`. Ghost-event roll multiplier = `1 - 0.15 * age` clamped at 0.5. Interaction roll multiplier = same. Hunt-roll chance fixed at `1/8` regardless of how far below threshold avg sanity is.
13. **Debug needs.** `__debug.thaye.age()`, `__debug.thaye.activeThreshold()`, `__debug.thaye.activeSpeed()`, `__debug.thaye.nextAgeAttemptT()`, `__debug.thaye.forceAgePlus()`.

## 2.24  The Mimic

(See §2.10. Listed here for alphabetical lookup; the Mimic is filed under "M" in current sources but is sometimes listed as "T" alphabetically. Refer to §2.10 for full details.)

## 2.25  The Twins

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Per hunt, picks 50/50:
   * **Slow twin (main)**: **1.5 m/s** + standard LOS acceleration. Hunt begins at the ghost's current position.
   * **Fast twin (decoy)**: **1.9 m/s** + standard LOS acceleration. The ghost **teleports** at hunt-start to "near where it last interacted with the large range" (i.e. somewhere it caused a recent EMF/interaction event). Hunt begins from that teleport spot.
4. **Hunt detection / tracking.** Standard ray-trace once the hunt's spawn position is set.
5. **Hunt visibility / blink / audio clues.** Standard.
6. **Hiding interaction.** Standard. Note: a fast-twin hunt's teleport often appears far from where the ghost was just observed — be ready to break LOS regardless of last-known position.
7. **Equipment interaction during hunts.**
   * **Crucifix check at hunt-roll** is performed at the ghost's **current** position (before deciding slow or fast). A crucifix in range can stop any twin variant.
   * Outside hunts: Twins have a **20 %** chance per "ability roll" to perform a paired interaction — two interactions, one in each of the Twins' two interaction-ranges, within 1–2 s of each other.
   * Standard smudge.
8. **Practical identification tests.**
   * Watch for paired simultaneous interactions (e.g. two doors slamming a second apart) — Twins.
   * Hunt that visibly starts from a different room than where the ghost was just observed → Fast Twin.
   * Hunt speeds clustering around 1.5 m/s and 1.9 m/s in different hunts of the same contract → Twins.
9. **Common misreads / misconceptions.** "Twins are two ghosts" — mechanically one ghost; the "decoy" is a teleporting expression of the same entity. "Twins always hunt twice" — they perform paired *interactions*, not paired hunts.
10. **Haunted implementation notes.** Add a `twins.huntVariant` 50/50 roll at hunt-start. Slow variant: speed=1.5. Fast variant: speed=1.9 + teleport ghost to last large-range interaction position. Crucifix check at current position before teleport. Outside hunts: 20 % chance per interaction roll to fire paired interactions in opposite ranges within 1–2 s.
11. **Debug needs.** `__debug.twins.huntVariant()`, `__debug.twins.lastLargeInteractionPos()`, `__debug.twins.lastPairedInteractionT()`, `__debug.twins.forceFastVariant()`.

## 2.26  Wraith

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace during hunts. **Outside hunts, can teleport** to a random player's location (a notable behavior tell, but not hunt-specific).
5. **Hunt visibility / blink / audio clues.** Standard.
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.**
   * **Never steps in salt piles** — under any circumstances, hunting or not, even during a Tier-III salt-line. This is the key UV-print test.
   * Cannot leave UV-revealable salt footprints.
   * Standard smudge / crucifix.
   * Outside hunts: stepping in salt does NOT decrease activity for a Wraith (because it doesn't step).
8. **Practical identification tests.**
   * Drop salt across the ghost's known-roam path. If the ghost's UV prints stop appearing on salt while normal floor-prints continue (or no salt prints ever appear), Wraith.
   * Tier-III salt during a hunt provides zero protection from a Wraith — useful as a confirm if you observe a hunting ghost walking unimpeded through salt without leaving prints.
9. **Common misreads / misconceptions.** "Wraith is invulnerable to salt" — accurate in effect, but the mechanic is "never steps in" not "is hurt by". "Wraith teleports during hunts" — its teleport ability is **outside** of hunts, to random players.
10. **Haunted implementation notes.** Add a `wraith.skipSalt` flag. Path-finding should treat salt piles as transparent for the Wraith but not for other ghosts. UV-print emission code: skip emission if ghost is Wraith.
11. **Debug needs.** `__debug.wraith.steppedInSalt()`, `__debug.wraith.lastTeleportT()`, `__debug.wraith.uvPrintsOnSaltCount()` (should always be 0).

## 2.27  Yokai

1. **Standard hunt threshold.** **50 %** with no voice activity.
2. **Special hunt threshold changes.** Voice chat (or local microphone speech) by any player **within 2 m** (and on the same floor) of the Yokai raises the threshold to **80 %**.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.**
   * Outside hunts: voice in the same room raises Yokai's activity by 30; voice within 9 m attracts the ghost.
   * **During hunts**: hearing radius for both voices and electronics is reduced to **2.5 m** (vs 9 m voice / 7.5 m Spirit Box default). This is a strong defensive tell — talking far from the ghost during a hunt is genuinely safer than against most ghosts.
5. **Hunt visibility / blink / audio clues.** Standard.
6. **Hiding interaction.** Standard. Whisper / talk freely from > 2.5 m during a hunt is much safer.
7. **Equipment interaction during hunts.**
   * Spirit Box held active: attracts only within 2.5 m (vs 7.5 m).
   * Standard smudge / crucifix / salt.
8. **Practical identification tests.**
   * Speak in proximity to the ghost (not during a hunt). If hunts fire at obviously high avg sanity (60–80 %), Yokai is highly likely (Demon also fits — rule out Demon by checking smudge/crucifix behavior).
   * During a hunt, speak from a known distance: if speaking at 5 m doesn't visibly redirect the ghost, Yokai.
9. **Common misreads / misconceptions.** "Yokai always hunts at 80 %" — only when voice happens at 2 m. "Spirit Box near a Yokai is dangerous during hunts" — actually safer than near most ghosts because of the reduced 2.5-m radius.
10. **Haunted implementation notes.** Track `recentVoiceWithin2mT`. Compute Yokai threshold = 0.80 if `now - lastVoice < N` and player was within 2 m, else 0.50. During hunts: override `voiceAttractRange = 2.5`, `electronicsAttractRange = 2.5`.
11. **Debug needs.** `__debug.yokai.activeThreshold()`, `__debug.yokai.lastVoiceWithin2m()`, `__debug.yokai.huntListenRange()`.

## 2.28  Yurei

1. **Standard hunt threshold.** **50 %**.
2. **Special hunt threshold changes.** None.
3. **Hunt speed model.** Standard 1.7 + LOS accel to 2.805.
4. **Hunt detection / tracking.** Standard ray-trace.
5. **Hunt visibility / blink / audio clues.** Standard during hunts. Outside hunts, Yurei has a uniquely **smooth, no-creak** door-slam where it shuts a door fully.
6. **Hiding interaction.** Standard.
7. **Equipment interaction during hunts.**
   * **Smudge** prevents the next 90 s of hunt attempts AND **traps Yurei in its favorite room** (cannot enter roaming state) for the same 90 s.
   * Standard crucifix.
   * Outside hunts: when the Yurei manifests / slams a door, drains the sanity of every player within **7.5 m** by **15 %**.
8. **Practical identification tests.**
   * Smudge the favorite room and observe whether the ghost wanders away in the next 90 s. If it remains parked in the favorite room, very likely Yurei.
   * Sudden 15 % drop in nearby players' sanity coincident with a smooth door-slam is highly Yurei-positive.
   * Door interaction style: a Yurei will fully close a door in one smooth motion with no creaking sound; any other door behavior rules out Yurei.
9. **Common misreads / misconceptions.** "Yurei smudge is the same as Spirit smudge" — Yurei adds a room-confine on top, Spirit just extends to 180 s. "Yurei drains sanity during hunts" — the 15 % drain is the door-slam *event* (outside or during hunts), not a hunt-only effect.
10. **Haunted implementation notes.** Smudge-on-Yurei: in addition to setting `huntPreventEndsAt`, set `yurei.confinedToFavoriteUntil = now + 90`. Block roam-state transition while confined. Door-slam event: drop sanity by 15 % for any player within 7.5 m. Door-slam audio uses the smooth-no-creak variant.
11. **Debug needs.** `__debug.yurei.confinedRemaining()`, `__debug.yurei.lastDoorSlamSanityDropPlayers()`, `__debug.yurei.activeRoom()`.

---

# PART 3 — SUMMARY TABLES

## 3.1  Hunt Threshold by Ghost (default conditions)

| Ghost | Threshold | Notes |
|---|---|---|
| Demon | 70 % | + ability hunt ignores threshold |
| Yokai (voice nearby) | 80 % | else 50 % |
| Thaye (age 0) | 75 % | drops 6 % per age, down to 15 % at age 10 |
| Raiju (near electronics) | 65 % | else 50 % |
| Onryo | 60 % | + 3-flame counter forces hunt |
| Mare (lights off) | 60 % | 40 % if lights on; <40 % regardless of light |
| Obambo (aggressive phase) | 65 % | calm phase: 10 % |
| Dayan (player walking ≤10 m) | 65 % | still ≤10 m: 45 %; outside 10 m: 50 % |
| Gallu (enraged) | 60 % | normal 50 %, weakened 40 % |
| Spirit, Wraith, Phantom, Poltergeist, Banshee*, Jinn, Revenant, Yurei, Oni, Yokai (no voice), Hantu, Myling, Goryo, Twins, Obake, Moroi | 50 % | * Banshee uses target sanity, not avg |
| Deogen | 40 % | |
| Shade | 35 % | suppressed if player same-room |
| Mimic | inherited | varies with mimicked ghost |

## 3.2  Hunt Speed by Ghost (default conditions, max with LOS)

| Ghost | Base | Max with LOS | LOS-accel? | Notes |
|---|---|---|---|---|
| Spirit, Wraith, Phantom, Polt, Banshee, Mare, Goryo, Onryo, Oni, Yokai, Myling, Yurei, Obake, Shade, Demon | 1.7 | 2.805 | ✓ | Reference default |
| Hantu | 1.4–2.7 | 1.4–2.7 | ✗ | Temperature curve |
| Thaye | 1.0–2.75 | 1.0–2.75 | ✗ | Age curve |
| Deogen | 0.4–3.0 | 0.4–3.0 | ✗ | Distance curve (slow close, fast far) |
| Revenant | 1.0 / 3.0 | 3.0 | ✗ | Binary, no accel |
| Moroi | 1.5–2.33 | up to ~3.71 | ✓ | Sanity-driven base + accel |
| Jinn | 1.7 / 2.5 | 2.805 / 2.5 | conditional | 2.5 fixed if breaker+LOS+≥3m |
| Raiju | 1.7 / 2.5 | 2.805 / 2.5 | conditional | 2.5 fixed near active electronics |
| Twins (slow) | 1.5 | 2.475 | ✓ | 50/50 picked per hunt |
| Twins (fast) | 1.9 | 3.135 | ✓ | + teleport at hunt-start |
| Dayan (≥10 m) | 1.7 | 2.805 | ✓ | standard outside 10 m |
| Dayan (<10 m, still) | 1.2 | 1.2 | ✗ | fixed |
| Dayan (<10 m, walking) | 2.25 | 2.25 | ✗ | fixed |
| Obambo (calm) | 1.445 | 2.385 | ✓ | |
| Obambo (aggressive) | 1.955 | 3.226 | ✓ | |
| Gallu (normal/enraged/weakened) | 1.7 / 1.96 / 1.36 | × 1.65 each | ✓ | |
| Mimic | inherited | inherited | inherited | |

## 3.3  Smudge Prevent-Duration & Crucifix Range

| Ghost | Smudge prevent | Crucifix range tier I/II/III |
|---|---|---|
| Default | 90 s | 3 m / 4 m / 5 m |
| Demon | 60 s | 4.5 / 6 / 7.5 m (×1.5) |
| Spirit | 180 s | 3 / 4 / 5 m |
| Yurei | 90 s + favorite-room confine | 3 / 4 / 5 m |
| Banshee | 90 s | 5 / 5 / 5 m (fixed at tier-III range — ⚠ medium confidence) |
| Gallu (enraged) | 90 s | (tier − 2 m) |
| Gallu (weakened) | 90 s | (tier + 1 m) |
| Moroi | 90 s prevent; **7 s** in-hunt blind (vs 5 s) | 3 / 4 / 5 m |

---

# PART 4 — CONFIDENCE GLOSSARY & KNOWN GAPS

**High confidence (multiple independent sources agree on numeric value):**
* Default 50 % threshold, 25-s cooldown, 1.7 m/s base, 2.805 m/s max LOS, 13-s LOS ramp.
* Demon 70 % / 20-s / × 1.5 crucifix / 60-s smudge.
* Spirit 180-s smudge.
* Yurei 90-s smudge + favorite-room confine + 15 % door-slam drain in 7.5 m.
* Hantu temperature curve (1.4 / 1.75 / 2.1 / 2.3 / 2.5 / 2.7 m/s at 15/12/9/6/3/0 °C); breaker behavior; visible breath while breaker off.
* Moroi 1.5 + 0.083 m/s per 5 % below 50 %; 7-s smudge blind.
* Thaye 75 % → 15 % threshold curve (−6 % per age); 2.75 → 1.0 m/s (−0.175 per age); 1/8 hunt-roll; aging trigger 1 min after first exit door.
* Deogen 0.4 / 3.0 m/s distance curve; always-knows-location; Spirit Box bull-breath at 1 m, 33 %.
* Revenant 1.0 / 3.0 binary; no LOS accel.
* Mare 60 % lights-off / 40 % lights-on; <40 % regardless.
* Yokai 80 % with voice within 2 m, else 50 %; 2.5-m hunt voice-radius; 2.5-m electronics-radius.
* Onryo 60 % threshold + 3-flame counter; 4-m flame block.
* Phantom flicker visible 1–2 s; photo vanish; halved SB rate.
* Polt 100 % throw / 0.5 s during hunt; 4-s startup.
* Obake 75 % print rate; 1/6 six-finger; halves remaining print times.
* Shade 35 % threshold; same-room suppression.
* Wraith never steps in salt; T3-salt no protection during Wraith hunt.
* Myling 12-m footstep; 64–127 s parabolic sound interval.
* Banshee target-only sanity check; 33 % parabolic scream.
* Twins 1.5 / 1.9 split; teleport on fast variant; 20 % paired interaction.
* Raiju 65 % near electronics; 2.5 m/s near electronics; 15-m heartbeat / electronics radius; activation 6/8/10 m by map size.
* Jinn 2.5 m/s with breaker+LOS+≥3 m; 25 % sanity drain in 3 m with breaker on.
* Dayan 10-m bubble; still 45 %/1.2; walking 65 %/2.25; female-only.
* Obambo calm 10 %/1.445 / aggressive 65 %/1.955; 2-min cycle; 0.8× duration if started aggressive.
* Gallu 50/60/40 thresholds; 1.7/1.96/1.36 speeds; 2-s/3-s salt-step enrage; instant weakening on hunt-end-while-enraged; crucifix −2 m enraged / +1 m weakened.

**Medium confidence (sourced consistently in community guides but not directly verified against current Wiki text in this session):**
* Hunt duration 15–40 / 20–50 / 30–60 by amateur / intermediate / pro and map-size scaling.
* Grace period 5 / 4 / 3 s by amateur / intermediate / pro.
* Banshee crucifix 5 m fixed (vs older "+2 m bonus per tier").
* Obake shape-shift indices 12/27/39/54/62/80/105/120/132.
* Sanity drain per-second (varies considerably by source — 0.24 %/s pro normal, 0.36 %/s blood moon; small map "8.1/min setup, 10.8/min post-setup"; solo halves rate).

**Low confidence (verify on current Phasmophobia Wiki when access restored):**
* Whether Banshee crucifix is fixed at 5 m or "tier + 2 m".
* Whether Obambo's phase-change has any visible / audio cue.
* Whether Gallu's state has any visible posture cue.
* Whether Thaye has a per-age vocalization or visual change beyond model age cosmetics.
* Exact LOS-decay formula (-0.01× per second is consistently reported but not explicit in all sources).
* Whether all Cursed Possession hunts truly bypass smudge/incense prevent windows or only some.
* Whether Mimic specifically inherits cooldown / smudge / crucifix overrides of the mimicked ghost (assumed yes; verify).

**Known gaps (out-of-scope for this hunt-only spec; documented in the broader `PHAS_GHOST_MASTER_SPEC.md`):**
1. Per-room sanity drain decimals.
2. Exact hunt-roll cadence (idle-exit period length).
3. Item-specific hunt-trigger interactions for newer cursed possessions (e.g. Tarot specifics, Music Box termination).
4. Exact teleport target-selection formula for the Twins fast variant.
5. Goryo DOTS-on-camera radius and angle constraints.
6. Phantom photo's exact "invisible duration" beyond "rest of current flicker cycle".

---

