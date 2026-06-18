"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth, ROLE_LABELS, type Role } from "@/lib/auth";

/**
 * Protege las páginas internas:
 *   - Si no hay usuario logueado, redirige a /login conservando ?next= (así
 *     sobreviven los links de afiliado /catalogo?ref=...).
 *   - Si se pasa `role`, además exige ESE rol; un usuario con otro rol ve un
 *     aviso de "acceso restringido" (no lo expulsa, solo le explica).
 */
export function AuthGate({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      router.replace(`/login?next=${next}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
      </div>
    );
  }

  if (role && user.role !== role) {
    return (
      <div className="glass animate-fade-in-up mx-auto max-w-lg rounded-3xl p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-2xl">
          🔒
        </div>
        <h1 className="text-xl font-extrabold text-slate-800">Sección restringida</h1>
        <p className="mt-2 text-sm text-slate-500">
          Esta sección es solo para <span className="font-semibold text-brand-dark">{ROLE_LABELS[role]}</span>.
          Tu cuenta es <span className="font-semibold">{ROLE_LABELS[user.role]}</span>.
        </p>
        <Link href="/catalogo" className="btn-primary shine mt-6 inline-flex">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
