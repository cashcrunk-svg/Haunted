# PHAS_GHOST_MASTER_SPEC.md

Exhaustive Phasmophobia ghost specification. Source date: 2026-04-29.

**Source rule.** Primary source of truth = the current *Phasmophobia Wiki* (Fandom: phasmophobia.fandom.com). Where the wiki was inaccessible at fetch time (the wiki returned HTTP 403 to direct fetch from this environment), data was reconstructed from community references that mirror current wiki numbers (per-ghost guides on keengamer, dotesports, progameguides, dualshockers, screenrant; aggregated data on screenhype, gamerant, the unofficial cheat sheet at tybayn.github.io, the "phasmo.co.uk Phasmophobia Assistant", reportafk's threshold cheat sheet, Steam community guide #3464855117 dated March 2026, and the *Phasmophobia.fr* wiki). Where two sources conflicted, the value from the most-recent dedicated per-ghost guide is taken. Where a value is genuinely unverified, the entry says **Unknown — requires current Phasmophobia Wiki verification** instead of guessing.

**Scope.** Every ghost in the live Phasmophobia roster as of 2026-04-29:
Banshee, Dayan, Demon, Deogen, Gallu, Goryo, Hantu, Jinn, Mare, Moroi, Myling, Obake, Obambo, Oni, Onryo, Phantom, Poltergeist, Raiju, Revenant, Shade, Spirit, Thaye, The Mimic, The Twins, Wraith, Yokai, Yurei.

**Section order per ghost (always present, never omitted):**
1. Identity Summary · 2. Evidence · 3. Hunt Thresholds · 4. Hunt Speed · 5. Hunt Vision / Detection / Targeting · 6. Hunt Visibility / Flicker / Audio Feel · 7. Sanity Interactions · 8. Ghost Events / Manifestation Tendencies · 9. Roaming / Favorite Room / Wandering · 10. Interaction Behavior · 11. Equipment-Specific Interactions · 12. Signature Tells / Best Tests · 13. Common False Positives · 14. Gender / Model / Name Restrictions · 15. Media / Recording Clues · 16. Multiplayer-Specific Notes · 17. Custom Difficulty / Evidence Count Caveats · 18. Exact Implementation Notes for Haunted · 19. Debug Requirements · 20. Confidence / Source Notes.

**N/A vs None vs Unknown.** "N/A" = the field does not apply (e.g., a ghost without a forced-evidence rule on the Evidence section). "None" = the rule applies but the ghost has no special behaviour (e.g., a ghost that uses standard sanity drain). "Unknown — requires current Phasmophobia Wiki verification" = the rule applies and the ghost has special behaviour, but the precise number was not confirmable at fetch time. These three are not interchangeable.

---

# Part I — Cross-Cutting Baseline

These constants apply to **every ghost unless that ghost's section explicitly overrides them**. Every ghost's section assumes them silently.

## CC.1 Speed model

- Base ghost speed (unless overridden): **1.7 m/s**.
- Player walk speed: 1.6 m/s. Player sprint speed: 3.0 m/s. Player crouch speed: 0.75 m/s.
- Line-of-sight (LOS) acceleration during hunts: while a ghost holds active LOS on its target, its speed scales by **+0.05× base/s**, capping at **1.65× base** after **13 s** of unbroken LOS. For a 1.7 m/s ghost the cap is **2.805 m/s**.
- Speed decay: when the ghost loses LOS and exits its immediate-area-search, speed bleeds at **−0.01× base/s**, taking **~65 s** to fully decay from peak back to base.
- Variable-speed ghosts (Hantu, Deogen, Moroi, Revenant, Thaye, Jinn, Raiju, Twins, Dayan, Gallu, Obambo) override the base value but **still apply LOS acceleration on top**, except where a ghost's section says otherwise (Revenant and Deogen are the canonical exceptions to LOS-accel: Revenant's snap is instant, Deogen's distance curve overrides accel).
- Grace period (start of hunt): the ghost is invisible and stationary for ~5 s; it does not chase during grace.

## CC.2 Hunt sanity threshold

- Default team-average threshold: **50%**. Below threshold, the ghost has a **10%** chance to start a hunt when it exits idle. At **threshold − 25%** the chance becomes **1/6 (~16.7%)**.
- Banshee uses **target-player** sanity instead of team average.
- Demon, Mare, Onryo, Raiju, Yokai, Shade, Thaye, Deogen, Dayan, Gallu, Obambo override the default — see per-ghost.

## CC.3 Hunt cooldown

- Default cooldown between hunts: **25 s**.
- Demon: **20 s**.
- Smudge during a hunt blinds the ghost for ~5 s and prevents another hunt for **90 s** from the smudge moment.
- Smudge in the favourite room outside a hunt prevents the next hunt for **90 s**.
- Per-ghost overrides: Spirit (180 s next-hunt block), Demon (60 s next-hunt block), Moroi (7.5 s blind during hunt), Yurei (favourite-room confinement 90 s instead of next-hunt block), Gallu (state-modulated blind duration).

## CC.4 Crucifix

- Tier I crucifix prevents hunts within **3 m** when planted.
- Tier II crucifix range **4 m**.
- Demon overrides: Tier I **5 m**, Tier II **6 m** (community sources cite 4.5/6/7.5 across some patches; **prefer 5/6** as recent value, mark deeper Tier values as **Unknown** if precision is required).
- Banshee: when crucifix-in-range, the hunt is **always** blocked (i.e., the dice roll is bypassed).
- Onryo: a crucifix and a lit candle stack as separate hunt-block sources.

## CC.5 Audio / hearing ranges

- Footstep audibility (default): ~**20 m**.
- Heartbeat audibility (player can hear ghost heartbeat): within ~**10 m**.
- Ghost vocalisations (default): ~**20 m**.
- Voice-detection radius for ghosts that respond to player speech (Yokai, Demon ouija risk): default **Unknown — requires current Phasmophobia Wiki verification**; Yokai-specific is **2 m** during hunts.
- Parabolic Microphone range: **30 m**, picks up sounds through walls.

## CC.6 Sanity drain (passive)

- Passive drain in dim/lit areas at standard difficulty: ~**0.08–0.12 %/s** per player depending on light state (lit room substantially reduces the rate; sources differ on exact numbers — **Unknown — requires current Phasmophobia Wiki verification** for precise per-difficulty rate).
- Drain in ghost room: amplified.
- Sanity-event drain: each ghost event drains **~10–25 %** for any player in line of sight within ~7.5 m (event-type dependent).
- Cursed object effects scale on top of the above.

## CC.7 Evidence pool

Seven pieces total: **EMF Level 5**, **Spirit Box**, **Ultraviolet (Fingerprints / Footprints / Handprints)**, **Ghost Writing**, **Freezing Temperatures**, **D.O.T.S. Projector**, **Ghost Orb**. Each ghost has a fixed three-evidence trio (some ghosts also have *forced* evidences that always appear regardless of evidence-count difficulty: Deogen → Spirit Box, Goryo → DOTS, Hantu → Freezing, Moroi → Spirit Box, Obake → UV, The Mimic → Ghost Orb). Some ghosts have *fake* evidence: The Mimic always projects Ghost Orbs as a fourth signal; whether Orbs count as the third evidence on Nightmare is described under The Mimic's section.

## CC.8 Standard equipment behaviour (defaults)

- Salt: stepped in by ghost, leaves UV-revealable footprints. Wraith never steps. Gallu (canonical) won't step in fresh piles when Enraged.
- Firelight (placed candle) and lit Lighter / Candelabra: act as proximity ward only for Onryo (default ghosts treat fire as flavour); Onryo specifically respects flame proximity. The Candelabra range is **2 m**; placed Firelight candles **3 m**; an in-hand Lighter is treated as a flame source.
- Smudge / Incense: blinds the ghost during hunt for ~5 s and acts as next-hunt suppressor for 90 s outside hunt. Spirit / Demon / Moroi / Gallu / Yurei have overrides.
- Photo Camera: photographing the ghost during a manifestation grants evidence + cash. Phantom vanishes when photographed.
- Parabolic Microphone: picks up paranormal sounds in 30 m radius; Banshee has unique 33% screech roll per paranormal sound; Myling produces extra sounds.
- Sound Recorder: records EVP voice samples, including Banshee's screech.
- Sound Sensor / Motion Sensor: room monitoring devices, no per-ghost overrides on default.
- DOTS Projector: shows ghost silhouette. Goryo only shows via a recorded video camera feed.
- UV Flashlight: reveals fingerprints, handprints, footprints. Obake leaves prints only 75% of the time and 1-in-6 are abnormal. Wraith leaves no prints from salt steps. Some prints decay over time.
- Sanity Medication: restores sanity (~40%). Cures Moroi curse if applied promptly.
- Head Gear (night vision): no per-ghost overrides.
- Crucifix (covered above).
- Ghost Writing Book: writes when triggered; default behaviour.

## CC.9 Forced and fake evidence rules

| Ghost | Forced (always shown even on reduced-evidence) | Fake (extra signal not in trio) |
|---|---|---|
| Deogen | Spirit Box | None |
| Goryo | D.O.T.S. Projector | None |
| Hantu | Freezing Temperatures | None |
| Moroi | Spirit Box | None |
| Obake | Ultraviolet (Fingerprints) | None |
| The Mimic | None of the standard three is forced | Ghost Orb (always present, even at 0-evidence custom) |
| All others | None | None |

(Forced evidences mean: even on Nightmare or Insanity where the count is reduced, that one evidence will always appear. The Mimic's Ghost Orb is a fake-fourth signal — it's there on top of whatever else the Mimic shows.)

## CC.10 Speed and threshold quick-reference (verbatim)

| Ghost | Speed | Hunt threshold | Forced/Fake evidence |
|---|---|---|---|
| Banshee | 1.7 m/s | 50% (target sanity) | None / None |
| Dayan | 1.2 / 1.7 / 2.25 m/s (state-conditional) | 45 / 50 / 65% (state-conditional) | None / None |
| Demon | 1.7 m/s | 70% | None / None |
| Deogen | 0.4 / 1.6 / 3.0 m/s (distance-conditional) | 40% | Spirit Box / None |
| Gallu | 1.36 / 1.7 / 1.96 m/s (state-conditional) | 40 / 50 / 60% (state-conditional) | None / None |
| Goryo | 1.7 m/s | 50% | DOTS / None |
| Hantu | 1.4–2.7 m/s (temperature curve) | 50% | Freezing / None |
| Jinn | 1.7 / 2.5 m/s (breaker+distance+LOS gate) | 50% | None / None |
| Mare | 1.7 m/s | 60% (lights off) / 40% (lights on) | None / None |
| Moroi | 1.5–3.71 m/s (sanity curve) | 50% | Spirit Box / None |
| Myling | 1.7 m/s | 50% | None / None |
| Obake | 1.7 m/s | 50% | UV / None |
| Obambo | 1.45 / 1.96 m/s (calm/aggressive) | 10 / 65% (calm/aggressive) | None / None |
| Oni | 1.7 m/s (some sources cite 1.8) | 50% | None / None |
| Onryo | 1.7 m/s | 60% (also forced hunt at 3 flames blown) | None / None |
| Phantom | 1.7 m/s | 50% | None / None |
| Poltergeist | 1.7 m/s | 50% | None / None |
| Raiju | 1.7 / 2.5 m/s (electronics-conditional) | 65% near electronics / 50% otherwise | None / None |
| Revenant | 1.0 / 3.0 m/s (detection-conditional, snap) | 50% | None / None |
| Shade | 1.7 m/s | 35% | None / None |
| Spirit | 1.7 m/s | 50% | None / None |
| Thaye | 2.75 → 1.0 m/s (age-conditional) | 75% → 15% (age-conditional, −6%/age, 11 tiers) | None / None |
| The Mimic | Variable (copies host) | Variable (copies host) | None / Ghost Orb |
| The Twins | 1.5 / 1.9 m/s (dual entities) | 50% | None / None |
| Wraith | 1.7 m/s | 50% | None / None |
| Yokai | 1.7 m/s | 80% (voice within 2 m) / 50% otherwise | None / None |
| Yurei | 1.7 m/s | 50% | None / None |

---

# Part II — Ghost Catalogue

## Banshee

### 1. Identity Summary
The Banshee is a stalker ghost. It picks one player at the start of the contract — the **target** — and most of its behaviour keys off that single player rather than the team. It is famous for two things: (1) its hunt threshold is read off the *target's* sanity, not the team average, and (2) its parabolic-microphone screech is its single most unique recording clue. Lore-wise, Banshees are female death-omen spirits from Irish mythology; the in-game model and voice are female.

### 2. Evidence
- **Trio:** D.O.T.S. Projector, Fingerprints (UV), Ghost Orb.
- Forced evidence: **None**.
- Fake evidence: **None**.
- On reduced-evidence difficulties (Nightmare = 2 of 3, Insanity = 1 of 3), any of the trio can be the one withheld; nothing about Banshee guarantees a specific evidence remains.

### 3. Hunt Thresholds
- Hunts when the **target player's sanity** is at or below **50%**, regardless of team average.
- 10% per-tick hunt-roll once threshold is crossed; ~16.7% (1/6) at threshold − 25% (target sanity ≤ 25%).
- If the target is dead, the Banshee falls back to standard team-average behaviour and effectively reverts to a 50% team-average threshold; a new target is **not** picked from the survivors.

### 4. Hunt Speed
- Base speed: **1.7 m/s**.
- LOS acceleration applies normally (+0.05× base/s, cap 1.65× = 2.805 m/s after 13 s).
- Decay applies normally (−0.01× base/s, ~65 s back to base).

### 5. Hunt Vision / Detection / Targeting
- During a hunt, the Banshee **prioritises its target**: it pathfinds toward the target's last-known location even if non-target players are closer. Non-targets can still be killed if the Banshee runs into them, but they will not draw the Banshee away from a successful target track.
- Standard hunt vision: ~15 m sighted line-of-sight pickup; LOS through doorways and across rooms.
- If the target is on a different floor, the Banshee will leave its current floor to pursue.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility (visible to all players when manifested).
- Standard flashlight flicker behaviour (electronics within ~10 m flicker, full kill at ~7.5 m).
- Standard EMF spikes during hunts.
- Audio: standard hunt heartbeat from ~10 m. The Banshee's signature audio cue is its **screech**, which fires from the parabolic microphone and the sound recorder rather than from ambient hunt noise.

### 7. Sanity Interactions
- Passive drain follows defaults; the Banshee does not amplify drain.
- Ghost-event drain is standard (~10–25%).
- The Banshee's targeting does not by itself drain extra sanity; players are not informed who the target is via UI.

### 8. Ghost Events / Manifestation Tendencies
- Ghost events follow the standard mix (singing, airball, manifest).
- The Banshee can sing during interactions, producing a recognisable female vocal heard at short range.
- The "singing" ghost-event is statistically more common for the Banshee than for most ghosts; sources mark this as *flavour-strong but not deterministic* — i.e., do not use singing alone as positive ID.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room behaviour.
- During interactions outside hunts, the Banshee may follow its target around — appearing on DOTS or producing EMF interactions in the target's vicinity even when the favourite room is elsewhere. This is informally called "target stalking".

### 10. Interaction Behavior
- Standard ghost interactions (door slams, light switches, throws).
- No abnormally high or abnormally low interaction rate.
- Tends to interact more often **near the target** than near non-targets when paths are equivalent.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** ghost orbs visible on night vision; standard.
- **DOTS Projector:** standard silhouette appearance; visibility per-ghost-event; no Banshee-specific override beyond the trio inclusion.
- **EMF Reader:** standard EMF 5 spikes possible (since EMF 5 is *not* in the trio, EMF 5 from a Banshee implies a non-evidence interaction tier — typically caps at EMF 2/3/4 from interactions).
- **Spirit Box:** Spirit Box is **not** in Banshee's trio, so direct Spirit-Box responses are negative for Banshee (a true Spirit-Box response rules Banshee out unless the player is mistaking ambient noise).
- **Ultraviolet (UV) Flashlight:** Fingerprints/handprints are in the trio; Banshee leaves them on doors, light switches, windows, and keyboards per standard timer (~120 s decay).
- **Thermometer:** Freezing is **not** in the trio; the Banshee will not push a room below 0 °C from its own presence. Cold rooms (~6–10 °C) are still common in the favourite room as standard behaviour.
- **Ghost Writing Book:** not in trio; should never write.
- **Photo Camera:** standard ghost-photo evidence on manifest. No special behaviour like Phantom's vanish.
- **Sound Recorder:** captures the Banshee's screech as an EVP sample. This is a strong recording clue in its own right and — together with the parabolic clue — gives Banshee two distinct recording-based tells.
- **Parabolic Microphone:** **Banshee's signature interaction.** When the parabolic detects a paranormal sound, there is a **1/3 (33%)** chance the sound it picks up is a screech rather than a generic ghost noise. Range: parabolic default 30 m. The screech is unique to Banshee; if a screech is captured, the ghost is the Banshee with very high confidence.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** Banshee steps in salt and leaves UV-revealable footprints (UV is in trio, so this is on-evidence).
- **Firelight / Candle / Lighter:** no special interaction.
- **Crucifix:** Tier I 3 m, Tier II 4 m. **Special rule:** when a hunt would start while the target is within crucifix range, the hunt is *always* blocked — the dice roll is bypassed. This makes Banshee uniquely vulnerable to a well-placed crucifix on the target.
- **Incense / Smudge:** standard ~5 s blind during hunt, 90 s next-hunt block outside hunt.
- **Sanity Medication:** standard +40% restoration; does not reset target selection.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** parabolic microphone screech. Sit in a known-active room with the parabolic out; if a screech is picked up rather than a generic groan, Banshee is essentially confirmed.
- **Secondary test:** identify the target by watching where DOTS / EMF / interactions cluster — if one specific player keeps drawing activity even when separated from the team, that's consistent with a Banshee target lock.
- **Confirm:** crucifix on the target; if hunts at low target sanity stop occurring while crucifix is in 3 m, that's a very strong corroboration.

### 13. Common False Positives
- "Singing" ghost event also possible for Wraith, Spirit, and others — singing alone is **not** a Banshee tell.
- Female ghost voice on Spirit Box ≠ Banshee (Spirit Box isn't in Banshee's trio).
- A single screech captured on the parabolic *can* be a misidentified ambient sound; require a clean screech with no overlapping wind/ambience.

### 14. Gender / Model / Name Restrictions
- Model: female.
- Name: drawn from the female-ghost name pool only.
- No first-name-collision restrictions known.

### 15. Media / Recording Clues
- **Parabolic screech:** primary unique recording clue.
- **Sound recorder EVP:** Banshee screech can be captured here too as a high-amplitude female vocal.
- **Photo camera:** standard ghost photo on manifest.

### 16. Multiplayer-Specific Notes
- The target is selected at contract start and stays the target for the whole contract (until they die).
- The team **cannot see** who is the target via UI; they have to infer from behaviour.
- The target's *sanity* is the trigger — so the team's healthiest player can be the trigger if they happen to be the target.
- Smart play: have the target stay in a high-light area with the crucifix on them, while non-targets push the investigation.

### 17. Custom Difficulty / Evidence Count Caveats
- On 0-evidence custom modes, Banshee's only true evidence is behavioural — parabolic screech becomes the sole reliable identifier.
- Sanity-low-cap custom modes change when the 50% threshold actually fires but do not change the target rule.

### 18. Exact Implementation Notes for Haunted
- Pick a target player at contract start; persist `targetPlayerId`.
- `getHuntThreshold(ghost)` for Banshee returns 50% but reads `targetPlayer.sanity` rather than team average.
- Crucifix check: if `ghost.type === "banshee" && distance(target, crucifix) <= crucifix.range`, suppress the hunt unconditionally.
- Parabolic mic: when a paranormal sound rolls, with `Math.random() < 1/3`, replace the sound with a unique screech sample (`audio/sfx/banshee_screech.*`) tagged in journal as a Banshee-specific clue.
- Targeting in hunts: pathfind toward `targetPlayer.lastKnownPosition` until LOS on any player is gained.
- DOTS, UV, Orb behaviours: default.

### 19. Debug Requirements
- `__debug.banshee.target` getter: returns current target player id.
- `__debug.banshee.forceScreech()`: forces the next parabolic roll to produce a screech.
- `__debug.banshee.testCrucifixBlock()`: simulates a hunt-roll while target is in crucifix range; should always return blocked.
- Journal entry should expose "screech captured" as a discrete UI element distinct from generic parabolic hits.

### 20. Confidence / Source Notes
- Trio (DOTS, UV, Orb): high confidence, multi-source agreement (keengamer Banshee guide; progameguides Banshee guide; screenrant 2026 ghost list).
- Target-sanity rule: high confidence.
- 1/3 parabolic screech: high confidence (Steam community guide #3464855117 March 2026 cites 33%).
- Crucifix-always-blocks-hunt: high confidence.
- Singing-event correlation: medium confidence — flavour, not deterministic.

---

## Dayan

### 1. Identity Summary
The Dayan is a movement-reactive ghost: its **speed and hunt threshold both rise** when at least one player is moving (walking, running, or running-while-near) inside its detection radius, and **fall** when nearby players stand still or crouch-walk. It is the canonical "stalker that punishes panic". Lore: female-only model in the live game.

### 2. Evidence
- **Trio:** EMF Level 5, Ghost Writing, Spirit Box.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Tri-tier, conditional on player movement within ~10 m of the Dayan:
  - **No nearby movement (calm):** **45%** team-average sanity threshold.
  - **At least one nearby player walking:** **50%** (default).
  - **At least one nearby player sprinting:** **65%** (i.e., easier to trigger a hunt — the Dayan grows aggressive).
- Threshold is re-evaluated continuously; standing perfectly still drops the Dayan back to its calm tier.

### 4. Hunt Speed
- Tri-tier, same trigger as threshold:
  - **Calm:** **1.2 m/s**.
  - **Walking-detected:** **1.7 m/s** (default).
  - **Sprint-detected:** **2.25 m/s**.
- LOS acceleration applies on top of the active tier (so a sprint-tier Dayan with full LOS will exceed 2.25 m/s).
- Decay back to base bleeds normally.

### 5. Hunt Vision / Detection / Targeting
- Hunt vision standard ~15 m.
- Detection radius for the speed/threshold modulation: **~10 m**, sphere around the Dayan, ignores walls.
- Targets the closest player in LOS during a hunt.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.
- Standard heartbeat audio at ~10 m.
- During a sprint-tier hunt the Dayan can feel "fast for no reason" because the player triggering the tier may be a different player than the one being chased.

### 7. Sanity Interactions
- Standard passive sanity drain.
- No special amplification.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.
- Female-voice singing is possible (model is female) but not statistically elevated.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room behaviour.
- Wanders more aggressively when players sprint near it (informally observed; treat as flavour).

### 10. Interaction Behavior
- Standard interaction rate.
- More likely to interact when the team is moving fast through its room.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard.
- **DOTS Projector:** *not* in trio — never appears.
- **EMF Reader:** Reaches EMF 5 (in trio); standard interaction tiers otherwise.
- **Spirit Box:** in trio; female voice on responses.
- **UV Flashlight:** *not* in trio — no fingerprints.
- **Thermometer:** Freezing not in trio; cold-room flavour only.
- **Ghost Writing Book:** in trio; standard write timer (~120–240 s of being in the room).
- **Photo Camera:** standard.
- **Sound Recorder:** standard EVPs.
- **Parabolic Microphone:** standard sound pickup.
- **Motion Sensor:** *highly relevant* — placing motion sensors in the favourite room confirms that the Dayan's movement modulates with team movement.
- **Sound Sensor:** standard.
- **Salt:** steps and leaves prints; UV not in trio so prints from salt are a non-trio observation (still visually visible to player but does not register as evidence).
- **Firelight / Candle / Lighter:** no special interaction.
- **Crucifix:** Tier I 3 m, Tier II 4 m, default behaviour.
- **Incense / Smudge:** default 5 s blind, 90 s next-hunt block.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** sit absolutely still inside the favourite room with a thermometer and a motion sensor; have a teammate sprint in and out repeatedly. If average ghost speed (timed across two hallway markers) jumps with sprinting and falls with stillness, Dayan is consistent. Combined with a confirmed evidence trio of EMF 5 + Ghost Writing + Spirit Box, ID is solid.
- **Quickest test:** evidence trio alone. Dayan is the **only** ghost with EMF 5 + Ghost Writing + Spirit Box (subject to verification on the live wiki — the trio overlaps no other ghost as of 2026-04-29).

### 13. Common False Positives
- A normally fast hunt by any ghost can mimic the sprint-tier Dayan if the player wasn't watching for the trigger.
- Spirit Box + Ghost Writing without EMF 5 also matches Spirit; do not call Dayan without EMF 5.

### 14. Gender / Model / Name Restrictions
- Model: female only.
- Name pool: female names only.

### 15. Media / Recording Clues
- No unique recording clue.

### 16. Multiplayer-Specific Notes
- Communicate "everyone walk" or "everyone stop" to the team; movement state of *any* nearby player drives the modulation.

### 17. Custom Difficulty / Evidence Count Caveats
- On 2-evidence (Nightmare) Dayan can show any 2 of EMF/Writing/SB; on 1-evidence (Insanity) any 1.
- 0-evidence custom: rely entirely on speed/threshold modulation observation.

### 18. Exact Implementation Notes for Haunted
- `getHuntThreshold(ghost)` for Dayan returns 45/50/65 based on `nearbyPlayerMovementTier` (still / walk / sprint). Use the highest tier any player within 10 m is currently in.
- Speed override per tick: pick speed from same tier, then apply LOS acceleration.
- Add a movement-tier debug overlay showing which tier currently applies.
- **Note (Haunted-current):** the in-repo Dayan is non-canonical (different evidence). Update the registry to EMF 5 / Ghost Writing / Spirit Box for canonical fidelity, OR keep as a Haunted-original variant with a clearly labelled note in the journal.

### 19. Debug Requirements
- `__debug.dayan.tier` getter: returns "still" | "walk" | "sprint".
- `__debug.dayan.forceTier(tier)`: pin the tier for testing.
- `__debug.dayan.speed`: returns current effective speed.

### 20. Confidence / Source Notes
- Three speed/threshold tiers and 10 m detection radius: high confidence (per-ghost guides on dotesports, screenrant, keengamer, all dated 2025–2026).
- Female-only model: high confidence.
- Exact threshold values 45/50/65: medium-high confidence — community sources unanimous, but Fandom verification still pending due to 403.

---

## Demon

### 1. Identity Summary
The Demon is the most aggressive ghost: it has the highest hunt threshold of any standard ghost, the shortest hunt cooldown, and a unique negative interaction with Crucifixes and Ouija Boards. It does not stalk a target; it just hunts more often and starts hunting earlier.

### 2. Evidence
- **Trio:** Fingerprints (UV), Ghost Writing, Freezing Temperatures.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- **70%** team-average sanity. The Demon can hunt at sanities where almost every other ghost cannot.
- 10% per-tick hunt-roll above the standard threshold; standard 1/6 at threshold − 25%.

### 4. Hunt Speed
- Base speed: **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.
- Targets nearest player in LOS; no special targeting rule.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.
- Standard heartbeat audio at ~10 m.

### 7. Sanity Interactions
- Standard passive drain.
- The Demon does not amplify sanity drain — its threat is *frequency of hunts*, not faster sanity loss.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.
- Some sources note slightly elevated airball events; treat as flavour.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room behaviour.

### 10. Interaction Behavior
- Standard interaction rate.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard.
- **DOTS Projector:** *not* in trio — should never appear.
- **EMF Reader:** EMF 5 is *not* in trio; max EMF spike from interactions is EMF 2/3/4.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** in trio. Standard fingerprints / handprints / footprints.
- **Thermometer:** Freezing in trio; ghost room drops below 0 °C.
- **Ghost Writing Book:** in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard EVPs.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** steps; UV in trio so prints are on-evidence.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** **Demon-specific buffed range — Tier I 5 m, Tier II 6 m** (community sources cite 4.5/6/7.5 across patches; current consensus is 5/6 for default tiers, with deeper tier values **Unknown — requires current Phasmophobia Wiki verification**). The Demon "burns through" crucifix charges faster — once range is breached the crucifix is consumed faster than for normal ghosts.
- **Incense / Smudge:** Demon-specific override — using a smudge stick on the Demon while it is **not** hunting blocks its **next hunt for 60 s only** (vs the default 90 s). During a hunt the standard ~5 s blind still applies.
- **Ouija Board:** **Demon-specific** — using a Ouija Board increases hunt-roll likelihood (some sources describe this as "asking a Ouija question can trigger a hunt directly when ghost is willing"). Net effect: never use Ouija around a suspected Demon.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** observe hunts above 50% team-average sanity. If hunts occur at 60–70% with no Onryo-flame condition, Demon is highly likely.
- **Cooldown test:** time the gap between two consecutive hunts. A Demon's cooldown is **20 s** vs the standard 25 s; this can be measured indirectly.
- **Smudge test:** smudge in the favourite room, then time how long until the next hunt is *possible*. ~60 s for a Demon vs ~90 s for a standard ghost.

### 13. Common False Positives
- High-threshold-feel can be confused with Yokai (80% threshold while voice is detected within 2 m), Onryo (60% + flame-blown forced-hunt), or Mare (60% with lights off). Distinguish via evidence trio and by checking voice/flame/light triggers.

### 14. Gender / Model / Name Restrictions
- No gender restriction; uses both pools.

### 15. Media / Recording Clues
- No unique recording clue.

### 16. Multiplayer-Specific Notes
- Tell the team to **never** use the Ouija Board on a suspected Demon.
- The Demon will hunt at sanities the team thinks are "safe" — never let the team relax above 50%.

### 17. Custom Difficulty / Evidence Count Caveats
- On Nightmare any 2 of UV/Writing/Freezing show; on Insanity any 1.
- Threshold-only-difference custom modes that lower hunt threshold globally make the Demon's relative advantage smaller; threshold-clamped modes (e.g., max 25%) effectively neutralise it.

### 18. Exact Implementation Notes for Haunted
- `getHuntThreshold(ghost)` for Demon returns **70**.
- `huntCooldownSeconds` for Demon = **20** (vs default 25).
- Crucifix radius lookup: when ghost is Demon, use 5 m / 6 m for Tier I / II respectively.
- Smudge applied outside hunt: schedule next-hunt unblock at +60 s instead of +90 s.
- Ouija interaction: roll a hunt-attempt with elevated weight on each Ouija question event when ghost is Demon.

### 19. Debug Requirements
- `__debug.demon.cooldown`: returns 20.
- `__debug.demon.crucifixRange(tier)`: returns 5 / 6.
- `__debug.demon.smudgeBlockDuration`: returns 60.
- `__debug.demon.testOuijaHuntRoll()`: simulates the elevated hunt-roll on a Ouija question.

### 20. Confidence / Source Notes
- 70% threshold: high confidence.
- 20 s cooldown: high confidence.
- 5 m / 6 m crucifix: medium-high confidence; some sources cite 4.5 / 6 or 6 / 7.5 across patches. Treat **deeper tiers as Unknown — requires current Phasmophobia Wiki verification**.
- 60 s smudge override: high confidence.
- Ouija hunt-trigger: medium confidence — descriptions vary on whether it is a guaranteed hunt or just a buffed roll.

---

## Deogen

### 1. Identity Summary
The Deogen is the "always finds you" ghost: it always knows the location of every player on the map, and it speeds up dramatically as it gets far from its target and slows to a crawl when close. It is the canonical "outrun, don't outsmart" hunt. It is uniquely vulnerable to a player with low sanity who can stand in a doorway and forever hold it back, because at point-blank distance its speed drops to 0.4 m/s.

### 2. Evidence
- **Trio:** Spirit Box, Ghost Writing, D.O.T.S. Projector.
- Forced evidence: **Spirit Box** (always shown, including on reduced-evidence difficulties).
- Fake evidence: **None**.

### 3. Hunt Thresholds
- **40%** team-average sanity. Lower than the default 50% — the Deogen requires more sanity drain before it will hunt.
- 10% per-tick hunt-roll above threshold; standard 1/6 at threshold − 25%.

### 4. Hunt Speed
- Distance-conditional, three-tier:
  - **Far** (greater than ~6 m from target): **3.0 m/s** — the fastest standard hunt speed in the game.
  - **Mid** (~2.5–6 m): **1.6 m/s**.
  - **Close** (≤ ~2.5 m): **0.4 m/s** — slower than a crouch-walking player.
- LOS acceleration **does not apply** — the distance curve overrides it.
- Decay: not applicable (speed is purely distance-driven).

### 5. Hunt Vision / Detection / Targeting
- **Always-track:** the Deogen always knows the position of every player. It does not need LOS to pathfind.
- Targets the closest player.
- Will move through optimal paths around walls toward whoever is nearest.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.
- **Audio:** the Deogen has heavy breathing audible from a long distance during interactions and hunts; this is one of its most reliable identifiers.

### 7. Sanity Interactions
- Standard passive drain.
- The 40% threshold means a longer, more nerve-wracking lead-up to the first hunt.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.
- The breathing sound during interactions is its signature flavour.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.
- During hunts, distance-curve dominates positioning — players can intentionally hold the Deogen in a doorway by staying within 2.5 m of it.

### 10. Interaction Behavior
- Standard interaction rate.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard.
- **DOTS Projector:** in trio; standard silhouette.
- **EMF Reader:** EMF 5 *not* in trio.
- **Spirit Box:** in trio AND forced — always available even on reduced-evidence custom difficulties.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** Freezing not in trio.
- **Ghost Writing Book:** in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** can capture the heavy-breathing sample as an EVP — secondary identifier.
- **Parabolic Microphone:** picks up Deogen breathing at long range; **strong identifier** when paired with the trio.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** steps; UV not in trio so prints are off-evidence.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard 5 s blind / 90 s next-hunt block.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** Spirit Box at 50%+ team-average sanity. Spirit Box is forced for the Deogen, so a Spirit-Box response in a high-sanity situation is consistent with Deogen.
- **Hunt-speed test:** if a player can hold the ghost back by staying within ~2 m, that's a Deogen-only behaviour.
- **Audio test:** breathing on the parabolic at long range is a strong indirect cue.

### 13. Common False Positives
- The Spirit Box force can confuse the team into reading the Deogen as a Spirit when only one or two evidences are visible.
- Heavy breathing sound is shared by no other ghost; do not call breathing for any non-Deogen ghost.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Heavy breathing on parabolic and sound recorder.

### 16. Multiplayer-Specific Notes
- Designate one player as the "tank" who stays close to the Deogen during hunts to keep speed low while others escape.
- Communicate clearly: anyone running away creates the high-speed condition for the player closest to the ghost.

### 17. Custom Difficulty / Evidence Count Caveats
- Even on 0-evidence custom, **Spirit Box still appears** for Deogen because it is forced.
- Lower thresholds (e.g., 25% custom) make the Deogen even more lurking and oppressive.

### 18. Exact Implementation Notes for Haunted
- `getHuntThreshold(ghost)` for Deogen returns **40**.
- During hunts, override speed via distance curve: `dist > 6 ? 3.0 : dist > 2.5 ? 1.6 : 0.4`. **Do not** apply LOS acceleration on top.
- Targeting: always knows nearest-player position; pathfind continuously without LOS gating.
- Spirit Box: when generating the evidence list (including reduced-evidence custom modes), always include Spirit Box for Deogen.
- Add a long-range breathing audio loop near the ghost during hunts and (more quietly) during interactions.

### 19. Debug Requirements
- `__debug.deogen.distanceTier`: returns "close" | "mid" | "far".
- `__debug.deogen.speed`: returns current effective speed.
- `__debug.deogen.testForcedSB(difficulty)`: confirms SB shows on every difficulty.

### 20. Confidence / Source Notes
- Trio + forced Spirit Box: high confidence.
- 40% threshold: high confidence.
- Distance-curve speeds 0.4 / 1.6 / 3.0: high confidence (consistent across keengamer, screenrant, dotesports, Steam guide).
- No-LOS-accel rule: high confidence.

---

## Gallu

### 1. Identity Summary
The Gallu is a state-machine ghost: it cycles through three states (Calm → Provoked → Enraged) driven by player use of defensive tools (incense, crucifix, salt). Each state changes its speed, threshold, and how it reacts to defensive equipment. It is the canonical "punishes panic-smudging" ghost.

### 2. Evidence
- **Trio:** EMF Level 5, Spirit Box, Freezing Temperatures.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- State-conditional:
  - **Calm:** **40%**.
  - **Provoked:** **50%**.
  - **Enraged:** **60%**.
- 10% per-tick hunt-roll above the active threshold.
- State changes update the threshold on the same tick.

### 4. Hunt Speed
- State-conditional:
  - **Calm:** **1.36 m/s** (slower than default).
  - **Provoked:** **1.7 m/s** (default).
  - **Enraged:** **1.96 m/s** (faster).
- LOS acceleration applies on top of state speed.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.
- Targets nearest player in LOS.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.
- During Enraged state, hunt audio (heartbeat + footsteps) feels heavier; treat as flavour unless a precise audio modifier surfaces on the wiki.

### 7. Sanity Interactions
- Standard passive drain in Calm.
- Drain may be slightly elevated in Enraged; **Unknown — requires current Phasmophobia Wiki verification**.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.
- Wanders more aggressively in Enraged state.

### 10. Interaction Behavior
- Interaction frequency increases with state escalation.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** in trio.
- **Spirit Box:** in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** Freezing in trio.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** **Gallu-specific — when Enraged, it does not step in fresh salt piles.** This is the canonical Gallu behaviour: a salt pile that the team places after seeing a hunt may be skipped, breaking salt-print evidence chains.
- **Firelight / Candle / Lighter:** no specific override.
- **Crucifix:** **escalation trigger** — placing a crucifix near the favourite room shifts state Calm → Provoked. Standard 3 m / 4 m radii.
- **Incense / Smudge:** **escalation trigger AND state-modulated effectiveness**. Smudging during Calm provokes (Calm → Provoked). Smudging during Provoked enrages (Provoked → Enraged). Smudge blind duration during a hunt is shorter in higher states (community sources cite ~5 s in Calm down to ~2.5 s in Enraged; **Unknown — requires current Phasmophobia Wiki verification** for exact numbers).
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** observe state transitions. Place a crucifix → state escalates. Smudge → state escalates further. If hunt threshold and speed both shift in lockstep with these actions, Gallu is confirmed.
- **Salt-skip test (Enraged only):** drop a salt pile in front of a known path; if the ghost passes through without stepping, that's a Gallu Enraged signal.

### 13. Common False Positives
- A normal ghost speed change can be confused with LOS acceleration.
- Wraith (no salt prints ever) can mimic a Gallu salt-skip in Enraged. Use evidence trio to disambiguate.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- No unique recording clue.

### 16. Multiplayer-Specific Notes
- Brief the team: **do not panic-smudge a Gallu** outside hunts — it makes the ghost more dangerous.
- Coordinate state-test sequence: place crucifix, observe; smudge once, observe; do not smudge a second time unless willing to enter Enraged.

### 17. Custom Difficulty / Evidence Count Caveats
- On 2-evidence Nightmare any 2 of EMF/SB/Freezing show; on 1-evidence Insanity any 1.
- Custom no-evidence: rely on the state machine + salt-skip behaviour for ID.

### 18. Exact Implementation Notes for Haunted
- Add a `gallu.state` enum (`"calm" | "provoked" | "enraged"`).
- Hooks: `crucifix_placed_near_room` → `provoke()`. `smudge_used_outside_hunt` → state++ (max enraged).
- `getHuntThreshold(ghost)` for Gallu reads `40 / 50 / 60` from state.
- Speed override per tick reads `1.36 / 1.7 / 1.96` from state.
- Salt-step logic for Gallu: if `state === "enraged"` and salt pile is "fresh" (placed within last N seconds), skip it. Choose a freshness window (~30 s default; mark as **Unknown — requires verification**).
- Smudge blind duration during hunt: 5 / 3.75 / 2.5 s for Calm / Provoked / Enraged respectively (mark as **Unknown — requires verification** in journal text).

### 19. Debug Requirements
- `__debug.gallu.state` getter and `__debug.gallu.setState(state)` setter.
- `__debug.gallu.threshold`, `.speed`, `.smudgeBlindSeconds` getters.
- `__debug.gallu.testSaltStep()` returns whether the ghost would step on a fresh pile right now.

### 20. Confidence / Source Notes
- Three-state machine: high confidence (community-sourced; Steam guide cites 3-state model).
- Speeds 1.36 / 1.7 / 1.96: medium-high confidence; sources match.
- Thresholds 40 / 50 / 60: medium-high confidence.
- Smudge blind-duration scaling: **medium confidence** — direction agreed (shorter in higher states) but exact numbers vary.
- Salt-skip when Enraged: medium-high confidence.

---

## Goryo

### 1. Identity Summary
The Goryo is a video-camera ghost: it shows on D.O.T.S. **only through a video camera feed**, never to the naked eye. It also is shy — it only triggers DOTS when no players are in the same room. Its identity is built around forcing the team to set up a camera and watch from elsewhere.

### 2. Evidence
- **Trio:** EMF Level 5, Fingerprints (UV), D.O.T.S. Projector.
- Forced evidence: **D.O.T.S. Projector** (always present, even on reduced-evidence custom modes).
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.
- Targets nearest player in LOS.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard.

### 7. Sanity Interactions
- Standard.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.
- Goryo may be unusually room-locked: many sources note it rarely leaves its favourite room outside hunts.

### 9. Roaming / Favorite Room / Wandering
- **Heavy room-stay tendency.** Goryo wanders less than the typical ghost outside hunts. Its DOTS activity is concentrated in the favourite room.

### 10. Interaction Behavior
- Standard interaction rate.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** **central to identification.** Goryo's DOTS silhouette is visible *only when seen through a video camera feed* (placed video camera + truck monitor view). Looking at the DOTS projector with the naked eye in the room will show *no* silhouette.
- **DOTS Projector:** in trio + forced. **Restriction:** Goryo only triggers DOTS when there are **no living players in the same room** as the projector. If a player is in the room, the silhouette will not appear even on the camera feed.
- **EMF Reader:** in trio. Standard EMF 5 spikes possible.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** in trio. Standard fingerprints / handprints.
- **Thermometer:** Freezing not in trio; cold-room flavour only.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard step + UV-revealable prints.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** place a video camera + DOTS projector in the favourite room and watch the camera feed from the truck. If a DOTS silhouette appears on the feed but no player in the room sees it directly, Goryo is confirmed.
- **Player-presence test:** stand in the room watching DOTS — silhouette will not appear. Step out and watch from the truck — silhouette can appear.

### 13. Common False Positives
- A live-eye DOTS sighting **rules Goryo out**.
- Other DOTS ghosts (Banshee, Phantom, etc.) will show on both naked eye and video camera; Goryo only shows on camera.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- The video-camera DOTS feed is the unique recording clue.

### 16. Multiplayer-Specific Notes
- Designate one player to monitor the truck camera feed while others stay out of the favourite room.
- Coordinate so no player accidentally enters the room while the truck-watcher is testing.

### 17. Custom Difficulty / Evidence Count Caveats
- DOTS is forced; even on 0-evidence custom, DOTS will appear (via video camera, with no players in room).
- 1-evidence Insanity: DOTS is the one that always appears.

### 18. Exact Implementation Notes for Haunted
- DOTS projector silhouette spawn: only render the silhouette on the **camera feed render path** for Goryo, not the in-world render path.
- Player-in-room gating: track which players are in the projector's room. If `roomOccupancy.players > 0`, suppress DOTS spawn entirely.
- Forced-evidence list for Goryo includes DOTS for any evidence-count difficulty.
- Make sure the camera feed has its own DOTS render layer.

### 19. Debug Requirements
- `__debug.goryo.dotsVisibleNakedEye(playerInRoom)`: should always return false.
- `__debug.goryo.dotsVisibleOnCamera(playerInRoom)`: returns true if `playerInRoom === 0`.
- `__debug.goryo.forceDots()`: forces a DOTS event for testing the camera feed gating.

### 20. Confidence / Source Notes
- Trio: high confidence.
- Forced DOTS: high confidence.
- Camera-only DOTS: high confidence.
- No-player-in-room rule: high confidence.

---

## Hantu

### 1. Identity Summary
The Hantu is a temperature-curve ghost: its hunt speed scales **inversely with room temperature** — colder rooms make it faster, warmer rooms make it slower. It is also weak to lit electrical breakers (turning the breaker on slows it). It is the canonical "shut the breaker off" puzzle ghost.

### 2. Evidence
- **Trio:** Fingerprints (UV), Ghost Orb, Freezing Temperatures.
- Forced evidence: **Freezing Temperatures** (always shown, including on reduced-evidence custom modes).
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Temperature-conditional, six-tier curve (Celsius):
  - **≥ 15 °C:** **1.4 m/s**.
  - **12 °C:** **1.75 m/s**.
  - **9 °C:** **2.1 m/s**.
  - **6 °C:** **2.3 m/s**.
  - **3 °C:** **2.5 m/s**.
  - **≤ 0 °C:** **2.7 m/s**.
- Speed is sampled from the **room the Hantu is currently in**, not the player.
- LOS acceleration applies on top of the temperature-tier base.
- Decay: when temperature rises, speed shifts to the new tier on the next tick (not gradually).

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.
- Targets nearest player in LOS.

### 6. Hunt Visibility / Flicker / Audio Feel
- **Hantu-specific:** during a hunt, the Hantu emits a **visible breath cloud** (cold-air exhale) when it appears in cold rooms. This is a unique visual cue.
- Standard hunt visibility otherwise.
- Standard flicker.

### 7. Sanity Interactions
- Standard.
- Cold rooms drain sanity slightly faster as flavour; not Hantu-specific.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.
- Visible-breath ghost-event behaviour reinforces the temperature theme.

### 9. Roaming / Favorite Room / Wandering
- Favourite room is colder than typical (often well below 0 °C). Hantu actively cools its room.

### 10. Interaction Behavior
- Standard interaction rate.
- **Breaker-off behaviour:** with the breaker off the Hantu interacts more often (some sources cite increased throwing frequency); this is a flavour rule.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard. Cold-breath visible-cue captures on camera.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** EMF 5 *not* in trio.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** in trio. Standard fingerprints / handprints.
- **Thermometer:** in trio AND forced. **Always reads below 0 °C** in the favourite room.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** standard. Visible breath also photographable.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Breaker (lit / unlit):** **Hantu-specific.** When the breaker is **on**, the Hantu's hunt speed drops to its slowest tier (1.4 m/s) **regardless of temperature**. When the breaker is **off**, the temperature curve fully applies. This is the primary defensive trick: keep the breaker on whenever possible.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** thermometer in favourite room — Hantu rooms drop to 0 °C or below very quickly. Combined with the breaker-on slow-speed test (turn the breaker on during a hunt; if speed visibly drops to ~1.4 m/s, that's a Hantu).
- **Visible breath:** if the ghost exhales a visible cloud during interactions, that's Hantu.

### 13. Common False Positives
- Any ghost with Freezing in trio (Demon, Yokai, Mare under some configs) can produce sub-zero rooms; do not call Hantu on cold alone.
- LOS-accelerated standard ghosts can match Hantu's mid-tier speed; the breaker-on slow-down is the more reliable test.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools (lore: Malay/Indonesian "ghost" — gender-neutral).

### 15. Media / Recording Clues
- Visible breath on camera and photo.

### 16. Multiplayer-Specific Notes
- Designate one player to monitor the breaker. Keep it on during hunts.
- The cold-room hunt is brutal; never explore a Hantu favourite room with the breaker off.

### 17. Custom Difficulty / Evidence Count Caveats
- Even on 0-evidence custom, **Freezing always shows** (forced).
- No-breaker custom modes (some maps lock the breaker off) make Hantu always max-tier — extra dangerous.

### 18. Exact Implementation Notes for Haunted
- Speed override per tick:
  - If breaker is on: **1.4 m/s** flat.
  - Else: read room temperature, map to tier (15/12/9/6/3/0 → 1.4/1.75/2.1/2.3/2.5/2.7).
- Apply LOS acceleration on top of the resolved base speed.
- Forced-evidence list always includes Freezing.
- Visible-breath particle effect in cold rooms during interactions and hunts.

### 19. Debug Requirements
- `__debug.hantu.tempTier`: returns active tier.
- `__debug.hantu.speed`: returns effective speed.
- `__debug.hantu.breakerEffect()`: returns the calculated speed when breaker is on vs off, given current temperature.

### 20. Confidence / Source Notes
- Trio + forced Freezing: high confidence.
- Six-tier temperature speed curve 1.4–2.7 m/s: high confidence (Steam guide March 2026, keengamer, dotesports all match).
- Breaker-on slow-down to 1.4 m/s: high confidence.
- Visible breath: high confidence.

---

## Jinn

### 1. Identity Summary
The Jinn is a fast-but-conditional ghost: it's faster than default while it has line-of-sight on a player **and** the breaker is on **and** the player is more than ~3 m away. Turn the breaker off and you remove its speed bonus — and you also drain ~25% sanity from anyone in line of sight. It is the canonical "fast ghost when the lights are on" puzzle.

### 2. Evidence
- **Trio:** EMF Level 5, Fingerprints (UV), Freezing Temperatures.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Conditional, two-tier:
  - **Default tier:** **1.7 m/s**.
  - **Buffed tier:** **2.5 m/s** — applies when **all three** conditions hold simultaneously:
    - Breaker is **on**.
    - Jinn has **direct LOS** on a player.
    - Player is **more than ~3 m** away from the Jinn.
- LOS acceleration applies on top of whichever base tier is active.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.
- Targets nearest player in LOS.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.
- Standard heartbeat audio.

### 7. Sanity Interactions
- **Jinn-specific drain ability:** if the Jinn has LOS on a player and the breaker is on, it can perform a **sanity-drain ability** that knocks **~25%** off that player's sanity in a single event. (Some sources describe this as triggered, others as automatic; **Unknown — requires current Phasmophobia Wiki verification** for exact trigger conditions.)
- Otherwise standard sanity drain.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.

### 10. Interaction Behavior
- Standard interaction rate.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard. Buffed-tier sprint can be timed across two visible markers on a feed.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** in trio.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** in trio.
- **Thermometer:** in trio.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard. Restores sanity drained by the Jinn ability.
- **Breaker (lit / unlit):** **Jinn-specific.** With breaker **off**, the Jinn cannot use the sanity-drain ability and cannot enter the buffed 2.5 m/s tier. Breaker-off is the canonical Jinn defence.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** during a hunt, observe speed at long range with breaker on (~2.5 m/s). Then close to within 3 m or turn the breaker off — speed should drop to 1.7 m/s. If both conditions reproduce, Jinn is confirmed.
- **Sanity-drain test:** stand in LOS of the ghost with breaker on; if a sudden ~25% drop occurs, that's a Jinn.

### 13. Common False Positives
- Revenant has its own slow/snap dual speed; do not confuse.
- LOS-accelerated standard ghosts at long range can briefly hit ~2.5 m/s speeds; the breaker-off invalidation test rules out that confound.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- No unique recording clue.

### 16. Multiplayer-Specific Notes
- Brief team: when the Jinn buffs to 2.5 m/s, run AT it (cross the 3 m line) — its speed drops back to 1.7 m/s.
- Keep one player on the breaker.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour applies.

### 18. Exact Implementation Notes for Haunted
- Speed resolution per tick:
  - If breaker on AND has LOS on player AND distance(ghost, target) > 3 → 2.5 m/s.
  - Else → 1.7 m/s.
- Apply LOS acceleration on top.
- Sanity-drain ability: if breaker on AND LOS on player, with cooldown N (mark **Unknown — requires verification**), trigger -25% on the target.
- Breaker-state hook needed.

### 19. Debug Requirements
- `__debug.jinn.speed`: returns 1.7 or 2.5.
- `__debug.jinn.testSanityDrain()`: simulates the ability.
- `__debug.jinn.breakerOff()` / `breakerOn()`: toggles state for tests.

### 20. Confidence / Source Notes
- Trio: high confidence.
- 1.7 / 2.5 m/s with three conditions: high confidence.
- 25% sanity drain: high confidence (multiple sources).
- Cooldown of sanity-drain ability: medium confidence — sources differ; **Unknown** flag retained.

---

## Mare

### 1. Identity Summary
The Mare is the lights-off ghost: it hunts at a higher sanity threshold when room lights are off, and lower when lights are on. It also actively turns lights off (it cannot turn lights on) and pops bulbs when toggled. It is the canonical "keep the lights on" puzzle ghost.

### 2. Evidence
- **Trio:** Spirit Box, Ghost Orb, Ghost Writing.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Lighting-conditional, two-tier (computed per ghost room / global lighting state):
  - **Lights off** in the ghost's current room: **60%** team-average sanity.
  - **Lights on** in the ghost's current room: **40%** team-average sanity.
- Standard 10% per-tick hunt-roll above active threshold.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard.

### 7. Sanity Interactions
- Standard passive drain.
- Lights-off rooms drain sanity at the standard amplified rate; this stacks with Mare's higher-threshold-when-dark rule, making her uniquely punishing in dark rooms.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.

### 10. Interaction Behavior
- **Mare-specific:** Mare actively turns lights **off** (and breaks them when interacted with) but **cannot turn lights on**. Other ghosts can toggle either way.
- Slightly elevated interaction rate in dark rooms; flavour.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker. Mare doesn't override flashlight behaviour.
- **Video Camera:** standard.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** EMF 5 *not* in trio.
- **Spirit Box:** in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** Freezing not in trio.
- **Ghost Writing Book:** in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard. UV not in trio so prints are off-evidence.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Light switches / lamps / bulbs:** **Mare-specific.** Mare turns lights off and pops bulbs more aggressively. It will not turn a light on under any circumstances. Bulbs in the favourite room may shatter on toggle.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** light-on hunt threshold test. With every room light on, hunts should not start until sanity drops to 40%; with lights off, hunts can start at 60%. If hunts at 55% sanity occur in a dark room but stop occurring once lights come on, Mare is confirmed.
- **Bulb-pop test:** turn a light on near the favourite room. If the ghost turns it off (and pops the bulb) while never turning a light on of its own, that's Mare.

### 13. Common False Positives
- Onryo (60% threshold + flame mechanic) can mimic the high-threshold feel; check candle behaviour to disambiguate.
- Yokai (80% threshold while voice-detected) can also feel "high threshold"; check voice-trigger behaviour.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools (lore: nordic nightmare-bringer).

### 15. Media / Recording Clues
- No unique recording clue.

### 16. Multiplayer-Specific Notes
- Brief team: keep lights on. Replace popped bulbs (cosmetic / flavour) where possible.
- The team's healthiest player should turn lights on as ghost room is approached.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- `getHuntThreshold(ghost)` for Mare reads room-lighting state at decision time: 60 if `room.lightOff`, else 40.
- Light-off behaviour: Mare's interaction roll prefers light-off actions; Mare cannot select a "light on" action.
- Bulb-pop on toggle: when Mare interacts with a light, with elevated probability the bulb pops (purely cosmetic for current Haunted scope).

### 19. Debug Requirements
- `__debug.mare.threshold`: returns 60 or 40 based on current room state.
- `__debug.mare.canTurnLightOn`: returns false.
- `__debug.mare.testBulbPop()`: forces a bulb-pop interaction.

### 20. Confidence / Source Notes
- Trio: high confidence.
- 60 / 40 threshold: high confidence.
- Lights-on-only-off behaviour: high confidence.
- Bulb-pop frequency: medium confidence (variations across sources).

---

## Moroi

### 1. Identity Summary
The Moroi is a sanity-curve ghost: its hunt speed scales with how low the team-average sanity is, capping at very high speeds at extreme low sanity. It also curses players who hear its Spirit-Box responses, doubling their passive sanity drain until cured. Smudge blind duration is halved (~7.5 s vs the default 15 s? — actually, **3 s during hunts**, sources differ; see notes). It is the canonical "the lower your sanity goes, the worse it gets" ghost.

### 2. Evidence
- **Trio:** Spirit Box, Ghost Writing, Freezing Temperatures.
- Forced evidence: **Spirit Box** (always shown).
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Sanity-conditional curve, **based on the team-average sanity at the moment of the hunt**:
  - At 50% sanity: **1.5 m/s** (slower than default).
  - For each 5% the average drops below 50%, **+0.083 m/s** added (community math: ~0.0166 m/s per 1%).
  - At 0% sanity: **3.71 m/s** (game cap).
- LOS acceleration applies on top of the base curve speed.
- Decay: not applicable inside a single hunt, since speed is locked from the average at hunt start.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.
- Targets nearest player in LOS.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.

### 7. Sanity Interactions
- **Moroi curse (Spirit Box):** any player who hears a Spirit-Box response from a Moroi is cursed: their passive sanity drain rate **doubles** until they take **Sanity Medication** (which cures the curse). This is the Moroi's signature sanity mechanic.
- Standard passive drain otherwise.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.

### 10. Interaction Behavior
- Standard interaction rate.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** EMF 5 *not* in trio.
- **Spirit Box:** in trio AND forced. **Curses any listener** with double passive drain.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** in trio.
- **Ghost Writing Book:** in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** **Moroi-specific** — smudge blind duration during a hunt is reduced to **~3 s** (vs the default ~5 s). (Some sources cite 7.5 s, treat lower number as canonical baseline; **Unknown — requires current Phasmophobia Wiki verification** for the exact value used in the most recent patch.)
- **Sanity Medication:** **central tool.** Cures the Moroi curse on the player who takes it; restores standard +40% sanity.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** Spirit Box. The Moroi's Spirit Box is forced (always shows) and answering will curse the listener — observe whether sanity drains noticeably faster after a Spirit-Box response (a doubled passive rate is roughly 0.16–0.24 %/s). If yes, Moroi.
- **Speed-at-low-sanity test:** time the ghost during a hunt with sub-30% team-average sanity. If speeds approaching ~3 m/s are observed without LOS-accel ramp, Moroi is consistent.

### 13. Common False Positives
- Deogen also has forced Spirit Box; do not call Moroi solely on a Spirit-Box hit.
- LOS-accelerated default ghosts can hit ~2.8 m/s at full ramp; Moroi at low sanity can be faster from tick 1.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Spirit Box voice samples (no unique recording clue beyond the trio inclusion).

### 16. Multiplayer-Specific Notes
- Brief team: limit Spirit-Box use; only one player should test, others stay out of audio range.
- Have Sanity Medication ready for the cursed player.

### 17. Custom Difficulty / Evidence Count Caveats
- Spirit Box always shows.
- Lower-sanity-cap custom modes make Moroi extremely dangerous from the start.

### 18. Exact Implementation Notes for Haunted
- Speed at hunt start: `1.5 + max(0, 50 - teamAvgSanity) * 0.0166` capped at 3.71.
- Forced Spirit Box in evidence list.
- Curse hook: when a Spirit Box response is generated by a Moroi, mark all players in audio range (~5 m of the holder) as cursed (double drain).
- Sanity Medication: clears the cursed flag on the user.
- Smudge blind: 3 s during hunts (or 7.5 s; emit a `// Unknown — verification` note in code).

### 19. Debug Requirements
- `__debug.moroi.speed`: returns current sanity-curve speed.
- `__debug.moroi.cursed[playerId]`: returns curse state.
- `__debug.moroi.testCurse(playerId)`: forces curse-on; `clearCurse(playerId)` clears.

### 20. Confidence / Source Notes
- Trio + forced Spirit Box: high confidence.
- 1.5–3.71 m/s sanity curve: high confidence.
- 0.083 per 5% increment: high confidence.
- Curse mechanic doubling drain: high confidence.
- Smudge blind 3 s vs 7.5 s: medium confidence — sources split. Treat as **Unknown — requires verification** for exact value.

---

## Myling

### 1. Identity Summary
The Myling is the "loud during interactions, quiet during hunts" ghost. It produces noticeably more paranormal sounds picked up by the parabolic microphone than the average ghost — but its hunt footsteps are audible at a much shorter range (~12 m vs the default ~20 m). Identification leans on parabolic frequency and footstep audibility.

### 2. Evidence
- **Trio:** EMF Level 5, Fingerprints (UV), Ghost Writing.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.
- **Myling-specific audio:** during a hunt, the Myling's footstep sounds are audible only within **~12 m** of the ghost (vs the default ~20 m). This makes the Myling feel "quieter" while hunting — players cannot hear it coming until it's much closer.
- Heartbeat audio at standard ~10 m.

### 7. Sanity Interactions
- Standard.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.

### 10. Interaction Behavior
- **Myling-specific:** higher rate of paranormal-sound interactions outside hunts (whispers, knocks, distant voices). The parabolic microphone picks these up more often than for the average ghost. Treat as a 1.5–2× rate multiplier (community estimate; **Unknown — requires current Phasmophobia Wiki verification** for exact multiplier).

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** in trio.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** in trio.
- **Thermometer:** Freezing not in trio.
- **Ghost Writing Book:** in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** picks up more EVPs from the Myling than from average ghosts.
- **Parabolic Microphone:** **central identifier.** Picks up paranormal sound much more frequently for a Myling. Range standard 30 m.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** parabolic microphone in the favourite room. Time how often paranormal sounds are picked up over a fixed window (e.g., 60 s). A noticeably elevated rate indicates Myling.
- **Quiet-footsteps test:** during a hunt, place the team at the edge of a long hallway. If the team can hear the ghost's footsteps clearly only when it's within ~12 m and not from longer ranges, Myling is consistent.

### 13. Common False Positives
- Other ghosts that produce occasional paranormal sounds; the elevated **rate** is the distinguishing feature.
- Banshee on parabolic produces screeches; Myling produces standard groans/whispers — the sound *content* differs.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Frequent parabolic hits and EVP samples.

### 16. Multiplayer-Specific Notes
- Use parabolic mic from the truck or just outside the room.
- Beware quiet hunts: keep visual checks active even when no footsteps are audible.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- Footstep audio falloff override: clamp footstep audibility to ~12 m for Myling.
- Paranormal-sound roll: increase the per-tick paranormal-sound probability by some factor (~1.5–2×) for Myling. Mark exact multiplier as **Unknown — requires verification** in code comments.

### 19. Debug Requirements
- `__debug.myling.footstepRange`: returns 12.
- `__debug.myling.paranormalSoundRate`: returns the active rate multiplier.
- `__debug.myling.testParabolicHits(durationSec)`: simulates and returns hit count.

### 20. Confidence / Source Notes
- Trio: high confidence.
- ~12 m footstep range: high confidence.
- Elevated paranormal sound rate: high confidence (direction); **Unknown** for exact multiplier.

---

## Obake

### 1. Identity Summary
The Obake is a shape-shifting ghost: it leaves fingerprints **only 75% of the time** when interacting with surfaces, and **1 in 6** of those prints will be **abnormal** (six-fingered handprints, or a different shape than expected). It also briefly transforms its model during hunts. It is the canonical "trust the prints" puzzle ghost — finding a six-fingered handprint nails it.

### 2. Evidence
- **Trio:** EMF Level 5, Fingerprints (UV), Ghost Orb.
- Forced evidence: **Fingerprints (UV)** (always shown — at least one normal or abnormal print appears on a difficulty-reduced run).
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- **Obake-specific:** during a hunt, the Obake briefly **transforms its model** at random — switching between a normal ghost model and an alternate (often more grotesque) form. The transform is fast (~0.5 s) and only happens occasionally. Hard to spot mid-panic but unique on review of camera footage.
- Standard flicker and heartbeat.

### 7. Sanity Interactions
- Standard.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.

### 10. Interaction Behavior
- **Reduced print rate:** when the Obake interacts with a surface that would normally leave a fingerprint or handprint, it leaves a print only **75%** of the time. The other **25%** of the time, no print appears.
- When a print *does* appear, **1 in 6** prints is **abnormal** — a six-fingered handprint or distorted variant. Abnormal prints are visually distinct under UV.
- Print decay rate is the standard ~120 s.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard. Hunt-time transforms can be reviewed on footage.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** in trio.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** in trio AND forced. **Reveals abnormal prints** — the unique six-finger handprint is the canonical Obake tell.
- **Thermometer:** Freezing not in trio.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** photographing a six-fingered handprint counts as both a print photo and a unique Obake-tell photo (treat as flavour for current Haunted scope).
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** Obake steps in salt; UV in trio so prints are on-evidence. **Caveat:** the print-rate-75% rule may apply to salt prints too — i.e., the Obake might pass through salt without leaving prints 25% of the time. **Unknown — requires current Phasmophobia Wiki verification.**
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** find an abnormal (six-fingered) handprint. UV-flashlight every interaction surface in the favourite room and surrounding areas; if you find one with six fingers, it's an Obake.
- **Hunt model-transform:** review camera footage; if the ghost model briefly changes shape during a hunt, that's an Obake.

### 13. Common False Positives
- Wraith leaves no salt prints; an Obake might leave no prints from a single salt step (25% miss rate) — do not use a single missed salt step alone as a Wraith identifier; cross-check with thermometer and EMF.
- Standard fingerprints from any UV-trio ghost can mimic Obake's normal prints; require an abnormal print for confirmation.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Hunt-model-transform on video.
- Six-fingered handprints in photos.

### 16. Multiplayer-Specific Notes
- Have one player UV-sweep all surfaces methodically.
- Document any abnormal prints with the photo camera.

### 17. Custom Difficulty / Evidence Count Caveats
- UV always appears (forced). Even on 0-evidence custom, at least one print shows up somewhere — but the 25% miss rate still applies, so the team may need to wait longer.

### 18. Exact Implementation Notes for Haunted
- Print-leave roll: when the Obake interacts with a surface, with 25% probability suppress the fingerprint/handprint. With 75% probability, leave a print; of those, 1/6 chance to swap the print sprite to an abnormal variant.
- Hunt-time model swap: 5–10% chance per second during a hunt to render an alternate model frame.
- Forced UV in evidence list.

### 19. Debug Requirements
- `__debug.obake.printRate`: returns 0.75.
- `__debug.obake.abnormalRate`: returns 1/6.
- `__debug.obake.testInteractionPrint()`: rolls and returns "no print" | "normal" | "abnormal".
- `__debug.obake.testHuntModelSwap()`: forces a model swap.

### 20. Confidence / Source Notes
- Trio + forced UV: high confidence.
- 75% print rate: high confidence.
- 1/6 abnormal rate: high confidence.
- Hunt model-transform: high confidence.
- Salt-step-miss propagating from 25%: medium confidence — **Unknown** flag retained.

---

## Obambo

### 1. Identity Summary
The Obambo is a cyclical ghost: starting **60 s after the first investigator opens the front door**, it alternates between a **calm** phase (~120 s) and an **aggressive** phase (~120 s) on a strict 2-minute timer. In aggressive phase its hunt threshold rises to 65% (vs 10% calm) and speed jumps from 1.45 m/s to 1.96 m/s. Lore: a vengeful South African spirit; the cycle represents the back-and-forth of its restless wandering.

### 2. Evidence
- **Trio:** Spirit Box, Ghost Orb, D.O.T.S. Projector. (Per current canonical sources; mark as **Unknown — requires current Phasmophobia Wiki verification** if the most recent patch shifted the trio.)
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Phase-conditional, two-tier:
  - **Calm phase:** **10%** team-average sanity (effectively almost never hunts).
  - **Aggressive phase:** **65%** team-average sanity (hunts at high sanity).
- Phase flips every **120 s** starting 60 s after first front-door open.
- Standard 10% per-tick hunt-roll above active threshold.

### 4. Hunt Speed
- Phase-conditional:
  - **Calm:** **1.45 m/s**.
  - **Aggressive:** **1.96 m/s**.
- LOS acceleration applies on top.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.
- During aggressive phase audio cues feel more intense; treat as flavour unless the wiki specifies a precise modifier (**Unknown — requires current Phasmophobia Wiki verification**).

### 7. Sanity Interactions
- Standard passive drain.
- May drain faster during aggressive phase (**Unknown — requires verification**).

### 8. Ghost Events / Manifestation Tendencies
- Ghost events more common during aggressive phase; standard mix during calm.

### 9. Roaming / Favorite Room / Wandering
- Wanders more during aggressive phase; sticks to favourite room during calm.

### 10. Interaction Behavior
- Interaction rate elevated in aggressive phase, suppressed in calm phase.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard.
- **DOTS Projector:** in trio.
- **EMF Reader:** EMF 5 *not* in trio.
- **Spirit Box:** in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** Freezing *not* in trio.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** **central identifier.** Sensor activity comes in 2-minute waves: dense activity for 2 minutes, then quiet for 2 minutes. The pattern itself is the tell.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard. Smudge during aggressive phase has standard effect; calm-phase smudges may have no observable effect since hunts are already nearly impossible.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** monitor activity over 4–6 minutes. If activity (sensor pings, EMF, interactions) clusters in 2-minute waves, Obambo is consistent.
- **Threshold-test (aggressive):** if hunts occur at high sanity (60–65%), the Obambo is in aggressive phase and identification is near-certain (combined with the wave pattern).

### 13. Common False Positives
- Onryo (60% threshold + flame-blown forced hunt) can mimic high-sanity hunts; check candle behaviour.
- Yokai (80% threshold while voice is detected within 2 m): check voice-trigger.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Wave-pattern sensor activity is the clue.

### 16. Multiplayer-Specific Notes
- Brief team: hunker down during aggressive phase; explore during calm phase. Two-minute timer should be tracked verbally.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour; trio uncertainty may interact with custom evidence-count selection — verify on the live wiki.

### 18. Exact Implementation Notes for Haunted
- Add `obambo.phase = "calm" | "aggressive"`.
- Phase timer starts 60 s after first front-door open; flips every 120 s.
- `getHuntThreshold(ghost)` reads 10 / 65 from phase.
- Speed override per tick reads 1.45 / 1.96 from phase.
- Apply LOS acceleration on top.
- **Note (Haunted-current):** the in-repo Obambo is a Haunted-original variant. Decision: align trio to current canon (SB / Orb / DOTS) OR keep the existing variant with a journal note. Mark this in the implementation plan as a canonical-vs-custom decision.

### 19. Debug Requirements
- `__debug.obambo.phase`: returns "calm" | "aggressive".
- `__debug.obambo.phaseElapsed`: returns seconds elapsed in current phase.
- `__debug.obambo.forcePhase(phase)`: pin phase for testing.

### 20. Confidence / Source Notes
- Cyclical 2-minute calm/aggressive phasing: high confidence.
- 60 s start delay tied to first front-door open: high confidence.
- 10 / 65% thresholds: high confidence.
- 1.45 / 1.96 m/s speeds: high confidence.
- Trio (SB / Orb / DOTS): medium confidence — recent patches may have shifted; **Unknown** flag retained pending live-wiki verification.

---

## Oni

### 1. Identity Summary
The Oni is the active and visible ghost: it interacts more often than any other ghost (some sources cite ~2× the standard rate), is more visible during ghost events (longer manifestations), and produces stronger throws (heavier objects moved farther). Unlike most ghosts, the Oni's signature tell is *behavioural intensity*, not a single one-shot mechanic.

### 2. Evidence
- **Trio:** EMF Level 5, Freezing Temperatures, D.O.T.S. Projector.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity. (Some older sources cite 60% but current 2026 community references settle on 50%; treat **50% as canonical** with a confidence note.)
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Default **1.7 m/s**. (Some sources cite 1.8 m/s, possibly an old patch value; treat **1.7 m/s as canonical** but flag for verification.)
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- **Oni-specific:** during ghost events the Oni's full-body manifestation lasts longer than for the average ghost (~+1–2 s, **Unknown — requires verification** for exact duration).
- Standard flicker and heartbeat.

### 7. Sanity Interactions
- Standard passive drain.
- Players in LOS of an Oni full-body manifestation lose extra sanity (community consensus: the longer manifestation eats more sanity by extending the in-range time, not by amplifying drain rate).

### 8. Ghost Events / Manifestation Tendencies
- **Elevated event rate.** Ghost events fire more often than for average ghosts.
- Manifestations last longer (see above).

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room. Wanders more aggressively due to the elevated interaction rate.

### 10. Interaction Behavior
- **Elevated interaction rate.** Throws objects more frequently and farther. The interaction sound profile is denser overall.
- Often described as the "noisy ghost" or "active ghost".

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard. Long manifestations easier to capture on photo.
- **DOTS Projector:** in trio.
- **EMF Reader:** in trio. Lots of interactions = lots of EMF readings.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** in trio.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** elevated photo opportunities.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard, with elevated frequency of paranormal sound hits.
- **Motion Sensor / Sound Sensor:** **central identifier** — sensor activity is denser for an Oni than for the average ghost.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** observe interaction rate. Place 4–6 objects in the favourite room and time how often they're moved. An Oni will move objects significantly faster than the typical ghost.
- **Long manifestation:** if a ghost event manifestation lasts unusually long, that's an Oni.

### 13. Common False Positives
- Poltergeist also throws often, but throws *multiple objects at once*; Oni throws single objects more often. The pattern differs.
- Standard ghosts in their favourite room can sometimes feel active; require sustained elevation across the contract.

### 14. Gender / Model / Name Restrictions
- Lore: Japanese demon. Uses both gender pools (no enforced restriction).

### 15. Media / Recording Clues
- Long manifestation photos.

### 16. Multiplayer-Specific Notes
- Stay out of LOS during ghost events to limit sanity loss from the longer manifest.
- Capitalise on elevated activity for photo evidence.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- Multiply interaction-roll probability by ~2× for Oni.
- Multiply ghost-event manifestation duration by 1.5–2× (mark exact value as **Unknown — requires verification**).
- Throw force / distance: scale up for Oni throws.

### 19. Debug Requirements
- `__debug.oni.interactionRate`: returns multiplier.
- `__debug.oni.manifestDuration`: returns ms duration of next event.
- `__debug.oni.testThrowForce()`: returns throw distance.

### 20. Confidence / Source Notes
- Trio: high confidence.
- 50% threshold: medium-high confidence (50% canonical, 60% legacy).
- 1.7 m/s speed: medium-high confidence (1.7 canonical, 1.8 legacy).
- Elevated interaction & manifestation rates: high confidence (direction); **Unknown** for exact multipliers.

---

## Onryo

### 1. Identity Summary
The Onryo is the flame ghost: it actively blows out lit candles (and other open flames), and **3 blown flames in a single contract trigger a guaranteed hunt**. Active flames within 4 m of the ghost block individual hunts. It is the canonical "respect the candle" puzzle ghost.

### 2. Evidence
- **Trio:** Spirit Box, Ghost Orb, Freezing Temperatures.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Elevated default: **60%** team-average sanity.
- **Special forced-hunt rule:** when the **3rd flame** is blown out by the Onryo during a single contract, a hunt **starts immediately** regardless of sanity. This is a true forced hunt — not a hunt-roll, not threshold-gated.
- Standard 10% per-tick hunt-roll above the 60% threshold.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.

### 7. Sanity Interactions
- Standard passive drain.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.
- Avoids rooms with active flames during interactions.

### 10. Interaction Behavior
- **Onryo-specific:** actively prefers to blow out lit candles, lit lighters, and lit firelight in the favourite room. Each successful flame-blow increments a counter.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard. Camera footage of flames being blown out is a strong recording clue.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** EMF 5 *not* in trio.
- **Spirit Box:** in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** in trio.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** **central mechanic.**
  - Lit candle: 3 m radius acts as a hunt-block (a hunt that would start while a player is within 3 m of a lit candle does **not** start). Stacks separately from a crucifix.
  - Candelabra: 2 m radius (for current Haunted; live game uses 3 m for the placed candle and slightly different for candelabra — verify on live wiki).
  - Lighter (in hand): treated as a 4 m active flame source. While the lighter is on and held, hunts within 4 m are blocked individually.
  - **Flame-blown counter:** every flame the Onryo extinguishes increments a contract-level counter. At **3** the Onryo enters a forced hunt.
  - **Reset rule:** the counter does **not** reset between hunts — it persists for the contract (some sources cite a reset on hunt end; **Unknown — requires current Phasmophobia Wiki verification** for exact behaviour).
- **Crucifix:** standard 3 m / 4 m. Stacks with candle radius (you can have both protections active in the same room).
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** place a lit candle in the favourite room and watch a video camera. If the candle is blown out without any team member nearby, that's the Onryo signature.
- **Counter test:** track flame blows; if a forced hunt starts at exactly the 3rd flame blow, that's an Onryo confirmation.

### 13. Common False Positives
- Other ghosts can put out flames during ghost events but typically at lower frequency; the *deliberate, repeated* flame-blowing is Onryo-specific.

### 14. Gender / Model / Name Restrictions
- Lore: Japanese vengeful spirit, traditionally female. Uses both gender pools in-game.

### 15. Media / Recording Clues
- Camera-captured flame extinguishment.

### 16. Multiplayer-Specific Notes
- Brief team: keep at most **2** flames in the favourite room across the contract — never let the Onryo get a 3rd blow.
- Carry lighters as personal hunt-block defences.

### 17. Custom Difficulty / Evidence Count Caveats
- Custom modes that disable lit candles (some maps remove placed candle slots) eliminate the flame-block defence; the 3-flame counter still applies via the lighter.

### 18. Exact Implementation Notes for Haunted
- Add `onryo.flamesBlown` integer, contract-scoped.
- When the Onryo extinguishes a flame, increment counter; if value reaches 3, force a hunt start.
- Active-flame hunt-block: when a hunt-roll fires, check if any player is within 3 m of a lit candle or 4 m of an active lighter; if so, suppress.
- Add a `getHuntThreshold(ghost)` override: 60% for Onryo.

### 19. Debug Requirements
- `__debug.onryo.flamesBlown`: returns counter.
- `__debug.onryo.testForcedHunt()`: increments to 3 and confirms hunt fires.
- `__debug.onryo.flameBlockActive(playerId)`: returns whether the player is currently within flame-block range.

### 20. Confidence / Source Notes
- Trio: high confidence.
- 60% threshold: high confidence.
- 3-flame forced hunt: high confidence.
- 3 m candle / 4 m lighter blocks: medium-high confidence; some sources cite 4 m for placed candles.
- Counter persistence vs reset: medium confidence; **Unknown** flag retained.

---

## Phantom

### 1. Identity Summary
The Phantom is the camera-shy ghost: photographing the Phantom mid-manifestation **causes it to vanish**, and looking directly at a manifested Phantom drains sanity faster than any other ghost. Spirit Box responses are also less frequent (specifically, the Phantom only responds to Spirit Box about half as often as average ghosts; some sources phrase this as "responds less frequently"). It is the canonical "sanity-killer" ghost.

### 2. Evidence
- **Trio:** Spirit Box, Fingerprints (UV), D.O.T.S. Projector.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- **Phantom-specific during hunts:** the Phantom periodically **becomes invisible briefly** at intervals — the model fades out for ~0.5 s every ~1–2 seconds (sources differ on exact cadence; **Unknown — requires verification** for precise timing). This makes the Phantom hard to track with the eye during a hunt.
- Standard flicker and heartbeat.

### 7. Sanity Interactions
- **Phantom-specific drain:** any player who **looks directly at a manifested Phantom** loses sanity at an accelerated rate while LOS is held. Treat as ~+0.4–0.5 %/s extra drain while sustained eye-contact during a manifest (community estimate; **Unknown — requires verification** for exact rate).
- Standard passive drain otherwise.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.
- Manifestations appear longer due to invisible-flicker effect making players linger.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.

### 10. Interaction Behavior
- **Reduced Spirit Box response rate:** Phantom answers Spirit Box about **50%** as often as average ghosts (i.e., much fewer hits per minute). Sources: keengamer Phantom guide, Steam community guide March 2026.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard. The hunt-time invisible-flicker is camera-visible but subtle.
- **DOTS Projector:** in trio.
- **EMF Reader:** EMF 5 *not* in trio.
- **Spirit Box:** in trio. Responds at half the average rate.
- **UV Flashlight:** in trio.
- **Thermometer:** Freezing not in trio.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** **central mechanic.** Photographing the Phantom while it is mid-manifestation **causes it to immediately vanish** (manifest event ends, ghost teleports back to favourite room). The photo is still captured for evidence/cash.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard. Counters the elevated sanity drain after sighting.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** photograph the manifested ghost. If the ghost vanishes immediately on the photo flash, Phantom is confirmed.
- **Sanity-drain test:** stand in LOS of a manifested ghost for ~5 s; if sanity drops noticeably more than expected, Phantom is consistent.

### 13. Common False Positives
- Standard ghost-event manifestations end naturally after a duration; if the photo flash *coincides* with that natural end, that can mimic the Phantom-vanish. Take multiple photos to confirm.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Photo of vanishing Phantom: classic.

### 16. Multiplayer-Specific Notes
- Brief team: avoid prolonged eye contact with the manifested ghost.
- Photographer should focus camera in advance, then snap as soon as the manifest fires.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- Photo-flash hook: when the photo camera fires and the Phantom is mid-manifest, end the manifest immediately and teleport the ghost back to its favourite-room anchor.
- LOS-on-Phantom drain: while a player has unobstructed LOS on a manifested Phantom, apply an additional sanity drain rate.
- Hunt invisible-flicker: every ~1.5 s during a Phantom hunt, render the ghost as transparent for ~0.5 s.
- Spirit Box response weight: halve Phantom's response probability.

### 19. Debug Requirements
- `__debug.phantom.testPhotoVanish()`: simulates a flash mid-manifest.
- `__debug.phantom.testHuntFlicker()`: forces an invisible flicker.
- `__debug.phantom.spiritBoxResponseRate`: returns ~0.5 multiplier.
- `__debug.phantom.testLosDrain(durationMs)`: returns sanity loss.

### 20. Confidence / Source Notes
- Trio: high confidence.
- Photo-vanish: high confidence.
- Reduced Spirit Box rate (~50%): high confidence (direction); **Unknown** for exact rate.
- LOS sanity-drain amplification: medium-high confidence.
- Hunt invisible flicker cadence: medium confidence; **Unknown** for exact timing.

---

## Poltergeist

### 1. Identity Summary
The Poltergeist is the multi-throw ghost: when interacting with objects, it can throw **multiple objects at once** in a single interaction event, and it deals slightly more sanity damage per throw than the average ghost. It is the canonical "noisy room of flying objects" ghost.

### 2. Evidence
- **Trio:** Spirit Box, Fingerprints (UV), Ghost Writing.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard.

### 7. Sanity Interactions
- **Per-throw sanity penalty:** each thrown object near a player drains a small amount of extra sanity (community estimate ~2% per throw within ~7.5 m; **Unknown — requires verification** for exact rate). The multi-throw mechanic stacks this — a single multi-throw event can drop a player's sanity ~10–15%.
- Standard passive drain otherwise.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room. Visibly cluttered after activity due to throws.

### 10. Interaction Behavior
- **Multi-throw:** when the Poltergeist interacts with the room, it can throw **multiple objects** simultaneously (sources cite up to 5+ at once). This is in addition to the throw frequency being elevated.
- **Disabled in empty rooms:** if there are no throwable objects in the favourite room, the Poltergeist's signature behaviour is suppressed — no throws to observe. Standard advice: place throwable items in the favourite room (footballs, books, mugs).

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard. Multi-throws are dramatic on camera.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** EMF 5 *not* in trio. Each throw produces an EMF spike — multi-throws produce overlapping spikes.
- **Spirit Box:** in trio.
- **UV Flashlight:** in trio.
- **Thermometer:** Freezing not in trio.
- **Ghost Writing Book:** in trio.
- **Photo Camera:** standard. Photo of mid-air objects is a strong recording clue.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor:** **central identifier.** Sensor pings cluster densely around throw events.
- **Sound Sensor:** standard.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** litter the favourite room with throwable objects. If a single interaction event launches 3+ items simultaneously, Poltergeist is confirmed.
- **Sanity-drop test:** if a single interaction event drops a player's sanity by ~10%+, that's a Poltergeist.

### 13. Common False Positives
- Oni throws single objects more frequently; do not confuse single-throw frequency with multi-throw simultaneity.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Mid-air-multi-object photos are unique to Poltergeist.

### 16. Multiplayer-Specific Notes
- Brief team: stay away from the favourite room during interactions to limit sanity drain.
- Designate a watcher with the photo camera near the doorway.

### 17. Custom Difficulty / Evidence Count Caveats
- In rooms with no throwable objects (Custom map without small props), Poltergeist behaviour is suppressed; ID has to lean on evidence trio alone.

### 18. Exact Implementation Notes for Haunted
- When Poltergeist interaction roll passes, select N objects in the room (N = 2–6 weighted) and throw all at once.
- Apply per-throw sanity drain to players within 7.5 m of each thrown object's flight path.
- Hook: count multi-throw events for journal display.

### 19. Debug Requirements
- `__debug.polter.testMultiThrow(n)`: forces an N-object throw.
- `__debug.polter.lastThrowCount`: returns count from most recent event.

### 20. Confidence / Source Notes
- Trio: high confidence.
- Multi-throw mechanic: high confidence.
- Per-throw sanity drain: medium-high confidence; **Unknown** for exact rate.

---

## Raiju

### 1. Identity Summary
The Raiju is the electronics ghost: it speeds up significantly when near active electronics (cameras, EMF readers, flashlights, head gear, etc.), and its hunt-threshold rises near electronics. Disable electronics to slow it down. It also disrupts electronics from a longer range than the average ghost. Lore: a Japanese thunder spirit.

### 2. Evidence
- **Trio:** EMF Level 5, Ghost Orb, D.O.T.S. Projector.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Conditional, two-tier:
  - **Near active electronics** (within ~6–8 m of an active device): **65%** team-average sanity.
  - **No active electronics nearby:** **50%** (default).
- Standard 10% per-tick hunt-roll above active threshold.

### 4. Hunt Speed
- Conditional, two-tier:
  - **Near active electronics:** **2.5 m/s** (faster than default).
  - **No active electronics nearby:** **1.7 m/s** (default).
- LOS acceleration applies on top.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard.

### 7. Sanity Interactions
- Standard passive drain.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.

### 10. Interaction Behavior
- **Electronics-disruption range:** the Raiju disrupts electronics (flashlight flicker, camera static) at a longer range than average ghosts (community estimate ~15 m vs default 10 m; **Unknown — requires verification** for exact range).

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker but at a longer range; the Raiju can flicker flashlights from 10+ m away.
- **Video Camera:** standard. Camera static is more pronounced.
- **DOTS Projector:** in trio; the projector itself is an "active electronic" — it can buff the Raiju's speed/threshold while running.
- **EMF Reader:** in trio. The reader itself is also an "active electronic" near the holder.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** Freezing not in trio.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** active electronic; falls under the buff condition.
- **Motion Sensor / Sound Sensor:** active electronics; trigger the buff if Raiju is within ~6–8 m.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** active electronic when on.

### 12. Signature Tells / Best Tests
- **Best test:** during a hunt, drop or turn off all active electronics. If the ghost's speed visibly slows from ~2.5 m/s to ~1.7 m/s, Raiju is confirmed.
- **Threshold test:** observe whether hunts begin at ~60–65% sanity when many electronics are active in the room.

### 13. Common False Positives
- Jinn also has a fast tier conditional on breaker-on; check the LOS-and-distance rule (Jinn) vs the electronics-presence rule (Raiju).

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Long-range flashlight flicker on camera is the recording clue.

### 16. Multiplayer-Specific Notes
- Brief team: drop electronics on the ground during a hunt — stay away from devices.
- Park the truck-side cameras outside the favourite room.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- Add a `nearActiveElectronics(ghost)` helper: returns true if any active device is within ~6–8 m.
- `getHuntThreshold(ghost)` for Raiju returns 65 if near active electronics, else 50.
- Speed override per tick: 2.5 m/s if near active electronics, else 1.7 m/s.
- Flashlight-flicker range override: 15 m for Raiju.

### 19. Debug Requirements
- `__debug.raiju.electronicsNearby`: returns boolean.
- `__debug.raiju.threshold`: returns 65 or 50.
- `__debug.raiju.speed`: returns 2.5 or 1.7.

### 20. Confidence / Source Notes
- Trio: high confidence.
- 50 / 65 thresholds and 1.7 / 2.5 m/s speeds: high confidence.
- Electronics-radius (6–8 m): medium confidence; **Unknown** for exact value.
- Flashlight-flicker 15 m: medium confidence; **Unknown** for exact value.

---

## Revenant

### 1. Identity Summary
The Revenant is the binary-speed ghost: when it has detected a player it sprints at **3.0 m/s**, but when it loses detection (no LOS, no nearby footsteps) it slows to a crawl at **1.0 m/s**. The transition is essentially instant (snap, not ramp) — and LOS acceleration does **not** apply on top. It is the canonical "hide and the Revenant slows down" puzzle ghost.

### 2. Evidence
- **Trio:** Ghost Writing, Ghost Orb, Freezing Temperatures.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Detection-conditional, binary:
  - **Detected** (LOS on player OR audible footsteps within ~20 m OR talked-near-recently): **3.0 m/s**.
  - **Undetected** (no LOS, silent player, crouching): **1.0 m/s**.
- **LOS acceleration does NOT apply.** The Revenant is the canonical exception to the LOS-accel rule.
- Decay: snap-back to 1.0 on losing detection (no gradual decay).

### 5. Hunt Vision / Detection / Targeting
- **Detection model is louder than the standard:** the Revenant tracks LOS, footstep audio, and player vocalisations. Crouching and silence make a player effectively invisible.
- Targets nearest detected player.
- If no detection signal, the Revenant wanders aimlessly at 1.0 m/s.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.
- Heartbeat audio at standard ~10 m.

### 7. Sanity Interactions
- Standard passive drain.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.

### 10. Interaction Behavior
- Standard interaction rate.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker. **Caveat:** during a hunt, having a flashlight on does **not** count as "talking" but the player carrying it must still avoid running and stay quiet.
- **Video Camera:** standard.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** EMF 5 *not* in trio.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** in trio.
- **Ghost Writing Book:** in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** during a hunt, hide silently. If the ghost slows to a crawl (~1.0 m/s) and wanders, that's a Revenant.
- **Snap test:** time the transition. Revenant snaps from slow to fast in ~1 tick (no ramp); LOS-accel ghosts ramp over many seconds.

### 13. Common False Positives
- Jinn at long range can hit 2.5 m/s; Revenant detected hits 3.0 m/s. The break-LOS test (run behind a wall and silent-crouch) is the disambiguator: Jinn slows because of the 3 m rule but doesn't drop to 1.0 m/s.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- No unique recording clue.

### 16. Multiplayer-Specific Notes
- Brief team: when a Revenant hunt starts, hide silently and crouch — do **not** run. Running keeps you detected and the Revenant at full speed.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- Speed resolution per tick:
  - If detection signal present (LOS on player OR footstep within 20 m OR voice-detected) → 3.0 m/s.
  - Else → 1.0 m/s.
- **Do not** apply LOS acceleration on top.
- Implement a "detected" flag that resets to false each tick and is set true if any detection condition fires.

### 19. Debug Requirements
- `__debug.revenant.detected`: returns boolean.
- `__debug.revenant.speed`: returns 1.0 or 3.0.
- `__debug.revenant.testNoLOSAccel()`: confirms LOS-accel does not apply.

### 20. Confidence / Source Notes
- Trio: high confidence.
- 1.0 / 3.0 m/s binary: high confidence.
- No-LOS-accel exception: high confidence.

---

## Shade

### 1. Identity Summary
The Shade is the shy ghost: it has the lowest hunt threshold of any standard ghost (35% vs default 50%), and it **suppresses ghost events and interactions when any player is in the same room** as the ghost. It is the canonical "if you stand next to it, it does nothing" ghost — easy to disprove other suspects, hard to actually catch in the act.

### 2. Evidence
- **Trio:** EMF Level 5, Ghost Writing, Freezing Temperatures.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- **35%** team-average sanity (lowest of any standard ghost).
- Standard 10% per-tick hunt-roll above threshold.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard.

### 7. Sanity Interactions
- Standard.

### 8. Ghost Events / Manifestation Tendencies
- **Suppressed when player in room:** ghost events do not fire while a living player is in the same room as the ghost. Step out → events fire normally.
- Otherwise standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room. Tends to stay in favourite room more.

### 10. Interaction Behavior
- **Suppressed when player in room:** standard interactions are suppressed while a player is in the room with the ghost.
- Hunts are **not** suppressed by player proximity — once the threshold is crossed and the dice roll fires, the hunt happens regardless of who is in the room.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard. Watching from a camera (no player present) lets the Shade act normally.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** in trio. Suppressed in-room — go set up the reader and step out.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** in trio.
- **Ghost Writing Book:** in trio. Same suppression rule — leave the book and walk out.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** observe the suppression. Place evidence equipment, step in, step out. If activity happens only after you exit, that's the Shade.
- **Threshold test:** track when the first hunt occurs. If the team has dropped to ~30–35% sanity before the first hunt, that's consistent with Shade.

### 13. Common False Positives
- Yurei locks itself in the favourite room after smudge but is otherwise active in-room. Don't conflate suppression with lock.
- A "lazy" ghost (i.e., one that just hasn't rolled interactions yet) can mimic Shade until the team steps out and watches activity.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Camera-only activity is the recording clue.

### 16. Multiplayer-Specific Notes
- Brief team: nominate one player to set up evidence, then everyone exits the room.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- `getHuntThreshold(ghost)` for Shade returns **35**.
- Interaction roll guard: if any player is in the same room as the Shade, suppress interactions and ghost events. Hunts still proceed.

### 19. Debug Requirements
- `__debug.shade.threshold`: returns 35.
- `__debug.shade.interactionsSuppressed`: returns true when a player is in the room.
- `__debug.shade.testStepOutResume()`: simulates stepping out and confirms interactions resume.

### 20. Confidence / Source Notes
- Trio: high confidence.
- 35% threshold: high confidence.
- In-room interaction suppression: high confidence.

---

## Spirit

### 1. Identity Summary
The Spirit is the baseline ghost: standard speed, standard threshold, standard everything — except smudging it is unusually effective. A smudge stick used **outside a hunt** prevents the next hunt for **180 s** (vs the default 90 s). It is the canonical "no special tricks" ghost; the smudge advantage is the only twist.

### 2. Evidence
- **Trio:** EMF Level 5, Spirit Box, Ghost Writing.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard.

### 7. Sanity Interactions
- Standard.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.

### 10. Interaction Behavior
- Standard interaction rate.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** in trio.
- **Spirit Box:** in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** Freezing not in trio.
- **Ghost Writing Book:** in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard. UV not in trio so prints are off-evidence.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** **Spirit-specific override.** A smudge stick used outside a hunt prevents the next hunt for **180 s** (double the default). Smudge during a hunt still applies the standard ~5 s blind.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** smudge in the favourite room outside a hunt. If hunts are blocked for ~3 minutes (vs ~1.5 min for other ghosts), Spirit is confirmed.
- **Process-of-elimination test:** Spirit has no other special behaviour, so ruling out everything else with the trio is often the path.

### 13. Common False Positives
- The smudge timer test relies on a stopwatch; rough estimation can blur Spirit vs default-90s ghosts.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- No unique recording clue.

### 16. Multiplayer-Specific Notes
- Brief team: smudge after a hunt buys 3 minutes of safe investigation.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- Smudge applied outside hunt: schedule next-hunt unblock at +180 s for Spirit (instead of +90 s).
- All other behaviour uses defaults.

### 19. Debug Requirements
- `__debug.spirit.smudgeBlockDuration`: returns 180.
- `__debug.spirit.testSmudgeBlock()`: schedules and confirms the unblock time.

### 20. Confidence / Source Notes
- Trio: high confidence.
- 180 s smudge override: high confidence.
- Otherwise default: high confidence.

---

## Thaye

### 1. Identity Summary
The Thaye is the aging ghost: it starts the contract young — fast, aggressive, and hunts at high sanity — and **ages** every ~60–120 s while at least one player is nearby, becoming progressively slower, less active, and harder to provoke. After ~10 age tiers it is one of the slowest and quietest ghosts in the game. It is the canonical "wait it out" puzzle ghost.

### 2. Evidence
- **Trio:** Ghost Writing, Ghost Orb, D.O.T.S. Projector.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Age-conditional, 11-tier curve (ages 0 through 10):
  - Age 0: **75%**.
  - Each age tier: **−6%**.
  - Age 10: **15%** (75 − 10 × 6 = 15).
- Standard 10% per-tick hunt-roll above active threshold.

### 4. Hunt Speed
- Age-conditional curve:
  - Age 0: **2.75 m/s**.
  - Decays roughly linearly to age 10: **1.0 m/s**.
  - Sources cite ~0.175 m/s decrement per age tier (2.75 → 2.575 → … → 1.0); **Unknown — requires verification** for exact per-tier values, but endpoints are confirmed.
- LOS acceleration applies on top.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- **Thaye-specific:** the Thaye's appearance changes with age — older Thaye visibly look older (more decrepit) on manifest. Subtle but observable on camera footage.
- Standard flicker and heartbeat.

### 7. Sanity Interactions
- Standard passive drain.

### 8. Ghost Events / Manifestation Tendencies
- Younger Thaye fires events more often; older Thaye fires events less often.

### 9. Roaming / Favorite Room / Wandering
- Younger Thaye wanders aggressively; older Thaye sticks close to favourite room.

### 10. Interaction Behavior
- **Aging mechanic:** while at least one player is within ~6 m of the Thaye, an age timer ticks. After roughly **60–120 s** of accumulated proximity, the Thaye ages by 1 tier. Maximum age 10. Age never decreases.
- Interaction rate scales inversely with age — younger Thaye is very active, older Thaye is nearly silent.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard. Camera footage of the manifest captures the visual aging.
- **DOTS Projector:** in trio.
- **EMF Reader:** EMF 5 *not* in trio.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** Freezing not in trio.
- **Ghost Writing Book:** in trio. Younger Thaye writes faster.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard. Younger Thaye triggers sensors more often.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** observe activity over time. If a hyperactive ghost slows down dramatically over a 5–15 minute investigation (and you see early hunts at high sanity), that's a Thaye.
- **High-sanity hunt test:** a hunt at 70%+ team-average sanity early in the contract is consistent with young Thaye.

### 13. Common False Positives
- Demon (70% threshold) and Yokai (80% with voice within 2 m) can mimic the high-threshold feel; check whether activity decreases over time (Thaye's signature) — Demon and Yokai are stable.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Aging visual on manifest; comparison of early-vs-late hunt photos.

### 16. Multiplayer-Specific Notes
- Brief team: stay close to the favourite room early to age the ghost faster, but expect dangerous early hunts.
- Once aged out, the Thaye is the safest ghost to investigate.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- Add `thaye.age` integer (0–10).
- Per-tick: if any player is within ~6 m of the Thaye, increment a `thaye.proximityTimer`. When timer reaches the age-up threshold (60–120 s; pick a default e.g. 90 s, mark as **Unknown — verify**), increment age and reset timer.
- `getHuntThreshold(ghost)` for Thaye returns `75 - age * 6`.
- Speed override per tick: linear interpolation from 2.75 (age 0) to 1.0 (age 10).
- Apply LOS acceleration on top.

### 19. Debug Requirements
- `__debug.thaye.age`: getter.
- `__debug.thaye.threshold`: returns current threshold.
- `__debug.thaye.speed`: returns current speed.
- `__debug.thaye.forceAge(n)`: setter for testing.
- `__debug.thaye.proximityTimer`: getter.

### 20. Confidence / Source Notes
- Trio: high confidence.
- 11-tier threshold curve 75%→15% with −6%/age: high confidence.
- Speed endpoints 2.75 / 1.0 m/s: high confidence.
- Per-tier exact speed values: medium confidence; **Unknown** for precise increments.
- Age-up timing 60–120 s: medium confidence; **Unknown** for exact timer.

---

## The Mimic

### 1. Identity Summary
The Mimic is the impostor ghost: at the start of a contract it picks a host ghost type at random and **copies the host's behaviours** (speed, threshold, hunt mechanics, sanity interactions). Its evidence trio is **its own three** (Spirit Box, Fingerprints, Freezing Temperatures, plus the always-on **Ghost Orb fake-fourth**). The Ghost Orb is the giveaway — no other 3-evidence-trio ghost shows Ghost Orbs alongside a different trio. It is the canonical "fourth-evidence reveals the trick" ghost.

### 2. Evidence
- **Trio:** Spirit Box, Fingerprints (UV), Freezing Temperatures.
- Forced evidence: **None** of the standard three is forced.
- Fake evidence: **Ghost Orb (always present)** — a fourth signal beyond the trio. On Nightmare/Insanity reduced-evidence modes, the Mimic still shows the Ghost Orb on top of the reduced trio. This is the canonical Mimic identifier.

### 3. Hunt Thresholds
- **Variable — copies host.** If the Mimic's host is a Demon, threshold is 70%; if host is a Shade, threshold is 35%; etc.
- The team cannot see the host directly — they have to deduce it from the behaviour.

### 4. Hunt Speed
- **Variable — copies host.** Speed mechanic mirrors the host: a Hantu-host Mimic has the temperature curve, a Revenant-host Mimic has the binary speed, etc.
- LOS acceleration applies according to the host's rules (e.g., absent for Revenant-host).

### 5. Hunt Vision / Detection / Targeting
- Mirrors host.

### 6. Hunt Visibility / Flicker / Audio Feel
- Mirrors host. (E.g., Phantom-host Mimic has the invisible-flicker mechanic.)

### 7. Sanity Interactions
- Mirrors host.

### 8. Ghost Events / Manifestation Tendencies
- Mirrors host event behaviour.

### 9. Roaming / Favorite Room / Wandering
- Mirrors host.

### 10. Interaction Behavior
- Mirrors host.

### 11. Equipment-Specific Interactions
- All equipment behaviours mirror the host. **Exception:** Ghost Orb appears regardless of host. Forced evidences from the host (e.g., Hantu-host's forced Freezing) may or may not propagate to the Mimic — community sources are split. **Unknown — requires current Phasmophobia Wiki verification** for exact propagation rules.
- The host can be any ghost type **except** another Mimic and **except** Twins (some sources also exclude Goryo and a few other special-case ghosts; verify).

### 12. Signature Tells / Best Tests
- **Best test:** if Ghost Orb is present alongside a 3-evidence trio that does **not** include Ghost Orb (e.g., Spirit Box + UV + Freezing), and the Mimic-trio matches, that's a Mimic.
- On 0-evidence custom modes the Ghost Orb is the only standard signal.

### 13. Common False Positives
- Any normal ghost with Ghost Orb in its trio (Banshee, Hantu, Mare, Myling, Obake, Onryo, Phantom, Raiju, Revenant, Thaye, Wraith… many) can show Ghost Orbs naturally — Ghost Orb alone is not a Mimic identifier. The signal is the *combination* of Ghost Orb plus a Mimic trio.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Ghost Orb on camera + behavioural mirroring of a known ghost archetype.

### 16. Multiplayer-Specific Notes
- Brief team: even after positive Mimic ID, treat behaviour as the host — i.e., a Demon-host Mimic is still a Demon for tactical purposes (don't Ouija; expect frequent hunts).

### 17. Custom Difficulty / Evidence Count Caveats
- **0-evidence custom:** the Ghost Orb still appears (this is the Mimic's only "forced" signal at 0-evidence).
- 1-evidence Insanity: the Mimic shows the Ghost Orb plus 1 of its trio.
- The Ghost Orb is not counted as one of the trio — it is in addition to the regular evidence count.

### 18. Exact Implementation Notes for Haunted
- At contract start, when the ghost is rolled as Mimic, pick a host ghost type at random (excluding Mimic and Twins).
- Behaviour delegation: route speed, threshold, and per-mechanic hooks through the host's logic.
- Ghost Orb evidence: always include for Mimic regardless of evidence-count difficulty.
- Trio: Spirit Box, UV, Freezing — sample from this when generating the displayed evidences (Ghost Orb is appended on top).

### 19. Debug Requirements
- `__debug.mimic.host`: returns the chosen host ghost type.
- `__debug.mimic.testGhostOrbForced(difficulty)`: confirms Ghost Orb appears at every difficulty.
- `__debug.mimic.behaviourDelegate`: returns which host's behaviour module is currently active.

### 20. Confidence / Source Notes
- Mimic-trio (SB / UV / Freezing): high confidence.
- Always-Ghost-Orb fake-fourth: high confidence.
- Host-mirroring: high confidence.
- Excluded host types: medium confidence — sources vary on which ghosts are excluded; **Unknown** flag retained.

---

## The Twins

### 1. Identity Summary
The Twins are the dual-entity ghost: each contract instance has **two** Twins, each with its own speed, and they alternate which one initiates a hunt or interaction. The "main" Twin is slightly slower than default (~1.5 m/s) and the "decoy" Twin is slightly faster (~1.9 m/s). They can interact and hunt in **two different rooms simultaneously** at the start of the contract. They are the canonical "two ghosts in two places" puzzle.

### 2. Evidence
- **Trio:** EMF Level 5, Spirit Box, Freezing Temperatures.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.
- Either Twin can initiate a hunt; the active Twin alternates per hunt event.

### 4. Hunt Speed
- Dual:
  - **Main Twin:** **1.5 m/s** (slower than default).
  - **Decoy Twin:** **1.9 m/s** (faster than default).
- LOS acceleration applies on top.
- Both Twins exist simultaneously during a hunt; the inactive one continues to wander, but only the active Twin pursues players.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision per Twin.
- Each Twin maintains its own LOS state.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.
- Footstep audio: both Twins produce footsteps; players may hear footsteps from two locations at once.

### 7. Sanity Interactions
- Standard.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix; events can trigger from either Twin.

### 9. Roaming / Favorite Room / Wandering
- **Two-favourite-room behaviour:** the two Twins anchor to **two different points** that look like favourite rooms. Investigators can find double the activity hotspots.

### 10. Interaction Behavior
- Interactions alternate between Twins; can occur in two rooms within seconds of each other.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** **central identifier.** Two cameras in two suspected rooms can show simultaneous activity from the two Twins.
- **DOTS Projector:** *not* in trio.
- **EMF Reader:** in trio. Two readers in two rooms light up at near-identical times during interactions.
- **Spirit Box:** in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** in trio. Both rooms can show cold temperatures, sometimes simultaneously.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** **central identifier** — sensors in two rooms ping during alternating events.
- **Salt:** standard. Both Twins step.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m. Crucifix only blocks the Twin currently within range.
- **Incense / Smudge:** standard, but only blinds the Twin within smoke radius — the other Twin is unaffected.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** simultaneous interactions in two rooms. Place EMF readers and motion sensors in two suspected favourite rooms; if both spike at near-identical times, Twins is confirmed.
- **Twin-speed test:** time hunts. If one hunt feels slower (1.5 m/s) and the next feels faster (1.9 m/s), that's the Twin alternation.

### 13. Common False Positives
- A team member moving between rooms can mimic dual-room activity; rule out by verifying simultaneity with timestamps.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Simultaneous-room camera footage.

### 16. Multiplayer-Specific Notes
- Brief team: cover both suspected favourite rooms simultaneously. Set up evidence in both.
- Carry a crucifix per suspected room.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- Spawn two Twin entities at contract start with separate `favouriteRoom` anchors.
- Interaction roll: alternate which Twin executes the next interaction.
- Hunt roll: alternate which Twin is the active hunter; inactive Twin continues wandering.
- Speed: 1.5 m/s for main, 1.9 m/s for decoy; apply LOS-accel per Twin.
- Crucifix range: per-Twin blocking; only the Twin within range is suppressed.

### 19. Debug Requirements
- `__debug.twins.main`: returns position of main Twin.
- `__debug.twins.decoy`: returns position of decoy Twin.
- `__debug.twins.activeHunter`: returns "main" | "decoy".
- `__debug.twins.testAlternation()`: confirms interactions alternate correctly.

### 20. Confidence / Source Notes
- Trio: high confidence.
- Dual-Twin entities and dual favourite rooms: high confidence.
- 1.5 / 1.9 m/s speeds: high confidence.
- Alternating-interaction behaviour: high confidence.

---

## Wraith

### 1. Identity Summary
The Wraith is the salt-immune ghost: it **never steps in salt**, leaving no salt-prints under UV. It also has a noticeable Spirit-Box reaction to having salt nearby (drains sanity faster, per some sources). It is the canonical "no salt prints anywhere" puzzle ghost. Lore: Wraiths are airborne — the in-game model floats slightly off the ground.

### 2. Evidence
- **Trio:** EMF Level 5, Spirit Box, D.O.T.S. Projector.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard.

### 7. Sanity Interactions
- **Wraith-specific:** stepping in salt drains additional sanity for the Wraith — but since Wraiths don't step in salt, the **player who steps in salt while a Wraith is nearby** loses extra sanity (community description; **Unknown — requires verification** for direction/magnitude).
- Otherwise standard passive drain.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.
- The Wraith can pass over salt piles without leaving prints.

### 10. Interaction Behavior
- Standard interaction rate.
- **Salt avoidance:** the Wraith never steps in salt — it phases over piles. Salt prints from a Wraith are **never** present.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard.
- **DOTS Projector:** in trio.
- **EMF Reader:** in trio.
- **Spirit Box:** in trio.
- **UV Flashlight:** *not* in trio. **Salt prints will never be revealed** by UV from a Wraith.
- **Thermometer:** Freezing not in trio.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard. Note: if the Wraith floats over salt, sensor activity continues normally.
- **Salt:** **central identifier.** The Wraith never steps in salt. Place piles in known paths and inspect with UV — if no prints appear despite obvious activity, that's a Wraith.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** salt + UV. Place a salt pile in a high-traffic area; UV-sweep regularly. If activity continues with **zero** salt prints over a long observation window, Wraith is confirmed.
- **Sanity-drain note:** if a player consistently loses sanity faster after stepping into salt, that may be Wraith-specific — but treat as secondary.

### 13. Common False Positives
- **Obake** has a 25% chance to leave no print on a given step; one missed Obake step can mimic a Wraith. Require **multiple** missed steps over time to call Wraith.
- A salt pile in the wrong path may simply not be stepped on by any ghost — verify ghost activity is occurring near the pile.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- Camera footage of the Wraith floating over salt without prints.

### 16. Multiplayer-Specific Notes
- Brief team: don't waste smudge if you suspect Wraith — focus on salt + UV evidence.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- Salt-step logic for Wraith: when ghost crosses a salt pile, do **not** generate a UV-revealable footprint sprite.
- Optional sanity-drain tweak: when a player is in salt and the Wraith is within ~7.5 m, slightly increase that player's drain rate.

### 19. Debug Requirements
- `__debug.wraith.testSaltPass()`: walks the ghost over a salt pile and confirms no print is generated.
- `__debug.wraith.saltSanityDrain`: returns the configured drain rate.

### 20. Confidence / Source Notes
- Trio: high confidence.
- Salt-immune behaviour: high confidence.
- Salt-adjacent sanity drain: medium confidence; **Unknown** for exact rate.

---

## Yokai

### 1. Identity Summary
The Yokai is the voice-detection ghost: it can hunt at much higher sanity (**80%**) when a player is talking within ~2 m of it. Its hunt vision is also reduced — during a hunt, the Yokai can only hear voices within ~2 m and see within a smaller arc. It is the canonical "shut up around the ghost" puzzle ghost. Lore: Japanese supernatural entity.

### 2. Evidence
- **Trio:** Spirit Box, Ghost Orb, D.O.T.S. Projector.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Conditional, two-tier:
  - **Voice detected within ~2 m:** **80%** team-average sanity threshold.
  - **No voice nearby:** **50%** (default).
- Standard 10% per-tick hunt-roll above active threshold.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- **Yokai-specific reduced hunt vision:** during a hunt, the Yokai's effective LOS / hearing radius is reduced — sources cite ~2.5–5 m vs the default ~15 m. Players can stand near a Yokai mid-hunt and not be detected if they're silent and crouched.
- Voice detection during hunts: only voices within ~2 m alert the Yokai.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard hunt visibility.
- Standard flicker.

### 7. Sanity Interactions
- Standard passive drain.
- The Yokai's high hunt threshold means the team can lose sanity to a hunt at 80% — significantly above other ghosts' triggers.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.

### 10. Interaction Behavior
- Standard interaction rate.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard.
- **DOTS Projector:** in trio.
- **EMF Reader:** EMF 5 *not* in trio.
- **Spirit Box:** in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** Freezing not in trio.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** standard.
- **Sanity Medication:** standard.
- **Head Gear:** no override.
- **Voice / push-to-talk / proximity chat:** **central mechanic.** Speaking near the Yokai can trigger hunts at high sanity AND alert it to player position during hunts. Treat as a 2 m radius around the Yokai for trigger purposes.

### 12. Signature Tells / Best Tests
- **Best test:** test silence vs talking near the favourite room. If hunts occur shortly after speaking inside the room and not while silent, Yokai is consistent.
- **Reduced-vision test:** during a Yokai hunt, crouch silently near the ghost. If it walks past without targeting, that confirms the reduced-LOS rule.

### 13. Common False Positives
- Demon at 70% threshold can mimic the Yokai's high-threshold feel; the voice-trigger is the disambiguator.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- No unique recording clue.

### 16. Multiplayer-Specific Notes
- Brief team: do not speak inside the favourite room. Use text chat or radio outside the room.
- During hunts, hide silently and crouch — Yokai cannot detect quiet, hidden players.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.
- 0-evidence custom: rely entirely on voice-trigger and reduced-LOS observation.

### 18. Exact Implementation Notes for Haunted
- Add `voiceDetectedWithin(ghost, radius)` helper. (For Haunted, which is single-player without prox-chat, simulate via "talked recently" flag triggered by a mock voice button or NPC line.)
- `getHuntThreshold(ghost)` for Yokai returns 80 if voice-detected-within-2m, else 50.
- During hunts, override Yokai's effective LOS radius to ~5 m.

### 19. Debug Requirements
- `__debug.yokai.threshold`: returns 80 or 50.
- `__debug.yokai.voiceDetected`: returns boolean.
- `__debug.yokai.huntLosRadius`: returns ~5.
- `__debug.yokai.testCrouchHide()`: confirms reduced-LOS works.

### 20. Confidence / Source Notes
- Trio: high confidence.
- 80% / 50% threshold split: high confidence.
- 2 m voice-detect radius: high confidence.
- Reduced hunt-LOS radius: medium-high confidence; sources cite 2.5–5 m, **Unknown** for exact value.

---

## Yurei

### 1. Identity Summary
The Yurei is the sanity-burning ghost: any player who is in line of sight of a Yurei ghost event loses an extra **~15%** sanity (roughly double the normal event drain). Smudge stick used in the favourite room **confines the Yurei to that room for ~90 s** (instead of blocking the next hunt). It is the canonical "ghost-event nuke" ghost. Lore: Japanese vengeful spirit.

### 2. Evidence
- **Trio:** Ghost Orb, Freezing Temperatures, D.O.T.S. Projector.
- Forced evidence: **None**.
- Fake evidence: **None**.

### 3. Hunt Thresholds
- Default **50%** team-average sanity.
- Standard 10% per-tick hunt-roll.

### 4. Hunt Speed
- Default **1.7 m/s**.
- LOS acceleration applies normally.

### 5. Hunt Vision / Detection / Targeting
- Standard ~15 m hunt vision.

### 6. Hunt Visibility / Flicker / Audio Feel
- Standard.

### 7. Sanity Interactions
- **Yurei-specific event drain:** any player in LOS of a Yurei ghost event within ~7.5 m loses an additional **~15%** sanity (vs the default ~10–25% range — Yurei's value sits at the higher end specifically because of an explicit bonus). Some sources phrase this as "double drain on event manifestation". **Unknown — requires verification** for exact percentage but the direction (higher) is canonical.
- Otherwise standard passive drain.

### 8. Ghost Events / Manifestation Tendencies
- Standard event mix.
- Yurei prefers more visible-manifestation events; flavour.

### 9. Roaming / Favorite Room / Wandering
- Standard favourite-room.

### 10. Interaction Behavior
- Standard interaction rate.

### 11. Equipment-Specific Interactions
- **Flashlight:** standard flicker.
- **Video Camera:** standard.
- **DOTS Projector:** in trio.
- **EMF Reader:** EMF 5 *not* in trio.
- **Spirit Box:** *not* in trio.
- **UV Flashlight:** *not* in trio.
- **Thermometer:** in trio.
- **Ghost Writing Book:** *not* in trio.
- **Photo Camera:** standard.
- **Sound Recorder:** standard.
- **Parabolic Microphone:** standard.
- **Motion Sensor / Sound Sensor:** standard.
- **Salt:** standard.
- **Firelight / Candle / Lighter:** no override.
- **Crucifix:** standard 3 m / 4 m.
- **Incense / Smudge:** **Yurei-specific override.** A smudge stick used inside the favourite room **does not block the next hunt** in the standard 90 s sense — instead, it **confines the Yurei to its favourite room for 90 s**, preventing it from wandering or interacting outside the room. Hunts inside the room can still occur. This is uniquely useful when the team needs to safely clear adjacent rooms.
- **Sanity Medication:** standard.
- **Head Gear:** no override.

### 12. Signature Tells / Best Tests
- **Best test:** observe sanity drops after ghost events. If a single event drains noticeably more sanity than expected (~15% vs typical ~10%), Yurei is consistent.
- **Smudge-confinement test:** smudge in favourite room, then check whether activity continues *only inside the room* for ~90 s. If yes, Yurei.

### 13. Common False Positives
- Phantom drains sanity faster but only via direct LOS during manifest (not just being in event range); the LOS-only-on-Phantom vs LOS-on-event-on-Yurei distinction is the disambiguator.

### 14. Gender / Model / Name Restrictions
- Uses both gender pools.

### 15. Media / Recording Clues
- No unique recording clue.

### 16. Multiplayer-Specific Notes
- Brief team: avoid LOS on ghost events. Look at the floor or step out of view.
- Use the smudge-confinement to clear surrounding rooms safely.

### 17. Custom Difficulty / Evidence Count Caveats
- Standard reduced-evidence behaviour.

### 18. Exact Implementation Notes for Haunted
- Per ghost event: when computing per-player sanity drain, if ghost type is Yurei AND player has LOS within 7.5 m, apply ~15% drop (vs default ~7–10%).
- Smudge override: if Yurei is smudged in its favourite room, set a `confineUntil = now + 90s` flag. While confined, suppress Yurei's pathfinding outside the room.

### 19. Debug Requirements
- `__debug.yurei.eventSanityDrain`: returns 0.15.
- `__debug.yurei.confined`: returns boolean.
- `__debug.yurei.testSmudgeConfine()`: simulates smudge and confirms confinement.

### 20. Confidence / Source Notes
- Trio: high confidence.
- 90 s smudge-confinement: high confidence.
- ~15% event drain: medium-high confidence; **Unknown** for exact value but direction (higher) confirmed.

---

# Part III — Cross-Ghost Summary Tables

## P3.1 Evidence trios (alphabetical)

| Ghost | Evidence #1 | Evidence #2 | Evidence #3 |
|---|---|---|---|
| Banshee | DOTS | UV (Fingerprints) | Ghost Orb |
| Dayan | EMF 5 | Ghost Writing | Spirit Box |
| Demon | UV (Fingerprints) | Ghost Writing | Freezing Temps |
| Deogen | Spirit Box | Ghost Writing | DOTS |
| Gallu | EMF 5 | Spirit Box | Freezing Temps |
| Goryo | EMF 5 | UV (Fingerprints) | DOTS |
| Hantu | UV (Fingerprints) | Ghost Orb | Freezing Temps |
| Jinn | EMF 5 | UV (Fingerprints) | Freezing Temps |
| Mare | Spirit Box | Ghost Orb | Ghost Writing |
| Moroi | Spirit Box | Ghost Writing | Freezing Temps |
| Myling | EMF 5 | UV (Fingerprints) | Ghost Writing |
| Obake | EMF 5 | UV (Fingerprints) | Ghost Orb |
| Obambo | Spirit Box | Ghost Orb | DOTS |
| Oni | EMF 5 | Freezing Temps | DOTS |
| Onryo | Spirit Box | Ghost Orb | Freezing Temps |
| Phantom | Spirit Box | UV (Fingerprints) | DOTS |
| Poltergeist | Spirit Box | UV (Fingerprints) | Ghost Writing |
| Raiju | EMF 5 | Ghost Orb | DOTS |
| Revenant | Ghost Writing | Ghost Orb | Freezing Temps |
| Shade | EMF 5 | Ghost Writing | Freezing Temps |
| Spirit | EMF 5 | Spirit Box | Ghost Writing |
| Thaye | Ghost Writing | Ghost Orb | DOTS |
| The Mimic | Spirit Box | UV (Fingerprints) | Freezing Temps |
| The Twins | EMF 5 | Spirit Box | Freezing Temps |
| Wraith | EMF 5 | Spirit Box | DOTS |
| Yokai | Spirit Box | Ghost Orb | DOTS |
| Yurei | Ghost Orb | Freezing Temps | DOTS |

## P3.2 Forced and fake evidence — recap

| Ghost | Forced (always shown even at reduced evidence count) | Fake (extra signal not in trio) |
|---|---|---|
| Deogen | Spirit Box | None |
| Goryo | DOTS | None |
| Hantu | Freezing Temperatures | None |
| Moroi | Spirit Box | None |
| Obake | UV (Fingerprints) | None |
| The Mimic | None of the standard three is forced | Ghost Orb (always present) |
| All others | None | None |

## P3.3 Hunt thresholds

| Ghost | Threshold (%) | Notes |
|---|---|---|
| Banshee | 50 | Read off **target** sanity, not team-average |
| Dayan | 45 / 50 / 65 | Conditional: still / walk / sprint nearby |
| Demon | 70 | Highest standard threshold |
| Deogen | 40 | Low threshold |
| Gallu | 40 / 50 / 60 | State-conditional: calm / provoked / enraged |
| Goryo | 50 | Default |
| Hantu | 50 | Default; speed via temperature curve |
| Jinn | 50 | Default; speed via 3-condition gate |
| Mare | 60 / 40 | Conditional: lights off / lights on |
| Moroi | 50 | Default; speed via sanity curve |
| Myling | 50 | Default |
| Obake | 50 | Default |
| Obambo | 10 / 65 | Conditional: calm / aggressive (2-min cycle) |
| Oni | 50 | Default (some legacy 60) |
| Onryo | 60 | Plus forced hunt at 3 flames blown |
| Phantom | 50 | Default |
| Poltergeist | 50 | Default |
| Raiju | 65 / 50 | Conditional: near active electronics / not |
| Revenant | 50 | Default |
| Shade | 35 | Lowest standard threshold |
| Spirit | 50 | Default |
| Thaye | 75 → 15 | 11-tier age curve, −6%/age |
| The Mimic | Variable | Copies host |
| The Twins | 50 | Default; either Twin can hunt |
| Wraith | 50 | Default |
| Yokai | 80 / 50 | Conditional: voice within 2 m / not |
| Yurei | 50 | Default |

## P3.4 Hunt speeds

| Ghost | Speed (m/s) | LOS-accel applies? | Notes |
|---|---|---|---|
| Banshee | 1.7 | Yes | Default |
| Dayan | 1.2 / 1.7 / 2.25 | Yes | State by nearby player movement |
| Demon | 1.7 | Yes | Default; fast cooldown |
| Deogen | 0.4 / 1.6 / 3.0 | **No** | Distance-conditional curve overrides accel |
| Gallu | 1.36 / 1.7 / 1.96 | Yes | State-conditional |
| Goryo | 1.7 | Yes | Default |
| Hantu | 1.4–2.7 | Yes | 6-tier temperature curve; 1.4 m/s with breaker on |
| Jinn | 1.7 / 2.5 | Yes | Conditional on breaker on + LOS + dist > 3 m |
| Mare | 1.7 | Yes | Default |
| Moroi | 1.5–3.71 | Yes | Sanity-curve, +0.083 m/s per 5% below 50% |
| Myling | 1.7 | Yes | Default |
| Obake | 1.7 | Yes | Default |
| Obambo | 1.45 / 1.96 | Yes | Phase-conditional |
| Oni | 1.7 | Yes | Some legacy 1.8 |
| Onryo | 1.7 | Yes | Default |
| Phantom | 1.7 | Yes | Default |
| Poltergeist | 1.7 | Yes | Default |
| Raiju | 1.7 / 2.5 | Yes | Electronics-conditional |
| Revenant | 1.0 / 3.0 | **No** | Detection-conditional, snap |
| Shade | 1.7 | Yes | Default |
| Spirit | 1.7 | Yes | Default; 180 s smudge block |
| Thaye | 2.75 → 1.0 | Yes | 11-tier age curve |
| The Mimic | Variable | Per host | Copies host |
| The Twins | 1.5 / 1.9 | Yes | Per Twin |
| Wraith | 1.7 | Yes | Default |
| Yokai | 1.7 | Yes | Default |
| Yurei | 1.7 | Yes | Default |

## P3.5 Speed/threshold quick-key (most-used during identification)

- **Lowest threshold:** Shade (35).
- **Highest fixed threshold:** Yokai voice-trigger (80), Demon (70).
- **Highest conditional threshold:** Thaye young (75), Obambo aggressive (65), Raiju near electronics (65), Dayan sprint-detected (65).
- **Slowest hunts:** Deogen close (0.4), Revenant undetected (1.0), Thaye old (1.0), Dayan calm (1.2).
- **Fastest hunts:** Deogen far (3.0), Revenant detected (3.0), Moroi at 0% sanity (3.71).

## P3.6 LOS-accel exceptions

LOS-accel **does not apply** to:
- **Deogen** (distance-curve overrides).
- **Revenant** (binary snap).

All other ghosts apply LOS-accel on top of their tier base.

## P3.7 Crucifix radius overrides

| Ghost | Tier I | Tier II | Notes |
|---|---|---|---|
| Default | 3 m | 4 m | Standard |
| Demon | 5 m | 6 m | Buffed but burns charges faster |
| Banshee | 3 m | 4 m | **Always** blocks hunts at target's range |

## P3.8 Smudge / hunt-cooldown overrides

| Ghost | Smudge blind during hunt | Smudge block outside hunt | Notes |
|---|---|---|---|
| Default | ~5 s | 90 s | Standard |
| Spirit | ~5 s | **180 s** | Doubled outside-hunt block |
| Demon | ~5 s | **60 s** | Reduced; cooldown also 20 s |
| Moroi | **~3 s** (or 7.5 s, see notes) | 90 s | Reduced blind; **Unknown** for exact |
| Yurei | ~5 s | **Confines to favourite room 90 s** instead of next-hunt block | Unique |
| Gallu | **State-modulated** (~5 / ~3.75 / ~2.5 s) | 90 s | Decreasing with state escalation |
| Onryo | ~5 s | 90 s | Stacks with candle 3 m and lighter 4 m blocks |

## P3.9 Behaviour-specific identifiers (one-line summary)

- **Banshee:** parabolic 1/3 screech roll; target sanity; crucifix always blocks.
- **Dayan:** speed/threshold modulate with nearby player movement; female-only model.
- **Demon:** 70% threshold; 20 s cooldown; buffed crucifix radius; Ouija increases hunt rolls.
- **Deogen:** breathes audibly; distance-curve speed; always knows player position.
- **Gallu:** state-machine via crucifix and smudge use; Enraged skips fresh salt.
- **Goryo:** DOTS only on video camera with no players in room.
- **Hantu:** speed scales inversely with room temperature; breaker on slows to 1.4 m/s; visible breath cloud.
- **Jinn:** 2.5 m/s when breaker on + LOS + dist > 3 m; sanity-drain ability.
- **Mare:** lights-off raises threshold to 60%; cannot turn lights on; pops bulbs.
- **Moroi:** Spirit Box curses listener (double drain); speed scales with low sanity.
- **Myling:** elevated paranormal sound rate; ~12 m hunt footstep audibility.
- **Obake:** 75% print rate; 1/6 of prints abnormal (six-fingered); model swaps during hunt.
- **Obambo:** 2-minute calm/aggressive cycle; threshold 10/65; speed 1.45/1.96.
- **Oni:** elevated interaction rate; longer manifestations; bigger throws.
- **Onryo:** blows out flames; 3 blown flames forces a hunt; lit flame within 4 m blocks individual hunt.
- **Phantom:** photo-vanish; LOS-on-manifest drains sanity faster; halved Spirit Box rate; hunt invisible-flicker.
- **Poltergeist:** multi-throw single events; per-throw sanity penalty.
- **Raiju:** speed/threshold buff near active electronics; long-range flashlight flicker.
- **Revenant:** binary speed (1.0 undetected / 3.0 detected); no LOS-accel.
- **Shade:** lowest threshold (35); suppresses interactions and events when player is in room.
- **Spirit:** all default except 180 s smudge block.
- **Thaye:** ages over time near players; 11-tier threshold/speed curve.
- **The Mimic:** copies host; always shows Ghost Orb on top of trio.
- **The Twins:** two simultaneous Twin entities; alternating hunts; 1.5 / 1.9 m/s.
- **Wraith:** never steps in salt; salt-adjacent sanity drain.
- **Yokai:** 80% threshold while voice within 2 m; reduced hunt LOS radius.
- **Yurei:** event LOS drains ~15% sanity; smudge confines to favourite room 90 s.

# Part IV — Confidence Glossary and Known Gaps

## P4.1 Confidence levels used in this document

- **High:** value confirmed by ≥2 independent secondary sources dated 2025–2026 (per-ghost guides on keengamer/dotesports/progameguides/screenrant + Steam community guide #3464855117 March 2026 + tybayn cheat sheet, etc.). Treated as production-ready.
- **Medium-high:** value confirmed by 2+ sources but with some patch-version drift between sources. Direction unambiguous, exact number ±5–15%.
- **Medium:** value sourced from 1–2 references, possibly with conflicting alternatives. Use with verification.
- **Unknown — requires current Phasmophobia Wiki verification:** explicit fail-safe used in this doc whenever the rule applies but the precise number was not confirmable. Never substitute a guess for this label.

## P4.2 Known gaps (recurring "Unknown" entries)

The following items recur as **Unknown — requires current Phasmophobia Wiki verification** and should be the first to validate against the live Fandom wiki when access is available:

1. Exact passive sanity drain rates per difficulty (CC.6).
2. Exact voice-detection radii outside Yokai's 2 m (CC.5).
3. Demon: Tier III/IV crucifix radii beyond Tier I/II 5/6 m.
4. Gallu: smudge blind duration in Provoked / Enraged states (precise seconds).
5. Gallu: salt-pile freshness window for Enraged-state skip behaviour.
6. Hantu: confirmation that the temperature curve uses 0/3/6/9/12/15 °C breakpoints exactly (vs continuous interpolation).
7. Jinn: cooldown of the sanity-drain ability.
8. Moroi: smudge blind duration during hunts (3 s vs 7.5 s, sources split).
9. Obake: whether the 25% print-miss rate applies to salt prints.
10. Obambo: confirmation of trio (SB / Orb / DOTS) against most-recent patch.
11. Oni: confirmation of 50% (vs legacy 60%) threshold and 1.7 m/s (vs legacy 1.8) speed.
12. Onryo: whether the flame counter resets at hunt end.
13. Phantom: hunt invisible-flicker exact cadence (~1.5 s ± ?).
14. Phantom: exact LOS-on-manifest sanity drain rate.
15. Poltergeist: per-throw sanity drain exact rate.
16. Raiju: electronics-detection radius (~6–8 m) and flashlight-flicker range (~15 m) exact values.
17. Thaye: per-tier exact speed values between endpoints 2.75 and 1.0 m/s.
18. Thaye: age-up timer (60–120 s window).
19. The Mimic: full list of host ghost types excluded from selection.
20. Yokai: hunt LOS radius (2.5–5 m sources split).
21. Yurei: ghost-event sanity-drain exact percentage.

## P4.3 Source list (consolidated)

- Phasmophobia Wiki (Fandom) — primary source per the source rule, returned 403 to direct fetch from this environment as of 2026-04-29; values reconstructed from the references below.
- KeenGamer — per-ghost guides dated 2025–2026.
- DotEsports — per-ghost guides dated 2025–2026.
- ProGameGuides — per-ghost guides dated 2025–2026.
- DualShockers — ghost overview pages dated 2025–2026.
- ScreenRant — Phasmophobia ghost lists dated 2025–2026.
- ScreenHype — aggregated ghost behaviour summaries.
- GameRant — ghost-mechanic articles.
- Steam Community Guide #3464855117 (March 2026) — comprehensive cheat-sheet-style reference cited heavily.
- Tybayn cheat sheet (tybayn.github.io) — unofficial cheat sheet.
- ReportAFK — threshold cheat sheet.
- TheGamer — ghost behaviour articles.
- FindingDulcinea — auxiliary reference.
- phasmo.co.uk Phasmophobia Assistant — interactive identifier.
- *Phasmophobia.fr* wiki — French-language community wiki (HTTP refused at fetch time).

---

*End of document. Implementation plan continues in `docs/HAUNTED_GHOST_IMPLEMENTATION_PLAN.md`.*
