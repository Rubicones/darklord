"use client";

import { Avatar, CrownIcon, HandCount, LookPips, SkullIcon } from "./bits";
import { useGame } from "./context";

export function Seats({ layout }: { layout: "row" | "column" }) {
  const { state, viewerId, openPlayer, online, mode } = useGame();
  const ordered = [
    ...state.players.filter((p) => p.id === state.lordId),
    ...state.players.filter((p) => p.id !== state.lordId),
  ];

  return (
    <div
      className={
        layout === "row"
          ? "no-scrollbar flex gap-2 overflow-x-auto px-3 py-2 [scroll-padding-inline:0.75rem]"
          : "flex flex-col gap-1.5"
      }
    >
      {ordered.map((p) => {
        const isLord = p.id === state.lordId;
        const speaking = p.id === state.speakerId;
        const viewing = p.id === viewerId;
        const isOnline = mode.kind === "room" && online?.has(p.id);
        return (
          <button
            key={p.id}
            onClick={() => openPlayer(p.id)}
            className={`focus-ring group relative flex shrink-0 items-center gap-2.5 rounded-2xl border px-2.5 py-2 text-left transition ${
              layout === "column" ? "w-full" : ""
            } ${
              viewing
                ? "border-gold/50 bg-gold/10"
                : speaking
                  ? "border-ember/40 bg-ember/10"
                  : "border-gold/10 bg-white/[0.03] hover:bg-white/[0.06]"
            } ${p.out ? "opacity-45 grayscale" : ""}`}
          >
            <span className="relative">
              <Avatar player={p} size={layout === "row" ? 34 : 38} ring={speaking} />
              {isLord && (
                <span className="absolute -right-1.5 -top-2 text-gold drop-shadow-[0_1px_2px_rgb(0_0_0/0.8)]">
                  <CrownIcon size={16} />
                </span>
              )}
              {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-coal bg-emerald-400" />
              )}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="max-w-[9rem] truncate text-sm font-bold leading-tight text-parch">{p.name}</span>
              <span className="mt-0.5 flex items-center gap-2 text-[11px] text-parch/55">
                {isLord ? (
                  <span className="font-semibold text-gold/80">Владыка</span>
                ) : p.out ? (
                  <span className="flex items-center gap-1 text-blood">
                    <SkullIcon size={12} /> вне игры
                  </span>
                ) : (
                  <>
                    <LookPips looks={p.looks} size={11} />
                    <HandCount n={p.hand.length} />
                  </>
                )}
              </span>
            </span>
            {speaking && layout === "column" && (
              <span className="ml-auto rounded-full bg-ember/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ember">
                говорит
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
