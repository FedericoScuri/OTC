const express = require("express");
const { ethers } = require("ethers");
const chain = require("../chain");
const aa = require("../account-abstraction");

/**
 * RF-A01 / PDR §2.1 — Account Abstraction (onboarding de usuarios Web2).
 *
 * Demuestra que un usuario que entra con email puede reservar SIN poseer
 * criptomonedas nativas: el backend deriva su Smart Account (mock MPC), un
 * Paymaster patrocina el gas y el USDC llega vía on-ramp (RF-D01).
 */
const router = express.Router();
const ZERO = ethers.ZeroAddress;

function handle(res, e) {
  if (e.code === "BAD_EMAIL") return res.status(400).json({ error: e.message });
  if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
  return res.status(500).json({ error: e.message });
}

// POST /api/aa/account { email } — dirección determinista de la Smart Account.
router.post("/account", (req, res) => {
  try {
    const account = aa.smartAccountFor(req.body?.email);
    res.json({ email: String(req.body.email).trim().toLowerCase(), smartAccount: account.address });
  } catch (e) {
    handle(res, e);
  }
});

/**
 * POST /api/aa/purchase { email, packageId, quantity?, agent? }
 *
 * Compra gasless de punta a punta para un usuario Web2:
 *  1. Deriva su Smart Account (mock MPC).
 *  2. Acredita el USDC necesario (simula el on-ramp tarjeta → USDC, RF-D01).
 *  3. El Paymaster patrocina el gas (el usuario no tiene ETH).
 *  4. La cuenta aprueba el escrow y compra; paga sólo con su USDC.
 */
router.post("/purchase", async (req, res) => {
  const packageId = Number(req.body?.packageId);
  const quantity = Number(req.body?.quantity) || 1;
  const agent = req.body?.agent && ethers.isAddress(req.body.agent) ? req.body.agent : ZERO;
  if (!packageId || quantity < 1) {
    return res.status(400).json({ error: "packageId y quantity (>=1) requeridos" });
  }
  if (!(await chain.isChainUp())) {
    return res.status(503).json({ error: "No hay nodo en el RPC. Corré `npm run node` en la raíz." });
  }

  try {
    const account = aa.smartAccountFor(req.body?.email);

    // Precio on-chain del paquete.
    const pkg = await chain.tourPackage().getPackage(packageId);
    if (pkg.provider === ZERO) {
      const err = new Error("Paquete inexistente");
      err.code = "NOT_FOUND";
      throw err;
    }
    const total = pkg.price * BigInt(quantity);

    // La cuenta de servicio (on-ramp + Paymaster) manda varias tx seguidas; un
    // NonceManager compartido evita el "nonce too low" con el automining.
    const service = new ethers.NonceManager(chain.onrampSigner());

    // 1. Asegurar USDC en la cuenta (simula que el on-ramp ya acreditó el saldo).
    const usdcRead = chain.usdc();
    let onramp = null;
    const balance = await usdcRead.balanceOf(account.address);
    if (balance < total) {
      const shortfall = total - balance;
      const tx = await chain.usdc(service).mint(account.address, shortfall);
      await tx.wait();
      onramp = { creditedUsdc: ethers.formatUnits(shortfall, 6), txHash: tx.hash };
    }

    // 2. El Paymaster patrocina el gas (la cuenta no tiene ETH nativo).
    const gas = await aa.sponsorGas(account.address, service);

    // La Smart Account también manda approve + purchase seguidas: NonceManager.
    const signer = new ethers.NonceManager(account);

    // 3. Approve del escrow desde la Smart Account (si hace falta).
    const escrowAddr = chain.escrow().target;
    let approveTx = null;
    if (total > 0n) {
      const allowance = await usdcRead.allowance(account.address, escrowAddr);
      if (allowance < total) {
        const tx = await chain.usdc(signer).approve(escrowAddr, total);
        await tx.wait();
        approveTx = tx.hash;
      }
    }

    // 4. Compra desde la Smart Account (gas pagado con el ETH patrocinado).
    const escrow = chain.escrow(signer);
    const tx = await escrow.purchase(packageId, quantity, agent);
    const receipt = await tx.wait();

    // bookingId desde el evento Purchased.
    let bookingId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = escrow.interface.parseLog(log);
        if (parsed?.name === "Purchased") {
          bookingId = Number(parsed.args.bookingId);
          break;
        }
      } catch {
        /* log de otro contrato */
      }
    }

    res.status(201).json({
      smartAccount: account.address,
      packageId,
      quantity,
      agent: agent === ZERO ? null : agent,
      priceUsdc: ethers.formatUnits(total, 6),
      bookingId,
      purchaseTxHash: receipt.hash,
      onramp, // USDC acreditado (o null si ya tenía saldo)
      gasSponsored: gas, // patrocinio del Paymaster
      approveTxHash: approveTx,
      userHeldNativeCrypto: false, // el turista nunca tocó cripto nativa
    });
  } catch (e) {
    handle(res, e);
  }
});

module.exports = router;
