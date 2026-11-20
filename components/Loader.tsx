export function Loader({ text = "Владыка пробуждается…" }: { text?: string }) {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-4 text-parch/60">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
      <p className="font-title">{text}</p>
    </div>
  );
}
