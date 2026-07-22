import type { Metadata } from "next";

export const metadata: Metadata = { title: "隐私说明" };

export default function PrivacyPage() {
  return (
    <main className="page-shell privacy-page">
      <p className="eyebrow">PRIVACY</p>
      <h1>隐私说明</h1>
      <p className="privacy-lead">这个小游戏不要求登录，也不会把你的比赛选择上传到服务器。</p>
      <section>
        <h2>比赛数据</h2>
        <p>参赛名单、比赛进度和冠军结果只保存在当前浏览器的 <code>localStorage</code> 中。更换设备、使用其他浏览器或清理浏览器数据后，进度无法恢复。</p>
      </section>
      <section>
        <h2>分享海报</h2>
        <p>分享海报在你的设备中直接生成。网站不会接收或保存生成的图片，是否保存和分享由你自行决定。</p>
      </section>
      <section>
        <h2>外部服务</h2>
        <p>网站由 Cloudflare Pages 提供静态托管和基础网络服务，其基础访问日志适用 Cloudflare 的相关政策。本项目没有接入广告、用户画像或第三方统计脚本。</p>
      </section>
      <section>
        <h2>产品信息</h2>
        <p>方便面品牌和产品名称仅用于非商业的趣味口味比较，不代表品牌方参与或赞助本项目。</p>
      </section>
      <a className="button button-primary" href="/">返回首页</a>
    </main>
  );
}
