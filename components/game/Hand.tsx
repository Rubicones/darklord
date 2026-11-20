"use client";

import { BACK_ACTION, BACK_HINT, isHint } from "@/lib/cards";
import { getPlayer, hintsIn, MAX_HINTS_PER_TURN } from "@/lib/game/engine";
import { Avatar, CardImg, EyeOffIcon, LookPips } from "./bits";
import { CardLabel } from "./cardview";
import { useGame } from "./context";

export function Hand() {
  const { state, viewerId, openPlay, canActFor, controlAll, isHidden, requestReveal, hideHand, privacy } = useGame();
  const p = getPlayer(state, viewerId);
  if (!p) {
    return (
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 text-center text-sm text-parch/50">
        {controlAll ? "Нажмите на слугу сверху, чтобы открыть его руку" : "Вы наблюдаете за столом"}
      </div>
    );
  }
  const hand = [...p.hand].sort((a, b) => Number(isHint(b)) - Number(isHint(a)));
  const interactive = canActFor(p.id) && !p.out;
  const speaking = state.speakerId === p.id;
  const overLimit = speaking && state.hintsThisTurn >= MAX_HINTS_PER_TURN;
  const nHints = hintsIn(p).length;
  const firstAction = hand.findIndex((c) => !isHint(c));
  const hidden = isHidden(p.id);

  return (
    <section className="relative">
      <div className="flex items-center gap-2 px-4 pb-1">
        <Avatar player={p} size={22} ring={speaking} />
        <span className="truncate text-sm font-bold">{controlAll ? `Рука: ${p.name}` : "Ваша рука"}</span>
        <LookPips looks={p.looks} size={12} />
        <span className="ml-auto shrink-0 text-xs text-parch/50">
          {nHints} нам. · {p.hand.length - nHints} дейст.
        </span>
        {controlAll && privacy && !hidden && (
          <button className="btn btn-ghost min-h-8 shrink-0 px-2.5 text-xs" onClick={hideHand} aria-label="Спрятать карты">
            <EyeOffIcon size={15} /> Спрятать
          </button>
        )}
      </div>

      {hidden ? (
        <div className="flex flex-col items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:justify-center sm:gap-6">
          <div className="relative h-24 w-40 shrink-0" aria-hidden>
            {hand.slice(0, 6).map((c, i, arr) => (
              <CardImg
                key={i}
                id={isHint(c) ? BACK_HINT : BACK_ACTION}
                small
                className="card-shadow absolute bottom-0 left-1/2 w-14 origin-bottom"
                alt=""
                style={{ transform: `translateX(-50%) rotate(${(i - (arr.length - 1) / 2) * 9}deg)` }}
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
            <p className="text-sm text-parch/70">
              Карты <b className="text-parch">{p.name}</b> скрыты от чужих глаз
            </p>
            <button className="btn btn-gold" onClick={() => requestReveal(p.id)}>
              Я — {p.name}, показать
            </button>
          </div>
        </div>
      ) : (
        <>
          {(overLimit || (nHints === 0 && !p.out)) && (
            <p className="mx-4 mb-1 rounded-xl bg-blood/20 px-3 py-1.5 text-xs text-[#ffc2b5]">
              {overLimit
                ? "Сыграно 3 намёка — пора переводить стрелки, пока Владыка не разгневался!"
                : "Нет ни одного намёка… Владыка вправе испепелить взглядом."}
            </p>
          )}
          <div className="no-scrollbar flex snap-x items-start gap-2.5 overflow-x-auto px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:justify-center">
            {hand.length === 0 && <p className="w-full py-6 text-center text-sm text-parch/40">Рука пуста</p>}
            {hand.map((id, i) => (
              <button
                key={id}
                disabled={!interactive}
                onClick={() => openPlay({ actor: p.id, card: id })}
                style={{ marginLeft: i > 0 && i === firstAction ? "0.75rem" : undefined }}
                className={`focus-ring group flex w-[5.4rem] shrink-0 snap-start flex-col gap-1.5 rounded-lg transition duration-200 sm:w-[6.6rem] lg:w-[7.6rem] xl:w-[8.6rem] ${
                  interactive ? "hover:-translate-y-2 active:-translate-y-1" : "cursor-default"
                }`}
              >
                <CardImg id={id} small className="card-shadow w-full animate-card-in" />
                <CardLabel id={id} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
