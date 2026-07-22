import { getNoodle } from "@/lib/noodles";
import { ROUND_LABELS, type Match } from "@/types/tournament";

interface BracketViewProps {
  matches: Match[];
}

function Slot({ id, winner }: { id: string | null; winner: boolean }) {
  const noodle = getNoodle(id);
  return <div className={winner ? "bracket-slot winner" : "bracket-slot"}>{noodle ? `${noodle.brand} · ${noodle.name}` : "待定"}</div>;
}

export function BracketView({ matches }: BracketViewProps) {
  return (
    <div className="bracket-scroll" tabIndex={0} aria-label="完整淘汰赛图，可横向滚动">
      <div className="bracket-grid">
        {([1, 2, 3, 4, 5] as Match["round"][]).map((round) => (
          <section className="bracket-round" key={round}>
            <h3>{ROUND_LABELS[round]}</h3>
            <div className="round-matches">
              {matches.filter((match) => match.round === round).map((match) => (
                <article className="bracket-match" key={match.id}>
                  <small>第 {match.matchIndex + 1} 场</small>
                  <Slot id={match.leftNoodleId} winner={match.winnerId === match.leftNoodleId} />
                  <Slot id={match.rightNoodleId} winner={match.winnerId === match.rightNoodleId} />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
