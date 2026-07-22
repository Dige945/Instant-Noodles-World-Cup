"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, RefreshCw, Shuffle, Sparkles } from "lucide-react";
import { getNoodle } from "@/lib/noodles";
import { useTournamentStore } from "@/store/tournament-store";
import type { Noodle } from "@/types/tournament";

function SelectionCard({ noodle, selected, onClick, badge, onReplace }: {
  noodle: Noodle;
  selected: boolean;
  onClick: () => void;
  badge?: string;
  onReplace?: () => void;
}) {
  return (
    <article className={`qualifier-card ${selected ? "is-selected" : ""}`}>
      {badge && <span className="qualifier-badge">{badge}</span>}
      {selected && <span className="qualifier-check"><Check size={18} /></span>}
      <button className="qualifier-card-main" type="button" onClick={onClick} aria-pressed={selected}>
        <div className="qualifier-image"><Image src={noodle.image} alt={`${noodle.brand}${noodle.name}包装图`} fill sizes="240px" /></div>
        <span>{noodle.brand}</span>
        <strong>{noodle.name}</strong>
        <small>{noodle.flavorTags.slice(0, 2).join(" · ")}</small>
      </button>
      {onReplace && <button className="qualifier-replace" type="button" onClick={onReplace}><Shuffle size={13} /> 不熟悉，换一个</button>}
    </article>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const draftIds = useTournamentStore((state) => state.draftContestants);
  const phase = useTournamentStore((state) => state.qualificationPhase);
  const groupIndex = useTournamentStore((state) => state.groupIndex);
  const qualifiedIds = useTournamentStore((state) => state.groupQualifiedIds);
  const revivalIds = useTournamentStore((state) => state.revivalSelectionIds);
  const initializeDraft = useTournamentStore((state) => state.initializeDraft);
  const rerollDraft = useTournamentStore((state) => state.rerollDraft);
  const replaceGroupContestant = useTournamentStore((state) => state.replaceGroupContestant);
  const toggleGroupSelection = useTournamentStore((state) => state.toggleGroupSelection);
  const advanceGroup = useTournamentStore((state) => state.advanceGroup);
  const toggleRevivalSelection = useTournamentStore((state) => state.toggleRevivalSelection);
  const startTournament = useTournamentStore((state) => state.startTournament);

  useEffect(() => {
    initializeDraft();
    router.prefetch("/tournament/");
  }, [initializeDraft, router]);

  if (draftIds.length !== 48) {
    return <main className="empty-page"><div className="loading-panel">正在抽取 48 款参赛方便面…</div></main>;
  }

  const groupIds = draftIds.slice(groupIndex * 4, groupIndex * 4 + 4);
  const groupNoodles = groupIds.map(getNoodle).filter((item) => item !== undefined);
  const groupSelected = qualifiedIds.filter((id) => groupIds.includes(id));
  const revivalNoodles = draftIds
    .filter((id) => !qualifiedIds.includes(id))
    .map(getNoodle)
    .filter((item) => item !== undefined);
  const groupLetter = String.fromCharCode(65 + groupIndex);

  function handleReroll() {
    if ((qualifiedIds.length > 0 || revivalIds.length > 0) && !window.confirm("重新抽签会清空小组赛和复活赛选择，确定继续吗？")) return;
    rerollDraft();
  }

  function handleStart() {
    if (startTournament()) router.push("/tournament/");
  }

  if (phase === "revival") {
    return (
      <main className="page-shell qualifier-page">
        <section className="qualifier-heading">
          <p className="eyebrow"><Sparkles size={16} /> 遗珠复活赛 · PLAY-OFF</p>
          <h1>捞回<span>遗珠</span></h1>
          <p>24 款小组遗珠还有 8 个复活名额，选出你不舍得淘汰的方便面。</p>
          <div className="qualifier-progress"><span style={{ width: `${(revivalIds.length / 8) * 100}%` }} /></div>
          <strong className="selection-count">已复活 {revivalIds.length} / 8</strong>
        </section>
        <section className="revival-grid" aria-label="复活赛候选方便面">
          {revivalNoodles.map((noodle, index) => (
            <SelectionCard
              key={noodle.id}
              noodle={noodle}
              selected={revivalIds.includes(noodle.id)}
              onClick={() => toggleRevivalSelection(noodle.id)}
              badge={String.fromCharCode(65 + Math.floor(index / 2))}
            />
          ))}
        </section>
        <div className="qualifier-actions">
          <button className="button button-ghost" type="button" onClick={handleReroll}><RefreshCw size={17} /> 重新抽签</button>
          <button className="button button-primary" type="button" onClick={handleStart} disabled={revivalIds.length !== 8}>组成 32 强，开始淘汰赛 <ArrowRight size={18} /></button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell qualifier-page">
      <section className="qualifier-heading">
        <p className="eyebrow">小组赛 · GROUP STAGE</p>
        <h1><span>{groupLetter}</span> 组</h1>
        <p>从本组选出更想吃的 2 款，直接晋级 32 强。</p>
        <div className="qualifier-progress"><span style={{ width: `${((groupIndex + groupSelected.length / 2) / 12) * 100}%` }} /></div>
        <strong className="selection-count">第 {groupIndex + 1} / 12 组 · 已选 {groupSelected.length} / 2</strong>
      </section>
      <section className="group-choice-grid" aria-label={`${groupLetter}组方便面`}>
        {groupNoodles.map((noodle) => (
          <SelectionCard key={noodle.id} noodle={noodle} selected={groupSelected.includes(noodle.id)} onClick={() => toggleGroupSelection(noodle.id)} onReplace={() => replaceGroupContestant(noodle.id)} />
        ))}
      </section>
      <div className="qualifier-actions">
        <button className="button button-ghost" type="button" onClick={handleReroll}><RefreshCw size={17} /> 重新抽签</button>
        <button className="button button-primary" type="button" onClick={advanceGroup} disabled={groupSelected.length !== 2}>
          {groupIndex === 11 ? "进入复活赛" : "确认本组，下一组"}<ArrowRight size={18} />
        </button>
      </div>
    </main>
  );
}
