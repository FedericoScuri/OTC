"use client";

import { useEffect, useRef, useState } from "react";
import { MapPinIcon, CalendarIcon, UsersIcon, SearchIcon } from "./icons";

export type DateRange = { start: Date | null; end: Date | null };
export type Guests = { adults: number; children: number };

/**
 * Barra de búsqueda tipo sitio de reservas, totalmente funcional:
 *   - Destino: filtra el catálogo en vivo por nombre.
 *   - Fechas: calendario real con selección de rango (check-in / check-out).
 *   - Personas: selector de adultos y niños con steppers.
 * Fechas y huéspedes son contexto de búsqueda de demo (el contrato aún no
 * modela capacidad ni rango de búsqueda), pero los controles son reales.
 */
export function SearchBar({
  query,
  onQuery,
  range,
  onRange,
  guests,
  onGuests,
  onSearch,
}: {
  query: string;
  onQuery: (v: string) => void;
  range: DateRange;
  onRange: (r: DateRange) => void;
  guests: Guests;
  onGuests: (g: Guests) => void;
  onSearch?: () => void;
}) {
  const [open, setOpen] = useState<null | "dates" | "guests">(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const totalGuests = guests.adults + guests.children;
  const guestLabel =
    `${totalGuests} ${totalGuests === 1 ? "persona" : "personas"}` +
    (guests.children > 0 ? ` · ${guests.children} niño${guests.children > 1 ? "s" : ""}` : "");

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-stretch gap-1 rounded-2xl border border-violet-100 bg-white p-1.5 shadow-lg shadow-violet-900/5 sm:flex-row sm:items-center"
    >
      {/* Destino */}
      <label className="flex flex-[1.4] items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-50">
        <MapPinIcon size={17} className="shrink-0 text-brand" />
        <span className="flex w-full flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Destino</span>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscá un paquete…"
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
          />
        </span>
      </label>

      <div className="hidden w-px self-stretch bg-slate-100 sm:block" />

      {/* Fechas */}
      <button
        type="button"
        onClick={() => setOpen(open === "dates" ? null : "dates")}
        className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 ${open === "dates" ? "bg-slate-50" : ""}`}
      >
        <CalendarIcon size={17} className="shrink-0 text-brand" />
        <span className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Fechas</span>
          <span className="text-sm font-medium text-slate-700">{rangeLabel(range)}</span>
        </span>
      </button>

      <div className="hidden w-px self-stretch bg-slate-100 sm:block" />

      {/* Personas */}
      <button
        type="button"
        onClick={() => setOpen(open === "guests" ? null : "guests")}
        className={`flex flex-[0.9] items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 ${open === "guests" ? "bg-slate-50" : ""}`}
      >
        <UsersIcon size={17} className="shrink-0 text-brand" />
        <span className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Personas</span>
          <span className="truncate text-sm font-medium text-slate-700">{guestLabel}</span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          setOpen(null);
          onSearch?.();
        }}
        className="btn-accent shine shrink-0 sm:px-5"
        aria-label="Buscar"
      >
        <SearchIcon size={17} />
        <span>Buscar</span>
      </button>

      {/* Popover de fechas */}
      {open === "dates" && (
        <div className="absolute left-0 top-full z-40 mt-2 w-[20rem] animate-scale-in rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-900/10 sm:left-auto sm:right-[8.5rem]">
          <CalendarRange range={range} onRange={onRange} />
        </div>
      )}

      {/* Popover de huéspedes */}
      {open === "guests" && (
        <div className="absolute right-2 top-full z-40 mt-2 w-72 animate-scale-in rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-900/10">
          <Stepper
            label="Adultos"
            hint="Desde 13 años"
            value={guests.adults}
            min={1}
            onChange={(adults) => onGuests({ ...guests, adults })}
          />
          <div className="my-2 h-px bg-slate-100" />
          <Stepper
            label="Niños"
            hint="0 a 12 años"
            value={guests.children}
            min={0}
            onChange={(children) => onGuests({ ...guests, children })}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- Calendario de rango (mes navegable) ---------- */

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getTime() === b.getTime();
}

function CalendarRange({ range, onRange }: { range: DateRange; onRange: (r: DateRange) => void }) {
  const today = startOfDay(new Date());
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  // Grilla del mes: arranca en lunes.
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = lunes
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  function pick(day: Date) {
    const { start, end } = range;
    // Sin inicio, o ya hay rango completo -> empezar de nuevo.
    if (!start || (start && end)) {
      onRange({ start: day, end: null });
    } else if (day.getTime() <= start.getTime()) {
      onRange({ start: day, end: null });
    } else {
      onRange({ start, end: day });
    }
  }

  function inRange(day: Date) {
    if (!range.start || !range.end) return false;
    return day.getTime() > range.start.getTime() && day.getTime() < range.end.getTime();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-slate-700">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold text-slate-400">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const past = day.getTime() < today.getTime();
          const isStart = sameDay(day, range.start);
          const isEnd = sameDay(day, range.end);
          const selected = isStart || isEnd;
          const middle = inRange(day);
          return (
            <button
              key={i}
              type="button"
              disabled={past}
              onClick={() => pick(day)}
              className={[
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                past ? "text-slate-300" : "text-slate-700 hover:bg-brand/10",
                middle ? "bg-brand/10" : "",
                selected ? "bg-brand text-white hover:bg-brand" : "",
              ].join(" ")}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-500">{rangeLabel(range)}</span>
        <button
          type="button"
          onClick={() => onRange({ start: null, end: null })}
          className="font-medium text-brand hover:text-brand-dark"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}

/* ---------- Stepper de huéspedes ---------- */

function Stepper({
  label,
  hint,
  value,
  min,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-brand hover:text-brand disabled:opacity-30"
          aria-label={`Quitar ${label}`}
        >
          −
        </button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-brand hover:text-brand"
          aria-label={`Agregar ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ---------- Utilidad de formato ---------- */

function fmt(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()}`;
}
function rangeLabel(range: DateRange): string {
  if (range.start && range.end) return `${fmt(range.start)} – ${fmt(range.end)}`;
  if (range.start) return `${fmt(range.start)} – …`;
  return "Agregá fechas";
}
