import type { Action, GameState } from "../game/types";

export type GameStatus = "loading" | "ready" | "notfound" | "missing-config" | "error";

export type GameApi = {
  state: GameState | null;
  dispatch: (a: Action) => void;
  status: GameStatus;
  error?: string | null;
  /** realtime connection health (room mode only) */
  live?: boolean;
  /** seat ids currently online (room mode only) */
  online?: Set<string>;
};
