"use client";

import { useState } from "react";
import { MAX_PLAYERS, uid } from "@/lib/game/engine";
import { Avatar, CrownIcon } from "./bits";
import type { Action, GameState } from "@/lib/game/types";

export function Lobby({
  state,
  dispatch,
  roomCode,
  mySeat,
  onBack,
}: {
  state: GameState;
  dispatch: (a: Action) => void;
  roomCode?: string;
  mySeat?: string | null;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [copied, setCopied] = useState(false);

  const add = () => {
    if (!name.trim()) return;
    dispatch({ t: "addPlayer", name, id: uid() });
    setName("");
  };

  const share = async () => {
    const url = `${location.origin}/r/${roomCode}`;
    try {
      if (navigator.share) await navigator.share({ title: "Да, Тёмный Властелин!", text: `Комната ${roomCode}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {}
  };

  const canStart = state.players.length >= 2;

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-5 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <button className="btn btn-ghost btn-icon" onClick={onBack} aria-label="На главную">
          ←
        </button>
        <h1 className="font-display text-2xl gold-text">Сбор слуг</h1>
      </header>

      {roomCode && (
        <section className="panel flex items-center gap-4 p-4">
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-parch/50">Код комнаты</div>
            <div className="font-title text-4xl tracking-[0.2em] text-gold-2">{roomCode}</div>
          </div>
          <button className="btn btn-gold" onClick={share}>
            {copied ? "Скопировано" : "Позвать"}
          </button>
        </section>
      )}

      <section className="panel flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-title text-lg text-gold-2">Игроки</h2>
          <span className="text-xs text-parch/45">
            {state.players.length}/{MAX_PLAYERS} · корона — Тёмный Властелин
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {state.players.map((p) => {
            const lord = p.id === state.lordId;
            return (
              <li
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2 animate-fade-up ${
                  lord ? "border-gold/40 bg-gold/10" : "border-gold/10 bg-white/[0.03]"
                }`}
              >
                <Avatar player={p} size={36} />
                {editing === p.id ? (
                  <input
                    autoFocus
                    className="input min-h-10 flex-1"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => {
                      dispatch({ t: "renamePlayer", id: p.id, name: editName });
                      setEditing(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  />
                ) : (
                  <button
                    className="min-w-0 flex-1 truncate text-left font-semibold"
                    onClick={() => {
                      setEditing(p.id);
                      setEditName(p.name);
                    }}
                    title="Переименовать"
                  >
                    {p.name}
                    {mySeat === p.id && <span className="ml-2 text-xs font-normal text-parch/45">это вы</span>}
                  </button>
                )}
                <button
                  className={`btn btn-icon ${lord ? "btn-gold" : "btn-ghost text-parch/40"}`}
                  onClick={() => dispatch({ t: "setLord", id: p.id })}
                  aria-label={`Сделать ${p.name} Тёмным Властелином`}
                  aria-pressed={lord}
                >
                  <CrownIcon size={18} />
                </button>
                <button
                  className="btn btn-ghost btn-icon text-parch/40 hover:text-blood"
                  onClick={() => dispatch({ t: "removePlayer", id: p.id })}
                  aria-label={`Убрать ${p.name}`}
                >
                  ✕
                </button>
              </li>
            );
          })}
          {state.players.length === 0 && (
            <li className="py-3 text-center text-sm text-parch/45">Пока никого. Добавьте игроков ниже.</li>
          )}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input
            className="input"
            placeholder={roomCode ? "Добавить игрока без телефона" : "Имя игрока"}
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-ghost shrink-0" disabled={!name.trim() || state.players.length >= MAX_PLAYERS}>
            Добавить
          </button>
        </form>
      </section>

      <section className="panel flex flex-col gap-3 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 accent-[#e8c27a]"
            checked={state.settings.guaranteePass}
            onChange={(e) => dispatch({ t: "setSetting", key: "guaranteePass", value: e.target.checked })}
          />
          <span>
            <span className="font-semibold">Правило первого круга</span>
            <span className="block text-sm text-parch/55">
              У каждого слуги на старте гарантированно есть «Перевод стрелок».
            </span>
          </span>
        </label>
      </section>

      <div className="mt-auto flex flex-col gap-2">
        {!state.lordId && state.players.length > 0 && (
          <p className="text-center text-xs text-parch/50">Владыка не выбран — трон займёт случайный игрок.</p>
        )}
        <button className="btn btn-gold min-h-14 w-full text-lg" disabled={!canStart} onClick={() => dispatch({ t: "start" })}>
          {canStart ? "Начать игру" : "Нужно минимум 2 игрока"}
        </button>
      </div>
    </main>
  );
}
