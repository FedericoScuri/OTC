"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  WineIcon,
  BuildingIcon,
  MountainIcon,
  CheckIcon,
  BoltIcon,
  CoinsIcon,
  ShieldCheckIcon,
  RefreshIcon,
} from "@/components/icons";

/**
 * Página de inicio (landing pública). Presenta la propuesta de valor y lleva
 * a registro / login. Una vez logueado, el usuario opera en /catalogo.
 */
export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative overflow-hidden pt-6 text-center">
        <div className="animate-fade-in-up space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/70 px-4 py-1.5 text-xs font-semibold text-brand-dark backdrop-blur">
            ⛓️ Turismo descentralizado sobre blockchain
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Reservá tu viaje sin intermediarios.{" "}
            <span className="text-gradient">Comisiones justas, pagos al instante.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-500">
            OTC conecta hoteles, bodegas y turismo aventura directo con vos y con agentes
            independientes. Sin OTAs que se queden con el 25%: los contratos inteligentes reparten el
            pago solos, de forma transparente y auditable.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {user ? (
              <Link href="/catalogo" className="btn-primary shine animate-glow px-6 py-3 text-base">
                Ir al catálogo →
              </Link>
            ) : (
              <>
                <Link href="/registro" className="btn-primary shine animate-glow px-6 py-3 text-base">
                  Crear cuenta gratis
                </Link>
                <Link href="/login" className="btn-ghost px-6 py-3 text-base">
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="grid gap-5 sm:grid-cols-3">
        {[
          { icon: <WineIcon size={26} />, title: "Bodegas y enoturismo", desc: "Catas y experiencias gastronómicas regionales." },
          { icon: <BuildingIcon size={26} />, title: "Hoteles", desc: "Desde grandes cadenas a hospedajes boutique." },
          { icon: <MountainIcon size={26} />, title: "Turismo aventura", desc: "Rafting, trekking y excursiones locales." },
        ].map((c, i) => (
          <div
            key={c.title}
            className="glass card-hover animate-fade-in-up rounded-2xl p-6"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light text-white shadow-lg shadow-brand/30">
              {c.icon}
            </div>
            <h3 className="mt-4 font-bold text-slate-800">{c.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
          </div>
        ))}
      </section>

      {/* Cómo funciona */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">¿Cómo funciona?</h2>
          <p className="mt-1 text-slate-500">Cuatro pasos, sin saber nada de cripto.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["1", "Pagás con tarjeta", "Tu dinero se convierte a USDC por detrás. No necesitás saber de blockchain."],
            ["2", "Queda en escrow", "El pago se retiene en un contrato hasta que el servicio se confirme."],
            ["3", "El hotel confirma", "Al prestar el servicio, el contrato libera los fondos automáticamente."],
            ["4", "Reparto instantáneo", "85% al proveedor, 12% al agente, 3% a la plataforma. En segundos."],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-2xl border border-violet-100 bg-white/60 p-5 backdrop-blur">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-black text-white">
                {n}
              </span>
              <h3 className="mt-3 font-bold text-slate-800">{t}</h3>
              <p className="mt-1 text-sm text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ¿Por qué blockchain? */}
      <section className="space-y-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
            ¿Por qué blockchain?
          </h2>
          <p className="mt-2 text-slate-500">
            No la usamos por moda. Resuelve cuatro problemas concretos del turismo que una base de
            datos común no puede <span className="font-semibold text-slate-700">garantizar</span>.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {[
            {
              icon: <BoltIcon size={22} />,
              title: "Pagos al instante, no en semanas",
              desc: "Los contratos mueven el dinero solos, sin esperar liquidaciones bancarias. El proveedor cobra en segundos apenas confirma el servicio.",
            },
            {
              icon: <CoinsIcon size={22} />,
              title: "Sin intermediarios que retengan tu plata",
              desc: "El reparto 85/12/3 lo ejecuta el contrato automáticamente. Nadie puede quedarse con el dinero, demorarlo ni cambiar las reglas a mitad de camino.",
            },
            {
              icon: <ShieldCheckIcon size={22} />,
              title: "Transparente y auditable",
              desc: "Cada reserva y cada pago queda registrado en una cadena pública. Imposible esconder cláusulas, inventar reseñas falsas o hacer overbooking.",
            },
            {
              icon: <RefreshIcon size={22} />,
              title: "La reserva es tuya de verdad",
              desc: "Cada reserva es un NFT que controlás vos: si no podés viajar, la revendés en el mercado secundario, con un royalty justo para el proveedor original.",
            },
          ].map((r, i) => (
            <div
              key={r.title}
              className="glass card-hover animate-fade-in-up flex gap-4 rounded-2xl p-6"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light text-white shadow-lg shadow-brand/30">
                {r.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{r.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mx-auto max-w-2xl text-center text-sm text-slate-400">
          En criollo: el código reemplaza la confianza ciega en un intermediario. Las reglas están a
          la vista y se cumplen solas.
        </p>
      </section>

      {/* Beneficios */}
      <section className="glass rounded-3xl p-8 sm:p-12">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
              ¿Por qué OTC y no una OTA tradicional?
            </h2>
            <p className="mt-2 text-slate-500">
              Devolvemos el margen a quienes generan el valor: proveedores y agentes.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              "Comisiones mucho más bajas que Booking o Expedia.",
              "El proveedor cobra al instante, no en semanas.",
              "Cualquiera puede ser agente y cobrar su comisión automática.",
              "Podés revender tu reserva si no podés viajar (mercado secundario).",
              "Todo es público y auditable: sin cláusulas ocultas ni overbooking.",
            ].map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckIcon size={13} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {!user && (
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200/60 pt-6">
            <span className="text-sm font-medium text-slate-600">¿Listo para empezar?</span>
            <Link href="/registro" className="btn-primary shine">
              Crear mi cuenta
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
