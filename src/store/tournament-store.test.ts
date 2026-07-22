import { beforeEach, describe, expect, it } from "vitest";
import { useTournamentStore } from "@/store/tournament-store";

function completeGroups() {
  for (let group = 0; group < 12; group += 1) {
    const draft = useTournamentStore.getState().draftContestants;
    useTournamentStore.getState().toggleGroupSelection(draft[group * 4]);
    useTournamentStore.getState().toggleGroupSelection(draft[group * 4 + 1]);
    expect(useTournamentStore.getState().advanceGroup()).toBe(true);
  }
}

describe("资格赛状态", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useTournamentStore.setState({
      tournament: null,
      draftContestants: [],
      draftReplacementCount: 0,
      qualificationPhase: "groups",
      groupIndex: 0,
      groupQualifiedIds: [],
      revivalSelectionIds: [],
      hydrated: true,
      storageWarning: null,
    });
  });

  it("抽取 48 款不重复产品并分成 12 组", () => {
    useTournamentStore.getState().initializeDraft();
    const draft = useTournamentStore.getState().draftContestants;
    expect(draft).toHaveLength(48);
    expect(new Set(draft).size).toBe(48);
  });

  it("每组选择 2 款后产生 24 款直通产品并进入复活赛", () => {
    useTournamentStore.getState().initializeDraft();
    completeGroups();
    expect(useTournamentStore.getState().qualificationPhase).toBe("revival");
    expect(useTournamentStore.getState().groupQualifiedIds).toHaveLength(24);
  });

  it("可以把当前组不熟悉的产品随机替换且不会重复", () => {
    useTournamentStore.getState().initializeDraft();
    const original = useTournamentStore.getState().draftContestants[0];
    useTournamentStore.getState().toggleGroupSelection(original);
    expect(useTournamentStore.getState().replaceGroupContestant(original)).toBe(true);
    const state = useTournamentStore.getState();
    expect(state.draftContestants).toHaveLength(48);
    expect(new Set(state.draftContestants).size).toBe(48);
    expect(state.draftContestants).not.toContain(original);
    expect(state.groupQualifiedIds).not.toContain(original);
    expect(state.draftReplacementCount).toBe(1);
  });

  it("从 24 款遗珠中复活 8 款后组成 32 强", () => {
    useTournamentStore.getState().initializeDraft();
    completeGroups();
    const state = useTournamentStore.getState();
    const eliminated = state.draftContestants.filter((id) => !state.groupQualifiedIds.includes(id));
    eliminated.slice(0, 8).forEach((id) => useTournamentStore.getState().toggleRevivalSelection(id));
    const tournament = useTournamentStore.getState().startTournament();
    expect(tournament?.contestants).toHaveLength(32);
    expect(tournament?.matches).toHaveLength(31);
    expect(window.localStorage.getItem("instant-noodle-world-cup:tournament")).toContain('"schemaVersion":1');
  });
});
