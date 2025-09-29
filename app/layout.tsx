// app/layout.tsx
import "../styles/globals.css"; // importa CSS global só aqui (no root)
import type { Metadata } from "next";
import ThemeScript from "@components/ThemeScript";

export const metadata: Metadata = {
  title: "Etherium Antennas",
  description: "Monitoramento de antenas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-app text-app antialiased">
        {children}
      </body>
    </html>
  );
}
