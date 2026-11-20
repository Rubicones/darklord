"use client";

import { useState } from "react";
import { ACTION_LABEL, CARDS, canPass, canStop, isHint } from "@/lib/cards";
import { activeServants, getPlayer, MAX_HINTS_PER_TURN } from "@/lib/game/engine";
import { Sheet } from "../ui/Sheet";
import { Avatar, CardImg, HandStopIcon, PointIcon } from "./bits";
import { CardLabel, CardText } from "./cardview";
import { useGame, type PlayRequest } from "./context";

type Mode = "pass" | "stop";
type Step = "who" | "view" | "hint" | "target";

function pickAction(hand: string[], mode: Mode) {
  const exact = hand.find((c) => CARDS[c]?.action === mode);
  if (exact) return exact;
  return hand.find((c) => CARDS[c]?.action === "both");
}

export function PlaySheet({ req, onClose }: { req: PlayRequest | null; onClose: () => void }) {
  return (
    <Sheet open={!!req} onClose={onClose} title={req ? <PlayTitle req={req} /> : undefined}>
      {req && <PlayFlow key={JSON.stringify(req)} req={req} onClose={onClose} />}
    </Sheet>
  );
}

function PlayTitle({ req }: { req: PlayRequest }) {
  const { state } = useGame();
  if (req.actor === "__choose_stop__") return <>Кто перебивает?</>;
  const p = getPlayer(state, req.actor);
  if (req.card) return <>{CARDS[req.card]?.title}</>;
  if (req.quick) return <>{ACTION_LABEL[req.quick]}</>;
  return <>{p?.name}</>;
}

function PlayFlow({ req, onClose }: { req: PlayRequest; onClose: () => void }) {
  const { state, dispatch, openPlay, openCard } = useGame();

  const initial = (() => {
    if (req.actor === "__choose_stop__") return { step: "who" as Step, actor: "", mode: "stop" as Mode, action: undefined, hint: undefined };
    const p = getPlayer(state, req.actor);
    if (req.quick && p) {
      return { step: "hint" as Step, actor: req.actor, mode: req.quick, action: pickAction(p.hand, req.quick), hint: undefined };
    }
    return { step: "view" as Step, actor: req.actor, mode: "pass" as Mode, action: undefined, hint: undefined };
  })();

  const [step, setStep] = useState<Step>(initial.step);
  const [actorId, setActorId] = useState<string>(initial.actor);
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [action, setAction] = useState<string | undefined>(initial.action);
  const [hint, setHint] = useState<string | undefined>(initial.hint);

  const actor = getPlayer(state, actorId);
  const hand = actor?.hand ?? [];
  const hints = hand.filter(isHint);
  const isSpeaker = state.speakerId === actorId;

  const finishStop = (h = hint) => {
    if (!action) return;
    dispatch({ t: "stop", by: actorId, action, hint: h });
    onClose();
  };
  const finishPass = (to: string) => {
    if (!action) return;
    dispatch({ t: "pass", by: actorId, action, hint, to });
    onClose();
  };

  // ---- step: choose who interrupts (shared screen) ----
  if (step === "who") {
    const list = activeServants(state).filter((p) => p.id !== state.speakerId && p.hand.some(canStop));
    return (
      <div className="grid gap-2 pb-2">
        {list.map((p) => (
          <button
            key={p.id}
            className="btn btn-ghost justify-start pl-2"
            onClick={() => {
              onClose();
              openPlay({ actor: p.id, quick: "stop" });
            }}
          >
            <Avatar player={p} size={32} /> {p.name}
          </button>
        ))}
        {list.length === 0 && <p className="text-sm text-parch/60">Ни у кого нет карты «Постой, паровоз!»</p>}
      </div>
    );
  }

  if (!actor) return <p className="pb-4 text-sm text-parch/60">Игрок не найден</p>;

  // ---- step: view a card from hand ----
  if (step === "view" && req.card) {
    const card = req.card;
    const def = CARDS[card];
    const inHand = hand.includes(card);
    const passAction = pickAction(hand, "pass");
    const stopAction = pickAction(hand, "stop");
    return (
      <div className="flex flex-col items-center gap-5 pb-2 sm:flex-row sm:items-start">
        <button
          className="group relative shrink-0 cursor-zoom-in"
          onClick={() => openCard(hand, Math.max(0, hand.indexOf(card)))}
          aria-label="Посмотреть вблизи"
        >
          <CardImg id={card} className="card-shadow w-[min(52vw,13rem)] animate-pop sm:w-52" />
          <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-xs text-parch">🔍 ближе</span>
        </button>
        <div className="flex w-full flex-col gap-2.5">
          <CardText id={card} className="mb-1" />
          {!inHand && <p className="text-sm text-parch/60">Этой карты уже нет на руке.</p>}
          {inHand && def.type === "hint" && (
            <>
              {isSpeaker && state.hintsThisTurn >= MAX_HINTS_PER_TURN && (
                <p className="rounded-xl bg-blood/20 px-3 py-2 text-xs text-[#ffc2b5]">
                  Это уже больше трёх намёков за ход. Владыка может быть недоволен — но решать вам.
                </p>
              )}
              <button
                className="btn btn-gold w-full"
                onClick={() => {
                  dispatch({ t: "playHint", by: actorId, card });
                  onClose();
                }}
              >
                Сыграть намёк
              </button>
              {passAction && (
                <button
                  className="btn btn-ghost w-full"
                  onClick={() => {
                    setMode("pass");
                    setAction(passAction);
                    setHint(card);
                    setStep("target");
                  }}
                >
                  <PointIcon /> Сыграть и перевести стрелки
                </button>
              )}
              {stopAction && !isSpeaker && state.speakerId && (
                <button
                  className="btn btn-ghost w-full"
                  onClick={() => {
                    setMode("stop");
                    setAction(stopAction);
                    setHint(card);
                    if (stopAction) {
                      dispatch({ t: "stop", by: actorId, action: stopAction, hint: card });
                      onClose();
                    }
                  }}
                >
                  <HandStopIcon /> Перебить этим намёком
                </button>
              )}
            </>
          )}
          {inHand && def.type === "action" && (
            <>

              {canPass(card) && (
                <button
                  className="btn btn-gold w-full"
                  onClick={() => {
                    setMode("pass");
                    setAction(card);
                    setStep("hint");
                  }}
                >
                  <PointIcon /> Перевод стрелок
                </button>
              )}
              {canStop(card) && (
                <button
                  className="btn btn-blood w-full"
                  onClick={() => {
                    setMode("stop");
                    setAction(card);
                    setStep("hint");
                  }}
                >
                  <HandStopIcon /> Постой, паровоз!
                </button>
              )}
            </>
          )}
          {inHand && (
            <button
              className="btn mt-1 w-full text-sm text-parch/50 hover:text-parch"
              onClick={() => {
                dispatch({ t: "discard", by: actorId, card });
                onClose();
              }}
            >
              Сбросить карту
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---- step: attach a hint ----
  if (step === "hint") {
    if (!action) {
      return (
        <p className="pb-4 text-sm text-parch/70">
          Нет подходящей карты действия.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-center gap-3">
          <CardImg id={action} small className="card-shadow w-16" />
          <p className="text-sm text-parch/70">
            {mode === "pass"
              ? "Выберите намёк, с которым переведёте стрелки (по правилам действие играется вместе с намёком)."
              : "Какой намёк подкинуть рассказчику?"}
          </p>
        </div>
        {hints.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {hints.map((h) => (
              <button
                key={h}
                onClick={() => setHint(hint === h ? undefined : h)}
                className={`focus-ring relative rounded-[0.6rem] transition ${
                  hint === h ? "-translate-y-1 ring-2 ring-gold ring-offset-2 ring-offset-coal" : "opacity-80 hover:opacity-100"
                }`}
              >
                <CardImg id={h} small className="w-full" />
                <span className="mt-1 block">
                  <CardLabel id={h} />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-parch/50">Намёков на руке нет — можно сыграть без намёка.</p>
        )}
        {mode === "pass" ? (
          <button className="btn btn-gold w-full" onClick={() => setStep("target")}>
            {hint ? "Дальше — на кого?" : "Без намёка — на кого?"}
          </button>
        ) : (
          <button className="btn btn-blood w-full" onClick={() => finishStop()}>
            <HandStopIcon /> {hint ? "Постой, паровоз!" : "Перебить без намёка"}
          </button>
        )}
      </div>
    );
  }

  // ---- step: choose pass target ----
  if (step === "target") {
    const targets = activeServants(state).filter((p) => p.id !== actorId);
    const last = [...state.story].reverse().find((p) => p.mode === "pass" && p.to === actorId);
    return (
      <div className="flex flex-col gap-3 pb-2">
        <div className="flex items-center gap-3">
          {hint && <CardImg id={hint} small className="card-shadow w-14" />}
          {action && <CardImg id={action} small className="card-shadow w-14 rotate-6" />}
          <p className="text-sm text-parch/70">На кого переводим стрелки?</p>
        </div>
        <div className="grid gap-2">
          {targets.map((p) => (
            <button key={p.id} className="btn btn-ghost justify-start pl-2" onClick={() => finishPass(p.id)}>
              <Avatar player={p} size={32} />
              <span>{p.name}</span>
              {last?.by === p.id && <span className="ml-auto text-xs font-normal text-ember">«Сам дурак!»</span>}
            </button>
          ))}
          {targets.length === 0 && <p className="text-sm text-parch/60">Некого обвинить…</p>}
        </div>
      </div>
    );
  }

  return null;
}
