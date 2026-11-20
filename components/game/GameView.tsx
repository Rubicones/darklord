"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { canUndo, getPlayer, servants } from "@/lib/game/engine";
import type { Action, GameState } from "@/lib/game/types";
import { Sheet } from "../ui/Sheet";
import { Avatar, CrownIcon, UndoIcon } from "./bits";
import { CardCatalog, CardViewer } from "./cardview";
import { GameCtx, useGame, type Ctx, type GameMode, type PlayRequest } from "./context";
import { Hand } from "./Hand";
import { LordPanel } from "./LordPanel";
import { EndScreen, Effects, LogList, MercyOverlay, TimerBadge } from "./Overlays";
import { PlayerSheet } from "./PlayerSheet";
import { PlaySheet } from "./PlaySheet";
import { Rules } from "./Rules";
import { Seats } from "./Seats";
import { Stage } from "./Stage";

type Props = {
  state: GameState;
  dispatch: (a: Action) => void;
  mode: GameMode;
  seat: string | null;
  online?: Set<string>;
  live?: boolean;
  onExit: () => void;
  onChangeSeat?: () => void;
};

export function GameView({ state, dispatch, mode, seat, online, live, onExit, onChangeSeat }: Props) {
  const controlAll = mode.kind === "local" || seat === "table";
  const [viewerPick, setViewerPick] = useState<string | null>(null);
  const [follow, setFollow] = useState(true);

  // В режиме «общего стола» рука следует за рассказчиком
  const [lastSpeaker, setLastSpeaker] = useState(state.speakerId);
  if (lastSpeaker !== state.speakerId) {
    setLastSpeaker(state.speakerId);
    if (controlAll && follow && state.speakerId) setViewerPick(state.speakerId);
  }

  const viewerId = useMemo(() => {
    if (!controlAll) return seat;
    if (viewerPick && getPlayer(state, viewerPick)) return viewerPick;
    return state.speakerId ?? servants(state).find((p) => !p.out)?.id ?? null;
  }, [controlAll, seat, viewerPick, state]);

  const canLord = controlAll || (!!seat && seat === state.lordId);
  const canActFor = useCallback((pid: string) => controlAll || seat === pid, [controlAll, seat]);

  const [playReq, setPlayReq] = useState<PlayRequest | null>(null);
  const [playerSheet, setPlayerSheet] = useState<string | null>(null);
  const [panel, setPanel] = useState<null | "lord" | "log" | "rules" | "menu" | "cards">(null);
  const [viewer, setViewerCards] = useState<{ ids: string[]; index: number } | null>(null);

  // «Передай телефон»: на общем экране чужие руки скрыты, пока игрок не подтвердит, что это он
  const [privacy, setPrivacyState] = useState(true);
  const [revealedFor, setRevealedFor] = useState<string | null>(null);
  const [passTo, setPassTo] = useState<{ pid: string; then?: () => void } | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem("darklord:privacy");
      if (v !== null) setPrivacyState(v === "1");
    } catch {}
  }, []);
  const setPrivacy = (v: boolean) => {
    setPrivacyState(v);
    try {
      localStorage.setItem("darklord:privacy", v ? "1" : "0");
    } catch {}
  };
  const guard = controlAll && privacy;
  const isHidden = useCallback(
    (pid: string) => guard && pid !== state.lordId && pid !== revealedFor,
    [guard, revealedFor, state.lordId],
  );
  const requestReveal = useCallback(
    (pid: string, then?: () => void) => {
      setViewerPick(pid);
      setPassTo({ pid, then });
    },
    [],
  );
  const openPlay = useCallback(
    (req: PlayRequest) => {
      if (req.actor !== "__choose_stop__" && isHidden(req.actor)) {
        requestReveal(req.actor, () => setPlayReq(req));
      } else setPlayReq(req);
    },
    [isHidden, requestReveal],
  );

  const ctx: Ctx = {
    state,
    dispatch,
    mode,
    controlAll,
    seat,
    viewerId,
    setViewer: setViewerPick,
    canLord,
    canActFor,
    online,
    openPlay,
    openPlayer: setPlayerSheet,
    openCard: (ids, index = 0) => setViewerCards({ ids, index }),
    privacy: guard,
    isHidden,
    requestReveal,
    hideHand: () => setRevealedFor(null),
  };

  const viewerIsLord = !!viewerId && viewerId === state.lordId;

  // Esc-safe: закрыть карточные листы, если игрок исчез
  useEffect(() => {
    if (playerSheet && !getPlayer(state, playerSheet)) setPlayerSheet(null);
  }, [state, playerSheet]);

  return (
    <GameCtx.Provider value={ctx}>
      <div id="game-root" className="relative z-10 flex h-dvh flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* header */}
          <header className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-[max(0.6rem,env(safe-area-inset-top))]">
            <button className="btn btn-ghost btn-icon" onClick={() => setPanel("menu")} aria-label="Меню">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="flex min-w-0 flex-col leading-none">
              <span className="truncate font-display text-[1.05rem] gold-text sm:text-xl">Да, Тёмный Властелин!</span>
              {mode.kind === "room" && (
                <span className="mt-1 flex items-center gap-1.5 text-[11px] text-parch/50">
                  <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-400" : "bg-amber-500 animate-pulse"}`} />
                  комната <b className="tracking-widest text-parch/80">{mode.code}</b>
                  {seat === "table" && <span>· общий стол</span>}
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <TimerBadge />
              <button
                className="btn btn-ghost btn-icon"
                disabled={!canUndo(state)}
                onClick={() => dispatch({ t: "undo" })}
                aria-label="Отменить последнее действие"
                title="Отменить"
              >
                <UndoIcon />
              </button>
              {canLord && !viewerIsLord && (
                <button className="btn btn-gold btn-icon" onClick={() => setPanel("lord")} aria-label="Панель Владыки">
                  <CrownIcon size={18} />
                </button>
              )}
            </div>
          </header>

          {/* seats (mobile/tablet) */}
          <div className="shrink-0 lg:hidden">
            <Seats layout="row" />
          </div>

          <Stage />

          {/* bottom: hand or lord panel */}
          <div className="shrink-0 border-t border-gold/10 bg-gradient-to-t from-black/50 to-transparent pt-2">
            {viewerIsLord ? (
              <div className="max-h-[46dvh] overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
                <div className="mb-2 flex items-center gap-2 text-gold">
                  <CrownIcon /> <span className="font-title text-lg">Вы — Тёмный Властелин</span>
                </div>
                <LordPanel />
              </div>
            ) : (
              <Hand />
            )}
          </div>
        </div>

        {/* desktop sidebar */}
        <aside className="hidden w-[22rem] shrink-0 flex-col gap-4 overflow-y-auto border-l border-gold/10 bg-black/20 p-4 lg:flex">
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-parch/45">За столом</h3>
            <Seats layout="column" />
          </div>
          {canLord && !viewerIsLord && (
            <div className="panel p-4">
              <h3 className="mb-3 flex items-center gap-2 font-title text-lg text-gold-2">
                <CrownIcon /> Воля Владыки
              </h3>
              <LordPanel />
            </div>
          )}
          <div className="min-h-0">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-parch/45">Летопись</h3>
            <LogList />
          </div>
        </aside>
      </div>

      <PlaySheet req={playReq} onClose={() => setPlayReq(null)} />
      <PlayerSheet pid={playerSheet} onClose={() => setPlayerSheet(null)} onOpenLord={() => setPanel("lord")} />

      <Sheet open={panel === "lord"} onClose={() => setPanel(null)} title="Воля Владыки">
        <LordPanel />
      </Sheet>
      <Sheet open={panel === "log"} onClose={() => setPanel(null)} title="Летопись">
        <LogList />
      </Sheet>
      <Sheet open={panel === "cards"} onClose={() => setPanel(null)} title="Все карты" size="lg">
        <CardCatalog />
      </Sheet>
      <Sheet open={panel === "rules"} onClose={() => setPanel(null)} title="Правила" size="lg">
        <Rules />
      </Sheet>
      <Sheet open={panel === "menu"} onClose={() => setPanel(null)} title="Меню">
        <div className="flex flex-col gap-2 pb-2">
          <button className="btn btn-ghost justify-start" onClick={() => setPanel("log")}>
            📜 Летопись
          </button>
          <button className="btn btn-ghost justify-start" onClick={() => setPanel("rules")}>
            📖 Правила
          </button>
          <button className="btn btn-ghost justify-start" onClick={() => setPanel("cards")}>
            🃏 Все карты
          </button>
          {controlAll && (
            <>
              <label className="btn btn-ghost cursor-pointer justify-start text-left">
                <input type="checkbox" className="h-4 w-4 shrink-0 accent-[#e8c27a]" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
                Прятать карты при передаче телефона
              </label>
              <label className="btn btn-ghost cursor-pointer justify-start text-left">
                <input type="checkbox" className="h-4 w-4 shrink-0 accent-[#e8c27a]" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
                Рука следует за рассказчиком
              </label>
            </>
          )}
          {onChangeSeat && (
            <button
              className="btn btn-ghost justify-start"
              onClick={() => {
                setPanel(null);
                onChangeSeat();
              }}
            >
              🪑 Сменить место
            </button>
          )}
          {(canLord || controlAll) && (
            <>
              <button
                className="btn btn-ghost justify-start"
                onClick={() => {
                  if (confirm("Пересдать карты и начать заново с теми же игроками?")) {
                    dispatch({ t: "newGame" });
                    setPanel(null);
                  }
                }}
              >
                🔄 Новая партия
              </button>
              <button
                className="btn btn-ghost justify-start"
                onClick={() => {
                  dispatch({ t: "toLobby" });
                  setPanel(null);
                }}
              >
                👥 Игроки и настройки (лобби)
              </button>
            </>
          )}
          <button className="btn justify-start text-parch/50" onClick={onExit}>
            ← На главную
          </button>
        </div>
      </Sheet>

      {passTo && (
        <PassDevice
          pid={passTo.pid}
          onConfirm={() => {
            setRevealedFor(passTo.pid);
            const then = passTo.then;
            setPassTo(null);
            then?.();
          }}
          onCancel={() => setPassTo(null)}
        />
      )}
      {viewer && <CardViewer ids={viewer.ids} index={viewer.index} onClose={() => setViewerCards(null)} />}

      <MercyOverlay />
      <EndScreen />
      <Effects />
    </GameCtx.Provider>
  );
}

function PassDevice({ pid, onConfirm, onCancel }: { pid: string; onConfirm: () => void; onCancel: () => void }) {
  const { state } = useGame();
  const p = getPlayer(state, pid);
  if (!p) return null;
  return (
    <div className="fixed inset-0 z-[62] flex flex-col items-center justify-center gap-6 bg-[radial-gradient(circle_at_50%_40%,#2a120c,#070303)] px-6 text-center animate-[fade-up_200ms_ease-out_both]">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold/60">Передайте устройство</p>
      <Avatar player={p} size={96} ring />
      <h2 className="font-display text-4xl leading-tight gold-text">{p.name}</h2>
      <p className="max-w-xs text-sm text-parch/60">Остальным — не подглядывать. Владыка всё видит.</p>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <button className="btn btn-gold min-h-14 w-full text-lg" onClick={onConfirm}>
          Я — {p.name}, показать карты
        </button>
        <button className="btn w-full text-sm text-parch/50" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
