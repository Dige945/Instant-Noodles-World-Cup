import rawNoodles from "@/data/noodles.json";
import type { Noodle } from "@/types/tournament";

export const noodles = rawNoodles as Noodle[];

export const noodleById = new Map(noodles.map((noodle) => [noodle.id, noodle]));

export function getNoodle(id: string | null | undefined): Noodle | undefined {
  return id ? noodleById.get(id) : undefined;
}
