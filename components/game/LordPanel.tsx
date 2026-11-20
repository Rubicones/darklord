"use client";

import { useEffect, useState } from "react";
import { activeServants, MAX_LOOKS, WRATH_REASONS } from "@/lib/game/engine";
import type { Player } from "@/lib/game/types";
import { Avatar, HandCount, LookPips } from "./bits";
import { useGame } from "./context";

export function WrathReasons({ player, onDone }: { player: Player; onDone?: () => void }) {
  const { dispatch } = useGame();
  return (
    <div className="flex flex-wrap gap-1.5">
      {WRATH_REASONS.map((r) => (
        <button
          key={r}
          className="rounded-full border border-blood/40 bg-blood/15 px-3 py-1.5 text-xs font-semibold text-[#ffcbbf] transition hover:bg-blood/30 active:scale-95"
          onClick={() => {
            dispatch({ t: "look", to: player.id, reason: r === "Просто так" ? undefined : r });
            onDone?.();
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function ServantRow({ p }: { p: Player }) {
  const { state, dispatch } = useGame();
  const [wrath, setWrath] = useState(false);
  const speaking = state.speakerId === p.id;
  return (
    <li className={`rounded-2xl border px-3 py-2.5 ${speaking ? "border-ember/40 bg-ember/[0.07]" : "border-gold/10 bg-white/[0.03]"}`}>
      <div className="flex items-center gap-2.5">
        <Avatar player={p} size={32} ring={speaking} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{p.name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-parch/50">
            <LookPips looks={p.looks} size={12} /> <HandCount n={p.hand.length} />
            {speaking && <span className="font-bold uppercase tracking-wider text-ember">говорит</span>}
          </div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          className="btn btn-ghost min-h-9 px-3 text-xs"
          disabled={speaking}
          onClick={() => dispatch({ t: "interrogate", id: p.id })}
        >
          Допросить
        </button>
        <button
          className={`btn min-h-9 px-3 text-xs ${wrath ? "btn-ghost" : "btn-blood"}`}
          disabled={(p.looks >= MAX_LOOKS && !wrath) || !!state.mercy}
          onClick={() => setWrath((w) => !w)}
          aria-expanded={wrath}
        >
          {wrath ? "Отмена" : "Испепелить"}
        </button>
      </div>
      {wrath && (
        <div className="mt-2.5 flex flex-col gap-2 animate-fade-up">
          <span className="text-[11px] uppercase tracking-wider text-parch/45">За что?</span>
          <WrathReasons player={p} onDone={() => setWrath(false)} />
          {p.looks > 0 && (
            <button
              className="self-start text-xs text-parch/50 underline-offset-2 hover:underline"
              onClick={() => {
                dispatch({ t: "unlook", to: p.id });
                setWrath(false);
              }}
            >
              …или снять один Взор
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export function LordPanel() {
  const { state, dispatch } = useGame();
  const [q, setQ] = useState(state.question);
  const list = activeServants(state);
  useEffect(() => {
    setQ(state.question);
  }, [state.question]);

  const commitQ = () => {
    if (q !== state.question) dispatch({ t: "setQuestion", text: q });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gold/70">Вопрос Владыки</span>
        <div className="flex gap-2">
          <input
            className="input font-title"
            placeholder="«Где мой Бородавочный Эликсир?!»"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={commitQ}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur(), commitQ())}
          />
        </div>
      </label>

      <ul className="flex flex-col gap-2">
        {list.map((p) => (
          <ServantRow key={p.id} p={p} />
        ))}
      </ul>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-parch/45">Таймер медлительности</span>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 15].map((s) => (
            <button key={s} className="btn btn-ghost min-h-9 px-2 text-xs" onClick={() => dispatch({ t: "timer", seconds: s })}>
              {s} с
            </button>
          ))}
          <button
            className="btn btn-ghost min-h-9 px-2 text-xs"
            disabled={!state.timerEndsAt}
            onClick={() => dispatch({ t: "timer", seconds: null })}
          >
            Стоп
          </button>
        </div>
      </div>
      <button
        className="btn btn-ghost w-full"
        disabled={!state.story.length && !state.speakerId && !state.question}
        onClick={() => {
          setQ("");
          dispatch({ t: "newStory" });
        }}
      >
        Новая история — очистить стол
      </button>
    </div>
  );
}
