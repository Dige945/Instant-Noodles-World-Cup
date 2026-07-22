import type { Match, Tournament } from "@/types/tournament";

export const STORAGE_KEY = "instant-noodle-world-cup:tournament";

function isMatch(value: unknown): value is Match {
  if (!value || typeof value !== "object") return false;
  const match = value as Partial<Match>;
  return (
    typeof match.id === "string" &&
    typeof match.round === "number" &&
    match.round >= 1 &&
    match.round <= 5 &&
    typeof match.matchIndex === "number" &&
    (match.leftNoodleId === null || typeof match.leftNoodleId === "string") &&
    (match.rightNoodleId === null || typeof match.rightNoodleId === "string") &&
    (match.winnerId === null || typeof match.winnerId === "string")
  );
}

export function isTournament(value: unknown): value is Tournament {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<Tournament>;
  return (
    data.schemaVersion === 1 &&
    typeof data.id === "string" &&
    Array.isArray(data.contestants) &&
    data.contestants.length === 32 &&
    data.contestants.every((id) => typeof id === "string") &&
    Array.isArray(data.matches) &&
    data.matches.length === 31 &&
    data.matches.every(isMatch) &&
    typeof data.currentMatchId === "string" &&
    (data.championId === null || typeof data.championId === "string") &&
    Array.isArray(data.snapshots) &&
    Array.isArray(data.selectedWinnerIds) &&
    typeof data.replacementCount === "number" &&
    typeof data.createdAt === "number"
  );
}

export function loadTournament(): Tournament | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isTournament(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveTournament(tournament: Tournament | null): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (tournament) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament));
    else window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
