import { ROUND_LABELS, ROUND_MATCH_COUNTS, type Match } from "@/types/tournament";

interface ProgressHeaderProps {
  match: Match;
  completed: number;
}

export function ProgressHeader({ match, completed }: ProgressHeaderProps) {
  const progress = Math.round((completed / 31) * 100);
  return (
    <section className="progress-panel" aria-label="比赛进度">
      <div className="round-meta">
        <span>{ROUND_LABELS[match.round]}</span>
        <strong>第 {match.matchIndex + 1} / {ROUND_MATCH_COUNTS[match.round]} 场</strong>
      </div>
      <div className="progress-copy"><span>总进度</span><strong>{completed} / 31</strong></div>
      <div className="progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
    </section>
  );
}
