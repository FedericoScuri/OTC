"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/catalogo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = login(email, password);
    if (res.ok) {
      router.replace(next);
    } else {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="glass animate-fade-in-up rounded-3xl p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gradient">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-500">Entrá a tu cuenta para reservar y operar.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@email.com"
              className="input"
              required
            />
          </Field>
          <Field label="Contraseña">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
            />
          </Field>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary shine w-full">
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="font-semibold text-brand hover:text-brand-dark">
            Creá una gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-slate-400">Cargando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
