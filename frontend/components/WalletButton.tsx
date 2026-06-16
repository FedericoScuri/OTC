"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { hardhatLocal } from "@/lib/chains";
import { shortAddress } from "@/lib/format";

/** Avatar determinista: un degradé generado a partir de la dirección. */
function Identicon({ address, size = 28 }: { address: string; size?: number }) {
  const h1 = parseInt(address.slice(2, 8), 16) % 360;
  const h2 = parseInt(address.slice(8, 14), 16) % 360;
  return (
    <span
      className="inline-block shrink-0 rounded-full ring-2 ring-white/70"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from 90deg, hsl(${h1} 80% 60%), hsl(${h2} 80% 55%), hsl(${h1} 80% 60%))`,
      }}
    />
  );
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasWallet, setHasWallet] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasWallet(typeof window !== "undefined" && Boolean((window as any).ethereum));
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function copy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  // --- Desconectado ---
  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => connect({ connector: injected() })}
          disabled={isPending}
          className="btn-primary shine animate-glow"
        >
          <WalletIcon />
          {isPending ? "Conectando…" : "Conectar wallet"}
        </button>
        {!hasWallet && (
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-slate-400 hover:text-brand"
          >
            ¿No tenés wallet? Instalá MetaMask →
          </a>
        )}
      </div>
    );
  }

  const wrongNetwork = chainId !== hardhatLocal.id;

  // --- Red incorrecta ---
  if (wrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: hardhatLocal.id })}
        className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50/80 px-4 py-2.5 text-sm font-semibold text-amber-700 backdrop-blur transition hover:bg-amber-100"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        Cambiar a red local
      </button>
    );
  }

  // --- Conectado ---
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass card-hover flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700"
      >
        <Identicon address={address} />
        <span className="font-mono">{shortAddress(address)}</span>
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Local
        </span>
        <ChevronIcon className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="glass absolute right-0 z-50 mt-2 w-72 origin-top-right animate-scale-in rounded-2xl p-2">
          <div className="flex items-center gap-3 rounded-xl bg-white/50 p-3">
            <Identicon address={address} size={40} />
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-semibold text-slate-800">
                {shortAddress(address)}
              </p>
              <p className="flex items-center gap-1 text-xs text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Hardhat Local · 31337
              </p>
            </div>
          </div>

          <button
            onClick={copy}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-white/60"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "¡Dirección copiada!" : "Copiar dirección"}
          </button>

          <button
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
          >
            <LogoutIcon />
            Desconectar
          </button>
        </div>
      )}
    </div>
  );
}

/* --- Íconos inline (sin dependencias) --- */
function WalletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg className="text-emerald-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
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
