"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WalletButton } from "./WalletButton";
import { useAuth, ROLE_LABELS } from "@/lib/auth";

const NAV = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/reservas", label: "Mis reservas" },
  { href: "/mercado", label: "Mercado" },
  { href: "/proveedor", label: "Proveedor" },
  { href: "/agente", label: "Agente" },
];

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

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

          {user && (
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
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {loading ? null : user ? (
            <>
              <WalletButton />
              <UserMenu />
            </>
          ) : (
            <>
              <Link href="/login" className="hidden text-sm font-semibold text-slate-600 hover:text-brand sm:block">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="btn-primary shine">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;
  const initial = user.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark text-sm font-bold text-white shadow-md shadow-accent/30 transition hover:scale-105"
        aria-label="Menú de usuario"
      >
        {initial}
      </button>

      {open && (
        <div className="glass absolute right-0 z-50 mt-2 w-60 origin-top-right animate-scale-in rounded-2xl p-2">
          <div className="rounded-xl bg-white/50 p-3">
            <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          <button
            onClick={() => {
              logout();
              setOpen(false);
              router.push("/");
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
          >
            <LogoutIcon />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
