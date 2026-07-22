const url = process.argv[2];
if (!url) throw new Error("请提供商品页 URL");
const html = await fetch(url).then((response) => response.text());
const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)];
for (const match of scripts) {
  try {
    const value = JSON.parse(match[1]);
    if (value.image) process.stdout.write(`${JSON.stringify(value.image, null, 2)}\n`);
  } catch {}
}
