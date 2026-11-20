"use client";

import { useRouter } from "next/navigation";
import { useLocalGame } from "@/lib/store/useLocalGame";
import { GameView } from "./game/GameView";
import { Lobby } from "./game/Lobby";
import { Loader } from "./Loader";

export function LocalGame() {
  const router = useRouter();
  const { state, dispatch } = useLocalGame();
  if (!state) return <Loader />;
  if (state.phase === "lobby") {
    return <Lobby state={state} dispatch={dispatch} onBack={() => router.push("/")} />;
  }
  return <GameView state={state} dispatch={dispatch} mode={{ kind: "local" }} seat={null} onExit={() => router.push("/")} />;
}
