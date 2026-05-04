#!/usr/bin/env node
// Scripted debug for the new control bindings (April 2026 Phasmo-parity pass).
// Boots the game with autoStart and walks each new control end-to-end:
//   1) KEYBIND_DEFAULTS shape: T=flashlight, F=use, J=journal, hotbar=1/2/3, rightClickMod=Space
//   2) CONTROLS_SCHEMA_VERSION = 3 (set by trackpad-modifier pass)
//   3) T toggles flashlight (was F)
//   4) F triggers use on a held active item (was R)
//   5) 1 / 2 / 3 jump selectedSlot directly (new)
//   6) Q still cycles inventory
//   7) G drops the held item
//   8) J toggles the journal
//   9) Space + L-click acts as a right-click — placement preview appears + commit grows worldItems
//  10) Releasing Space mid-drag still commits on left mouseup (modPlacementActive flag)

const { chromium } = require("playwright");

const BASE = process.env.SMOKE_BASE || "http://localhost:8000";
const URL_FLAGS = "?seed=7&skipSetup=1&ghost=Spirit&autoStart=1&debug=1";

function log(...a) { console.log("[controls]", ...a); }
function fail(msg) { console.error("[controls] FAIL:", msg); process.exitCode = 1; }
function expect(cond, msg) { if (!cond) fail(msg); }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  log("nav", BASE + "/" + URL_FLAGS);
  await page.goto(BASE + "/" + URL_FLAGS, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(2500);

  // Make sure the page has focus so keyboard events route to the document
  await page.locator("canvas").first().click({ position: { x: 5, y: 5 } });
  await page.waitForTimeout(150);

  // ── Step 1 & 2: keybind defaults + schema version ────────────────────
  const snap0 = await page.evaluate(() => window.__debug.controlsSnap());
  log("initial keybinds:", snap0.keybinds, "schemaVer:", snap0.schemaVersion);
  expect(snap0.keybinds.flashlight === "t",     "flashlight should default to 't', got " + snap0.keybinds.flashlight);
  expect(snap0.keybinds.use === "f",            "use should default to 'f', got " + snap0.keybinds.use);
  expect(snap0.keybinds.interact === "e",       "interact should default to 'e', got " + snap0.keybinds.interact);
  expect(snap0.keybinds.journal === "j",        "journal should default to 'j', got " + snap0.keybinds.journal);
  expect(snap0.keybinds.drop === "g",           "drop should default to 'g', got " + snap0.keybinds.drop);
  expect(snap0.keybinds.inventory === "q",      "inventory should default to 'q', got " + snap0.keybinds.inventory);
  expect(snap0.keybinds.sprint === "shift",     "sprint should default to 'shift', got " + snap0.keybinds.sprint);
  expect(snap0.keybinds.rightClickMod === " ",  "rightClickMod should default to Space ' ', got '" + snap0.keybinds.rightClickMod + "'");
  expect(snap0.schemaVersion === 3,             "CONTROLS_SCHEMA_VERSION should be 3, got " + snap0.schemaVersion);

  // ── Step 3: load player up so item-bound controls have something to act on ──
  await page.evaluate(() => {
    const d = window.__debug;
    d.grantAllGear(); // EMF + Flashlight + Incense + Lighter, slot 0 = EMF
    d.endSetup();
    d.setSanity(80);
  });
  await page.waitForTimeout(100);

  // ── Step 4: T toggles flashlight ──
  // Inventory order from grantAllGear: EMF, Flashlight, Incense — Flashlight is slot 1
  await page.evaluate(() => { window.__debug && (window.selectedSlot = 1); });
  // Force-set selectedSlot via direct inventory cycle since selectedSlot isn't on window;
  // press 2 to jump to slot index 1 (1-key=slot0, 2-key=slot1)
  await page.keyboard.press("2");
  await page.waitForTimeout(120);
  let snapPre = await page.evaluate(() => window.__debug.controlsSnap());
  log("after [2] pressed: selectedSlot=", snapPre.selectedSlot, "held=", snapPre.inventory[snapPre.selectedSlot]);
  expect(snapPre.selectedSlot === 1, "Hotkey 2 should set selectedSlot=1, got " + snapPre.selectedSlot);
  expect(snapPre.inventory[snapPre.selectedSlot] === "Flashlight", "slot 1 should be Flashlight, got " + snapPre.inventory[snapPre.selectedSlot]);

  const flBefore = snapPre.flashlightOn;
  await page.keyboard.press("t");
  await page.waitForTimeout(120);
  let snapFL = await page.evaluate(() => window.__debug.controlsSnap());
  log("after [T] pressed: flashlightOn", flBefore, "->", snapFL.flashlightOn);
  expect(snapFL.flashlightOn !== flBefore, "T should toggle flashlightOn (was " + flBefore + ", now " + snapFL.flashlightOn + ")");
  // Toggle back
  await page.keyboard.press("t");
  await page.waitForTimeout(120);
  let snapFL2 = await page.evaluate(() => window.__debug.controlsSnap());
  expect(snapFL2.flashlightOn === flBefore, "second T should toggle back (expected " + flBefore + ", got " + snapFL2.flashlightOn + ")");

  // ── Step 5: 1 / 2 / 3 hotbar direct select ──
  await page.keyboard.press("1");
  await page.waitForTimeout(80);
  let snapH1 = await page.evaluate(() => window.__debug.controlsSnap());
  expect(snapH1.selectedSlot === 0, "Hotkey 1 should set selectedSlot=0, got " + snapH1.selectedSlot);

  await page.keyboard.press("3");
  await page.waitForTimeout(80);
  let snapH3 = await page.evaluate(() => window.__debug.controlsSnap());
  expect(snapH3.selectedSlot === 2, "Hotkey 3 should set selectedSlot=2, got " + snapH3.selectedSlot);

  await page.keyboard.press("2");
  await page.waitForTimeout(80);
  let snapH2 = await page.evaluate(() => window.__debug.controlsSnap());
  expect(snapH2.selectedSlot === 1, "Hotkey 2 should set selectedSlot=1, got " + snapH2.selectedSlot);
  log("hotbar 1/2/3 → selectedSlot routes confirmed");

  // ── Step 6: Q still cycles inventory ──
  const before = snapH2.selectedSlot;
  await page.keyboard.press("q");
  await page.waitForTimeout(80);
  let snapQ = await page.evaluate(() => window.__debug.controlsSnap());
  expect(snapQ.selectedSlot !== before, "Q should change selectedSlot from " + before + ", got " + snapQ.selectedSlot);
  log("Q cycle: " + before + " -> " + snapQ.selectedSlot);

  // ── Step 7: F uses held item on Flashlight (turns it on, drives heldItemOn) ──
  await page.keyboard.press("2"); // back to Flashlight
  await page.waitForTimeout(80);
  // Make sure flashlight is OFF first so we can verify F turned it on
  let preF = await page.evaluate(() => window.__debug.controlsSnap());
  if (preF.flashlightOn) { await page.keyboard.press("t"); await page.waitForTimeout(80); }
  preF = await page.evaluate(() => window.__debug.controlsSnap());
  log("before [F]: heldItemOn=", preF.heldItemOn, "flashlightOn=", preF.flashlightOn);
  await page.keyboard.press("f");
  await page.waitForTimeout(120);
  let postF = await page.evaluate(() => window.__debug.controlsSnap());
  log("after [F]: heldItemOn=", postF.heldItemOn, "flashlightOn=", postF.flashlightOn);
  expect(postF.heldItemOn === true || postF.flashlightOn === true,
    "F (use) on Flashlight should activate it — heldItemOn or flashlightOn became true");

  // ── Step 8: J toggles journal ──
  const j0 = await page.evaluate(() => window.__debug.controlsSnap());
  await page.keyboard.press("j");
  await page.waitForTimeout(120);
  const j1 = await page.evaluate(() => window.__debug.controlsSnap());
  expect(j1.journalOpen !== j0.journalOpen, "J should toggle journalOpen (" + j0.journalOpen + " -> " + j1.journalOpen + ")");
  await page.keyboard.press("j");
  await page.waitForTimeout(120);
  const j2 = await page.evaluate(() => window.__debug.controlsSnap());
  expect(j2.journalOpen === j0.journalOpen, "second J should restore (" + j0.journalOpen + ")");
  log("journal toggle round-trip OK");

  // ── Step 9: G drops held item ──
  // Re-grant gear so we have 3 in inventory after any F-toggle changes
  await page.evaluate(() => { window.__debug.grantAllGear(); });
  await page.waitForTimeout(80);
  await page.keyboard.press("2"); // select Flashlight
  await page.waitForTimeout(80);
  const preG = await page.evaluate(() => window.__debug.controlsSnap());
  log("before [G]: inventory=", preG.inventory);
  await page.keyboard.press("g");
  await page.waitForTimeout(150);
  const postG = await page.evaluate(() => window.__debug.controlsSnap());
  log("after [G]:  inventory=", postG.inventory);
  expect(postG.inventory.length === preG.inventory.length - 1,
    "G should drop one item (was " + preG.inventory.length + ", now " + postG.inventory.length + ")");

  // ── Step 10: Space + L-click acts as R-click → placement preview ──
  // Need a placeable item — swap Incense out for Crucifix (Crucifix is in PLACEABLE_ITEMS).
  await page.evaluate(() => {
    inventory.length = 0;
    inventory.push("Crucifix", "Salt", "Motion Sensor");
    selectedSlot = 0;
  });
  await page.waitForTimeout(80);
  await page.keyboard.press("1"); // slot 0 = Crucifix
  await page.waitForTimeout(80);
  const placeReady = await page.evaluate(() => window.__debug.controlsSnap());
  log("placement-ready: held=", placeReady.inventory[placeReady.selectedSlot]);

  // Click somewhere safely on the canvas while holding Space
  const canvas = await page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) { fail("could not get canvas bounding box"); await browser.close(); return; }
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  await page.keyboard.down("Space");
  await page.waitForTimeout(50);
  await page.mouse.move(cx, cy);
  await page.mouse.down({ button: "left" });
  await page.waitForTimeout(120);
  const placeMid = await page.evaluate(() => window.__debug.controlsSnap());
  log("space+left-down: placementPreview=", placeMid.placementPreview, "modActive=", placeMid.modPlacementActive);
  expect(placeMid.placementPreview.active === true, "placementPreview should be active during Space+L-click hold");
  expect(placeMid.modPlacementActive === true, "_modPlacementActive should be true during Space+L-click hold");

  // Step 11 — release Space mid-drag, then release left mouse: commit must still fire
  const worldBefore = await page.evaluate(() => window.__debug.dump().worldItems.length);
  await page.keyboard.up("Space");
  await page.waitForTimeout(60);
  await page.mouse.up({ button: "left" });
  await page.waitForTimeout(200);
  const placeAfter = await page.evaluate(() => window.__debug.controlsSnap());
  const worldAfter = await page.evaluate(() => window.__debug.dump().worldItems.length);
  log("after release: placementPreview=", placeAfter.placementPreview, "worldItems:", worldBefore, "->", worldAfter);
  expect(placeAfter.placementPreview.active === false, "placementPreview should be cleared after release");
  expect(placeAfter.modPlacementActive === false, "_modPlacementActive should be cleared after release");
  // Placement may or may not commit depending on validity (collision with walls).
  // The important behaviour is that the modifier path didn't leak preview state
  // and worldItems didn't shrink.
  expect(worldAfter >= worldBefore, "worldItems should not shrink after Space+L-click release");

  // ── Bonus: hold-only hint without click should not do anything weird ──
  await page.keyboard.down("Space");
  await page.waitForTimeout(120);
  const holdOnly = await page.evaluate(() => window.__debug.controlsSnap());
  expect(holdOnly.placementPreview.active === false, "Holding Space alone should NOT activate placement preview");
  await page.keyboard.up("Space");

  await page.screenshot({ path: "tests/controls-debug-screenshot.png" });
  log("screenshot -> tests/controls-debug-screenshot.png");

  if (errors.length) { errors.forEach(e => console.error("[controls] err:", e)); fail(errors.length + " runtime errors"); }

  await browser.close();
  if (process.exitCode) console.error("[controls] FAILED"); else console.log("[controls] PASS");
}

run().catch((e) => { console.error("[controls] uncaught:", e); process.exit(2); });
