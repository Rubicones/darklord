import type { Metadata } from "next";
import { LocalGame } from "@/components/LocalGame";

export const metadata: Metadata = { title: "Игра на одном устройстве · Да, Тёмный Властелин!" };

export default function Page() {
  return <LocalGame />;
}
