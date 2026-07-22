"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import type { Noodle } from "@/types/tournament";

interface NoodleCardProps {
  noodle: Noodle;
  onChoose?: () => void;
  selected?: boolean;
  defeated?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export function NoodleCard({ noodle, onChoose, selected, defeated, disabled, compact }: NoodleCardProps) {
  const Component = onChoose ? motion.button : motion.div;
  return (
    <Component
      className={`noodle-card${selected ? " is-selected" : ""}${defeated ? " is-defeated" : ""}${compact ? " is-compact" : ""}`}
      onClick={onChoose}
      disabled={onChoose ? disabled : undefined}
      type={onChoose ? "button" : undefined}
      whileHover={!disabled && onChoose ? { y: -6, scale: 1.01 } : undefined}
      whileTap={!disabled && onChoose ? { scale: 0.98 } : undefined}
      aria-label={onChoose ? `选择${noodle.brand}${noodle.name}` : undefined}
    >
      {selected && <span className="advance-badge"><Check size={13} /> 晋级</span>}
      <div className="package-art">
        <Image src={noodle.image} alt={`${noodle.brand}${noodle.name}包装图`} fill sizes={compact ? "140px" : "(max-width: 720px) 43vw, 340px"} />
      </div>
      <div className="noodle-card-copy">
        <span className="brand-name">{noodle.brand}</span>
        <h3>{noodle.name}</h3>
        <div className="tag-list">{noodle.flavorTags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
    </Component>
  );
}
