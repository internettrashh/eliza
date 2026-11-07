// usage: node capture.mjs <label> <outdir>
import { chromium } from "/home/gcloud_construct_computer/slop/slopdotcash/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
const [label, out] = process.argv.slice(2);
const dir = `${out}/${label}`; mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: "/tmp/chrome-libs/chrome-headless-shell" });
const log = [];
for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport, recordVideo: { dir: `${dir}/video-${name}`, size: viewport } });
  const page = await ctx.newPage();
  page.on("console", (m) => log.push(`[${name}] console.${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => log.push(`[${name}] pageerror: ${e.message}`));
  page.on("request", (r) => { if (r.url().includes("/api/views/maps/interact")) log.push(`[${name}] request ${r.method()} ${new URL(r.url()).pathname} ${r.postData()}`); });
  page.on("response", async (r) => { if (r.url().includes("/api/views/maps/interact")) log.push(`[${name}] response ${r.status()} ${(await r.text().catch(() => "")).slice(0, 600)}`); });
  await page.goto("http://localhost:2138/maps", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(12000);
  await page.screenshot({ path: `${dir}/${name}-1-open.jpg`, fullPage: true, type: "jpeg", quality: 80 });
  await page.keyboard.press("Escape"); await page.waitForTimeout(800);
  const form = page.locator('form[aria-label="Search places"]');
  if ((await form.getAttribute("aria-hidden")) === "true") {
    const h = await page.evaluate(() => { const e=[...document.querySelectorAll("div")].find(d=>{const r=d.getBoundingClientRect(); return r.width>=30&&r.width<=60&&r.height<=8&&r.height>=2;}); if(!e) return null; const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
    log.push(`[${name}] sheet handle: ${JSON.stringify(h)}`);
    if (h) { await page.mouse.move(h.x,h.y); await page.mouse.down(); await page.mouse.move(h.x,h.y+300,{steps:10}); await page.mouse.move(h.x,viewport.height-5,{steps:10}); await page.mouse.up(); await page.waitForTimeout(1200); }
  }
  log.push(`[${name}] search form hidden: ${await form.getAttribute("aria-hidden")}`);
  const box = page.locator('input[type="search"], input[placeholder*="earch" i]').first();
  log.push(`[${name}] search inputs: ${await box.count()}`);
  if (await box.count() && await box.isVisible()) {
    await box.click(); await box.fill("cafe"); await page.waitForTimeout(500);
    await box.press("Enter"); await page.waitForTimeout(6000);
  }
  await page.screenshot({ path: `${dir}/${name}-2-search.jpg`, fullPage: true, type: "jpeg", quality: 80 });
  writeFileSync(`${dir}/${name}-text.txt`, await page.locator("body").innerText());
  await ctx.close();
}
writeFileSync(`${dir}/browser-log.txt`, log.join("\n") + "\n");
await browser.close();
console.log(log.filter((l) => /request|response|inputs|error|hidden|handle/.test(l)).join("\n"));
