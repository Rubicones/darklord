"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasLocalGame, resetLocalGame } from "@/lib/store/useLocalGame";
import { createRoom, normalizeCode, roomExists } from "@/lib/store/useRoomGame";
import { hasSupabaseConfig } from "@/lib/supabase";
import { Sheet } from "./ui/Sheet";
import { CardImg } from "./game/bits";
import { Rules } from "./game/Rules";
import { CardCatalog } from "./game/cardview";

export function Home() {
  const router = useRouter();
  const [resume, setResume] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<null | "create" | "join">(null);
  const [err, setErr] = useState<string | null>(null);
  const [rules, setRules] = useState(false);
  const [catalog, setCatalog] = useState(false);
  const rooms = hasSupabaseConfig();

  useEffect(() => {
    setResume(hasLocalGame());
  }, []);

  const onCreate = async () => {
    setErr(null);
    setBusy("create");
    try {
      const c = await createRoom();
      router.push(`/r/${c}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка");
      setBusy(null);
    }
  };

  const onJoin = async () => {
    const c = normalizeCode(code);
    if (c.length < 4) return setErr("Код — 4 буквы");
    setErr(null);
    setBusy("join");
    if (await roomExists(c)) router.push(`/r/${c}`);
    else {
      setErr("Комната не найдена");
      setBusy(null);
    }
  };

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center justify-center gap-8 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] lg:flex-row lg:gap-16">
      {/* hero */}
      <div className="relative flex flex-col items-center text-center lg:flex-1 lg:items-start lg:text-left">
        <div className="relative mb-6 h-56 w-60 sm:h-64 sm:w-72">
          <div className="absolute left-1/2 top-1/2 -z-10 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/35 blur-[70px]" />
          <CardImg id="h77" small className="card-shadow absolute left-0 top-6 w-28 -rotate-[14deg] sm:w-32" alt="" />
          <CardImg id="h42" small className="card-shadow absolute right-0 top-6 w-28 rotate-[14deg] sm:w-32" alt="" />
          <CardImg id="look1" className="card-shadow absolute left-1/2 top-0 w-32 -translate-x-1/2 animate-float sm:w-36" alt="Ригор Мортис" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold/60">Карточная игра Ригора Мортиса</p>
        <h1 className="mt-2 font-display text-5xl leading-[0.95] gold-text drop-shadow-[0_6px_30px_rgb(232_150_60/0.25)] sm:text-6xl">
          Да, Тёмный
          <br />
          Властелин!
        </h1>
        <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-parch/65">
          Слуги провалили миссию. Теперь им предстоит оправдываться, переводить стрелки и молить о пощаде.
        </p>
      </div>

      {/* actions */}
      <div className="panel flex w-full max-w-sm flex-col gap-3 p-5 lg:flex-1">
        <h2 className="font-title text-lg text-gold-2">Одно устройство</h2>
        {resume && (
          <button className="btn btn-gold w-full" onClick={() => router.push("/local")}>
            Продолжить партию
          </button>
        )}
        <button
          className={`btn w-full ${resume ? "btn-ghost" : "btn-gold"}`}
          onClick={() => {
            if (resume && !confirm("Начать новую партию? Текущая будет удалена.")) return;
            resetLocalGame();
            router.push("/local");
          }}
        >
          Новая игра на этом устройстве
        </button>

        <div className="my-2 flex items-center gap-3 text-xs uppercase tracking-widest text-parch/35">
          <span className="h-px flex-1 bg-gold/15" /> или у каждого свой телефон <span className="h-px flex-1 bg-gold/15" />
        </div>

        <button className="btn btn-ghost w-full" disabled={!rooms || !!busy} onClick={onCreate}>
          {busy === "create" ? "Создаём…" : "Создать комнату"}
        </button>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onJoin();
          }}
        >
          <input
            className="input text-center font-title text-xl uppercase tracking-[0.3em]"
            placeholder="КОД"
            value={code}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            onChange={(e) => setCode(normalizeCode(e.target.value))}
            disabled={!rooms}
            aria-label="Код комнаты"
          />
          <button className="btn btn-ghost shrink-0" disabled={!rooms || !!busy || code.length < 4}>
            {busy === "join" ? "…" : "Войти"}
          </button>
        </form>
        {!rooms && (
          <p className="text-xs leading-relaxed text-parch/45">
            Комнаты заработают после настройки Supabase (переменные NEXT_PUBLIC_SUPABASE_URL и ключ — см. README).
          </p>
        )}
        {err && <p className="text-sm text-[#ff9b85]">{err}</p>}

        <div className="mt-1 grid grid-cols-2 gap-2">
          <button className="btn text-sm text-parch/55 hover:text-parch" onClick={() => setRules(true)}>
            📖 Правила
          </button>
          <button className="btn text-sm text-parch/55 hover:text-parch" onClick={() => setCatalog(true)}>
            🃏 Все карты
          </button>
        </div>
      </div>

      <Sheet open={catalog} onClose={() => setCatalog(false)} title="Все карты" size="lg">
        <CardCatalog />
      </Sheet>
      <Sheet open={rules} onClose={() => setRules(false)} title="Правила" size="lg">
        <Rules />
      </Sheet>
    </main>
  );
}
