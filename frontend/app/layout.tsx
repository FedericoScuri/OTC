import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { AuroraBackground } from "@/components/AuroraBackground";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "OTC — Open Tourism Commerce",
  description: "Marketplace descentralizado de paquetes turísticos sobre blockchain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans">
        <Providers>
          <AuroraBackground />
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-slate-400">
            OTC · Open Tourism Commerce — demo académica sobre blockchain
          </footer>
        </Providers>
      </body>
    </html>
  );
}
