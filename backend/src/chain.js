const { ethers } = require("ethers");
const config = require("./config");
const abis = require("./abis");

/**
 * Acceso a la cadena vía ethers v6. El backend firma transacciones con cuentas
 * de servicio (operador on-ramp / proveedor) para la demo local.
 */
const provider = new ethers.JsonRpcProvider(config.rpcUrl);

function wallet(key) {
  if (!key) throw new Error("Falta la clave privada en .env");
  return new ethers.Wallet(key, provider);
}

/** Contrato USDC conectado a un signer (o solo lectura si no se pasa). */
function usdc(signerOrProvider = provider) {
  return new ethers.Contract(config.addresses.MockUSDC, abis.MockUSDC, signerOrProvider);
}

/** Contrato del NFT de paquetes conectado a un signer (o solo lectura). */
function tourPackage(signerOrProvider = provider) {
  return new ethers.Contract(config.addresses.TourPackageNFT, abis.TourPackageNFT, signerOrProvider);
}

/** ¿Hay un nodo respondiendo en el RPC configurado? */
async function isChainUp() {
  try {
    await provider.getBlockNumber();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  provider,
  wallet,
  usdc,
  tourPackage,
  isChainUp,
  onrampSigner: () => wallet(config.onrampKey),
  providerSigner: () => wallet(config.providerKey),
};
