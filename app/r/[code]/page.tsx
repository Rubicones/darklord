import { Suspense } from "react";
import { Loader } from "@/components/Loader";
import { RoomGame } from "@/components/RoomGame";

export default function Page({ params }: PageProps<"/r/[code]">) {
  return (
    <Suspense fallback={<Loader text="Входим в логово…" />}>
      {params.then(({ code }) => (
        <RoomGame code={code.toUpperCase()} />
      ))}
    </Suspense>
  );
}
