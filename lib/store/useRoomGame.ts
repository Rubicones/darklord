"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { apply, createGame } from "../game/engine";
import type { Action, GameState } from "../game/types";
import { getSupabase } from "../supabase";
import type { GameApi, GameStatus } from "./types";

type Row = { state: GameState; version: number };

const CODE_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function normalizeCode(code: string) {
  return code
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 6);
}

export async function createRoom(): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase не настроен");
  for (let attempt = 0; attempt < 6; attempt++) {
    let code = "";
    for (let i = 0; i < 4; i++) code += CODE_ABC[Math.floor(Math.random() * CODE_ABC.length)];
    const { error } = await sb.from("rooms").insert({ code, state: createGame(), version: 0 });
    if (!error) return code;
    if (error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Не удалось создать комнату, попробуйте ещё раз");
}

export async function roomExists(code: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data } = await sb.from("rooms").select("code").eq("code", code).maybeSingle();
  return !!data;
}

export function getDeviceId() {
  const k = "darklord:device";
  try {
    let id = localStorage.getItem(k);
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      localStorage.setItem(k, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function useRoomGame(code: string, seat: string | null): GameApi {
  const [row, setRowState] = useState<Row | null>(null);
  const [status, setStatus] = useState<GameStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [online, setOnline] = useState<Set<string>>(() => new Set());

  const rowRef = useRef<Row | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const channelRef = useRef<RealtimeChannel | null>(null);

  const setRow = useCallback((r: Row | null) => {
    rowRef.current = r;
    setRowState(r);
  }, []);

  const accept = useCallback(
    (r: Row) => {
      const cur = rowRef.current;
      if (!cur || r.version >= cur.version) setRow(r);
    },
    [setRow],
  );

  const refetch = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data, error } = await sb
      .from("rooms")
      .select("state,version")
      .eq("code", code)
      .maybeSingle();
    if (error) {
      setError(error.message);
      setStatus((s) => (s === "loading" ? "error" : s));
      return;
    }
    if (!data) {
      setStatus("notfound");
      return;
    }
    accept(data as Row);
    setStatus("ready");
  }, [code, accept]);

  // initial load + realtime subscription
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setStatus("missing-config");
      return;
    }
    refetch();

    const channel = sb.channel(`room:${code}`, {
      config: { presence: { key: getDeviceId() } },
    });
    channel
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => {
          const n = payload.new as Partial<Row>;
          if (n && n.state && typeof n.version === "number") accept(n as Row);
        },
      )
      .on("presence", { event: "sync" }, () => {
        const st = channel.presenceState<{ seat: string | null }>();
        const seats = new Set<string>();
        Object.values(st).forEach((arr) =>
          arr.forEach((m) => {
            if (m.seat) seats.add(m.seat);
          }),
        );
        setOnline(seats);
      })
      .subscribe((s) => {
        setLive(s === "SUBSCRIBED");
        if (s === "SUBSCRIBED") refetch();
      });
    channelRef.current = channel;

    const onVis = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onVis);
      sb.removeChannel(channel);
      channelRef.current = null;
    };
  }, [code, refetch, accept]);

  // presence: announce which seat this device occupies
  useEffect(() => {
    const ch = channelRef.current;
    if (!ch || !live) return;
    ch.track({ seat });
  }, [seat, live]);

  // polling fallback while realtime is down
  useEffect(() => {
    if (live || status !== "ready") return;
    const t = setInterval(refetch, 3000);
    return () => clearInterval(t);
  }, [live, status, refetch]);

  const run = useCallback(
    async (a: Action) => {
      const sb = getSupabase();
      if (!sb) return;
      for (let attempt = 0; attempt < 6; attempt++) {
        const cur = rowRef.current;
        if (!cur) return;
        const next = apply(cur.state, a);
        if (next === cur.state) return;
        const version = cur.version + 1;
        setRow({ state: next, version }); // optimistic
        const { data, error } = await sb
          .from("rooms")
          .update({ state: next, version, updated_at: new Date().toISOString() })
          .eq("code", code)
          .eq("version", cur.version)
          .select("version");
        if (error) {
          setError(error.message);
          rowRef.current = cur;
          await refetch();
          return;
        }
        if (data && data.length > 0) {
          setError(null);
          return;
        }
        // кто-то успел раньше — подтягиваем свежую версию и повторяем
        rowRef.current = null;
        await refetch();
      }
    },
    [code, refetch, setRow],
  );

  const dispatch = useCallback(
    (a: Action) => {
      queue.current = queue.current.then(() => run(a)).catch(() => {});
    },
    [run],
  );

  return { state: row?.state ?? null, dispatch, status, error, live, online };
}
