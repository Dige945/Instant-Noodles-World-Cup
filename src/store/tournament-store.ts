"use client";

import { create } from "zustand";
import { getNoodle, noodles } from "@/lib/noodles";
import { seedFirstRound, selectContestants } from "@/lib/seeding";
import { loadTournament, saveTournament } from "@/lib/storage";
import { createTournament, selectMatchWinner, undoLastSelection } from "@/lib/tournament";
import type { Tournament } from "@/types/tournament";

interface TournamentStore {
  tournament: Tournament | null;
  draftContestants: string[];
  draftReplacementCount: number;
  qualificationPhase: "groups" | "revival";
  groupIndex: number;
  groupQualifiedIds: string[];
  revivalSelectionIds: string[];
  hydrated: boolean;
  storageWarning: string | null;
  hydrate: () => void;
  initializeDraft: (force?: boolean) => void;
  rerollDraft: () => void;
  replaceGroupContestant: (id: string) => boolean;
  toggleGroupSelection: (id: string) => void;
  advanceGroup: () => boolean;
  toggleRevivalSelection: (id: string) => void;
  startTournament: () => Tournament | null;
  chooseWinner: (matchId: string, winnerId: string) => void;
  undo: () => void;
  resetTournament: () => void;
}

function persist(tournament: Tournament | null): string | null {
  return saveTournament(tournament) ? null : "浏览器未能保存进度，本页关闭后可能无法恢复。";
}

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  tournament: null,
  draftContestants: [],
  draftReplacementCount: 0,
  qualificationPhase: "groups",
  groupIndex: 0,
  groupQualifiedIds: [],
  revivalSelectionIds: [],
  hydrated: false,
  storageWarning: null,

  hydrate: () => {
    if (get().hydrated) return;
    set({ tournament: loadTournament(), hydrated: true });
  },

  initializeDraft: (force = false) => {
    if (!force && get().draftContestants.length === 48) return;
    set({
      draftContestants: selectContestants(noodles, 48).map((item) => item.id),
      draftReplacementCount: 0,
      qualificationPhase: "groups",
      groupIndex: 0,
      groupQualifiedIds: [],
      revivalSelectionIds: [],
    });
  },

  rerollDraft: () => {
    set({
      draftContestants: selectContestants(noodles, 48).map((item) => item.id),
      draftReplacementCount: 0,
      qualificationPhase: "groups",
      groupIndex: 0,
      groupQualifiedIds: [],
      revivalSelectionIds: [],
    });
  },

  replaceGroupContestant: (id) => {
    const { draftContestants, groupIndex, groupQualifiedIds, revivalSelectionIds, qualificationPhase, draftReplacementCount } = get();
    if (qualificationPhase !== "groups") return false;
    const currentGroup = draftContestants.slice(groupIndex * 4, groupIndex * 4 + 4);
    if (!currentGroup.includes(id)) return false;
    const available = noodles.filter((item) => !draftContestants.includes(item.id));
    if (!available.length) return false;
    const replacement = available[Math.floor(Math.random() * available.length)];
    set({
      draftContestants: draftContestants.map((item) => item === id ? replacement.id : item),
      groupQualifiedIds: groupQualifiedIds.filter((item) => item !== id),
      revivalSelectionIds: revivalSelectionIds.filter((item) => item !== id),
      draftReplacementCount: draftReplacementCount + 1,
    });
    return true;
  },

  toggleGroupSelection: (id) => {
    const { draftContestants, groupIndex, groupQualifiedIds, qualificationPhase } = get();
    if (qualificationPhase !== "groups") return;
    const currentGroup = draftContestants.slice(groupIndex * 4, groupIndex * 4 + 4);
    if (!currentGroup.includes(id)) return;
    const currentSelected = groupQualifiedIds.filter((item) => currentGroup.includes(item));
    if (groupQualifiedIds.includes(id)) {
      set({ groupQualifiedIds: groupQualifiedIds.filter((item) => item !== id) });
    } else if (currentSelected.length < 2) {
      set({ groupQualifiedIds: [...groupQualifiedIds, id] });
    }
  },

  advanceGroup: () => {
    const { draftContestants, groupIndex, groupQualifiedIds } = get();
    const currentGroup = draftContestants.slice(groupIndex * 4, groupIndex * 4 + 4);
    if (groupQualifiedIds.filter((id) => currentGroup.includes(id)).length !== 2) return false;
    if (groupIndex === 11) set({ qualificationPhase: "revival" });
    else set({ groupIndex: groupIndex + 1 });
    return true;
  },

  toggleRevivalSelection: (id) => {
    const { draftContestants, groupQualifiedIds, revivalSelectionIds, qualificationPhase } = get();
    if (qualificationPhase !== "revival" || groupQualifiedIds.includes(id) || !draftContestants.includes(id)) return;
    if (revivalSelectionIds.includes(id)) {
      set({ revivalSelectionIds: revivalSelectionIds.filter((item) => item !== id) });
    } else if (revivalSelectionIds.length < 8) {
      set({ revivalSelectionIds: [...revivalSelectionIds, id] });
    }
  },

  startTournament: () => {
    const { groupQualifiedIds, revivalSelectionIds, draftReplacementCount } = get();
    const finalistIds = [...groupQualifiedIds, ...revivalSelectionIds];
    const selected = finalistIds.map(getNoodle).filter((item) => item !== undefined);
    if (selected.length !== 32) return null;
    const seeded = seedFirstRound(selected);
    const tournament = createTournament(
      seeded.map((item) => item.id),
      draftReplacementCount,
    );
    set({ tournament, storageWarning: persist(tournament) });
    return tournament;
  },

  chooseWinner: (matchId, winnerId) => {
    const current = get().tournament;
    if (!current) return;
    const tournament = selectMatchWinner(current, matchId, winnerId);
    set({ tournament, storageWarning: persist(tournament) });
  },

  undo: () => {
    const current = get().tournament;
    if (!current || current.snapshots.length === 0) return;
    const tournament = undoLastSelection(current);
    set({ tournament, storageWarning: persist(tournament) });
  },

  resetTournament: () => {
    set({
      tournament: null,
      draftContestants: [],
      draftReplacementCount: 0,
      qualificationPhase: "groups",
      groupIndex: 0,
      groupQualifiedIds: [],
      revivalSelectionIds: [],
      storageWarning: persist(null),
    });
  },
}));
