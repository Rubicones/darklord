export type Player = {
  id: string;
  name: string;
  color: string;
  hand: string[];
  looks: number;
  out: boolean;
};

export type PlayMode = "hint" | "pass" | "stop";

export type Play = {
  id: string;
  by: string;
  mode: PlayMode;
  hint?: string;
  action?: string;
  to?: string;
};

export type LogTone = "info" | "wrath" | "mercy" | "doom" | "pass" | "stop";

export type LogEntry = {
  id: string;
  at: number;
  text: string;
  tone: LogTone;
  /** player the event is mostly about (for effects) */
  who?: string;
};

export type Mercy = {
  playerId: string;
  card: string | null;
  result: "saved" | "doomed" | null;
};

export type Settings = {
  /** «Правило первого круга»: у каждого слуги на старте есть «Перевод стрелок» */
  guaranteePass: boolean;
};

export type Phase = "lobby" | "playing" | "ended";

export type GameState = {
  v: 1;
  rev: number;
  phase: Phase;
  players: Player[];
  lordId: string | null;
  speakerId: string | null;
  hintsThisTurn: number;
  question: string;
  story: Play[];
  hintDeck: string[];
  actionDeck: string[];
  hintDiscard: string[];
  actionDiscard: string[];
  mercy: Mercy | null;
  loserId: string | null;
  timerEndsAt: number | null;
  settings: Settings;
  log: LogEntry[];
  past?: GameState[];
};

export type Action =
  | { t: "addPlayer"; name: string; id?: string }
  | { t: "renamePlayer"; id: string; name: string }
  | { t: "removePlayer"; id: string }
  | { t: "setLord"; id: string }
  | { t: "setSetting"; key: keyof Settings; value: boolean }
  | { t: "start" }
  | { t: "newGame"; lordId?: string }
  | { t: "toLobby" }
  | { t: "setQuestion"; text: string }
  | { t: "interrogate"; id: string }
  | { t: "setSpeaker"; id: string }
  | { t: "playHint"; by: string; card: string }
  | { t: "pass"; by: string; action: string; hint?: string; to: string }
  | { t: "stop"; by: string; action: string; hint?: string }
  | { t: "discard"; by: string; card: string }
  | { t: "draw"; by: string; kind: "hint" | "action" }
  | { t: "look"; to: string; reason?: string }
  | { t: "unlook"; to: string }
  | { t: "mercyDraw" }
  | { t: "mercyResolve"; grant?: boolean }
  | { t: "newStory" }
  | { t: "timer"; seconds: number | null }
  | { t: "undo" };
