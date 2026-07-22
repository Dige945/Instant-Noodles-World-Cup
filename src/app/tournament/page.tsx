"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, RotateCcw, Save } from "lucide-react";
import { NoodleCard } from "@/components/noodle-card";
import { ProgressHeader } from "@/components/progress-header";
import { getNoodle } from "@/lib/noodles";
import { getCompletedMatchCount, getCurrentMatch } from "@/lib/tournament";
import { ROUND_LABELS, type Match } from "@/types/tournament";
import { useTournamentStore } from "@/store/tournament-store";

function RoundIntro({ round, onDone }: { round: Match["round"]; onDone: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onDone, 900); return () => window.clearTimeout(timer); }, [onDone]);
  return <div className="round-intro"><span>{ROUND_LABELS[round]}</span><small>ROUND {round}</small></div>;
}

export default function TournamentPage() {
  const router = useRouter();
  const hydrated = useTournamentStore((state) => state.hydrated);
  const tournament = useTournamentStore((state) => state.tournament);
  const chooseWinner = useTournamentStore((state) => state.chooseWinner);
  const undo = useTournamentStore((state) => state.undo);
  const storageWarning = useTournamentStore((state) => state.storageWarning);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [introKey, setIntroKey] = useState<string | null>(null);
  const match = tournament ? getCurrentMatch(tournament) : undefined;
  const left = getNoodle(match?.leftNoodleId);
  const right = getNoodle(match?.rightNoodleId);
  const shouldIntro = match?.matchIndex === 0 && introKey !== match.id;

  useEffect(() => {
    router.prefetch("/result/");
  }, [router]);

  useEffect(() => {
    if (!tournament || !match) return;
    const upcoming = tournament.matches.find((item) => (
      item.id !== match.id &&
      item.winnerId === null &&
      item.leftNoodleId &&
      item.rightNoodleId
    ));
    if (!upcoming) return;
    [upcoming.leftNoodleId, upcoming.rightNoodleId].forEach((id) => {
      const noodle = getNoodle(id);
      if (!noodle) return;
      const image = new window.Image();
      image.decoding = "async";
      image.src = noodle.image;
      void image.decode().catch(() => undefined);
    });
  }, [match, tournament]);

  function select(id: string) {
    if (!tournament || !match || locked) return;
    setLocked(true); setSelectedId(id);
    window.setTimeout(() => {
      chooseWinner(match.id, id);
      const state = useTournamentStore.getState().tournament;
      if (state?.championId) router.push("/result/");
      setSelectedId(null); setLocked(false);
    }, 420);
  }

  function handleUndo() { if (!locked) { setSelectedId(null); undo(); } }

  if (!hydrated) return <main className="empty-page"><div className="loading-panel">正在恢复赛场…</div></main>;
  if (!tournament || !match || !left || !right) return <main className="empty-page"><div className="empty-bowl">🏆</div><h1>还没有正在进行的比赛</h1><p>先确认 32 款参赛方便面，再进入淘汰赛。</p><a className="button button-primary" href="/setup/">选择参赛阵容</a></main>;

  const completed = getCompletedMatchCount(tournament);
  return (
    <main className="page-shell tournament-page">
      {shouldIntro && <RoundIntro round={match.round} onDone={() => setIntroKey(match.id)} />}
      <div className="arena-tools"><a href="/setup/" aria-label="返回阵容页"><ChevronLeft /></a><button type="button" onClick={handleUndo} disabled={locked || tournament.snapshots.length === 0} aria-label="撤销上一场"><RotateCcw /></button></div>
      <ProgressHeader match={match} completed={completed} />
      <section className="battle-heading"><p className="section-label">CHOOSE YOUR FAVORITE</p><h1>哪一款更想吃？</h1></section>
      {storageWarning && <p className="warning-banner">{storageWarning}</p>}
      <section className="battle-stage" aria-live="polite">
        <NoodleCard key={left.id} noodle={left} onChoose={() => select(left.id)} selected={selectedId === left.id} defeated={Boolean(selectedId && selectedId !== left.id)} disabled={locked} />
        <div className="versus-mark"><span>VS</span><small>二选一</small></div>
        <NoodleCard key={right.id} noodle={right} onChoose={() => select(right.id)} selected={selectedId === right.id} defeated={Boolean(selectedId && selectedId !== right.id)} disabled={locked} />
      </section>
      <div className="battle-footer"><button className="button button-ghost" type="button" onClick={handleUndo} disabled={locked || tournament.snapshots.length === 0}><RotateCcw size={17} /> 撤销上一场</button><span><Save size={15} /> 进度已自动保存</span></div>
    </main>
  );
}
