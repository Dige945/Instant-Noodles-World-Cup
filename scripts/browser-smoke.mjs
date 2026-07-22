import puppeteer from "puppeteer-core";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:4173";
const executablePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
const artifactDir = process.env.SMOKE_ARTIFACT_DIR;
if (artifactDir) {
  await fs.mkdir(artifactDir, { recursive: true });
  const client = await page.createCDPSession();
  await client.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: artifactDir });
}

const runtimeErrors = [];
const responseErrors = [];
page.on("pageerror", (error) => runtimeErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) runtimeErrors.push(message.text());
});
page.on("response", (response) => {
  if (response.status() >= 400) responseErrors.push(`${response.status()} ${response.url()}`);
});

async function assertLayout(label) {
  const layout = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, className: element.className?.toString().slice(0, 80), left: rect.left, right: rect.right };
      })
      .filter((item) => item.left < -1 || item.right > viewport + 1)
      .slice(0, 8);
    return { viewport, scrollWidth: document.documentElement.scrollWidth, offenders };
  });
  if (layout.scrollWidth > layout.viewport + 1) {
    throw new Error(`${label} 出现横向溢出：${JSON.stringify(layout)}`);
  }
}

async function assertResponsiveLayout(label) {
  for (const viewport of [{ width: 320, height: 720 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
    await assertLayout(`${label} ${viewport.width}px`);
  }
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
}

try {
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
  await assertResponsiveLayout("首页");
  if (artifactDir) await page.screenshot({ path: path.join(artifactDir, "home-mobile.png"), fullPage: true });
  await page.click('a[href="/setup/"]');
  await page.waitForSelector(".group-choice-grid .qualifier-card:nth-child(4)");
  await assertResponsiveLayout("参赛名单页");
  if (artifactDir) await page.screenshot({ path: path.join(artifactDir, "setup-mobile.png"), fullPage: true });
  await page.click(".group-choice-grid .qualifier-card:nth-child(1) .qualifier-replace");
  for (let group = 0; group < 12; group += 1) {
    await page.click(".group-choice-grid .qualifier-card:nth-child(1) .qualifier-card-main");
    await page.click(".group-choice-grid .qualifier-card:nth-child(2) .qualifier-card-main");
    await page.click(".qualifier-actions .button-primary");
  }
  await page.waitForSelector(".revival-grid .qualifier-card:nth-child(24)");
  for (let candidate = 1; candidate <= 8; candidate += 1) {
    await page.click(`.revival-grid .qualifier-card:nth-child(${candidate}) .qualifier-card-main`);
  }
  if (artifactDir) await page.screenshot({ path: path.join(artifactDir, "revival-mobile.png"), fullPage: true });
  await page.click(".qualifier-actions .button-primary");
  await page.waitForSelector(".battle-stage");
  await assertResponsiveLayout("比赛页");
  await page.waitForSelector(".round-intro", { hidden: true, timeout: 3000 });
  if (artifactDir) await page.screenshot({ path: path.join(artifactDir, "battle-mobile.png"), fullPage: true });

  for (let match = 0; match < 31; match += 1) {
    await page.waitForSelector(".round-intro", { hidden: true, timeout: 3000 });
    await page.click("button.noodle-card:first-child");
    if (match < 30) await new Promise((resolve) => setTimeout(resolve, 720));
  }
  await page.waitForSelector(".champion-hero", { timeout: 5000 });
  await assertResponsiveLayout("结果页");
  if (artifactDir) await page.screenshot({ path: path.join(artifactDir, "result-mobile.png"), fullPage: true });
  await page.waitForFunction(
    () => !document.querySelector(".hero-result-actions .button-primary")?.disabled,
    { timeout: 5000 },
  );
  if (artifactDir) {
    await page.evaluate(() => {
      const wrapper = document.querySelector(".poster-offscreen");
      if (wrapper instanceof HTMLElement) {
        wrapper.style.left = "0";
        wrapper.style.top = "0";
        wrapper.style.zIndex = "9999";
      }
    });
    const poster = await page.$(".share-poster");
    await poster?.screenshot({ path: path.join(artifactDir, "share-poster-preview.png") });
    await page.evaluate(() => {
      const wrapper = document.querySelector(".poster-offscreen");
      if (wrapper instanceof HTMLElement) {
        wrapper.style.left = "-10000px";
        wrapper.style.zIndex = "-100";
      }
    });
  }
  await page.evaluate(() => {
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function capturePosterDownload() {
      if (this.download.endsWith(".png")) window.__posterDownload = this.href;
      return originalClick.call(this);
    };
  });
  await page.click(".hero-result-actions .button-primary");
  await page.waitForFunction(
    () => {
      const message = document.querySelector(".export-message")?.textContent ?? "";
      return message.includes("海报已生成") || message.includes("海报生成失败");
    },
    { timeout: 30000 },
  );
  await page.waitForSelector(".poster-preview-dialog");
  if (artifactDir) await page.screenshot({ path: path.join(artifactDir, "poster-modal-mobile.png") });
  await page.click(".poster-preview-actions a[download]");
  const exportedPoster = await page.evaluate(() => window.__posterDownload ?? "");
  if (!exportedPoster.startsWith("data:image/png;base64,")) throw new Error("未捕获到导出的海报 PNG");
  const exportedPosterBytes = Buffer.from(exportedPoster.split(",")[1], "base64");
  if (artifactDir) await fs.writeFile(path.join(artifactDir, "exported-poster.png"), exportedPosterBytes);

  const pageResult = await page.evaluate(() => ({
    champion: document.querySelector(".champion-hero h2")?.textContent,
    routeItems: document.querySelectorAll(".champion-route li").length,
    bracketMatches: document.querySelectorAll(".bracket-match").length,
    posterButtonDisabled: document.querySelector(".hero-result-actions .button-primary")?.disabled,
    posterWidth: document.querySelector(".share-poster")?.getBoundingClientRect().width,
    posterHeight: document.querySelector(".share-poster")?.getBoundingClientRect().height,
    podiumItems: document.querySelectorAll(".podium-card").length,
    exportMessage: document.querySelector(".export-message")?.textContent,
  }));
  const result = { ...pageResult, exportedPosterBytes: exportedPosterBytes.length };

  if (!result.champion || result.routeItems !== 6 || result.bracketMatches !== 31 || result.podiumItems !== 3) {
    throw new Error(`结果页数据不完整：${JSON.stringify(result)}`);
  }
  if (result.posterWidth !== 540 || result.posterHeight !== 960) {
    throw new Error(`海报尺寸错误：${JSON.stringify(result)}`);
  }
  if (!result.exportMessage?.includes("海报已生成")) {
    throw new Error(`海报导出失败：${JSON.stringify(result)}`);
  }
  if (responseErrors.length) throw new Error(`资源请求错误：${responseErrors.join(" | ")}`);
  if (runtimeErrors.length) throw new Error(`浏览器运行错误：${runtimeErrors.join(" | ")}`);
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
} finally {
  await browser.close();
}
