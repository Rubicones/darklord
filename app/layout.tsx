import type { Metadata, Viewport } from "next";
import "@fontsource/ruslan-display/cyrillic.css";
import "@fontsource/ruslan-display/latin.css";
import "@fontsource/kurale/cyrillic.css";
import "@fontsource/kurale/latin.css";
import "@fontsource-variable/manrope/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Да, Тёмный Властелин!",
  description: "Электронная версия карточной игры для компании в одной комнате",
  appleWebApp: { capable: true, title: "Тёмный Властелин", statusBarStyle: "black-translucent" },
  icons: { icon: "/cards/look1-s.webp", apple: "/cards/look1-s.webp" },
};

export const viewport: Viewport = {
  themeColor: "#0c0605",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="relative min-h-dvh">{children}</body>
    </html>
  );
}
