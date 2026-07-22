import { beforeEach, describe, expect, it } from "vitest";
import { noodles } from "@/lib/noodles";
import { loadTournament, saveTournament, STORAGE_KEY } from "@/lib/storage";
import { createTournament } from "@/lib/tournament";

describe("本地存储", () => {
  beforeEach(() => window.localStorage.clear());

  it("保存并恢复合法比赛", () => {
    const tournament = createTournament(noodles.slice(0, 32).map((item) => item.id));
    expect(saveTournament(tournament)).toBe(true);
    expect(loadTournament()).toEqual(tournament);
  });

  it("损坏数据会被安全清除", () => {
    window.localStorage.setItem(STORAGE_KEY, "{broken");
    expect(loadTournament()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("旧版或不完整数据不会造成异常", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 0 }));
    expect(loadTournament()).toBeNull();
  });
});
