import "../styles/globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

export const metadata: Metadata = { title: "Etherium Antennas" };

const font = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400","600","700"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={font.className}>
      <body className="min-h-screen bg-gradient-to-br from-brand2 via-neutral-900 to-black text-white">
        {children}
      </body>
    </html>
  );
}
