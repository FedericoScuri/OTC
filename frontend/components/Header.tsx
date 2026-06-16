"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";

const NAV = [
  { href: "/", label: "Catálogo" },
  { href: "/proveedor", label: "Proveedor" },
  { href: "/agente", label: "Agente" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-7">
          <Link href="/" className="group flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light text-sm font-black text-white shadow-md shadow-brand/30 transition-transform group-hover:scale-110 group-hover:rotate-3">
              O
            </span>
            <span className="text-lg font-extrabold tracking-tight text-gradient">OTC</span>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "text-brand-dark" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-brand to-brand-light" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
