"use client";

import { useState } from "react";
import { getPlayer, MAX_LOOKS } from "@/lib/game/engine";
import { Sheet } from "../ui/Sheet";
import { Avatar, CrownIcon, LookPips } from "./bits";
import { useGame } from "./context";
import { WrathReasons } from "./LordPanel";

export function PlayerSheet({
  pid,
  onClose,
  onOpenLord,
}: {
  pid: string | null;
  onClose: () => void;
  onOpenLord: () => void;
}) {
  const { state } = useGame();
  const p = getPlayer(state, pid);
  return (
    <Sheet
      open={!!p}
      onClose={onClose}
      title={
        p ? (
          <span className="flex items-center gap-3">
            <Avatar player={p} size={36} ring={state.speakerId === p.id} />
            {p.name}
          </span>
        ) : undefined
      }
    >
      {p && <PlayerActions key={p.id} pid={p.id} onClose={onClose} onOpenLord={onOpenLord} />}
    </Sheet>
  );
}

function PlayerActions({ pid, onClose, onOpenLord }: { pid: string; onClose: () => void; onOpenLord: () => void }) {
  const { state, dispatch, controlAll, canLord, canActFor, setViewer, viewerId } = useGame();
  const [wrath, setWrath] = useState(false);
  const p = getPlayer(state, pid)!;
  const isLord = p.id === state.lordId;
  const playing = state.phase === "playing";
  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center gap-3 text-sm text-parch/70">
        {isLord ? (
          <span className="flex items-center gap-1.5 font-semibold text-gold">
            <CrownIcon /> Тёмный Властелин
          </span>
        ) : (
          <>
            <LookPips looks={p.looks} size={16} />
            <span>
              Взоров {p.looks}/{MAX_LOOKS} · карт на руке {p.hand.length}
            </span>
            {p.out && <span className="text-blood">вне игры</span>}
          </>
        )}
      </div>

      {controlAll && (
        <div className="grid gap-2">
          {isLord ? (
            <button className="btn btn-gold w-full" onClick={act(onOpenLord)}>
              <CrownIcon /> Панель Владыки
            </button>
          ) : (
            <button
              className="btn btn-gold w-full"
              disabled={viewerId === p.id}
              onClick={act(() => setViewer(p.id))}
            >
              {viewerId === p.id ? "Рука уже открыта" : "Открыть руку"}
            </button>
          )}
        </div>
      )}

      {canLord && playing && !isLord && !p.out && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gold/70">Воля Владыки</span>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={act(() => dispatch({ t: "interrogate", id: p.id }))}>
              Допросить
            </button>
            <button
              className="btn btn-ghost"
              disabled={state.speakerId === p.id}
              onClick={act(() => dispatch({ t: "setSpeaker", id: p.id }))}
            >
              Дать слово
            </button>
            <button
              className="btn btn-blood"
              disabled={p.looks >= MAX_LOOKS || !!state.mercy}
              onClick={() => setWrath((w) => !w)}
            >
              Испепелить взором
            </button>
            <button
              className="btn btn-ghost"
              disabled={p.looks === 0}
              onClick={act(() => dispatch({ t: "unlook", to: p.id }))}
            >
              Снять Взор
            </button>
          </div>
          {wrath && (
            <div className="animate-fade-up">
              <WrathReasons player={p} onDone={onClose} />
            </div>
          )}
        </div>
      )}

      {playing && !isLord && !p.out && (canActFor(p.id) || canLord) && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-parch/45">Свобода действий</span>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost text-sm" onClick={() => dispatch({ t: "draw", by: p.id, kind: "hint" })}>
              + намёк
            </button>
            <button className="btn btn-ghost text-sm" onClick={() => dispatch({ t: "draw", by: p.id, kind: "action" })}>
              + действие
            </button>
          </div>
        </div>
      )}

      {(controlAll || canLord) && !isLord && playing && (
        <button
          className="btn w-full text-sm text-parch/50 hover:text-gold"
          onClick={act(() => dispatch({ t: "setLord", id: p.id }))}
        >
          <CrownIcon size={14} /> Захватить власть: сделать Владыкой
        </button>
      )}
    </div>
  );
}
