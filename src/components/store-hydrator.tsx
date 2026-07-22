"use client";

import { useEffect } from "react";
import { useTournamentStore } from "@/store/tournament-store";

export function StoreHydrator() {
  const hydrate = useTournamentStore((state) => state.hydrate);
  useEffect(() => hydrate(), [hydrate]);
  return null;
}
