"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ACTION_IDS, CARDS, HINT_IDS, LOOK_IDS } from "@/lib/cards";
import { CardImg, HandStopIcon, PointIcon, SkullIcon } from "./bits";

/* ---------- текст карты ---------- */

export function ActionBadge({ id, size = 14 }: { id: string; size?: number }) {
  const d = CARDS[id];
  if (!d || d.type !== "action") return null;
  return (
    <span className="inline-flex items-center gap-1">
      {(d.action === "pass" || d.action === "both") && (
        <span className="text-gold-2">
          <PointIcon size={size} />
        </span>
      )}
      {(d.action === "stop" || d.action === "both") && (
        <span className="text-ember">
          <HandStopIcon size={size} />
        </span>
      )}
      {d.skull && (
        <span className="text-parch/60" title="Череп Ригора Мортиса">
          <SkullIcon size={size - 1} />
        </span>
      )}
    </span>
  );
}

const SHORT: Record<string, string> = { pass: "Стрелки", stop: "Паровоз", both: "Стрелки / паровоз" };

/** Короткая подпись под миниатюрой */
export function CardLabel({ id }: { id: string }) {
  const d = CARDS[id];
  if (!d) return null;
  if (d.type === "action") {
    return (
      <span className="flex items-center justify-center gap-1 text-[11px] font-semibold leading-tight text-parch/80">
        <ActionBadge id={id} size={13} />
        <span className="truncate">{SHORT[d.action!]}</span>
      </span>
    );
  }
  return (
    <span className="line-clamp-2 text-center font-title text-[12px] leading-[1.15] text-parch/90">{d.title}</span>
  );
}

/** Полный текст карты */
export function CardText({ id, className = "" }: { id: string; className?: string }) {
  const d = CARDS[id];
  if (!d) return null;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <h3 className="font-title text-2xl leading-tight text-gold-2">{d.title}</h3>
        {d.type === "action" && <ActionBadge id={id} size={18} />}
      </div>
      {d.who && <p className="font-semibold text-parch">{d.who}</p>}
      {d.text && <p className="leading-relaxed text-parch/75">{d.text}</p>}
      {d.type === "action" && (
        <p className="text-sm text-parch/55">
          {d.skull
            ? "На карте есть череп Ригора Мортиса — как карта судьбы она не спасает."
            : "Черепа нет — как карта судьбы она спасает от казни."}
        </p>
      )}
    </div>
  );
}

/* ---------- просмотр карты вблизи ---------- */

export function CardViewer({
  ids,
  index,
  onClose,
  footer,
}: {
  ids: string[];
  index: number;
  onClose: () => void;
  footer?: (id: string) => ReactNode;
}) {
  const [i, setI] = useState(index);
  const [zoom, setZoom] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const id = ids[Math.min(i, ids.length - 1)];
  const many = ids.length > 1;

  const go = (d: number) => {
    setZoom(false);
    setI((v) => (v + d + ids.length) % ids.length);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && many) go(1);
      if (e.key === "ArrowLeft" && many) go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-[65] flex flex-col bg-[#080404]/95 backdrop-blur-md animate-[fade-up_200ms_ease-out_both]" role="dialog" aria-modal="true">
      <div className="flex shrink-0 items-center justify-between px-3 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <span className="text-xs tabular-nums text-parch/45">{many ? `${i + 1} / ${ids.length}` : ""}</span>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-icon" onClick={() => setZoom((z) => !z)} aria-label={zoom ? "Уменьшить" : "Увеличить"}>
            {zoom ? "−" : "+"}
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 lg:flex-row lg:justify-center lg:gap-10">
        <div
          className={`relative flex shrink-0 items-center justify-center ${zoom ? "w-full overflow-auto" : ""}`}
          onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
          onTouchEnd={(e) => {
            const t = touch.current;
            touch.current = null;
            if (!t || zoom || !many) return;
            const dx = e.changedTouches[0].clientX - t.x;
            const dy = e.changedTouches[0].clientY - t.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
          }}
        >
          <button className="cursor-zoom-in" onClick={() => setZoom((z) => !z)} aria-label="Приблизить">
            <CardImg
              key={id}
              id={id}
              className={`card-shadow animate-pop ${
                zoom
                  ? "w-[min(180vw,64rem)] max-w-none cursor-zoom-out"
                  : "max-h-[62dvh] w-auto max-w-[86vw] lg:max-h-[82dvh]"
              }`}
            />
          </button>
        </div>
        {!zoom && (
          <div className="w-full max-w-md shrink-0 lg:max-w-sm">
            <CardText id={id} />
            {footer?.(id)}
            {many && (
              <div className="mt-4 flex gap-2">
                <button className="btn btn-ghost flex-1" onClick={() => go(-1)}>
                  ← Пред.
                </button>
                <button className="btn btn-ghost flex-1" onClick={() => go(1)}>
                  След. →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- каталог всех карт ---------- */

export function CardCatalog() {
  const [tab, setTab] = useState<"hint" | "action">("hint");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const base = tab === "hint" ? HINT_IDS : [...ACTION_IDS, ...LOOK_IDS];
  const needle = q.trim().toLowerCase();
  const ids = needle
    ? base.filter((id) => {
        const d = CARDS[id];
        return [d.title, d.who, d.text].some((s) => s?.toLowerCase().includes(needle));
      })
    : base;

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="flex gap-2">
        {(["hint", "action"] as const).map((t) => (
          <button key={t} className={`btn flex-1 ${tab === t ? "btn-gold" : "btn-ghost"}`} onClick={() => setTab(t)}>
            {t === "hint" ? `Намёки · ${HINT_IDS.length}` : `Действия · ${ACTION_IDS.length}`}
          </button>
        ))}
      </div>
      <input className="input" placeholder="Поиск по тексту карт" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4">
        {ids.map((id, i) => (
          <li key={id}>
            <button className="focus-ring flex w-full flex-col gap-1.5 rounded-lg" onClick={() => setOpen(i)}>
              <CardImg id={id} small className="w-full" />
              <CardLabel id={id} />
            </button>
          </li>
        ))}
      </ul>
      {ids.length === 0 && <p className="py-4 text-center text-sm text-parch/45">Ничего не найдено</p>}
      {open !== null && <CardViewer ids={ids} index={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
