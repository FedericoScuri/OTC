const crypto = require("crypto");
const { ethers } = require("ethers");
const chain = require("./chain");
const config = require("./config");

/**
 * RF-A01 / PDR §2.1 — Account Abstraction (flujo no-nativo).
 *
 * Emula, para la demo, la pieza que el PDR describe como núcleo del onboarding
 * de usuarios NO cripto: una Smart Account instanciada por MPC a partir del
 * login Web2, con el gas patrocinado por un Paymaster para que el turista pueda
 * reservar **sin poseer criptomonedas nativas**.
 *
 * Cómo se emula cada pieza (y qué sería en producción):
 *  - "MPC/HSM" (RNF-S02): acá derivamos la clave de forma determinista con un
 *    HMAC sobre el email + una semilla del servidor. En prod son nodos MPC reales
 *    que custodian la clave; el usuario nunca ve una seed phrase.
 *  - "Smart Contract Wallet": acá es una EOA derivada. En prod es una cuenta
 *    ERC-4337 desplegada por una factory, operada vía UserOperations.
 *  - "Paymaster": acá una cuenta de servicio con ETH rellena el gas de la cuenta.
 *    En prod es el contrato Paymaster que patrocina el gas vía el EntryPoint.
 */

// Semilla del "MPC" del backend (en prod: nodos MPC/HSM). Configurable por .env.
const MPC_SEED = process.env.AA_MPC_SEED || "otc-demo-mpc-seed-no-usar-en-prod";

// Política de patrocinio de gas del Paymaster (en wei).
const GAS_MIN_WEI = ethers.parseEther("0.01"); // por debajo de esto, se rellena
const GAS_TOPUP_WEI = ethers.parseEther("0.05"); // cuánto deposita el Paymaster

/** Normaliza el identificador Web2 para que la derivación sea estable. */
function normalize(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    const err = new Error("email Web2 inválido");
    err.code = "BAD_EMAIL";
    throw err;
  }
  return email.trim().toLowerCase();
}

/**
 * Deriva de forma determinista la Smart Account de un usuario Web2 (mock MPC).
 * El mismo email siempre devuelve la misma cuenta, sin que el usuario maneje
 * claves. Devuelve un ethers.Wallet conectado al provider.
 */
function smartAccountFor(email) {
  const priv = "0x" + crypto.createHmac("sha256", MPC_SEED).update(normalize(email)).digest("hex");
  return new ethers.Wallet(priv, chain.provider);
}

/**
 * El Paymaster patrocina el gas: si la cuenta está por debajo del mínimo, una
 * cuenta de servicio con ETH la rellena. Así el usuario Web2 no necesita tener
 * cripto nativa para firmar/operar.
 *
 * @param accountAddress dirección de la Smart Account a rellenar.
 * @param paymaster signer de la cuenta de servicio que paga (en la demo, la del
 *   on-ramp). Pasalo envuelto en NonceManager si vas a mandar varias tx seguidas
 *   desde la misma cuenta.
 */
async function sponsorGas(accountAddress, paymaster = chain.onrampSigner()) {
  const bal = await chain.provider.getBalance(accountAddress);
  if (bal >= GAS_MIN_WEI) {
    return { sponsored: false, balanceEth: ethers.formatEther(bal) };
  }
  const tx = await paymaster.sendTransaction({ to: accountAddress, value: GAS_TOPUP_WEI });
  await tx.wait();
  const newBal = await chain.provider.getBalance(accountAddress);
  return {
    sponsored: true,
    txHash: tx.hash,
    amountEth: ethers.formatEther(GAS_TOPUP_WEI),
    paymaster: await paymaster.getAddress(),
    balanceEth: ethers.formatEther(newBal),
  };
}

module.exports = {
  MPC_SEED_IN_USE: MPC_SEED !== "otc-demo-mpc-seed-no-usar-en-prod",
  GAS_MIN_WEI,
  GAS_TOPUP_WEI,
  smartAccountFor,
  sponsorGas,
};
