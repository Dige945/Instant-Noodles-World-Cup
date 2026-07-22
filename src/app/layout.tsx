import type { Metadata, Viewport } from "next";
import { StoreHydrator } from "@/components/store-hydrator";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://instant-noodle-world-cup.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "中国方便面世界杯",
    template: "%s｜中国方便面世界杯",
  },
  description: "32 款方便面，只能留下一碗。用 31 次选择决出你的方便面冠军。",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192" }],
    apple: "/icon-192.png",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "中国方便面世界杯",
    description: "32 款方便面，只能留下一碗。",
    images: [{ url: "/og-cover.png", width: 1200, height: 630, alt: "中国方便面世界杯" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "中国方便面世界杯",
    description: "32 款方便面，只能留下一碗。",
    images: ["/og-cover.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <StoreHydrator />
        <header className="site-header">
          <a className="site-brand" href="/" aria-label="返回中国方便面世界杯首页">
            <span aria-hidden="true">🍜</span>
            <span>NOODLE CUP</span>
          </a>
          <span className="site-kicker">方便面世界杯 · 32 → 1</span>
        </header>
        {children}
        <footer className="site-footer">
          <p>本结果仅代表个人口味 · 产品名称仅用于趣味比较</p>
          <a href="/privacy/">隐私说明</a>
        </footer>
      </body>
    </html>
  );
}
