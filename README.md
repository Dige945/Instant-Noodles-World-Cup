# 中国方便面世界杯

一个移动端优先的纯前端网页小游戏。用户先从 48 款方便面完成 12 组小组赛和 8 款遗珠复活，再通过 31 场两两选择从 32 强中选出冠军，并生成四强榜、口味人格、完整比赛树和 1080 × 1920 分享海报。

网址：https://instantnoodlescup.fun/

## 技术架构

- Next.js App Router + TypeScript
- Tailwind CSS 4 与自定义响应式样式
- Zustand 状态管理
- 浏览器 `localStorage` 持久化
- Motion 选择动画
- `html-to-image` 海报导出
- Next.js 静态导出至 `out/`
- Cloudflare Pages 托管

首版没有后端、数据库和用户登录。比赛数据仅保存在当前浏览器中。

## 本地运行

环境要求：Node.js 22。

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。

提交或部署前运行：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

生产构建会生成 `out/`。使用普通静态文件服务器预览：

```bash
npm run preview
```

预览时需要直接打开并刷新 `/setup/`、`/tournament/` 和 `/result/`，确认静态子路径有效。

## 项目结构

```text
src/
├─ app/                    四个页面、根布局与全局视觉
├─ components/             卡片、进度、比赛树、冠军路线、海报
├─ data/noodles.json       方便面候选池
├─ lib/
│  ├─ seeding.ts           随机抽取与首轮排阵
│  ├─ tournament.ts        31 场比赛树、晋级和撤销
│  ├─ personality.ts       口味人格规则
│  ├─ storage.ts           localStorage 校验与容错
├─ store/                  Zustand 比赛状态
└─ types/                  严格 TypeScript 类型
public/
├─ images/noodles/         53 张本地 WebP 产品图
├─ _headers                Cloudflare 缓存与安全头
├─ icon.svg
└─ og-cover.png
```

`src/app/privacy/` 提供单独的隐私说明页面。

## 修改方便面数据

编辑 [`src/data/noodles.json`](src/data/noodles.json)。每条数据格式：

```json
{
  "id": "brand-product",
  "name": "具体产品名",
  "brand": "品牌名",
  "image": "/images/noodles/product.webp",
  "type": "bag",
  "flavorTags": ["牛肉", "红烧", "经典"],
  "category": "beef",
  "popularity": 90,
  "isBackup": false
}
```

要求：

- `id` 唯一且发布后保持稳定。
- 候选池至少保留 32 项，当前提供 53 项。
- 图片放入 `public/images/noodles/`，并使用以 `/images/noodles/` 开头的站内路径。
- 不要使用电商网站或带防盗链的外部图片。
- 正式包装图上线前需要自行确认图片来源和使用授权。

当前 53 条数据均已配置本地 WebP 图片，不依赖第三方图片外链。公开商品页、原图地址、匹配名称和抓取时间记录在 `src/data/noodle-image-sources.json`。批量获取与人工纠错脚本分别为：

```bash
npm run fetch:noodle-images
npm run fetch:exact-images
npm run contact-sheet
```

`contact-sheet` 会生成 `artifacts/noodle-images-contact-sheet.jpg`，用于上线前逐项核对包装与名称。商品图的商标及著作权仍归各权利人所有；商业发布前应取得授权或替换为品牌官方授权素材。

### 直接替换商品图片

所有页面使用的都是本地文件：

```text
public/images/noodles/{产品 ID}.webp
```

例如 `今麦郎红烧牛肉面` 的 ID 是 `jml-hlx`，对应文件是 `public/images/noodles/jml-hlx.webp`。准备一张正方形 WebP 图片，建议尺寸 `720 × 720`、白色或透明背景，然后使用相同文件名覆盖原文件即可，不需要修改代码。

如果使用 JPG、PNG 或修改文件名，需要同步修改 `src/data/noodles.json` 中对应条目的 `image` 字段。替换完成后运行：

```bash
npm run contact-sheet
npm run build
```

重新部署后如果浏览器仍显示旧图，可以强制刷新。Cloudflare 图片缓存最长为 7 天，频繁换图时建议改用新文件名，避免同名缓存。

`type` 可选：`soup`、`dry`、`cup`、`bag`、`snack`。

`category` 可选：`beef`、`chicken`、`seafood`、`spicy`、`sour-spicy`、`dry-noodle`、`nostalgic`、`other`。

## 比赛逻辑

核心逻辑位于：

- `src/lib/seeding.ts`：Fisher-Yates 随机、热门产品分区、同品牌与同类别冲突修复。
- `src/lib/tournament.ts`：固定生成 `16 + 8 + 4 + 2 + 1 = 31` 场比赛，处理胜者晋级、冠军和撤销快照。
- `src/lib/tournament.test.ts`：验证 31 场不变量、左右槽位、完整流程和决赛撤销。

首轮比赛从 0 开始编号。偶数场胜者进入下一轮左侧，奇数场胜者进入右侧：

```ts
const nextMatchIndex = Math.floor(matchIndex / 2);
const isLeftSlot = matchIndex % 2 === 0;
```

## 状态持久化

- Zustand store：`src/store/tournament-store.ts`
- 存储与运行时校验：`src/lib/storage.ts`
- 存储键：`instant-noodle-world-cup:tournament`
- 当前 schema 版本：`1`

应用只在客户端挂载后读取数据。损坏或不兼容的数据会被清理，不会导致页面白屏。

## 分享海报

`src/components/share-poster.tsx` 在屏幕外渲染一个固定 `540 × 960` 节点，再以 `pixelRatio: 2` 导出为 `1080 × 1920` PNG。

海报使用的包装图、字体和二维码都在浏览器中加载。产品图片必须保持同源，否则 Canvas 安全策略可能导致导出失败。

网站地址来自：

```text
NEXT_PUBLIC_SITE_URL
```

Goal 阶段使用 Cloudflare Pages 的 `*.pages.dev` 生产地址。用户以后绑定正式域名后，只需更新此变量并重新部署，二维码和元数据无需改代码。

## Cloudflare Pages 部署

### Git 集成

在 Cloudflare Pages 中连接 GitHub 仓库，填写：

```text
Production branch: main
Build command: npm run build
Build output directory: out
Root directory: /
```

环境变量：

```text
NODE_VERSION=22
NEXT_PUBLIC_SITE_URL=https://项目名.pages.dev
```

每次推送 `main` 自动发布生产版本，其他分支和 Pull Request 生成预览版本。

### Wrangler 直接部署

仓库已经提供 `wrangler.jsonc`，构建完成后可执行：

```bash
npx wrangler pages deploy out --project-name instant-noodle-world-cup
```

首次执行需要登录 Cloudflare。Cloudflare 账户授权和任何对外部署都应由账户所有者确认。

当前 Cloudflare Pages 项目名称为 `instant-noodle-world-cup`，生产分支为 `main`。

### Pages 验收

- 首页与 `/setup/`、`/tournament/`、`/result/` 可直接访问和刷新。
- `_next/static/` 长期缓存，HTML 不使用永久缓存。
- HTTPS 正常。
- 微信内置浏览器能打开并完成选择。
- 海报可以生成和下载。

## 域名职责边界

域名购买、付款、注册人验证、DNS、nameserver、自定义域名绑定、重定向和正式域名验收由用户自行完成，不属于本项目 Goal 的执行范围。

用户完成域名绑定后需要：

1. 将 `NEXT_PUBLIC_SITE_URL` 改为规范正式域名。
2. 重新触发 Cloudflare Pages 部署。
3. 检查海报二维码和社交分享元数据。

## 发布与回滚

发布前运行全部质量检查并在本地预览 `out/`。生产异常时，在 Cloudflare Pages 的部署历史中回退到上一个成功部署，再通过新提交修复，避免删除 Git 历史。

## 已知限制

- 进度仅保存在当前浏览器，无法跨设备同步。
- 微信内置浏览器是否允许直接下载图片取决于系统版本；无法下载时可长按保存。
- 当前产品图来自公开商品页并已转存为本地 WebP；商业发布前仍需确认图片使用授权。
- Cloudflare Pages 在中国大陆不同网络下的速度可能有差异，需要上线前实测。
