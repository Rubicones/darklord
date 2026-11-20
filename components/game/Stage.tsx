"use client";

import { useEffect, useRef } from "react";
import { CARDS, canPass, canStop } from "@/lib/cards";
import { activeServants, getPlayer, MAX_HINTS_PER_TURN, nameOf } from "@/lib/game/engine";
import type { Play } from "@/lib/game/types";
import { Avatar, CardImg, HandStopIcon, PointIcon } from "./bits";
import { useGame } from "./context";

function StoryCard({ play, latest, onOpen }: { play: Play; latest: boolean; onOpen: (id: string) => void }) {
  const { state } = useGame();
  const by = getPlayer(state, play.by);
  const main = play.hint ?? play.action!;
  return (
    <figure
      className={`relative flex shrink-0 snap-center flex-col items-center gap-2 animate-card-in ${
        latest ? "w-[min(44vw,13rem)] lg:w-[16rem]" : "w-[min(32vw,9.5rem)] opacity-90 lg:w-[12rem]"
      } transition-[width] duration-500`}
    >
      <div className="relative w-full">
        <button className="focus-ring block w-full cursor-zoom-in rounded-[4.5%]" onClick={() => onOpen(main)} aria-label={`Посмотреть «${CARDS[main]?.title}»`}>
          <CardImg id={main} className="card-shadow w-full" />
        </button>
        {play.hint && play.action && (
          <button
            className="absolute -bottom-3 -right-3 w-[38%] rotate-[10deg] cursor-zoom-in"
            onClick={() => onOpen(play.action!)}
            aria-label="Посмотреть карту действия"
          >
            <CardImg id={play.action} small className="card-shadow w-full" />
          </button>
        )}
        {play.mode !== "hint" && (
          <span
            className={`absolute -left-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-lg ${
              play.mode === "pass"
                ? "border-gold bg-[#3a1f0b] text-gold-2"
                : "border-ember bg-[#4a140c] text-ember"
            }`}
            title={play.mode === "pass" ? "Перевод стрелок" : "Постой, паровоз!"}
          >
            {play.mode === "pass" ? <PointIcon /> : <HandStopIcon />}
          </span>
        )}
      </div>
      <figcaption className="flex max-w-full flex-col items-center gap-1 text-center">
        <span className="line-clamp-2 font-title text-sm leading-tight text-gold-2">{CARDS[main]?.title}</span>
        <span className="flex max-w-full items-center gap-1.5 text-xs text-parch/70">
        {by && <Avatar player={by} size={18} />}
        <span className="truncate">
          {by?.name ?? "—"}
          {play.mode === "pass" && play.to && (
            <span className="text-gold"> → {nameOf(state, play.to)}</span>
          )}
          {play.mode === "stop" && <span className="text-ember"> перебивает</span>}
        </span>
        </span>
      </figcaption>
    </figure>
  );
}

export function Stage() {
  const { state, dispatch, canLord, openPlay, viewerId, controlAll, seat, setViewer, openCard } = useGame();
  const storyIds = state.story.flatMap((p) => [p.hint, p.action].filter((x): x is string => !!x));
  const openStoryCard = (id: string) => openCard(storyIds, Math.max(0, storyIds.indexOf(id)));
  const scroller = useRef<HTMLDivElement>(null);
  const speaker = getPlayer(state, state.speakerId);
  const last = state.story[state.story.length - 1];

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [state.story.length]);

  // who can trigger quick actions from this screen
  const actorId = controlAll ? viewerId : seat;
  const actor = getPlayer(state, actorId);
  const actorIsServant = !!actor && actor.id !== state.lordId && !actor.out;

  const stopCandidates = activeServants(state).filter(
    (p) => p.id !== state.speakerId && p.hand.some(canStop),
  );
  const showStop =
    !!speaker &&
    (controlAll ? stopCandidates.length > 0 : actorIsServant && actor!.id !== speaker.id && actor!.hand.some(canStop));
  const showPass =
    !!speaker && actorIsServant && actor!.id === speaker.id && actor!.hand.some(canPass);

  const onStop = () => {
    if (!controlAll && actor) return openPlay({ actor: actor.id, quick: "stop" });
    if (actor && actor.id !== state.speakerId && actor.hand.some(canStop))
      return openPlay({ actor: actor.id, quick: "stop" });
    if (stopCandidates.length === 1) {
      setViewer(stopCandidates[0].id);
      openPlay({ actor: stopCandidates[0].id, quick: "stop" });
    } else {
      // попросим выбрать, кто перебивает
      openPlay({ actor: "__choose_stop__", quick: "stop" });
    }
  };

  return (
    <section className="relative flex min-h-0 flex-1 flex-col">
      {/* speaker / question */}
      <div className="flex flex-col gap-2 px-4 pt-2">
        {state.question && (
          <p className="panel px-4 py-2.5 font-title text-[0.95rem] italic leading-snug text-gold-2/90">
            <span className="mr-1 not-italic text-gold/60">Владыка:</span>«{state.question}»
          </p>
        )}
        {speaker && (
          <div className="flex items-center gap-2 text-sm animate-fade-up" key={speaker.id}>
            <Avatar player={speaker} size={24} ring />
            <span className="text-parch/70">Оправдывается</span>
            <b className="text-parch">{speaker.name}</b>
            <span
              className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                state.hintsThisTurn >= MAX_HINTS_PER_TURN ? "bg-blood/30 text-[#ffb4a6]" : "bg-white/5 text-parch/60"
              }`}
            >
              намёки {state.hintsThisTurn}/{MAX_HINTS_PER_TURN}
            </span>
          </div>
        )}
      </div>

      {/* story */}
      <div className="relative flex min-h-0 flex-1 items-center">
        {state.story.length > 0 ? (
          <div
            ref={scroller}
            className="no-scrollbar flex h-full w-full snap-x items-center gap-4 overflow-x-auto px-[max(1rem,calc(50%-7rem))] py-4 lg:gap-6"
          >
            {state.story.map((p) => (
              <StoryCard key={p.id} play={p} latest={p.id === last?.id} onOpen={openStoryCard} />
            ))}
          </div>
        ) : (
          <EmptyStage />
        )}
      </div>

      {/* quick actions */}
      {(showStop || showPass) && (
        <div className="flex justify-center gap-2 px-4 pb-2">
          {showPass && (
            <button className="btn btn-gold animate-pop" onClick={() => openPlay({ actor: actor!.id, quick: "pass" })}>
              <PointIcon /> Перевести стрелки
            </button>
          )}
          {showStop && (
            <button className="btn btn-blood animate-pop" onClick={onStop}>
              <HandStopIcon /> Постой, паровоз!
            </button>
          )}
        </div>
      )}
      {canLord && !speaker && state.story.length > 0 && (
        <div className="flex justify-center pb-2">
          <button className="btn btn-ghost text-sm" onClick={() => dispatch({ t: "newStory" })}>
            Очистить стол
          </button>
        </div>
      )}
    </section>
  );
}

function EmptyStage() {
  const { state, dispatch, canLord } = useGame();
  const list = activeServants(state);
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 text-center">
      <div className="relative w-28 animate-float sm:w-36">
        <div className="absolute inset-0 -z-10 scale-125 rounded-full bg-blood/30 blur-3xl" />
        <CardImg id="look1" small className="card-shadow w-full" alt="Ригор Мортис" />
      </div>
      {state.speakerId ? (
        <p className="font-title text-lg text-parch/80">
          {nameOf(state, state.speakerId)}, Владыка ждёт объяснений… Сыграйте намёк.
        </p>
      ) : canLord ? (
        <>
          <p className="font-title text-lg text-gold-2">Кого из слуг допросить первым?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {list.map((p) => (
              <button
                key={p.id}
                className="btn btn-ghost pl-1.5"
                onClick={() => dispatch({ t: "interrogate", id: p.id })}
              >
                <Avatar player={p} size={30} /> {p.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-parch/45">Допрашиваемый тянет карту действия и начинает оправдываться.</p>
        </>
      ) : (
        <p className="font-title text-lg text-parch/70">Тёмный Властелин обдумывает, кого допросить…</p>
      )}
    </div>
  );
}
