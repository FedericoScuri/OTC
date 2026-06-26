"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { parseUnits, decodeEventLog, type Address } from "viem";
import { QRCodeSVG } from "qrcode.react";
import { config } from "@/lib/wagmi";
import { useContracts } from "@/lib/contracts";
import { backend, type PayLink, type PayLinkBreakdown } from "@/lib/backend";
import { shortAddress } from "@/lib/format";
import { WalletButton } from "./WalletButton";
import { CheckIcon } from "./icons";

type FullLink = PayLink & PayLinkBreakdown;
type Status = "idle" | "approving" | "paying" | "surcharge" | "recording" | "gasless" | "done" | "error";

/**
 * Checkout de un link de pago (RF-D02). El cliente carga sus datos y paga el
 * precio final on-chain:
 *   1. approve(base) al escrow  → 2. purchase(paquete, 1, agente)  →
 *   3. transfer(sobreprecio) directo al agente  → 4. registra la venta.
 * La base se reparte 85/12/3 al confirmar el servicio; el sobreprecio queda
 * íntegro para el agente.
 */
export function PayLinkCheckout({
  code,
  link,
  onPaid,
}: {
  code: string;
  link: FullLink;
  onPaid?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const { usdc, escrow } = useContracts();
  const { writeContractAsync } = useWriteContract();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<{
    bookingId: number | null;
    txHash: string;
    surchargeTxHash: string | null;
  }>();

  const base = parseUnits(link.basePriceUsdc, 6);
  const surcharge = parseUnits(link.surchargeUsdc, 6);
  const agent = link.agent as Address;
  const busy =
    status === "approving" ||
    status === "paying" ||
    status === "surcharge" ||
    status === "recording" ||
    status === "gasless";
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  /** Pago "sin wallet": el backend deriva la Smart Account del email y paga todo. */
  async function payGasless() {
    if (!email || !email.includes("@")) {
      setError("Cargá un email válido para pagar sin wallet.");
      return;
    }
    setError(undefined);
    setStatus("gasless");
    try {
      const r = await backend.post<{
        bookingId: number | null;
        txHash: string;
        surchargeTxHash: string | null;
      }>(`/api/paylinks/${code}/pay-gasless`, { email });
      setResult({ bookingId: r.bookingId, txHash: r.txHash, surchargeTxHash: r.surchargeTxHash });
      setStatus("done");
      onPaid?.();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "No se pudo completar el pago sin wallet.");
    }
  }

  async function pay() {
    if (!address) return;
    setError(undefined);
    try {
      // 1. Allowance del escrow para la base.
      const allowance = (await readContract(config, {
        ...usdc,
        functionName: "allowance",
        args: [address, escrow.address],
      })) as bigint;
      if (allowance < base) {
        setStatus("approving");
        const h = await writeContractAsync({
          ...usdc,
          functionName: "approve",
          args: [escrow.address, base],
        });
        await waitForTransactionReceipt(config, { hash: h });
      }

      // 2. Compra del paquete (retiene la base en escrow y mintea la reserva).
      setStatus("paying");
      const buyHash = await writeContractAsync({
        ...escrow,
        functionName: "purchase",
        args: [BigInt(link.packageId), 1n, agent],
      });
      const receipt = await waitForTransactionReceipt(config, { hash: buyHash });

      let bookingId: number | null = null;
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== escrow.address.toLowerCase()) continue;
        try {
          const ev = decodeEventLog({ abi: escrow.abi, data: log.data, topics: log.topics });
          if (ev.eventName === "Purchased") {
            bookingId = Number((ev.args as { bookingId: bigint }).bookingId);
            break;
          }
        } catch {
          /* otro evento */
        }
      }

      // 3. Sobreprecio: transferencia USDC directa al agente.
      let surchargeTxHash: string | null = null;
      if (surcharge > 0n) {
        setStatus("surcharge");
        const sh = await writeContractAsync({
          ...usdc,
          functionName: "transfer",
          args: [agent, surcharge],
        });
        await waitForTransactionReceipt(config, { hash: sh });
        surchargeTxHash = sh;
      }

      // 4. Registrar la venta en el backend (no bloquea el éxito on-chain).
      setStatus("recording");
      await backend
        .post(`/api/paylinks/${code}/sale`, {
          bookingId,
          customer: address,
          wallet: address,
          email,
          phone,
          txHash: buyHash,
          surchargeTxHash,
          quantity: 1,
        })
        .catch(() => {});

      setResult({ bookingId, txHash: buyHash, surchargeTxHash });
      setStatus("done");
      onPaid?.();
    } catch (e) {
      setStatus("error");
      setError(parseError(e));
    }
  }

  if (status === "done" && result) {
    return (
      <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
        <p className="flex items-center gap-2 text-base font-semibold text-emerald-800">
          <CheckIcon size={18} /> ¡Pago confirmado!
        </p>
        <p className="text-emerald-700">
          {result.bookingId ? `Reserva #${result.bookingId} creada. ` : ""}
          Quedó registrada y asociada al agente. El pago del paquete está protegido en escrow hasta
          que se confirme el servicio.
        </p>
        <div className="mt-1 space-y-0.5 break-all font-mono text-[11px] text-emerald-700/80">
          <p>tx paquete: {result.txHash}</p>
          {result.surchargeTxHash && <p>tx sobreprecio: {result.surchargeTxHash}</p>}
        </div>
      </div>
    );
  }

  const statusLabel =
    status === "approving"
      ? "Aprobando USDC…"
      : status === "paying"
        ? "Pagando el paquete…"
        : status === "surcharge"
          ? "Transfiriendo el sobreprecio…"
          : status === "recording"
            ? "Registrando la venta…"
            : `Pagar ${Number(link.finalPriceUsdc).toLocaleString("es-AR", { minimumFractionDigits: 2 })} USDC`;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Tu email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vos@email.com"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Tu teléfono</span>
          <input
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+54 261 555 1234"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          />
        </label>
      </div>

      {/* Método de pago: wallet (principal) */}
      {!isConnected ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="mb-3 text-sm text-slate-600">Conectá tu wallet para pagar en blockchain.</p>
          <WalletButton />
        </div>
      ) : (
        <button onClick={pay} disabled={busy} className="btn-primary shine w-full">
          {busy && <Spinner />} {statusLabel}
        </button>
      )}

      {/* Alternativa sin wallet: pago gasless por email (RF-A01) */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> o <span className="h-px flex-1 bg-slate-200" />
      </div>
      <button onClick={payGasless} disabled={busy} className="btn-accent shine w-full">
        {status === "gasless" ? (
          <>
            <Spinner /> Procesando pago sin wallet…
          </>
        ) : (
          "💳 Pagar sin wallet (con tu email)"
        )}
      </button>
      <p className="text-center text-[11px] text-slate-400">
        Pagás con tu email, sin cripto ni MetaMask. El gas lo cubre la plataforma.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* QR + dirección de recepción */}
      <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <summary className="cursor-pointer font-medium text-slate-700">
          Pagar desde otro dispositivo (QR) / dirección de recepción
        </summary>
        <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          {pageUrl && (
            <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200">
              <QRCodeSVG value={pageUrl} size={120} />
            </div>
          )}
          <div className="space-y-1 text-xs text-slate-500">
            <p>Escaneá el QR para abrir esta página de pago en tu celular con wallet.</p>
            <p className="mt-2 font-medium text-slate-600">Dirección de recepción (escrow):</p>
            <p className="break-all font-mono text-slate-700">{escrow.address}</p>
            <p className="text-slate-400">({shortAddress(escrow.address)} · red Hardhat local)</p>
          </div>
        </div>
      </details>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="inline h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

function parseError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const match = msg.match(/(Escrow|TourPackageNFT|Market): [^"\n]+/);
  if (match) return match[0];
  if (msg.includes("User rejected")) return "Cancelaste la transacción.";
  if (/nonce/i.test(msg)) {
    return "MetaMask quedó desincronizada con la red. En MetaMask: Configuración → Avanzado → “Borrar datos de actividad y nonce”, y reintentá.";
  }
  if (/insufficient/i.test(msg)) return "Saldo de USDC insuficiente para el precio final.";
  return "No se pudo completar el pago.";
}
