"use client";

import { useCallback, useEffect, useState } from "react";
import { apply, createGame } from "../game/engine";
import type { Action, GameState } from "../game/types";
import type { GameApi } from "./types";

const KEY = "darklord:local:v1";

function load(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as GameState;
      if (s && s.v === 1) return s;
    }
  } catch {}
  return createGame();
}

export function resetLocalGame() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function hasLocalGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const s = JSON.parse(raw) as GameState;
    return s.phase !== "lobby" || s.players.length > 0;
  } catch {
    return false;
  }
}

export function useLocalGame(): GameApi {
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    setState(load());
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const dispatch = useCallback((a: Action) => {
    setState((prev) => (prev ? apply(prev, a) : prev));
  }, []);

  return { state, dispatch, status: state ? "ready" : "loading" };
}
