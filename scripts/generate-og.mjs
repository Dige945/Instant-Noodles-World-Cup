import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const svg = await fs.readFile(new URL("../public/og-cover.svg", import.meta.url));
const output = fileURLToPath(new URL("../public/og-cover.png", import.meta.url));
await sharp(svg).png().toFile(output);

const icon = await fs.readFile(new URL("../public/icon.svg", import.meta.url));
await sharp(icon).resize(192, 192).png().toFile(fileURLToPath(new URL("../public/icon-192.png", import.meta.url)));
await sharp(icon).resize(512, 512).png().toFile(fileURLToPath(new URL("../public/icon-512.png", import.meta.url)));
