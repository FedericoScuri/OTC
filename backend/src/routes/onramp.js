const express = require("express");
const { ethers } = require("ethers");
const chain = require("../chain");

/**
 * RF-D01 — On-ramp fiat (sandbox tipo MoonPay/Transak).
 *
 * Simula la pasarela que convierte "tarjeta" a USDC. En la demo no hay pago
 * real: cotizamos el monto, descontamos el fee de la pasarela y acreditamos el
 * USDC minteando MockUSDC a la wallet del comprador (en prod llega USDC real).
 */
const router = express.Router();

// Parámetros del sandbox. 1 USD ≈ 1 USDC; la pasarela cobra un fee.
const RATE = 1; // USDC por USD
const FEE_PCT = 0.015; // 1.5%
const MIN_FIAT = 10;
const MAX_FIAT = 5000;

/** Cotiza una compra: cuánto USDC recibe el usuario por X fiat. */
function quote(fiatAmount) {
  const feeAmount = round6(fiatAmount * FEE_PCT);
  const usdcAmount = round6((fiatAmount - feeAmount) * RATE);
  return {
    fiatAmount,
    currency: "USD",
    rate: RATE,
    feePct: FEE_PCT,
    feeAmount,
    usdcAmount,
    provider: "sandbox",
  };
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

function validateAmount(fiatAmount) {
  if (typeof fiatAmount !== "number" || !Number.isFinite(fiatAmount) || fiatAmount <= 0) {
    return "fiatAmount debe ser un número mayor a 0";
  }
  if (fiatAmount < MIN_FIAT || fiatAmount > MAX_FIAT) {
    return `fiatAmount debe estar entre ${MIN_FIAT} y ${MAX_FIAT} USD`;
  }
  return null;
}

// POST /api/onramp/quote { fiatAmount } — cotización sin tocar la cadena.
router.post("/quote", (req, res) => {
  const fiatAmount = Number(req.body?.fiatAmount);
  const err = validateAmount(fiatAmount);
  if (err) return res.status(400).json({ error: err });
  res.json(quote(fiatAmount));
});

/**
 * POST /api/onramp/buy { address, fiatAmount } — simula el pago con tarjeta y
 * acredita el USDC en la wallet (mintea MockUSDC).
 */
router.post("/buy", async (req, res) => {
  const { address } = req.body ?? {};
  const fiatAmount = Number(req.body?.fiatAmount);

  const amountErr = validateAmount(fiatAmount);
  if (amountErr) return res.status(400).json({ error: amountErr });
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "address inválida" });
  }
  if (!(await chain.isChainUp())) {
    return res.status(503).json({ error: "No hay nodo en el RPC. Corré `npm run node` en la raíz." });
  }

  try {
    const q = quote(fiatAmount);
    const usdc = chain.usdc(chain.onrampSigner());
    const amount = ethers.parseUnits(String(q.usdcAmount), 6);

    // (En prod acá iría el cobro real con la tarjeta antes de acreditar.)
    const tx = await usdc.mint(address, amount);
    const receipt = await tx.wait();
    const balance = await chain.usdc().balanceOf(address);

    res.json({
      ...q,
      address,
      txHash: receipt.hash,
      newBalance: ethers.formatUnits(balance, 6),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
