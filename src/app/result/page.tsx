"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Crown, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { BracketView } from "@/components/bracket-view";
import { ChampionRoute } from "@/components/champion-route";
import { SharePoster } from "@/components/share-poster";
import { getNoodle } from "@/lib/noodles";
import { getPersonality } from "@/lib/personality";
import { getFinalFour } from "@/lib/tournament";
import { useTournamentStore } from "@/store/tournament-store";

export default function ResultPage() {
  const router = useRouter();
  const hydrated = useTournamentStore((state) => state.hydrated);
  const tournament = useTournamentStore((state) => state.tournament);
  const undo = useTournamentStore((state) => state.undo);
  const resetTournament = useTournamentStore((state) => state.resetTournament);
  const champion = getNoodle(tournament?.championId);

  if (!hydrated) return <main className="empty-page"><div className="loading-panel">正在展开冠军榜…</div></main>;
  if (!tournament || !champion) return <main className="empty-page"><div className="empty-bowl">🏆</div><h1>冠军还没有诞生</h1><p>完成全部 31 场选择后，冠军会在这里揭晓。</p><a className="button button-primary" href={tournament ? "/tournament/" : "/setup/"}>回到比赛</a></main>;

  const personality = getPersonality(tournament);
  const placements = getFinalFour(tournament);
  const podium = [placements.runnerUpId, ...placements.semifinalistIds]
    .map(getNoodle)
    .filter((item) => item !== undefined);

  function handleUndoFinal() { undo(); router.push("/tournament/"); }
  function handleRestart() { resetTournament(); router.push("/setup/"); }

  return (
    <main className="result-page">
      <section className="champion-hero">
        <div className="confetti" aria-hidden="true">✦ · ✧ · ✦ · ✧ · ✦</div>
        <p className="eyebrow"><Trophy size={16} /> NOODLE CUP CHAMPION</p>
        <h1>冠军诞生</h1>
        <div className="champion-stage"><Crown className="champion-crown" size={72} aria-hidden="true" /><div className="champion-package"><Image src={champion.image} alt={`${champion.brand}${champion.name}包装图`} fill sizes="320px" priority /></div></div>
        <div className="champion-ribbon">🏆 冠军 · CHAMPION</div>
        <p className="champion-brand">{champion.brand}</p><h2>{champion.name}</h2>
        <div className="podium-row">{podium.map((item, index) => item && <div className="podium-card" key={item.id}><Image src={item.image} alt="" width={44} height={44} /><span>{index === 0 ? "亚军" : "四强"}</span><strong>{item.name}</strong></div>)}</div>
        <div className="personality-pill"><Sparkles size={18} /><span>你的方便面人格</span><strong>{personality.name}</strong></div>
        <p className="personality-description">{personality.description}</p>
        <div className="hero-result-actions"><SharePoster tournament={tournament} personality={personality} /><button className="button button-ghost" type="button" onClick={handleRestart}><RotateCcw size={17} /> 再玩一次</button></div>
      </section>
      <div className="result-content page-shell">
        <section className="result-section two-column-result"><div><p className="section-label">ROAD TO CHAMPION</p><h2>一路赢到最后</h2><p>五轮淘汰赛，每一场都由你的口味决定。</p></div><ChampionRoute tournament={tournament} /></section>
        <section className="result-section"><div className="section-heading-row"><div><p className="section-label">FULL BRACKET</p><h2>完整淘汰赛图</h2></div><span>横向滑动查看全部轮次</span></div><BracketView matches={tournament.matches} /></section>
        <section className="share-section"><div><p className="section-label">ONE MORE CHOICE?</p><h2>想改决赛结果？</h2></div><button className="button button-ghost" type="button" onClick={handleUndoFinal}><RotateCcw size={17} /> 撤销决赛</button></section>
      </div>
    </main>
  );
}
