import { describe, expect, it } from "vitest";
import { noodles } from "@/lib/noodles";
import { seedFirstRound, selectContestants } from "@/lib/seeding";
import {
  createMatches,
  createTournament,
  getCompletedMatchCount,
  selectMatchWinner,
  undoLastSelection,
  getFinalFour,
} from "@/lib/tournament";

function seededRandom(seed = 123456): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("世界杯核心逻辑", () => {
  it("抽取 32 款不重复产品并生成有限排阵", () => {
    expect(noodles.length).toBeGreaterThanOrEqual(48);
    const random = seededRandom();
    const selected = selectContestants(noodles, 32, random);
    const seeded = seedFirstRound(selected, random);
    expect(selected).toHaveLength(32);
    expect(new Set(selected.map((item) => item.id)).size).toBe(32);
    expect(selected.map((item) => item.id)).toContain("ksf-xianxia");
    expect(seeded).toHaveLength(32);
    expect(new Set(seeded.map((item) => item.id)).size).toBe(32);
  });

  it("创建 16、8、4、2、1 共 31 场比赛", () => {
    const ids = noodles.slice(0, 32).map((item) => item.id);
    const matches = createMatches(ids);
    expect(matches).toHaveLength(31);
    expect([1, 2, 3, 4, 5].map((round) => matches.filter((m) => m.round === round).length)).toEqual([
      16, 8, 4, 2, 1,
    ]);
  });

  it("偶数场进入下一轮左侧，奇数场进入右侧", () => {
    const ids = noodles.slice(0, 32).map((item) => item.id);
    let tournament = createTournament(ids);
    tournament = selectMatchWinner(tournament, "r1-m0", ids[0]);
    expect(tournament.matches.find((m) => m.id === "r2-m0")?.leftNoodleId).toBe(ids[0]);
    tournament = selectMatchWinner(tournament, "r1-m1", ids[2]);
    expect(tournament.matches.find((m) => m.id === "r2-m0")?.rightNoodleId).toBe(ids[2]);
  });

  it("恰好完成 31 次选择后产生冠军", () => {
    const ids = noodles.slice(0, 32).map((item) => item.id);
    let tournament = createTournament(ids);
    for (let choice = 0; choice < 31; choice += 1) {
      const match = tournament.matches.find((item) => item.id === tournament.currentMatchId)!;
      expect(match.leftNoodleId).toBeTruthy();
      expect(match.rightNoodleId).toBeTruthy();
      tournament = selectMatchWinner(tournament, match.id, match.leftNoodleId!);
    }
    expect(getCompletedMatchCount(tournament)).toBe(31);
    expect(tournament.championId).toBeTruthy();
    expect(tournament.snapshots).toHaveLength(31);
    const placements = getFinalFour(tournament);
    expect(placements.runnerUpId).toBeTruthy();
    expect(placements.semifinalistIds).toHaveLength(2);
    expect(new Set([placements.championId, placements.runnerUpId, ...placements.semifinalistIds]).size).toBe(4);
  });

  it("撤销决赛会清除冠军并恢复可比赛状态", () => {
    const ids = noodles.slice(0, 32).map((item) => item.id);
    let tournament = createTournament(ids);
    for (let choice = 0; choice < 31; choice += 1) {
      const match = tournament.matches.find((item) => item.id === tournament.currentMatchId)!;
      tournament = selectMatchWinner(tournament, match.id, match.leftNoodleId!);
    }
    const finalist = tournament.championId;
    tournament = undoLastSelection(tournament);
    expect(finalist).toBeTruthy();
    expect(tournament.championId).toBeNull();
    expect(tournament.currentMatchId).toBe("r5-m0");
    expect(getCompletedMatchCount(tournament)).toBe(30);
  });

  it("拒绝非当前场次和不属于本场的产品", () => {
    const ids = noodles.slice(0, 32).map((item) => item.id);
    const tournament = createTournament(ids);
    expect(() => selectMatchWinner(tournament, "r1-m1", ids[2])).toThrow("只能选择当前场次");
    expect(() => selectMatchWinner(tournament, "r1-m0", ids[10])).toThrow("不属于当前比赛");
  });
});
