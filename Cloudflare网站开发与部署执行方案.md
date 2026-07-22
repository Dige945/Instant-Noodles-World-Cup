# 中国方便面世界杯｜网站开发与 Cloudflare 部署执行方案

> 本文档是项目的完整执行说明，可直接交给 Goal 模型作为开发、测试和上线依据。

## 1. 最终目标

开发并上线一个名为“中国方便面世界杯”的移动端优先网页小游戏。

用户先从 48 款方便面中完成 12 组小组赛，每组选 2 款直通，再从 24 款遗珠中复活 8 款组成 32 强；随后完成 31 场两两选择，依次完成 32 强、16 强、8 强、半决赛和决赛，最终得到冠军、亚军、四强、口味人格、完整晋级路线和可下载的分享海报。

网站必须满足：

- 使用 Next.js、TypeScript 和 Tailwind CSS 开发。
- 首版为纯前端静态网站，不使用服务器、数据库和用户登录。
- 比赛进度保存在浏览器 `localStorage`。
- 能导出 PNG 分享海报。
- 能构建为静态文件并部署到 Cloudflare Pages。
- 部署到 Cloudflare Pages，并获得可公开访问的 `*.pages.dev` 预览地址。
- 域名购买、DNS 配置、自定义域名绑定和正式域名验收由用户自行完成，不属于 Goal 模型职责。
- 在手机浏览器、微信内置浏览器和桌面浏览器中可正常使用。

最终架构：

```text
用户浏览器
    ↓ HTTPS
Cloudflare Pages 预览域名
    ↓
Cloudflare Pages + 全球 CDN
    ↓
Next.js 静态文件
    ├─ HTML / CSS / JavaScript
    ├─ 方便面 JSON 数据
    ├─ 本地图片和字体
    ├─ localStorage 比赛状态
    └─ 浏览器端 PNG 海报生成
```

---

## 2. 范围约束

### 2.1 本次必须完成

- 首页。
- 48 款小组赛与遗珠复活赛。
- 至少 48 款演示候选数据。
- 随机抽取 48 款产品，分为 12 组，每组选 2 款直通。
- 从 24 款落选产品中选择 8 款复活，组成 32 强。
- 兼顾品牌、热门度和口味分布的首轮对阵。
- 31 场完整单败淘汰赛。
- 当前轮次、当前场次和总进度显示。
- 选择、胜出和淘汰动画。
- 逐步撤销上一场选择。
- 自动保存和刷新恢复。
- 冠军结果页。
- 冠军击败对手列表。
- 基于标签规则生成方便面人格。
- 冠军晋级路线和完整淘汰赛图。
- 生成并下载分享海报。
- 手机端和桌面端响应式布局。
- 404 页面、网站图标、SEO 和社交分享元数据。
- Cloudflare Pages 自动部署。
- Cloudflare Pages 预览部署与 HTTPS 访问。

### 2.2 本次明确不做

- 后端 API。
- 数据库。
- 用户注册、登录或跨设备同步。
- 在线排行榜和实时投票。
- 评论区。
- 支付或电商链接。
- AI 人格生成。
- 微信公众号 JS-SDK 分享。
- 后台管理系统。

除非基本功能全部完成并通过验收，否则 Goal 模型不得扩大范围。

---

## 3. 技术选型

| 范围 | 选择 |
|---|---|
| Web 框架 | Next.js App Router |
| 语言 | TypeScript，开启严格模式 |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 持久化 | Zustand persist 或独立 localStorage 适配层 |
| 动画 | Framer Motion / Motion |
| 图片导出 | `html-to-image` |
| 图标 | Lucide React |
| 测试 | Vitest + React Testing Library；关键流程可增加 Playwright |
| 代码托管 | GitHub |
| 网站托管 | Cloudflare Pages |
| CDN、预览域名、HTTPS | Cloudflare Pages |
| 正式域名 | 由用户自行购买和绑定，不在 Goal 模型执行范围内 |

项目不依赖 Next.js 服务端运行时。所有业务逻辑都必须兼容静态导出。

---

## 4. 静态网站约束

在 `next.config.ts` 中启用静态导出：

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

要求：

- `npm run build` 后生成 `out/`。
- 不使用 Server Actions、Route Handlers、SSR、ISR 或运行时动态路由。
- 不依赖 Next.js 图片优化服务器。
- 可使用 `next/image`，但必须保持 `unoptimized: true`；简单产品图也可使用原生 `<img>`。
- 所有需要 `window`、`document`、`localStorage`、Canvas 或图片导出的组件必须是客户端组件。
- 首页静态 HTML 不应因为读取 `localStorage` 出现水合不一致。
- `/setup/`、`/tournament/`、`/result/` 直接打开和刷新时都必须可访问。
- 结果页若没有有效比赛状态，应显示说明并提供返回首页按钮，不能白屏。

---

## 5. 建议目录结构

```text
src/
├─ app/
│  ├─ page.tsx
│  ├─ setup/page.tsx
│  ├─ tournament/page.tsx
│  ├─ result/page.tsx
│  ├─ not-found.tsx
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ noodle-card.tsx
│  ├─ contestant-grid.tsx
│  ├─ battle-stage.tsx
│  ├─ progress-header.tsx
│  ├─ champion-card.tsx
│  ├─ champion-route.tsx
│  ├─ bracket-view.tsx
│  ├─ share-poster.tsx
│  └─ ui/
├─ data/
│  └─ noodles.json
├─ lib/
│  ├─ tournament.ts
│  ├─ seeding.ts
│  ├─ personality.ts
│  ├─ storage.ts
│  ├─ validation.ts
│  └─ poster.ts
├─ store/
│  └─ tournament-store.ts
└─ types/
   └─ tournament.ts
public/
├─ images/noodles/
├─ images/brand/
├─ fonts/
├─ favicon.ico
├─ icon-192.png
├─ icon-512.png
├─ og-cover.png
├─ robots.txt
├─ _headers
└─ _redirects
```

保持模块职责清晰。比赛算法不得散落在页面组件中。

---

## 6. 核心数据设计

```ts
export type NoodleType = "soup" | "dry" | "cup" | "bag" | "snack";

export type NoodleCategory =
  | "beef"
  | "chicken"
  | "seafood"
  | "spicy"
  | "sour-spicy"
  | "dry-noodle"
  | "nostalgic"
  | "other";

export interface Noodle {
  id: string;
  name: string;
  brand: string;
  image: string;
  type: NoodleType;
  flavorTags: string[];
  category: NoodleCategory;
  popularity: number;
  isBackup: boolean;
}

export interface Match {
  id: string;
  round: 1 | 2 | 3 | 4 | 5;
  matchIndex: number;
  leftNoodleId: string | null;
  rightNoodleId: string | null;
  winnerId: string | null;
}

export interface TournamentSnapshot {
  matches: Match[];
  currentMatchId: string;
  championId: string | null;
  selectedWinnerIds: string[];
}

export interface Tournament {
  schemaVersion: number;
  id: string;
  contestants: string[];
  matches: Match[];
  currentMatchId: string;
  championId: string | null;
  snapshots: TournamentSnapshot[];
  replacementCount: number;
  createdAt: number;
  completedAt?: number;
}
```

数据要求：

- `noodles.json` 至少有 48 条演示数据。
- ID 必须唯一且长期稳定。
- 图片路径全部使用 `/images/noodles/...` 本地路径。
- 开发期可用自制的渐变占位图，图中显示品牌和产品名。
- 不允许直接引用电商平台图片链接。
- 正式包装图片上线前必须核对来源和使用授权。

---

## 7. 比赛算法要求

### 7.1 初始化

1. 从候选池随机抽取 32 个不同产品。
2. 生成共 31 场比赛的固定树结构：16 + 8 + 4 + 2 + 1。
3. 将首轮产品填入 16 场比赛。
4. 后续比赛槽位保持 `null`，等待前一轮胜者晋级。

### 7.2 首轮排阵

使用“随机打乱 + 冲突修复”的可解释算法：

1. 先按热门度将高人气产品分散到两个半区。
2. 对其余产品执行 Fisher-Yates 随机打乱。
3. 检测首轮同品牌对阵，尝试与后续产品交换。
4. 在不制造新品牌冲突的前提下，减少相同类别集中。
5. 设置最大修复次数；无法完全满足时接受最少冲突结果，避免死循环。

算法应允许注入随机函数，便于测试。

### 7.3 胜者晋级

选择胜者时必须按以下顺序执行：

1. 验证当前比赛存在、尚未完成，且选择对象确实属于本场比赛。
2. 深拷贝当前必要状态并保存为撤销快照。
3. 写入当前比赛的 `winnerId`。
4. 若是决赛，设置 `championId` 和 `completedAt`。
5. 若不是决赛，计算下一场编号：

```ts
const nextMatchIndex = Math.floor(currentMatch.matchIndex / 2);
const isLeftSlot = currentMatch.matchIndex % 2 === 0;
```

6. 偶数场胜者进入下一场左侧，奇数场胜者进入下一场右侧。
7. 将 `currentMatchId` 指向下一场可进行但尚未完成的比赛。
8. 持久化最新状态。

### 7.4 撤销

- 每次选择前保存一份快照。
- 撤销只恢复最近一份快照。
- 恢复时必须清除由该次选择写入的后续槽位。
- 决赛完成后仍可撤销。
- 没有历史快照时禁用撤销按钮。

### 7.5 必测不变量

- 完整比赛恰好需要 31 次选择。
- 每轮比赛数依次为 16、8、4、2、1。
- 每场只能有一个胜者。
- 下一轮的每个参赛者都必须来自上一轮胜者。
- 冠军必须是决赛的胜者。
- 连续撤销不会留下幽灵选手或错误冠军。

---

## 8. 页面要求

### 8.1 首页 `/`

- 标题“中国方便面世界杯”。
- 副标题“32 款方便面，只能留下一碗”。
- 简短说明需要完成 31 次选择，预计 3～5 分钟。
- 唯一主操作按钮“开始世界杯”。
- 若检测到未完成比赛，可显示“继续比赛”和“重新开始”。
- 视觉包含皇冠、面条、热气或奖杯元素。

### 8.2 小组赛与复活赛 `/setup/`

- 随机显示 48 款产品并分为 A～L 共 12 组。
- 每组显示 4 款包装、品牌、名称和标签，必须选择 2 款直通。
- 当前组每款提供“不熟悉，换一个”，从未入选本届 48 款的候选池中随机替换，且不得产生重复产品。
- 完成小组赛后，将 24 款落选产品集中进入“遗珠复活赛”。
- 复活赛必须选择 8 款，与 24 款直通产品组成最终 32 强。
- 提供“重新抽签”；若会丢失已有选择，应进行轻量确认。

### 8.3 比赛 `/tournament/`

- 显示当前轮次。
- 显示轮内场次，例如“第 6 / 16 场”。
- 显示总进度，例如“已完成 5 / 31”。
- 左右展示两个产品卡片，中间显示 VS。
- 点击后立即锁定输入，避免重复点击。
- 胜者放大、高亮并显示“晋级”，败者降低透明度。
- 约 500 毫秒后进入下一场。
- 提供撤销按钮。
- 页面刷新后恢复当前比赛。
- 小屏上可改为上下排列，但必须保持双方同等视觉权重。

### 8.4 结果 `/result/`

- 冠军包装图、品牌、名称和冠军标识。
- 明确展示亚军和两名止步半决赛的四强选手。
- 冠军先后击败的全部对手。
- 规则生成的方便面人格及简短解释。
- 冠军晋级路线。
- 完整淘汰赛图。
- “生成分享海报”和“再玩一次”。
- 重新开始必须清除旧局状态并返回名单页。

### 8.5 分享海报

海报至少包含：

- 中国方便面世界杯标题。
- 冠军包装图和名称。
- 方便面人格。
- 冠军晋级路线。
- “32 款方便面，只能留下一碗”。
- “本结果仅代表个人口味”。
- 当前公开网站地址和二维码，内容从 `NEXT_PUBLIC_SITE_URL` 读取。

海报要求：

- 使用固定导出尺寸，推荐 1080 × 1920。
- 在屏幕外渲染专用海报节点，不能直接截取响应式结果页。
- 等待字体和图片加载完成后再调用 `html-to-image`。
- 输出 PNG 并提供下载。
- 所有图片和字体必须同源，避免 Canvas 跨域污染。
- Goal 阶段二维码使用 `*.pages.dev` 生产预览地址；用户以后绑定域名并修改环境变量后，应自动使用正式域名，代码中不得写死地址。

---

## 9. 视觉与移动端规范

- 主色：近黑背景、深紫环境光、紫红霓虹渐变，皇冠和奖杯使用少量金色。
- 风格对标用户提供的 Music Cup 样例：大面积留黑、居中粗体标题、方形选手图、圆形 VS、胜者霓虹描边、败者退暗。
- 首页、轮次转场、比赛页、冠军页与分享长图保持同一套暗黑赛场视觉，不使用复古小卖部风格。
- 卡片大圆角、轻阴影、清晰点击反馈。
- 正文字号不小于 14px，主要按钮高度不小于 44px。
- 适配 320px 到桌面宽屏。
- 除完整比赛树的明确横向滚动容器外，页面不得整体横向溢出。
- 尊重 `prefers-reduced-motion`，降低动画的用户仍可顺利完成比赛。
- 所有操作按钮必须有键盘焦点样式和可理解的无障碍名称。
- 颜色不能是唯一的胜负信息表达方式。

### 9.1 分享长图对标要求

- 固定输出 1080 × 1920 PNG。
- 顶部使用英文杯赛字标和中文赛事标题。
- 32 位选手从左右两侧向中心收束，保留每一轮晋级关系。
- 每个树节点使用真实商品缩略图、名称和明暗晋级状态。
- 中央展示冠军大图、皇冠、冠军渐变徽章、品牌和人格。
- 底部放二维码、项目字标、宣传语和当前公开网址。
- 背景使用黑紫渐变、细星点纹理和低亮度连线；保证微信聊天缩略图中冠军主体仍清晰。

### 9.2 商品图片要求

- 当前 53 款候选均使用站内 `/images/noodles/*.webp`，不得在运行时请求电商图片。
- 图片统一转换为 720 × 720 WebP，使用白色画布完整容纳商品包装，避免裁切品牌和口味文字。
- `src/data/noodle-image-sources.json` 必须记录商品页、原图地址、匹配名称、抓取时间和本地路径。
- 使用 `npm run contact-sheet` 生成总览图，人工检查图文匹配；搜索误命中的商品必须用具体商品页纠正。
- 图片抓取只解决技术上的本地化和稳定加载，不等于获得商业使用授权；正式商业上线前由项目所有者完成版权及商标素材授权确认。

---

## 10. 本地存储设计

建议存储键：

```text
instant-noodle-world-cup:tournament
```

要求：

- 存储数据包含 `schemaVersion`。
- 只在客户端挂载后读取存储。
- 使用运行时校验；损坏或旧版不兼容数据不能造成白屏。
- 校验失败时清理无效状态，并让用户重新开始。
- 状态写入失败时显示非阻塞提示，游戏仍可继续。
- 页面提供“重新开始”入口。
- 不在 `localStorage` 中保存敏感信息。

首版需要向用户说明：比赛进度只保存在当前浏览器，清理浏览器数据或更换设备后无法恢复。

---

## 11. SEO、分享与基础网站文件

在根布局中配置：

- 中文 `title`。
- 中文 `description`。
- `metadataBase`，从公开环境变量读取当前公开网站地址。
- Open Graph 标题、描述和 `og-cover.png`。
- 网站图标。
- `lang="zh-CN"`。
- 合理的 viewport 和主题色。

建议环境变量：

```text
NEXT_PUBLIC_SITE_URL=https://项目名.pages.dev
```

不得把本地地址或任何域名写死到海报、二维码或元数据中；统一读取环境变量，以便用户以后自行切换为正式域名。

`public/robots.txt` 初始内容：

```text
User-agent: *
Allow: /
```

---

## 12. Cloudflare 缓存和安全头

在 `public/_headers` 中加入适合纯静态站点的基础头。示例：

```text
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: DENY

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=604800
```

注意：

- 不要在尚未验证的情况下添加过严的 Content Security Policy，以免阻断海报生成、字体或脚本。
- HTML 不设置长期不可变缓存，确保新版本及时生效。
- 若正式图片会被同名替换，应使用带版本或哈希的文件名。

`public/_redirects` 可保留为空或仅放置确有需要的规则。由于启用了 `trailingSlash`，各页面应输出对应目录的 `index.html`，不要无条件将所有请求重写到首页，否则可能掩盖真实 404。

---

## 13. 开发步骤

Goal 模型按顺序执行，不跳过验证：

1. 阅读原始策划文档和本文档。
2. 初始化 Next.js + TypeScript + Tailwind 项目。
3. 配置静态导出、ESLint、严格 TypeScript 和测试环境。
4. 建立类型、至少 48 条方便面数据和本地占位图。
5. 编写随机抽取和首轮排阵算法及单元测试。
6. 编写 31 场比赛树、胜者晋级和撤销逻辑及单元测试。
7. 编写 Zustand 状态和安全的 `localStorage` 持久化。
8. 完成首页和名单页。
9. 完成比赛页及动画、防重复点击、进度和恢复。
10. 完成人格规则、冠军路线和结果页。
11. 完整实现淘汰赛图。
12. 实现固定尺寸分享海报和 PNG 下载。
13. 添加 SEO、OG 图片、favicon、404、安全头和静态资源缓存。
14. 完成移动端、微信内置浏览器和桌面端检查。
15. 运行格式检查、Lint、TypeScript、测试和生产构建。
16. 检查 `out/` 中首页及全部子页面是否存在。
17. 推送 GitHub 并接入 Cloudflare Pages。
18. 使用 `*.pages.dev` 预览地址完成线上验收，并向用户交付域名接入所需信息。

---

## 14. 本地开发与构建命令

以实际 `package.json` 脚本为准，至少提供：

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

推荐脚本：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

静态导出项目生产验证不能只运行 `next start`。应构建后使用本地静态文件服务器预览 `out/`，并测试子路径直接访问。

---

## 15. Cloudflare Pages 部署步骤

### 15.1 准备 GitHub 仓库

1. 创建 GitHub 仓库。
2. 提交源代码，不提交 `.env.local`、`node_modules/`、`.next/` 和 `out/`。
3. 推送默认分支，推荐 `main`。
4. 确认 GitHub 上的最新提交能在本地通过 `npm run build`。

### 15.2 创建 Pages 项目

在 Cloudflare 控制台创建 Pages 项目并连接 GitHub 仓库。界面名称可能随平台更新变化，但构建参数保持如下：

```text
Production branch: main
Build command: npm run build
Build output directory: out
Root directory: /
```

如果仓库以后变成 monorepo，再将 Root directory 指向网站子目录。

环境变量：

```text
NEXT_PUBLIC_SITE_URL=https://项目名.pages.dev
NODE_VERSION=项目实际使用并锁定的 Node LTS 版本
```

Goal 阶段将 `NEXT_PUBLIC_SITE_URL` 设置为 Pages 提供的生产预览地址。用户以后自行绑定正式域名时，再由用户改成正式地址并重新部署。

### 15.3 自动部署规则

- `main` 分支用于生产部署。
- Pull Request 或其他分支生成预览部署。
- 合并到 `main` 前必须通过构建和测试。
- 每次生产部署后执行线上冒烟测试。
- Cloudflare 保留部署历史；新版本异常时从控制台回退到上一个成功部署。

### 15.4 Pages 部署验证

先使用 Cloudflare 提供的 `*.pages.dev` 地址验证：

- 首页可访问。
- `/setup/`、`/tournament/`、`/result/` 可直接打开。
- 资源没有 404。
- 31 场流程能完成。
- 刷新能恢复比赛。
- PNG 能生成和下载。
- DevTools 控制台没有持续错误。

通过后将 Pages 项目名称、`*.pages.dev` 地址、构建设置和所需环境变量交付给用户。Goal 模型到此不再执行任何域名相关操作。

---

## 16. 用户自行购买和绑定域名（不属于 Goal 模型职责）

本章只作为用户后续操作参考。Goal 模型不得购买域名、修改域名注册信息、配置 nameserver、创建正式域名 DNS 记录、绑定自定义域名或等待用户完成上述操作，也不得把这些操作列为 Goal 的阻塞项或完成条件。

### 16.1 用户选择域名

建议选择短、容易口述、避免商标冲突的域名。可考虑的构词方向：

```text
noodle + cup
noodle + worldcup
instantnoodle + cup
中文项目名的简短拼音
```

不要在文档或代码中预设某个域名一定可注册；购买前必须实时查询可用性和续费价格。

### 16.2 用户购买域名

优先在 Cloudflare Registrar 查询并购买支持的域名后缀。这样域名、DNS、Pages 和 HTTPS 都在同一个账户中管理。

购买前检查：

- 首年价格和续费价格。
- 注册人信息要求。
- 是否支持需要的域名后缀。
- 域名是否侵犯他人商标或已有品牌权益。
- 开启账户双重验证。

若 Cloudflare 不提供目标后缀，可在其他正规注册商购买，再把域名的权威名称服务器修改为 Cloudflare 指定的 nameserver。

### 16.3 用户绑定 Pages 自定义域名

1. 打开对应 Cloudflare Pages 项目。
2. 添加自定义域名，例如根域名 `example.com`。
3. 再添加 `www.example.com`。
4. Cloudflare DNS 中确认记录由 Pages 自动创建或按控制台提示创建。
5. 选择一个规范主域名。
6. 将另一个域名通过重定向规则做永久跳转，避免两个地址形成重复内容。
7. 等待证书签发，确认 HTTPS 正常。
8. Cloudflare SSL/TLS 模式保持平台推荐的安全配置，不关闭 HTTPS。
9. 开启“始终使用 HTTPS”或等效设置。
10. 更新 `NEXT_PUBLIC_SITE_URL` 为规范主域名并重新部署。

推荐规范形式：

```text
https://example.com/
```

### 16.4 用户绑定后的自行复查

- `http://` 自动跳转到 `https://`。
- `www` 和根域名只有一个作为最终地址。
- HTTPS 证书有效且没有混合内容。
- OG 元数据、海报网址和二维码都是正式域名。
- Pages 预览域名不出现在正式分享内容中。

---

## 17. 中国大陆访问说明

本方案使用 Cloudflare Pages 的全球网络，不需要自己购买服务器即可上线，适合快速发布和低成本运营。

但需要接受以下现实约束：

- 中国大陆不同运营商、地区和时段的访问速度可能不同。
- Cloudflare Pages 不能等同于中国大陆境内备案 CDN。
- 若未来对大陆访问稳定性有严格要求，可能需要备案域名并迁移到境内对象存储/CDN。
- 由于本项目输出标准静态文件 `out/`，未来迁移不需要重写业务代码。

上线前至少使用中国移动、中国联通、中国电信网络各测试一次，并重点测试微信内置浏览器。

---

## 18. 测试与验收标准

### 18.1 自动化检查

以下命令必须全部成功：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

核心算法测试至少覆盖：

- 生成 31 场比赛。
- 抽取 48 个唯一产品并分为 12 组。
- 每组恰好选择 2 款，共产生 24 款直通产品。
- 从 24 款遗珠中恰好复活 8 款，最终组成 32 强。
- 每轮场次数正确。
- 偶数和奇数场胜者进入正确槽位。
- 完成 31 次选择后得到冠军。
- 逐步撤销恢复正确状态。
- 决赛后撤销清除冠军。
- 损坏存储数据安全降级。
- 结果页包含亚军和两名四强；分享海报保持冠军主体与完整对阵树，不额外放置四强名次卡。
- 排阵算法在限制次数内结束。

### 18.2 浏览器验收

- iPhone Safari。
- Android Chrome。
- 微信内置浏览器。
- 桌面 Chrome 或 Edge。
- 窄屏 320px。

### 18.3 线上功能验收

- 用户能从首页完整完成一届比赛。
- 总共进行且仅进行 31 次有效选择。
- 每场胜者进入正确的下一轮位置。
- 刷新后能恢复进度。
- 撤销不破坏后续对阵。
- 决赛胜者正确成为冠军。
- 冠军击败列表正确。
- 人格结果符合规则且不会为空。
- 完整比赛树信息正确。
- 分享海报清晰、无缺图、可下载。
- `*.pages.dev` 生产预览地址和 HTTPS 正常。
- 所有子页面直接刷新不返回 404。
- 常见手机宽度没有非预期横向滚动。
- 页面没有明显控制台异常。

---

## 19. 发布与回滚流程

### 发布前

1. 更新版本说明。
2. 运行全部检查。
3. 本地预览静态 `out/`。
4. 检查新增图片大小和来源。
5. 确认环境变量使用当前 Cloudflare Pages 生产预览地址。
6. 合并到 `main`。

### 发布后

1. 打开正式首页。
2. 新开一局并完成至少数场选择。
3. 刷新检查恢复。
4. 打开结果测试局或完整跑通一局。
5. 生成海报。
6. 在手机和微信中打开链接。

### 回滚

如果生产版本出现白屏、路由 404、无法比赛或海报严重故障：

1. 在 Cloudflare Pages 部署历史中回退到上一个成功版本。
2. 不删除 Git 历史。
3. 在新分支修复并重新运行全部检查。
4. 重新部署后再次执行线上冒烟测试。

---

## 20. 常见故障排查

### 子页面刷新 404

- 确认 `output: "export"` 和 `trailingSlash: true`。
- 检查 `out/setup/index.html` 等文件是否存在。
- 检查 Pages 输出目录是否确实为 `out`。
- 检查是否添加了错误的重定向规则。

### 构建成功但页面白屏

- 检查是否在服务端渲染阶段直接读取 `window` 或 `localStorage`。
- 检查客户端组件是否声明 `"use client"`。
- 检查静态资源路径大小写。
- 检查浏览器控制台和部署日志。

### 海报生成缺图

- 确认图片为本站本地资源。
- 等待图片和字体加载完成。
- 避免引用带防盗链或跨域限制的第三方 URL。
- 确认图片文件名大小写与部署文件一致。

### 部署后仍显示旧页面

- 确认新部署状态成功。
- 检查 HTML 是否被错误设置为长期缓存。
- 清除 Cloudflare 缓存后重试。
- 使用无痕窗口排除浏览器缓存。

### 本地进度导致新版本报错

- 检查 `schemaVersion` 和迁移/失效逻辑。
- 存储校验失败时应安全清理并返回首页。
- 不允许因为旧状态使整个 React 页面崩溃。

---

## 21. Goal 模型完成条件

只有同时满足以下条件，才可以宣布 Goal 完成：

1. 源代码、数据、占位图片和配置全部存在于仓库。
2. 四个核心页面和 31 场比赛流程完整可用。
3. 持久化、撤销、人格、比赛树和海报全部实现。
4. `lint`、类型检查、测试和生产构建全部通过。
5. `out/` 可被普通静态服务器正确托管。
6. Cloudflare Pages 部署成功，`*.pages.dev` 预览地址可访问。
7. 在 Pages 预览地址下完成移动端和微信浏览器冒烟测试。
8. README 说明本地开发、数据修改、构建、Pages 部署和回滚方法。
9. 最终交付说明列出：
    - 项目目录结构。
    - 本地运行方法。
    - 如何添加和修改方便面数据。
    - 比赛算法位置。
    - 状态持久化位置。
    - 海报生成位置。
    - Cloudflare Pages 项目名称和 `*.pages.dev` 预览地址。
    - 用户后续绑定域名需要填写的环境变量和重新部署步骤。
    - 已知限制。

域名购买、付款、账户验证、DNS、正式域名绑定、重定向和正式域名验收全部由用户自行完成。Goal 模型不得等待这些操作，也不得在完成 Pages 预览部署后继续代办域名事项。交付 Pages 预览地址及必要说明后，只要其他完成条件均满足，即可宣布 Goal 完成。
