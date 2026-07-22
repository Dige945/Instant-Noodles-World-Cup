import type { Noodle } from "@/types/tournament";

export type RandomSource = () => number;

const FEATURED_CONTESTANT_IDS = [
  "ksf-hongshao",
  "ksf-xianxia",
  "ksf-xianggu",
  "ksf-xlr",
  "ty-laotan",
  "ty-hsj",
] as const;

export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function selectContestants(
  pool: readonly Noodle[],
  count = 32,
  random: RandomSource = Math.random,
): Noodle[] {
  if (pool.length < count) {
    throw new Error(`候选池至少需要 ${count} 款产品`);
  }
  const featuredIdSet = new Set<string>(FEATURED_CONTESTANT_IDS);
  const featured = FEATURED_CONTESTANT_IDS
    .map((id) => pool.find((item) => item.id === id))
    .filter((item): item is Noodle => Boolean(item))
    .slice(0, count);
  const remaining = shuffle(
    pool.filter((item) => !featuredIdSet.has(item.id)),
    random,
  ).slice(0, count - featured.length);

  return shuffle([...featured, ...remaining], random);
}

function pairConflict(a: Noodle, b: Noodle): number {
  let score = 0;
  if (a.brand === b.brand) score += 10;
  if (a.category === b.category) score += 2;
  return score;
}

function totalConflict(items: readonly Noodle[]): number {
  let score = 0;
  for (let index = 0; index < items.length; index += 2) {
    score += pairConflict(items[index], items[index + 1]);
  }
  return score;
}

export function seedFirstRound(
  contestants: readonly Noodle[],
  random: RandomSource = Math.random,
): Noodle[] {
  if (contestants.length !== 32) {
    throw new Error("完整世界杯必须恰好有 32 款产品");
  }

  const popular = [...contestants].sort((a, b) => b.popularity - a.popularity).slice(0, 8);
  const popularIds = new Set(popular.map((item) => item.id));
  const rest = shuffle(contestants.filter((item) => !popularIds.has(item.id)), random);
  const seeded = new Array<Noodle>(32);
  const spreadSlots = shuffle([0, 4, 8, 12, 16, 20, 24, 28], random);

  popular.forEach((item, index) => {
    seeded[spreadSlots[index]] = item;
  });

  let restIndex = 0;
  for (let index = 0; index < seeded.length; index += 1) {
    if (!seeded[index]) {
      seeded[index] = rest[restIndex];
      restIndex += 1;
    }
  }

  let best = [...seeded];
  let bestScore = totalConflict(best);
  const maxAttempts = 500;

  for (let attempt = 0; attempt < maxAttempts && bestScore > 0; attempt += 1) {
    const candidate = [...best];
    const first = Math.floor(random() * candidate.length);
    let second = Math.floor(random() * candidate.length);
    if (first === second) second = (second + 1) % candidate.length;
    [candidate[first], candidate[second]] = [candidate[second], candidate[first]];
    const candidateScore = totalConflict(candidate);
    if (candidateScore <= bestScore) {
      best = candidate;
      bestScore = candidateScore;
    }
  }

  return best;
}
