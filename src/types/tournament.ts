export type NoodleType = "soup" | "dry" | "cup" | "bag" | "snack";

export type NoodleCategory =
  | "beef"
  | "chicken"
  | "seafood"
  | "spicy"
  | "sour-spicy"
  | "dry-noodle"
  | "nostalgic"
  | "other";

export interface Noodle {
  id: string;
  name: string;
  brand: string;
  image: string;
  type: NoodleType;
  flavorTags: string[];
  category: NoodleCategory;
  popularity: number;
  isBackup: boolean;
}

export interface Match {
  id: string;
  round: 1 | 2 | 3 | 4 | 5;
  matchIndex: number;
  leftNoodleId: string | null;
  rightNoodleId: string | null;
  winnerId: string | null;
}

export interface TournamentSnapshot {
  matches: Match[];
  currentMatchId: string;
  championId: string | null;
  selectedWinnerIds: string[];
  completedAt?: number;
}

export interface Tournament {
  schemaVersion: number;
  id: string;
  contestants: string[];
  matches: Match[];
  currentMatchId: string;
  championId: string | null;
  snapshots: TournamentSnapshot[];
  selectedWinnerIds: string[];
  replacementCount: number;
  createdAt: number;
  completedAt?: number;
}

export const ROUND_LABELS: Record<Match["round"], string> = {
  1: "32 强",
  2: "16 强",
  3: "8 强",
  4: "半决赛",
  5: "决赛",
};

export const ROUND_MATCH_COUNTS: Record<Match["round"], number> = {
  1: 16,
  2: 8,
  3: 4,
  4: 2,
  5: 1,
};
