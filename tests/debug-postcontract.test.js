#!/usr/bin/env node
// One-off debug probe for the rebuilt post-contract flow:
//   1) "+ XP" pressed mid-game must DEFER (not show loading screen)
//   2) On lobby return, the deferred flow starts in "xpFill" first
//   3) Filling completes → state transitions to "debrief"
//   4) Debrief is terminal — Return to Lobby tears down the flow
// Captures screenshots at each phase so the paper-on-cork theme is verifiable.

const { chromium } = require("playwright");
const path = require("path");

const BASE = process.env.SMOKE_BASE || "http://localhost:8000";
const URL_FLAGS = "?seed=7&skipSetup=1&ghost=Spirit&autoStart=1&debug=1";
const SHOTS = path.resolve(__dirname);

function log(...a) { console.log("[postcontract]", ...a); }
function fail(msg) { console.error("[postcontract] FAIL:", msg); process.exitCode = 1; }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  log("nav", BASE + "/" + URL_FLAGS);
  await page.goto(BASE + "/" + URL_FLAGS, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(2500);

  // Step 1 — confirm we're in-game (gameRunning=true)
  const gr1 = await page.evaluate(() => window.gameRunning);
  log("gameRunning at boot:", gr1);
  if (!gr1) fail("expected autoStart to put us in-game");

  // Step 2 — simulate "+ XP" press while in-game; flow must DEFER
  const giveMid = await page.evaluate(() => window.__debug.pressGiveXp(750));
  log("pressGiveXp (in-game):", giveMid);
  if (!giveMid.deferred) fail("mid-game grant should be deferred, was applied immediately");

  const pcMid = await page.evaluate(() => window.__debug.postContract());
  const pendMid = await page.evaluate(() => window.__debug.pendingDebugXpFlow());
  log("postContract (in-game):", pcMid, "pending:", pendMid);
  if (pcMid !== null) fail("mid-game grant should NOT activate _postContract");
  if (!pendMid || pendMid.total !== 750) fail("pending flow should hold the queued grant");

  // Snapshot mid-game (should look like normal gameplay, no loading screen)
  await page.screenshot({ path: path.join(SHOTS, "debug-postcontract-1-ingame.png") });

  // Step 3 — go to the lobby; the corkboard branch should drain pending → xpFill
  await page.evaluate(() => window.__debug.gotoLobby());
  await page.waitForTimeout(200); // let one frame run drain logic
  const pcLobby = await page.evaluate(() => window.__debug.postContract());
  const pendLobby = await page.evaluate(() => window.__debug.pendingDebugXpFlow());
  log("postContract (lobby, after drain):", pcLobby, "pending:", pendLobby);
  if (!pcLobby) fail("expected _postContract to start when entering lobby with pending grant");
  if (pcLobby.state !== "xpFill") fail("flow should start in 'xpFill' (got " + pcLobby?.state + ")");
  if (pendLobby) fail("pending should be drained to null");

  // Snapshot xpFill
  await page.screenshot({ path: path.join(SHOTS, "debug-postcontract-2-xpfill.png") });

  // Step 4 — let the fill complete (totalEarned 750 with default _approxLevels=1
  // gives ~1 second; we wait a generous 4 s for safety, also accounts for any
  // unlock cards triggered along the way). Then assert state is "debrief".
  // Click DONE on any unlock card by sending a center click on the canvas.
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(150);
    const st = await page.evaluate(() => window.__debug.postContract()?.state);
    if (st === "unlockCard") {
      await page.mouse.click(640, 400); // anywhere on card body advances
    }
    if (st === "debrief") break;
  }
  const pcAfter = await page.evaluate(() => window.__debug.postContract());
  log("postContract (after fill):", pcAfter);
  if (!pcAfter) fail("flow should not be torn down before debrief");
  if (pcAfter && pcAfter.state !== "debrief") fail("flow should reach 'debrief' (got " + pcAfter?.state + ")");

  await page.screenshot({ path: path.join(SHOTS, "debug-postcontract-3-debrief.png") });

  // Step 5 — click the "return to lobby →" button on the debrief; flow should clear
  // Canvas is 800×600 logical; convert canvas coords → CSS coords via the
  // canvas's bounding rect (the click handler scales the other direction).
  const btn = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    const r = c.getBoundingClientRect();
    // Debrief button rect in canvas-space: (538, 492, 170, 44)
    const sx = r.width / c.width, sy = r.height / c.height;
    return {
      x: r.left + (538 + 170 / 2) * sx,
      y: r.top  + (492 + 44 / 2) * sy,
    };
  });
  await page.mouse.click(btn.x, btn.y);
  await page.waitForTimeout(300);
  const pcDone = await page.evaluate(() => window.__debug.postContract());
  log("postContract (after return-to-lobby click):", pcDone);
  if (pcDone !== null) fail("flow should be cleared after Return to Lobby (got " + JSON.stringify(pcDone) + ")");

  await page.screenshot({ path: path.join(SHOTS, "debug-postcontract-4-lobby.png") });

  if (errors.length) {
    log("page errors captured:");
    for (const e of errors) console.error("  ", e);
    fail("browser produced " + errors.length + " errors");
  }

  await browser.close();
  log(process.exitCode ? "FAIL" : "PASS");
}

run().catch((e) => { console.error(e); process.exit(1); });
