"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, ROLE_LABELS, type Role } from "@/lib/auth";

const ROLES: Role[] = ["cliente", "proveedor", "agente"];

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/catalogo";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("cliente");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = register({ name, email, password, role });
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
        <h1 className="text-2xl font-extrabold tracking-tight text-gradient">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registrate para reservar, vender inventario o cobrar comisiones.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Nombre">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="input"
              required
            />
          </Field>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="input"
              required
            />
          </Field>

          <Field label="¿Cómo vas a usar OTC?">
            <div className="grid gap-2">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition ${
                    role === r
                      ? "border-brand bg-brand/5 text-brand-dark ring-2 ring-brand/20"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </Field>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary shine w-full">
            {busy ? "Creando…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
            Iniciá sesión
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

export default function RegistroPage() {
  return (
    <Suspense fallback={<p className="text-center text-slate-400">Cargando…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
