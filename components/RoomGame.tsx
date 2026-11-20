"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MAX_PLAYERS, uid } from "@/lib/game/engine";
import type { Action, GameState } from "@/lib/game/types";
import { useRoomGame } from "@/lib/store/useRoomGame";
import { Avatar, CrownIcon } from "./game/bits";
import { GameView } from "./game/GameView";
import { Lobby } from "./game/Lobby";
import { Loader } from "./Loader";

const seatKey = (code: string) => `darklord:seat:${code}`;

export function RoomGame({ code }: { code: string }) {
  const router = useRouter();
  const [seat, setSeatState] = useState<string | null>(null);
  const [seatLoaded, setSeatLoaded] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const { state, dispatch, status, error, live, online } = useRoomGame(code, seat);

  useEffect(() => {
    try {
      setSeatState(localStorage.getItem(seatKey(code)));
    } catch {}
    setSeatLoaded(true);
  }, [code]);

  const setSeat = useCallback(
    (s: string | null) => {
      setSeatState(s);
      setChoosing(false);
      try {
        if (s) localStorage.setItem(seatKey(code), s);
        else localStorage.removeItem(seatKey(code));
      } catch {}
    },
    [code],
  );

  const exit = () => router.push("/");

  if (status === "missing-config")
    return <Message title="Supabase не настроен" text="Добавьте ключи в .env.local — инструкция в README." onBack={exit} />;
  if (status === "notfound")
    return <Message title={`Комнаты ${code} нет`} text="Проверьте код или создайте новую комнату." onBack={exit} />;
  if (status === "error" && !state) return <Message title="Не удалось подключиться" text={error ?? ""} onBack={exit} />;
  if (!state || !seatLoaded) return <Loader text="Входим в логово…" />;

  const seatValid = seat === "table" || (!!seat && state.players.some((p) => p.id === seat));

  if (!seatValid || choosing) {
    return <JoinScreen code={code} state={state} dispatch={dispatch} online={online} onSeat={setSeat} onBack={exit} current={seat} />;
  }

  if (state.phase === "lobby") {
    return <Lobby state={state} dispatch={dispatch} roomCode={code} mySeat={seat} onBack={exit} />;
  }

  return (
    <GameView
      state={state}
      dispatch={dispatch}
      mode={{ kind: "room", code }}
      seat={seat}
      online={online}
      live={live}
      onExit={exit}
      onChangeSeat={() => setChoosing(true)}
    />
  );
}

function Message({ title, text, onBack }: { title: string; text: string; onBack: () => void }) {
  return (
    <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl gold-text">{title}</h1>
      <p className="max-w-sm text-parch/60">{text}</p>
      <button className="btn btn-gold" onClick={onBack}>
        На главную
      </button>
    </main>
  );
}

function JoinScreen({
  code,
  state,
  dispatch,
  online,
  onSeat,
  onBack,
  current,
}: {
  code: string;
  state: GameState;
  dispatch: (a: Action) => void;
  online?: Set<string>;
  onSeat: (s: string) => void;
  onBack: () => void;
  current: string | null;
}) {
  const [name, setName] = useState("");
  const join = () => {
    if (!name.trim()) return;
    const id = uid();
    dispatch({ t: "addPlayer", name, id });
    onSeat(id);
  };
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <button className="btn btn-ghost btn-icon" onClick={onBack} aria-label="На главную">
          ←
        </button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-parch/50">Комната</div>
          <div className="font-title text-2xl tracking-[0.2em] text-gold-2">{code}</div>
        </div>
      </header>

      <h1 className="font-display text-3xl leading-tight gold-text">Кто вы, жалкий слуга?</h1>

      <form
        className="panel flex flex-col gap-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          join();
        }}
      >
        <label className="text-sm font-semibold text-parch/70" htmlFor="join-name">
          Новый игрок
        </label>
        <div className="flex gap-2">
          <input
            id="join-name"
            className="input"
            placeholder="Ваше имя"
            value={name}
            maxLength={24}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-gold shrink-0" disabled={!name.trim() || state.players.length >= MAX_PLAYERS}>
            Войти
          </button>
        </div>
      </form>

      {state.players.length > 0 && (
        <section className="panel flex flex-col gap-2 p-4">
          <h2 className="text-sm font-semibold text-parch/70">…или я уже в игре</h2>
          {state.players.map((p) => (
            <button
              key={p.id}
              className={`btn justify-start pl-2 ${current === p.id ? "btn-gold" : "btn-ghost"}`}
              onClick={() => onSeat(p.id)}
            >
              <Avatar player={p} size={32} />
              <span className="truncate">{p.name}</span>
              {p.id === state.lordId && <CrownIcon size={16} className="text-gold" />}
              {online?.has(p.id) && <span className="ml-auto text-xs font-normal text-emerald-300">онлайн</span>}
            </button>
          ))}
        </section>
      )}

      <button className="btn btn-ghost w-full" onClick={() => onSeat("table")}>
        🖥 Общий экран стола (управляет всеми)
      </button>
      <p className="-mt-2 text-center text-xs text-parch/45">
        Например, ноутбук или планшет в центре стола — на нём видно всё и можно ходить за любого.
      </p>
    </main>
  );
}
