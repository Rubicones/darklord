"use client";

import { useEffect, useRef, useState } from "react";
import { BACK_ACTION, CARDS } from "@/lib/cards";
import { getPlayer, nameOf } from "@/lib/game/engine";
import type { LogEntry } from "@/lib/game/types";
import { Avatar, CardImg, CrownIcon, SkullIcon } from "./bits";
import { useGame } from "./context";

/* ---------------- Пощадите, Владыка! ---------------- */

export function MercyOverlay() {
  const { state, dispatch, canLord, canActFor, openCard } = useGame();
  const m = state.mercy;
  if (!m) return null;
  const p = getPlayer(state, m.playerId);
  if (!p) return null;
  const canDraw = canLord || canActFor(p.id);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_50%_40%,rgb(90_10_5/0.75),rgb(5_2_2/0.95))] p-5 backdrop-blur-sm animate-[fade-up_300ms_ease-out_both]">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#ff9b85]">Третий Испепеляющий Взор</p>
        <h2 className="font-display text-4xl leading-none text-[#ffd9c9] drop-shadow-[0_4px_20px_rgb(255_60_30/0.6)] sm:text-5xl">
          Пощадите, Владыка!
        </h2>
        <div className="flex items-center gap-2 text-lg">
          <Avatar player={p} size={34} /> <b>{p.name}</b>
        </div>

        <div className="relative my-1 w-44 sm:w-52">
          <div className="absolute inset-0 -z-10 scale-110 rounded-3xl bg-ember/25 blur-3xl" />
          {m.card ? (
            <button key={m.card} className="block w-full animate-flip cursor-zoom-in" onClick={() => openCard([m.card!])}>
              <CardImg id={m.card} className="card-shadow w-full" />
            </button>
          ) : (
            <CardImg id={BACK_ACTION} className="card-shadow w-full animate-float" alt="Карта судьбы" />
          )}
        </div>

        {!m.card ? (
          <>
            <p className="text-sm leading-relaxed text-parch/75">
              Моли о пощаде — по-настоящему! Если Владыка сочтёт мольбу достойной, тяни карту судьбы: нет черепа
              Ригора Мортиса — спасён.
            </p>
            <div className="flex w-full flex-col gap-2">
              {canDraw && (
                <button className="btn btn-gold w-full" onClick={() => dispatch({ t: "mercyDraw" })}>
                  Тянуть карту судьбы
                </button>
              )}
              {canLord && (
                <button className="btn btn-ghost w-full" onClick={() => dispatch({ t: "mercyResolve", grant: false })}>
                  Мольба жалка. Казнить!
                </button>
              )}
              {!canDraw && !canLord && <p className="text-sm text-parch/50">Владыка выслушивает мольбу…</p>}
            </div>
          </>
        ) : (
          <>
            <p
              className={`font-title text-2xl animate-pop ${
                m.result === "saved" ? "text-emerald-300" : "text-[#ff8b73]"
              }`}
            >
              {m.result === "saved" ? "Черепа нет. Владыка милостив!" : (
                <span className="inline-flex items-center gap-2">
                  <SkullIcon size={24} /> Череп Ригора Мортиса…
                </span>
              )}
            </p>
            <div className="flex w-full flex-col gap-2">
              {canLord || canDraw ? (
                <button className="btn btn-gold w-full" onClick={() => dispatch({ t: "mercyResolve" })}>
                  {m.result === "saved" ? "Продолжить игру" : "Принять судьбу"}
                </button>
              ) : null}
              {canLord && (
                <button
                  className="text-xs text-parch/45 hover:text-parch"
                  onClick={() => dispatch({ t: "mercyResolve", grant: m.result !== "saved" })}
                >
                  {m.result === "saved" ? "Владыка передумал — казнить всё равно" : "Помиловать вопреки судьбе"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Конец игры ---------------- */

export function EndScreen() {
  const { state, dispatch, canLord, controlAll } = useGame();
  if (state.phase !== "ended") return null;
  const loser = getPlayer(state, state.loserId);
  const can = canLord || controlAll;
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center overflow-y-auto bg-black/80 p-5 backdrop-blur-md animate-[fade-up_300ms_ease-out_both]">
      <div className="panel flex w-full max-w-md flex-col items-center gap-4 px-6 py-8 text-center">
        <CardImg id="look2" small className="card-shadow w-28 animate-float" />
        <h2 className="font-display text-4xl leading-tight gold-text">Виновный найден!</h2>
        {loser && (
          <div className="flex items-center gap-2 text-xl">
            <Avatar player={loser} size={36} /> <b>{loser.name}</b>
          </div>
        )}
        <p className="text-sm leading-relaxed text-parch/70">
          Ригор Мортис нашёл того, кто понесёт всю ответственность за провал миссии. Остальные слуги могут
          перевести дух… до следующего поручения.
        </p>
        {can ? (
          <div className="flex w-full flex-col gap-2">
            {loser && (
              <button className="btn btn-gold w-full" onClick={() => dispatch({ t: "newGame", lordId: loser.id })}>
                <CrownIcon /> Новая игра: {loser.name} — Владыка
              </button>
            )}
            <button className="btn btn-ghost w-full" onClick={() => dispatch({ t: "newGame", lordId: state.lordId ?? undefined })}>
              Новая игра с прежним Владыкой ({nameOf(state, state.lordId)})
            </button>
            <button className="btn w-full text-sm text-parch/50" onClick={() => dispatch({ t: "toLobby" })}>
              В лобби
            </button>
          </div>
        ) : (
          <p className="text-sm text-parch/50">Владыка решает, что дальше…</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- Эффекты: вспышка гнева + тост ---------------- */

export function Effects() {
  const { state } = useGame();
  const seen = useRef<string | null>(null);
  const seenAt = useRef(0);
  const [flash, setFlash] = useState(0);
  const [shake, setShake] = useState(0);
  const [toast, setToast] = useState<LogEntry | null>(null);

  const lastEntry = state.log[state.log.length - 1];

  useEffect(() => {
    if (!lastEntry) return;
    if (seen.current === null) {
      seen.current = lastEntry.id;
      seenAt.current = lastEntry.at;
      return;
    }
    if (seen.current === lastEntry.id) return;
    seen.current = lastEntry.id;
    if (lastEntry.at <= seenAt.current) return; // откат (undo) — без эффектов
    seenAt.current = lastEntry.at;
    setToast(lastEntry);
    if (lastEntry.tone === "wrath" || lastEntry.tone === "doom") {
      setFlash((f) => f + 1);
      setShake((s) => s + 1);
      try {
        navigator.vibrate?.([60, 40, 120]);
      } catch {}
    }
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [lastEntry]);

  useEffect(() => {
    if (!shake) return;
    const el = document.getElementById("game-root");
    if (!el) return;
    el.classList.remove("animate-shake");
    void el.offsetWidth;
    el.classList.add("animate-shake");
  }, [shake]);

  return (
    <>
      {flash > 0 && <div key={flash} className="wrath-flash" />}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] flex justify-center px-4">
          <div
            key={toast.id}
            className={`max-w-md rounded-full border px-4 py-2 text-center text-sm font-semibold shadow-2xl backdrop-blur-md animate-pop ${
              toast.tone === "wrath" || toast.tone === "doom"
                ? "border-blood/50 bg-[#3a0d08]/90 text-[#ffd0c4]"
                : toast.tone === "mercy"
                  ? "border-emerald-400/40 bg-[#0d2a1f]/90 text-emerald-100"
                  : "border-gold/25 bg-[#22120c]/90 text-parch"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Таймер медлительности ---------------- */

export function TimerBadge() {
  const { state, dispatch, canLord } = useGame();
  const [now, setNow] = useState<number | null>(null);
  const ends = state.timerEndsAt;

  useEffect(() => {
    if (!ends) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [ends]);

  const left = ends && now ? Math.max(0, ends - now) : null;
  const over = left === 0;

  useEffect(() => {
    if (over) {
      try {
        navigator.vibrate?.(300);
      } catch {}
    }
  }, [over]);

  if (!ends || left === null) return null;
  const secs = Math.ceil(left / 1000);
  return (
    <button
      onClick={() => canLord && dispatch({ t: "timer", seconds: null })}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold tabular-nums ${
        over ? "animate-pulse border-blood bg-blood/40 text-white" : "border-gold/30 bg-black/40 text-gold-2"
      }`}
      title={canLord ? "Остановить таймер" : undefined}
    >
      ⏳ {over ? "Время!" : `${secs}с`}
    </button>
  );
}

/* ---------------- Летопись ---------------- */

export function LogList() {
  const { state } = useGame();
  const items = [...state.log].reverse();
  if (!items.length) return <p className="py-6 text-center text-sm text-parch/45">Пока ничего не произошло</p>;
  return (
    <ol className="flex flex-col gap-1.5 pb-2">
      {items.map((e) => {
        const who = getPlayer(state, e.who);
        return (
          <li
            key={e.id}
            className={`flex items-start gap-2.5 rounded-xl px-3 py-2 text-sm ${
              e.tone === "wrath" || e.tone === "doom"
                ? "bg-blood/15 text-[#ffd0c4]"
                : e.tone === "mercy"
                  ? "bg-emerald-500/10 text-emerald-100"
                  : e.tone === "pass"
                    ? "bg-gold/[0.07]"
                    : e.tone === "stop"
                      ? "bg-ember/10"
                      : "bg-white/[0.03] text-parch/80"
            }`}
          >
            {who ? <Avatar player={who} size={20} /> : <span className="w-5" />}
            <span className="flex-1 leading-snug">{e.text}</span>
          </li>
        );
      })}
    </ol>
  );
}

export const cardTitle = (id: string) => CARDS[id]?.title ?? id;
