import { Crown } from "lucide-react";
import { getNoodle } from "@/lib/noodles";
import type { Tournament } from "@/types/tournament";

export function ChampionRoute({ tournament }: { tournament: Tournament }) {
  const champion = getNoodle(tournament.championId);
  const championMatches = tournament.matches
    .filter((match) => match.winnerId === tournament.championId)
    .sort((a, b) => a.round - b.round);

  return (
    <ol className="champion-route">
      {championMatches.map((match, index) => {
        const rivalId = match.leftNoodleId === tournament.championId ? match.rightNoodleId : match.leftNoodleId;
        const rival = getNoodle(rivalId);
        return (
          <li key={match.id}>
            <span>{index + 1}</span>
            <div><small>第 {index + 1} 轮击败</small><strong>{rival?.brand} · {rival?.name}</strong></div>
          </li>
        );
      })}
      <li className="route-champion"><span><Crown size={18} /></span><div><small>最终冠军</small><strong>{champion?.brand} · {champion?.name}</strong></div></li>
    </ol>
  );
}
