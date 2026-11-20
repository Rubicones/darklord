"use client";

import type { CSSProperties } from "react";
import { CARDS, cardSrc } from "@/lib/cards";
import { MAX_LOOKS } from "@/lib/game/engine";
import type { Player } from "@/lib/game/types";

export function CardImg({
  id,
  small = false,
  className = "",
  alt,
  style,
}: {
  id: string;
  small?: boolean;
  className?: string;
  alt?: string;
  style?: CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cardSrc(id, small)}
      alt={alt ?? CARDS[id]?.title ?? "Карта"}
      draggable={false}
      style={style}
      loading="lazy"
      decoding="async"
      className={`aspect-[476/661] select-none rounded-[4.5%] ${className}`}
    />
  );
}

export function Avatar({
  player,
  size = 40,
  ring = false,
}: {
  player: Pick<Player, "name" | "color">;
  size?: number;
  ring?: boolean;
}) {
  const initials = player.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-title font-bold text-[#1b0c07] ${
        ring ? "animate-ember" : ""
      }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${player.color} 60%, white), ${player.color} 60%, color-mix(in oklab, ${player.color} 70%, black))`,
        boxShadow: ring ? undefined : "inset 0 -2px 0 rgb(0 0 0 / 0.25), 0 2px 6px rgb(0 0 0 / 0.4)",
      }}
    >
      {initials}
    </span>
  );
}

/** Три «глаза» Испепеляющего Взора */
export function LookPips({ looks, size = 12 }: { looks: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`Взоров: ${looks} из ${MAX_LOOKS}`}>
      {Array.from({ length: MAX_LOOKS }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
          <path
            d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"
            fill={i < looks ? "#e0412c" : "transparent"}
            stroke={i < looks ? "#ff8a5c" : "rgb(243 228 195 / 0.35)"}
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="3.2" fill={i < looks ? "#ffe2a8" : "rgb(243 228 195 / 0.3)"} />
        </svg>
      ))}
    </span>
  );
}

export function CrownIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7zm3 14h12v1.5H6V21z" />
    </svg>
  );
}

export function HandStopIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13V5.5a1.5 1.5 0 013 0V11m0-6.5V4a1.5 1.5 0 013 0v7m0-5.5a1.5 1.5 0 013 0V12m0-3.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-1.5a6 6 0 01-4.6-2.2L4.5 15.6a1.6 1.6 0 012.4-2.1L8 14.5" />
    </svg>
  );
}

export function PointIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10.5H11.5m0 0V9a1.5 1.5 0 00-3 0v1.5M11.5 10.5V14m-3-3.5V8.5a1.5 1.5 0 00-3 0V15a5 5 0 005 5h1.5a4 4 0 004-4v-1a1.5 1.5 0 00-3 0" />
      <path d="M21 10.5a1.5 1.5 0 010 3h-5.5" />
    </svg>
  );
}

export function SkullIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C6.9 2 3 5.7 3 10.5c0 2.8 1.3 5 3.5 6.4V20a1 1 0 001 1h1.5v-2h1.5v2h3v-2H15v2h1.5a1 1 0 001-1v-3.1c2.2-1.4 3.5-3.6 3.5-6.4C21 5.7 17.1 2 12 2zm-3.5 12a2.3 2.3 0 110-4.6 2.3 2.3 0 010 4.6zm7 0a2.3 2.3 0 110-4.6 2.3 2.3 0 010 4.6zM12 15.2l-1.2 2h2.4l-1.2-2z" />
    </svg>
  );
}

export function EyeOffIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7c1.9 0 3.5-.5 4.9-1.3M9.9 9.9a3 3 0 004.2 4.2" />
    </svg>
  );
}

export function CardsIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <rect x="7" y="3" width="13" height="17" rx="2" />
      <path d="M4 7v12a2 2 0 002 2h9" />
    </svg>
  );
}

export function UndoIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 010 11H11" />
    </svg>
  );
}

export function HandCount({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 tabular-nums" title={`Карт на руке: ${n}`}>
      <CardsIcon size={11} /> {n}
    </span>
  );
}
