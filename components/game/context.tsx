"use client";

import { createContext, useContext } from "react";
import type { Action, GameState } from "@/lib/game/types";

export type GameMode = { kind: "local" } | { kind: "room"; code: string };

export type Ctx = {
  state: GameState;
  dispatch: (a: Action) => void;
  mode: GameMode;
  /** этот экран управляет всеми (локальная игра или «общий стол» в комнате) */
  controlAll: boolean;
  /** место устройства в комнате (id игрока или "table") */
  seat: string | null;
  /** чья рука сейчас показана */
  viewerId: string | null;
  setViewer: (id: string) => void;
  canLord: boolean;
  canActFor: (pid: string) => boolean;
  online?: Set<string>;
  /** открыть розыгрыш карты */
  openPlay: (req: PlayRequest) => void;
  openPlayer: (pid: string) => void;
  /** посмотреть карты вблизи */
  openCard: (ids: string[], index?: number) => void;
  /** режим «передай телефон»: чужие руки скрыты */
  privacy: boolean;
  /** рука этого игрока сейчас скрыта на этом экране */
  isHidden: (pid: string) => boolean;
  /** попросить передать устройство игроку и показать его карты */
  requestReveal: (pid: string, then?: () => void) => void;
  hideHand: () => void;
};

export type PlayRequest = {
  actor: string;
  card?: string;
  quick?: "pass" | "stop";
};

export const GameCtx = createContext<Ctx | null>(null);

export function useGame() {
  const c = useContext(GameCtx);
  if (!c) throw new Error("GameCtx missing");
  return c;
}
