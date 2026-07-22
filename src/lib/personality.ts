import { getNoodle } from "@/lib/noodles";
import type { Tournament } from "@/types/tournament";

export interface Personality {
  name: string;
  description: string;
}

const PERSONALITIES: Record<string, Personality> = {
  nostalgic: { name: "经典怀旧派", description: "老味道是你的安全感，一口就能回到记忆里的小卖部。" },
  soup: { name: "浓汤主义者", description: "你相信一碗面的灵魂都在汤里，醇厚才是真满足。" },
  spicy: { name: "重口挑战者", description: "麻、辣、酸、香缺一不可，你追求的是味蕾的高光时刻。" },
  dry: { name: "干拌面信徒", description: "比起慢慢喝汤，你更偏爱酱汁紧紧裹住每一根面。" },
  seafood: { name: "海鲜汤底派", description: "鲜味是你的第一标准，虾蟹鱼贝都能让你心动。" },
  explorer: { name: "随机探索家", description: "你的选择横跨各种流派，好吃比门派更重要。" },
};

export function getPersonality(tournament: Tournament): Personality {
  const selected = tournament.selectedWinnerIds
    .map((id) => getNoodle(id))
    .filter((item) => item !== undefined);
  const scores = { nostalgic: 0, soup: 0, spicy: 0, dry: 0, seafood: 0 };

  selected.forEach((noodle) => {
    if (noodle.category === "nostalgic") scores.nostalgic += 2;
    if (["soup", "bag", "cup"].includes(noodle.type)) scores.soup += 1;
    if (["spicy", "sour-spicy"].includes(noodle.category)) scores.spicy += 2;
    if (["dry", "snack"].includes(noodle.type)) scores.dry += 2;
    if (noodle.category === "seafood") scores.seafood += 2;
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked[0] || ranked[0][1] < 4 || ranked[0][1] === ranked[1]?.[1]) {
    return PERSONALITIES.explorer;
  }
  return PERSONALITIES[ranked[0][0]];
}
