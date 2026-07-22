"use client";

import { ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useTournamentStore } from "@/store/tournament-store";

export default function HomePage() {
  const hydrated = useTournamentStore((state) => state.hydrated);
  const tournament = useTournamentStore((state) => state.tournament);
  const resetTournament = useTournamentStore((state) => state.resetTournament);
  const hasProgress = hydrated && tournament && tournament.snapshots.length > 0;
  const continueHref = tournament?.championId ? "/result/" : "/tournament/";

  return (
    <main className="home-page">
      <section className="hero-shell">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="hero-logo-mark" aria-hidden="true">🍜</div>
          <p className="hero-wordmark">NOODLE CUP</p>
          <h1>方便面<br /><span>世界杯</span></h1>
          <p className="hero-subtitle">32 款方便面，只能留下一碗</p>
          <p className="hero-description">31 次二选一，决出真正属于你的本命泡面。无需登录，比赛进度会自动保存在当前浏览器。</p>
          <div className="hero-actions">
            {hasProgress ? (
              <>
                <a className="button button-primary" href={continueHref}>继续比赛 <ArrowRight size={19} /></a>
                <button className="button button-ghost" onClick={resetTournament} type="button"><RotateCcw size={17} /> 重新开始</button>
              </>
            ) : (
              <a className="button button-primary" href="/setup/"><Trophy size={18} /> 开始世界杯 <ArrowRight size={19} /></a>
            )}
          </div>
          <p className="time-note">大约 3～5 分钟 · 无需登录 · 自动保存</p>
        </motion.div>
        <div className="hero-orbit" aria-hidden="true"><span>32</span><small>NOODLES</small></div>
      </section>
      <section className="how-it-works" aria-label="玩法说明">
        <p className="section-label">HOW TO PLAY</p>
        <div className="step-list">
          <article><span>01</span><strong>确认阵容</strong><p>从 48 款候选中抽取 32 款。</p></article>
          <article><span>02</span><strong>连续对决</strong><p>每场选出你更想吃的一款。</p></article>
          <article><span>03</span><strong>冠军诞生</strong><p>生成完整赛程和分享长图。</p></article>
        </div>
      </section>
    </main>
  );
}
