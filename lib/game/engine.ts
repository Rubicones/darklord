import {
  ACTION_IDS,
  CARDS,
  HINT_IDS,
  canPass,
  isAction,
  isHint,
} from "../cards";
import type { Action, GameState, LogTone, Player } from "./types";

export const HAND_HINTS = 3;
export const HAND_ACTIONS = 3;
export const MAX_HINTS_PER_TURN = 3;
export const MAX_LOOKS = 3;
export const MAX_PLAYERS = 10;
const MAX_LOG = 60;
const MAX_UNDO = 8;

export const PLAYER_COLORS = [
  "#e76f51",
  "#2a9d8f",
  "#e9c46a",
  "#8ab17d",
  "#c77dff",
  "#6d9dc5",
  "#f4a261",
  "#ef476f",
  "#4cc9f0",
  "#b5838d",
];

export const WRATH_REASONS = [
  "Нет «Перевода стрелок»",
  "Нет намёков",
  "Медлительность",
  "Скука",
  "Пренебрежение намёком",
  "«Не называй меня начальник!»",
  "Посторонний шум",
  "Просто так",
];

export function uid(len = 8) {
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(): GameState {
  return {
    v: 1,
    rev: 0,
    phase: "lobby",
    players: [],
    lordId: null,
    speakerId: null,
    hintsThisTurn: 0,
    question: "",
    story: [],
    hintDeck: shuffle(HINT_IDS),
    actionDeck: shuffle(ACTION_IDS),
    hintDiscard: [],
    actionDiscard: [],
    mercy: null,
    loserId: null,
    timerEndsAt: null,
    settings: { guaranteePass: true },
    log: [],
  };
}

// ---------- selectors ----------

export const getPlayer = (s: GameState, id: string | null | undefined) =>
  s.players.find((p) => p.id === id);

export const nameOf = (s: GameState, id: string | null | undefined) =>
  getPlayer(s, id)?.name ?? "Кто-то";

export const servants = (s: GameState) =>
  s.players.filter((p) => p.id !== s.lordId);

export const activeServants = (s: GameState) => servants(s).filter((p) => !p.out);

export const hintsIn = (p: Player) => p.hand.filter(isHint);
export const actionsIn = (p: Player) => p.hand.filter(isAction);

// ---------- mutation helpers (operate on a draft) ----------

function log(s: GameState, text: string, tone: LogTone = "info", who?: string) {
  s.log.push({ id: uid(6), at: Date.now(), text, tone, who });
  if (s.log.length > MAX_LOG) s.log.splice(0, s.log.length - MAX_LOG);
}

function draw(s: GameState, kind: "hint" | "action"): string | null {
  const deck = kind === "hint" ? "hintDeck" : "actionDeck";
  const disc = kind === "hint" ? "hintDiscard" : "actionDiscard";
  if (s[deck].length === 0 && s[disc].length > 0) {
    s[deck] = shuffle(s[disc]);
    s[disc] = [];
    log(s, kind === "hint" ? "Колода намёков перемешана" : "Колода действий перемешана");
  }
  return s[deck].shift() ?? null;
}

function drawInto(s: GameState, p: Player, kind: "hint" | "action", n: number) {
  for (let i = 0; i < n; i++) {
    const c = draw(s, kind);
    if (c) p.hand.push(c);
  }
}

function discardCard(s: GameState, card: string) {
  if (isHint(card)) s.hintDiscard.push(card);
  else if (isAction(card)) s.actionDiscard.push(card);
}

function takeFromHand(p: Player, card: string | undefined): boolean {
  if (!card) return false;
  const i = p.hand.indexOf(card);
  if (i < 0) return false;
  p.hand.splice(i, 1);
  return true;
}

function clearStory(s: GameState) {
  for (const play of s.story) {
    if (play.hint) discardCard(s, play.hint);
    if (play.action) discardCard(s, play.action);
  }
  s.story = [];
}

function dealFresh(s: GameState) {
  clearStory(s);
  s.hintDeck = shuffle(HINT_IDS);
  s.actionDeck = shuffle(ACTION_IDS);
  s.hintDiscard = [];
  s.actionDiscard = [];
  for (const p of s.players) {
    p.hand = [];
    p.looks = 0;
    p.out = false;
    if (p.id === s.lordId) continue;
    drawInto(s, p, "hint", HAND_HINTS);
    drawInto(s, p, "action", HAND_ACTIONS);
    if (s.settings.guaranteePass && !p.hand.some(canPass)) {
      const di = s.actionDeck.findIndex(canPass);
      const hi = p.hand.findIndex(isAction);
      if (di >= 0 && hi >= 0) {
        const swapped = p.hand[hi];
        p.hand[hi] = s.actionDeck[di];
        s.actionDeck[di] = swapped;
      }
    }
  }
  s.phase = "playing";
  s.speakerId = null;
  s.hintsThisTurn = 0;
  s.question = "";
  s.mercy = null;
  s.loserId = null;
  s.timerEndsAt = null;
}

const NOT_UNDOABLE = new Set<Action["t"]>(["timer", "undo"]);

/** Mutates the draft. Returns false when the action is a no-op. */
function reduce(s: GameState, a: Action): boolean {
  switch (a.t) {
    case "addPlayer": {
      const name = a.name.trim().slice(0, 24);
      if (!name || s.players.length >= MAX_PLAYERS) return false;
      if (a.id && getPlayer(s, a.id)) return false;
      const used = new Set(s.players.map((p) => p.color));
      const color =
        PLAYER_COLORS.find((c) => !used.has(c)) ??
        PLAYER_COLORS[s.players.length % PLAYER_COLORS.length];
      const p: Player = { id: a.id ?? uid(), name, color, hand: [], looks: 0, out: false };
      s.players.push(p);
      if (s.phase === "playing") {
        drawInto(s, p, "hint", HAND_HINTS);
        drawInto(s, p, "action", HAND_ACTIONS);
        log(s, `${name} присоединяется к слугам`, "info", p.id);
      }
      return true;
    }
    case "renamePlayer": {
      const p = getPlayer(s, a.id);
      const name = a.name.trim().slice(0, 24);
      if (!p || !name || p.name === name) return false;
      p.name = name;
      return true;
    }
    case "removePlayer": {
      const p = getPlayer(s, a.id);
      if (!p) return false;
      p.hand.forEach((c) => discardCard(s, c));
      s.players = s.players.filter((x) => x.id !== a.id);
      if (s.lordId === a.id) s.lordId = null;
      if (s.speakerId === a.id) s.speakerId = null;
      if (s.mercy?.playerId === a.id) s.mercy = null;
      if (s.phase !== "lobby") log(s, `${p.name} покидает игру`);
      return true;
    }
    case "setLord": {
      const p = getPlayer(s, a.id);
      if (!p || s.lordId === a.id) return false;
      const prevLord = getPlayer(s, s.lordId);
      s.lordId = a.id;
      if (s.phase === "playing") {
        p.hand.forEach((c) => discardCard(s, c));
        p.hand = [];
        p.looks = 0;
        if (prevLord) {
          drawInto(s, prevLord, "hint", HAND_HINTS);
          drawInto(s, prevLord, "action", HAND_ACTIONS);
        }
        if (s.speakerId === a.id) s.speakerId = null;
        log(s, `Власть захвачена! Новый Тёмный Властелин — ${p.name}`, "doom", p.id);
      }
      return true;
    }
    case "setSetting": {
      if (s.settings[a.key] === a.value) return false;
      s.settings[a.key] = a.value;
      return true;
    }
    case "start":
    case "newGame": {
      if (a.t === "newGame") {
        const next = a.lordId ?? s.loserId ?? s.lordId;
        if (next && getPlayer(s, next)) s.lordId = next;
      }
      if (!getPlayer(s, s.lordId)) {
        if (!s.players.length) return false;
        s.lordId = s.players[Math.floor(Math.random() * s.players.length)].id;
      }
      if (servants(s).length < 1) return false;
      dealFresh(s);
      log(s, `Игра началась. Тёмный Властелин — ${nameOf(s, s.lordId)}`, "doom", s.lordId ?? undefined);
      return true;
    }
    case "toLobby": {
      clearStory(s);
      for (const p of s.players) {
        p.hand = [];
        p.looks = 0;
        p.out = false;
      }
      s.phase = "lobby";
      s.speakerId = null;
      s.mercy = null;
      s.loserId = null;
      s.timerEndsAt = null;
      return true;
    }
    case "setQuestion": {
      const text = a.text.slice(0, 200);
      if (text === s.question) return false;
      s.question = text;
      return true;
    }
    case "interrogate": {
      const p = getPlayer(s, a.id);
      if (!p || p.id === s.lordId || p.out) return false;
      clearStory(s);
      s.speakerId = p.id;
      s.hintsThisTurn = 0;
      drawInto(s, p, "action", 1);
      log(s, `Допрос! ${p.name}, объяснитесь`, "info", p.id);
      return true;
    }
    case "setSpeaker": {
      const p = getPlayer(s, a.id);
      if (!p || p.id === s.lordId || s.speakerId === p.id) return false;
      s.speakerId = p.id;
      s.hintsThisTurn = 0;
      log(s, `Слово передано: ${p.name}`, "info", p.id);
      return true;
    }
    case "playHint": {
      const p = getPlayer(s, a.by);
      if (!p || !isHint(a.card) || !takeFromHand(p, a.card)) return false;
      s.story.push({ id: uid(6), by: p.id, mode: "hint", hint: a.card });
      if (s.speakerId === null && p.id !== s.lordId) s.speakerId = p.id;
      if (s.speakerId === p.id) s.hintsThisTurn += 1;
      log(s, `${p.name}: «${CARDS[a.card].title}»`, "info", p.id);
      return true;
    }
    case "pass": {
      const p = getPlayer(s, a.by);
      const to = getPlayer(s, a.to);
      if (!p || !to || to.id === p.id || to.id === s.lordId) return false;
      if (!canPass(a.action) || !p.hand.includes(a.action)) return false;
      if (a.hint && (!isHint(a.hint) || !p.hand.includes(a.hint))) return false;
      takeFromHand(p, a.action);
      if (a.hint) takeFromHand(p, a.hint);
      s.story.push({ id: uid(6), by: p.id, mode: "pass", action: a.action, hint: a.hint, to: to.id });
      // добрать намёки до трёх
      const need = HAND_HINTS - hintsIn(p).length;
      if (need > 0) drawInto(s, p, "hint", need);
      s.speakerId = to.id;
      s.hintsThisTurn = 0;
      log(
        s,
        `${p.name} переводит стрелки → ${to.name}${a.hint ? ` («${CARDS[a.hint].title}»)` : ""}`,
        "pass",
        to.id,
      );
      return true;
    }
    case "stop": {
      const p = getPlayer(s, a.by);
      if (!p || !p.hand.includes(a.action)) return false;
      const kind = CARDS[a.action]?.action;
      if (kind !== "stop" && kind !== "both") return false;
      if (a.hint && (!isHint(a.hint) || !p.hand.includes(a.hint))) return false;
      takeFromHand(p, a.action);
      if (a.hint) takeFromHand(p, a.hint);
      s.story.push({ id: uid(6), by: p.id, mode: "stop", action: a.action, hint: a.hint });
      log(
        s,
        `${p.name}: «Постой, паровоз!»${a.hint ? ` — «${CARDS[a.hint].title}»` : ""}`,
        "stop",
        p.id,
      );
      return true;
    }
    case "discard": {
      const p = getPlayer(s, a.by);
      if (!p || !takeFromHand(p, a.card)) return false;
      discardCard(s, a.card);
      log(s, `${p.name} сбрасывает карту`, "info", p.id);
      return true;
    }
    case "draw": {
      const p = getPlayer(s, a.by);
      if (!p) return false;
      const c = draw(s, a.kind);
      if (!c) return false;
      p.hand.push(c);
      log(s, `${p.name} берёт карту ${a.kind === "hint" ? "намёка" : "действия"}`, "info", p.id);
      return true;
    }
    case "look": {
      const p = getPlayer(s, a.to);
      if (!p || p.id === s.lordId || p.out || s.mercy) return false;
      p.looks = Math.min(MAX_LOOKS, p.looks + 1);
      p.hand.forEach((c) => discardCard(s, c));
      p.hand = [];
      drawInto(s, p, "hint", HAND_HINTS);
      drawInto(s, p, "action", HAND_ACTIONS);
      log(
        s,
        `Испепеляющий Взор → ${p.name} (${p.looks}/${MAX_LOOKS})${a.reason ? ` — ${a.reason}` : ""}`,
        "wrath",
        p.id,
      );
      if (p.looks >= MAX_LOOKS) s.mercy = { playerId: p.id, card: null, result: null };
      return true;
    }
    case "unlook": {
      const p = getPlayer(s, a.to);
      if (!p || p.looks <= 0) return false;
      p.looks -= 1;
      log(s, `Владыка смягчился: ${p.name} — минус один Взор (${p.looks}/${MAX_LOOKS})`, "mercy", p.id);
      return true;
    }
    case "mercyDraw": {
      if (!s.mercy || s.mercy.card) return false;
      const c = draw(s, "action");
      if (!c) return false;
      s.actionDiscard.push(c);
      s.mercy.card = c;
      s.mercy.result = CARDS[c].skull ? "doomed" : "saved";
      log(
        s,
        s.mercy.result === "saved"
          ? `Карта судьбы без черепа — ${nameOf(s, s.mercy.playerId)} избегает казни!`
          : `На карте судьбы череп Ригора Мортиса…`,
        s.mercy.result === "saved" ? "mercy" : "doom",
        s.mercy.playerId,
      );
      return true;
    }
    case "mercyResolve": {
      if (!s.mercy) return false;
      const p = getPlayer(s, s.mercy.playerId);
      const verdict =
        a.grant === undefined ? (s.mercy.result ?? "doomed") : a.grant ? "saved" : "doomed";
      s.mercy = null;
      if (!p) return true;
      if (verdict === "saved") {
        p.looks = MAX_LOOKS - 1;
        log(s, `Владыка милостив. ${p.name} получает прощение… пока что.`, "mercy", p.id);
      } else {
        p.out = true;
        s.loserId = p.id;
        s.phase = "ended";
        s.speakerId = null;
        s.timerEndsAt = null;
        log(s, `Виновный в провале миссии найден: ${p.name}!`, "doom", p.id);
      }
      return true;
    }
    case "newStory": {
      if (!s.story.length && !s.speakerId && !s.question) return false;
      clearStory(s);
      s.speakerId = null;
      s.hintsThisTurn = 0;
      s.question = "";
      log(s, "Стол очищен. Новая история!");
      return true;
    }
    case "timer": {
      const next = a.seconds ? Date.now() + a.seconds * 1000 : null;
      if (next === s.timerEndsAt) return false;
      s.timerEndsAt = next;
      return true;
    }
    case "undo":
      return false;
  }
}

/** Pure: returns a new state (or the same object if nothing changed). */
export function apply(prev: GameState, a: Action): GameState {
  if (a.t === "undo") {
    const past = prev.past ?? [];
    const last = past[past.length - 1];
    if (!last) return prev;
    return { ...last, rev: prev.rev + 1, past: past.slice(0, -1) };
  }
  const { past, ...rest } = prev;
  const draft = structuredClone(rest) as GameState;
  if (!reduce(draft, a)) return prev;
  draft.rev = prev.rev + 1;
  if (NOT_UNDOABLE.has(a.t)) {
    draft.past = past;
  } else {
    const snap: GameState = { ...rest, log: rest.log.slice(-30) };
    draft.past = [...(past ?? []), snap].slice(-MAX_UNDO);
  }
  return draft;
}

export const canUndo = (s: GameState | null) => !!s?.past?.length;
