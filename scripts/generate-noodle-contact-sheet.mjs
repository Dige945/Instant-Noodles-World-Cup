import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const noodles = JSON.parse(await fs.readFile(path.join(root, "src", "data", "noodles.json"), "utf8"));
const columns = 6;
const cellWidth = 240;
const cellHeight = 280;
const width = columns * cellWidth;
const height = Math.ceil(noodles.length / columns) * cellHeight;
const composites = [];

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

for (let index = 0; index < noodles.length; index += 1) {
  const noodle = noodles[index];
  const imagePath = path.join(root, "public", noodle.image.replace(/^\//, ""));
  const image = await sharp(imagePath).resize(210, 210, { fit: "contain", background: "#100f16" }).png().toBuffer();
  const x = (index % columns) * cellWidth;
  const y = Math.floor(index / columns) * cellHeight;
  composites.push({ input: image, left: x + 15, top: y + 10 });
  const label = Buffer.from(`<svg width="240" height="60" xmlns="http://www.w3.org/2000/svg"><rect width="240" height="60" fill="#100f16"/><text x="12" y="20" fill="#f1b633" font-family="Microsoft YaHei, sans-serif" font-size="12" font-weight="700">${index + 1}. ${escapeXml(noodle.brand)}</text><text x="12" y="43" fill="#ffffff" font-family="Microsoft YaHei, sans-serif" font-size="14" font-weight="700">${escapeXml(noodle.name)}</text></svg>`);
  composites.push({ input: label, left: x, top: y + 220 });
}

const output = path.join(root, "artifacts", "noodle-images-contact-sheet.jpg");
await fs.mkdir(path.dirname(output), { recursive: true });
await sharp({ create: { width, height, channels: 3, background: "#100f16" } })
  .composite(composites)
  .jpeg({ quality: 88 })
  .toFile(output);
console.log(output);
