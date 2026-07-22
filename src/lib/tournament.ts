import type { Match, Tournament, TournamentSnapshot } from "@/types/tournament";

const MATCH_COUNTS = [16, 8, 4, 2, 1] as const;

function copyMatches(matches: Match[]): Match[] {
  return matches.map((match) => ({ ...match }));
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createMatches(seededContestantIds: readonly string[]): Match[] {
  if (seededContestantIds.length !== 32 || new Set(seededContestantIds).size !== 32) {
    throw new Error("参赛名单必须包含 32 个不同产品");
  }

  const matches: Match[] = [];
  MATCH_COUNTS.forEach((count, roundIndex) => {
    const round = (roundIndex + 1) as Match["round"];
    for (let matchIndex = 0; matchIndex < count; matchIndex += 1) {
      matches.push({
        id: `r${round}-m${matchIndex}`,
        round,
        matchIndex,
        leftNoodleId: round === 1 ? seededContestantIds[matchIndex * 2] : null,
        rightNoodleId: round === 1 ? seededContestantIds[matchIndex * 2 + 1] : null,
        winnerId: null,
      });
    }
  });
  return matches;
}

export function createTournament(
  seededContestantIds: readonly string[],
  replacementCount = 0,
  now = Date.now(),
): Tournament {
  const matches = createMatches(seededContestantIds);
  return {
    schemaVersion: 1,
    id: createId(),
    contestants: [...seededContestantIds],
    matches,
    currentMatchId: matches[0].id,
    championId: null,
    snapshots: [],
    selectedWinnerIds: [],
    replacementCount,
    createdAt: now,
  };
}

function createSnapshot(tournament: Tournament): TournamentSnapshot {
  return {
    matches: copyMatches(tournament.matches),
    currentMatchId: tournament.currentMatchId,
    championId: tournament.championId,
    selectedWinnerIds: [...tournament.selectedWinnerIds],
    completedAt: tournament.completedAt,
  };
}

export function getCurrentMatch(tournament: Tournament): Match | undefined {
  return tournament.matches.find((match) => match.id === tournament.currentMatchId);
}

export function getCompletedMatchCount(tournament: Tournament): number {
  return tournament.matches.filter((match) => match.winnerId !== null).length;
}

export function selectMatchWinner(
  tournament: Tournament,
  matchId: string,
  winnerId: string,
  now = Date.now(),
): Tournament {
  if (tournament.championId) throw new Error("本届比赛已经结束");
  if (tournament.currentMatchId !== matchId) throw new Error("只能选择当前场次");

  const match = tournament.matches.find((item) => item.id === matchId);
  if (!match || match.winnerId) throw new Error("当前比赛不存在或已经完成");
  if (winnerId !== match.leftNoodleId && winnerId !== match.rightNoodleId) {
    throw new Error("所选产品不属于当前比赛");
  }

  const snapshot = createSnapshot(tournament);
  const matches = copyMatches(tournament.matches);
  const current = matches.find((item) => item.id === matchId)!;
  current.winnerId = winnerId;

  let championId: string | null = null;
  let completedAt: number | undefined;

  if (current.round === 5) {
    championId = winnerId;
    completedAt = now;
  } else {
    const nextRound = (current.round + 1) as Match["round"];
    const nextMatchIndex = Math.floor(current.matchIndex / 2);
    const next = matches.find(
      (item) => item.round === nextRound && item.matchIndex === nextMatchIndex,
    )!;
    if (current.matchIndex % 2 === 0) next.leftNoodleId = winnerId;
    else next.rightNoodleId = winnerId;
  }

  const nextPlayable = matches.find(
    (item) => item.winnerId === null && item.leftNoodleId && item.rightNoodleId,
  );

  return {
    ...tournament,
    matches,
    currentMatchId: nextPlayable?.id ?? current.id,
    championId,
    snapshots: [...tournament.snapshots, snapshot],
    selectedWinnerIds: [...tournament.selectedWinnerIds, winnerId],
    completedAt,
  };
}

export function undoLastSelection(tournament: Tournament): Tournament {
  const snapshot = tournament.snapshots.at(-1);
  if (!snapshot) return tournament;
  return {
    ...tournament,
    matches: copyMatches(snapshot.matches),
    currentMatchId: snapshot.currentMatchId,
    championId: snapshot.championId,
    selectedWinnerIds: [...snapshot.selectedWinnerIds],
    snapshots: tournament.snapshots.slice(0, -1),
    completedAt: snapshot.completedAt,
  };
}

export function getDefeatedByChampion(tournament: Tournament): string[] {
  if (!tournament.championId) return [];
  return tournament.matches
    .filter((match) => match.winnerId === tournament.championId)
    .sort((a, b) => a.round - b.round)
    .map((match) =>
      match.leftNoodleId === tournament.championId
        ? match.rightNoodleId
        : match.leftNoodleId,
    )
    .filter((id): id is string => Boolean(id));
}

export function getFinalFour(tournament: Tournament): {
  championId: string | null;
  runnerUpId: string | null;
  semifinalistIds: string[];
} {
  const final = tournament.matches.find((match) => match.round === 5);
  const championId = tournament.championId;
  const runnerUpId = final && championId
    ? (final.leftNoodleId === championId ? final.rightNoodleId : final.leftNoodleId)
    : null;
  const semifinalistIds = tournament.matches
    .filter((match) => match.round === 4 && match.winnerId)
    .map((match) => match.leftNoodleId === match.winnerId ? match.rightNoodleId : match.leftNoodleId)
    .filter((id): id is string => Boolean(id));

  return { championId, runnerUpId, semifinalistIds };
}
