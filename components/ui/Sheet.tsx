"use client";

import { useEffect, type ReactNode } from "react";

export function Sheet({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button
        aria-label="Закрыть"
        className="absolute inset-0 bg-black/65 backdrop-blur-[3px] animate-[fade-up_200ms_ease-out_both]"
        onClick={onClose}
      />
      <div
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-gold/15 bg-[linear-gradient(180deg,#24120d,#140a08)] shadow-[0_-20px_60px_-10px_rgb(0_0_0/0.8)] animate-sheet-up sm:rounded-[1.75rem] sm:animate-pop ${
          size === "lg" ? "sm:max-w-3xl" : "sm:max-w-lg"
        }`}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-parch/20 sm:hidden" />
        {title !== undefined && (
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3 sm:pt-5">
            <h2 className="font-title text-xl text-gold-2">{title}</h2>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Закрыть">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}
