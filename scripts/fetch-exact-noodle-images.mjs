import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const deleteIds = [
  "ngdc-hs", "ngdc-sj", "ngdc-tj", "nissin-hj", "qh-tj", "ty-zjm",
  "gzm-cy", "xy-mx", "gzm-gzy", "ty-kexue",
  "gzm-hj", "gzm-niurou", "gzm-dongcai", "gzm-zhishi", "gzm-jirong", "gzm-mayou", "gzm-lazhu",
  "nanjc-bj", "nanjc-xj", "bj-zr", "ty-xianxia",
];

const overrides = [
  { id: "ksf-xianxia", sku: "2963657", brand: "康师傅", name: "鲜虾鱼板面", title: "康师傅鲜虾鱼板面五连包", page: "https://www.sayweee.com/zh/product/Shrimp-Flavored-Dry-Mixed-Noodles/2963657", type: "bag", tags: ["鲜虾", "鱼板", "海鲜"], category: "seafood", popularity: 94 },
  { id: "ksf-xianggu", sku: "47060", brand: "康师傅", name: "香菇炖鸡面", title: "康师傅香菇炖鸡味五连包", page: "https://www.sayweee.com/zh/product/Kangshifu-Soup-Noodle--Artificial-Chicken-Flavor-with-Mushroom-5pk/47060", type: "bag", tags: ["香菇", "炖鸡", "经典"], category: "chicken", popularity: 93 },
  { id: "ksf-tengjiao", sku: "109623", brand: "康师傅", name: "藤椒牛肉面", title: "康师傅藤椒牛肉面五连包", page: "https://www.sayweee.com/zh/product/KSF-INST-NDL-5PK-SC-GRN-PEPPER-BEEF-FLV/109623", type: "bag", tags: ["藤椒", "牛肉", "麻辣"], category: "spicy", popularity: 91 },
  { id: "ksf-congxiang", sku: "104913", brand: "康师傅", name: "葱香排骨面", title: "康师傅葱香排骨味五连包", page: "https://www.sayweee.com/zh/product/weee/104913?lang=zh", type: "bag", tags: ["葱香", "排骨", "经典"], category: "other", popularity: 88 },
  { id: "ksf-suanla", sku: "2963659", brand: "康师傅", name: "老陈醋酸辣牛肉面", title: "康师傅老陈醋酸辣牛肉面五连包", page: "https://www.sayweee.com/zh/product/Sour-And-Spicy-Noodles/2963659", type: "bag", tags: ["老陈醋", "酸辣", "牛肉"], category: "sour-spicy", popularity: 86 },
  { id: "ksf-jintang", sku: "2129074", brand: "康师傅", name: "酸香金汤肥牛面", title: "康师傅酸香爽金汤肥牛面", page: "https://www.sayweee.com/zh/product/Master-Kong-s-instant-noodles-classic-sour-and-fragrant-shuangjin-soup-fat-beef-105g-1-bag/2129074", type: "bag", tags: ["金汤", "肥牛", "酸香"], category: "sour-spicy", popularity: 87 },
  { id: "ty-rouzao", sku: "2162965", brand: "统一", name: "肉燥面", title: "统一肉燥面五包", page: "https://www.sayweee.com/zh/product/Tung-I-Minced-Pork-Flavor-Instant-Noodles-85g/2162965", type: "bag", tags: ["肉燥", "台式", "经典"], category: "nostalgic", popularity: 91 },
  { id: "ty-tj", brand: "统一", name: "茄皇番茄牛肉面", title: "统一茄皇番茄牛肉面五连包", page: "https://www.hengxin.co.uk/zh_CN/shop/unif-instant-noodle-tomato-egg-flavour-116g-5-packs-580g-5-14705", imageUrl: "https://www.hengxin.co.uk/web/image/product.template/14705/image_1920", type: "bag", tags: ["番茄", "牛肉", "酸甜"], category: "beef", popularity: 88 },
  { id: "ty-baobao", brand: "统一", name: "红油爆椒牛肉面", title: "统一红油爆椒牛肉面", page: "https://mdg.chinapp.com/p/108554.html", imageUrl: "https://img14.360buyimg.com/pop/s400x400_jfs/t1/223201/29/11826/515947/621de571E43e07b6d/514cbc8a57ef4e40.png", type: "bag", tags: ["红油", "爆椒", "牛肉"], category: "spicy", popularity: 89 },
  { id: "gzm-shacha", brand: "公仔面", name: "沙嗲牛肉味碗面", title: "公仔碗面沙嗲牛肉味", page: "https://www.doll.com.hk/en/products/detail/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle%20Satay%20%26%20Beef%20Flavour/28/", imageUrl: "https://www.doll.com.hk/download/product_image/519/1a2d8bbd-4754-4d56-98d2-e410d99ed626.jpg", type: "cup", tags: ["沙嗲", "牛肉", "港式"], category: "beef", popularity: 86 },
  { id: "gzm-tungu", brand: "公仔面", name: "猪骨浓汤味碗面", title: "公仔碗面猪骨浓汤味", page: "https://www.doll.com.hk/en/products/detail/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle%20Tonkotsu%20Flavour/29/", imageUrl: "https://www.doll.com.hk/download/product_image/520/344fef35-10f8-4659-a72d-a5497a13aa23.jpg", type: "cup", tags: ["猪骨", "浓汤", "港式"], category: "other", popularity: 84 },
  { id: "gzm-mayou", brand: "公仔面", name: "麻油上素味碗面", title: "公仔碗面麻油上素味", page: "https://www.doll.com.hk/en/products/detail/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle%20Vegetarian%20Flavour%20with%20Sesame%20Oil/30/", imageUrl: "https://www.doll.com.hk/download/product_image/521/f3eb26d7-2bb1-4ec8-9962-8176ded36b4a.jpg", type: "cup", tags: ["麻油", "上素", "港式"], category: "nostalgic", popularity: 83 },
  { id: "gzm-malatang", brand: "公仔面", name: "麻辣汤味碗面", title: "公仔碗面麻辣汤味", page: "https://www.doll.com.hk/en/products/detail/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle%20Hot%20%26%20Spicy%20Soup%20Flavour/31/", imageUrl: "https://www.doll.com.hk/download/product_image/523/07cd45c4-4022-4512-b7f4-576944eda415.jpg", type: "cup", tags: ["麻辣", "汤面", "港式"], category: "spicy", popularity: 82 },
  { id: "gzm-wuxiang", brand: "公仔面", name: "五香肉丁味碗面", title: "公仔碗面五香肉丁味", page: "https://www.doll.com.hk/en/products/detail/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle%20Spiced%20Pork%20Cubes%20Flavour/34/", imageUrl: "https://www.doll.com.hk/download/product_image/524/d366aeec-d8df-438f-ae3e-acc2f4691919.jpg", type: "cup", tags: ["五香", "肉丁", "港式"], category: "other", popularity: 85 },
  { id: "gzm-hujiao", brand: "公仔面", name: "胡椒猪肚汤味碗面", title: "公仔碗面胡椒猪肚汤味", page: "https://www.doll.com.hk/en/products/detail/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle/Doll%20Bowl%20Noodle%20Pepper%20%26%20Pork%20Soup%20Flavour/126/", imageUrl: "https://www.doll.com.hk/download/product_image/522/a7b0c4b9-af48-4e8e-843d-ace9b63bd75b.jpg", type: "cup", tags: ["胡椒", "猪肚", "港式"], category: "other", popularity: 84 },
];

const dataPath = path.join(root, "src/data/noodles.json");
const sourcePath = path.join(root, "src/data/noodle-image-sources.json");
let noodles = JSON.parse(await fs.readFile(dataPath, "utf8"));
const manifest = JSON.parse(await fs.readFile(sourcePath, "utf8"));

noodles = noodles.filter((entry) => !deleteIds.includes(entry.id));
manifest.sources = manifest.sources.filter((entry) => !deleteIds.includes(entry.id));
for (const id of deleteIds) {
  await fs.unlink(path.join(root, "public/images/noodles", `${id}.webp`)).catch(() => undefined);
  process.stdout.write(`DEL ${id}\n`);
}

for (const item of overrides) {
  const imageUrl = item.imageUrl ?? `https://sku.anycart.com/m/i/weee--${item.sku}`;
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`${item.id}: ${response.status}`);
  const target = path.join(root, "public/images/noodles", `${item.id}.webp`);
  await sharp(Buffer.from(await response.arrayBuffer()))
    .resize(720, 720, { fit: "contain", background: "#ffffff" })
    .webp({ quality: 88 })
    .toFile(target);

  let noodle = noodles.find((entry) => entry.id === item.id);
  if (!noodle) {
    noodle = { id: item.id, image: `/images/noodles/${item.id}.webp`, isBackup: false };
    noodles.push(noodle);
  }
  Object.assign(noodle, {
    name: item.name,
    brand: item.brand,
    type: item.type,
    flavorTags: item.tags,
    category: item.category,
    popularity: item.popularity,
  });

  const record = {
    id: item.id,
    brand: item.brand,
    name: item.name,
    matchedProduct: item.title,
    productPage: item.page,
    originalImage: imageUrl,
    searchPage: item.page,
    matchScore: 999,
    downloadedAt: new Date().toISOString(),
    localPath: `/images/noodles/${item.id}.webp`,
  };
  const sourceIndex = manifest.sources.findIndex((entry) => entry.id === item.id);
  if (sourceIndex >= 0) manifest.sources[sourceIndex] = record;
  else manifest.sources.push(record);
  process.stdout.write(`OK ${item.brand} ${item.name}\n`);
}

await fs.writeFile(dataPath, `${JSON.stringify(noodles, null, 2)}\n`);
await fs.writeFile(sourcePath, `${JSON.stringify(manifest, null, 2)}\n`);
