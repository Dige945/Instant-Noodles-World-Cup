import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const dataPath = path.join(root, "src", "data", "noodles.json");
const outputDir = path.join(root, "public", "images", "noodles");
const sourcePath = path.join(root, "src", "data", "noodle-image-sources.json");
const noodles = JSON.parse(await fs.readFile(dataPath, "utf8"));

await fs.mkdir(outputDir, { recursive: true });

const COMMON = /方便面|泡面|速食|即食|五连包|袋装|桶装|杯面|干脆面|拉面|炒面|拌面|牛肉面|伊面|面|味|风味|经典|日式|韩式|港式|原汁/g;

function normalize(value) {
  return value.toLowerCase().replace(/[\s·・()（）【】\[\]×*+\-_/，,。:：]/g, "");
}

function keyFlavor(value) {
  return normalize(value).replace(COMMON, "");
}

function bigrams(value) {
  const normalized = normalize(value);
  const result = new Set();
  for (let index = 0; index < normalized.length - 1; index += 1) result.add(normalized.slice(index, index + 2));
  return result;
}

function similarity(target, candidate) {
  const a = bigrams(target);
  const b = bigrams(candidate);
  let overlap = 0;
  a.forEach((item) => { if (b.has(item)) overlap += 1; });
  return a.size + b.size ? (2 * overlap) / (a.size + b.size) : 0;
}

function scoreProduct(noodle, product) {
  const title = normalize(product.name ?? "");
  const brand = normalize(noodle.brand);
  const name = normalize(noodle.name);
  const flavor = keyFlavor(noodle.name);
  let score = similarity(`${noodle.brand}${noodle.name}`, product.name ?? "") * 100;
  if (title.includes(brand)) score += 65;
  else score -= 70;
  if (title.includes(name)) score += 90;
  if (flavor && title.includes(flavor)) score += 45;
  for (const tag of noodle.flavorTags) {
    const normalizedTag = normalize(tag);
    if (normalizedTag.length > 1 && title.includes(normalizedTag)) score += 8;
  }
  if (title.includes("组合") || title.includes("混合")) score -= 18;
  const isCupTitle = /桶|杯|碗|开心桶|来一桶/.test(product.name ?? "");
  const isDryTitle = /干拌|拌面|炒面|干脆/.test(product.name ?? "");
  if (noodle.type === "cup") score += isCupTitle ? 28 : -22;
  if (noodle.type === "bag" && isCupTitle) score -= 32;
  if ((noodle.type === "dry" || noodle.type === "snack") && isDryTitle) score += 24;
  if ((noodle.type === "dry" || noodle.type === "snack") && !isDryTitle) score -= 16;
  return score;
}

function extractProducts(html) {
  const products = [];
  const scripts = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    try {
      const json = JSON.parse(match[1]);
      const items = Array.isArray(json?.["@graph"]) ? json["@graph"] : [json];
      for (const item of items) {
        if (item?.["@type"] === "Product" && item.name && item.image) products.push(item);
      }
    } catch {
      // Ignore unrelated malformed JSON-LD blocks.
    }
  }
  return products;
}

async function fetchWithTimeout(url, timeout = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131 Safari/537.36" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function findProduct(noodle) {
  const queries = [
    `${noodle.brand}${noodle.name}`,
    `${noodle.brand} ${keyFlavor(noodle.name)}`,
    noodle.brand,
  ];
  const seen = new Map();
  let searchUrl = "";

  for (const query of queries) {
    searchUrl = `https://www.sayweee.com/zh/grocery-near-me/chinese-lang/explore/${encodeURIComponent(query)}`;
    const response = await fetchWithTimeout(searchUrl);
    const html = await response.text();
    extractProducts(html).forEach((product) => seen.set(product["@id"] ?? product.url ?? product.name, product));
  }

  const ranked = [...seen.values()].sort((a, b) => scoreProduct(noodle, b) - scoreProduct(noodle, a));
  if (!ranked.length) throw new Error("没有找到商品候选");
  return { product: ranked[0], searchUrl, score: scoreProduct(noodle, ranked[0]) };
}

async function downloadOne(noodle) {
  const { product, searchUrl, score } = await findProduct(noodle);
  const imageResponse = await fetchWithTimeout(product.image);
  const input = Buffer.from(await imageResponse.arrayBuffer());
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height || input.length < 5000) throw new Error("商品图片无效或尺寸过小");

  const filename = `${noodle.id}.webp`;
  await sharp(input)
    .rotate()
    .resize(720, 720, { fit: "contain", background: { r: 16, g: 15, b: 22, alpha: 1 } })
    .webp({ quality: 86, effort: 5 })
    .toFile(path.join(outputDir, filename));

  return {
    id: noodle.id,
    brand: noodle.brand,
    name: noodle.name,
    matchedProduct: product.name,
    productPage: product.url,
    originalImage: product.image,
    searchPage: searchUrl,
    matchScore: Math.round(score),
    downloadedAt: new Date().toISOString(),
    localPath: `/images/noodles/${filename}`,
  };
}

let previous = { sources: [], failures: [] };
try {
  previous = JSON.parse(await fs.readFile(sourcePath, "utf8"));
} catch {
  // First run has no previous source manifest.
}
const filterIds = new Set((process.env.IMAGE_FILTER ?? "").split(",").filter(Boolean));
const targets = filterIds.size ? noodles.filter((noodle) => filterIds.has(noodle.id)) : noodles;
const sourceMap = new Map(previous.sources.map((source) => [source.id, source]));
const failureMap = new Map(previous.failures.map((failure) => [failure.id, failure]));

for (let index = 0; index < targets.length; index += 1) {
  const noodle = targets[index];
  try {
    const source = await downloadOne(noodle);
    sourceMap.set(noodle.id, source);
    failureMap.delete(noodle.id);
    console.log(`[${index + 1}/${targets.length}] OK ${noodle.brand} ${noodle.name} -> ${source.matchedProduct}`);
  } catch (error) {
    failureMap.set(noodle.id, { id: noodle.id, brand: noodle.brand, name: noodle.name, error: error.message });
    console.log(`[${index + 1}/${targets.length}] FAIL ${noodle.brand} ${noodle.name}: ${error.message}`);
  }
}

const sources = [...sourceMap.values()].sort((a, b) => noodles.findIndex((item) => item.id === a.id) - noodles.findIndex((item) => item.id === b.id));
const failures = [...failureMap.values()];
await fs.writeFile(sourcePath, `${JSON.stringify({ generatedAt: new Date().toISOString(), sources, failures }, null, 2)}\n`, "utf8");

const sourceById = new Map(sources.map((source) => [source.id, source.localPath]));
const updated = noodles.map((noodle) => ({ ...noodle, image: sourceById.get(noodle.id) ?? noodle.image }));
await fs.writeFile(dataPath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");

console.log(`来源总计：${sources.length} 张，失败：${failures.length} 张。来源清单：${path.relative(root, sourcePath)}`);
if (failures.length) process.exitCode = 2;
