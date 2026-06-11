# Registro de cambios (Changelog)

Todos los cambios importantes del proyecto se documentan acá.
Antes de pushear, anotá tu cambio en una línea bajo **"Sin publicar"**.

Formato: `[Fecha] — Descripción del cambio (autor)`

---

## Sin publicar

### Fase 4 — Frontend (en curso)

- [2026-06-11] — Scaffold del frontend en `frontend/`: Next.js 14 (App Router) + TypeScript + Tailwind + wagmi v2/viem (Claude)
- [2026-06-11] — Login Web3 con MetaMask y verificación/cambio de red a Hardhat local (RF-A01) (Claude)
- [2026-06-11] — Catálogo de paquetes: lee `TourPackageNFT` on-chain (totalPackages + getPackage) y los muestra en tarjetas (Claude)
- [2026-06-11] — Flujo de compra desde la UI: approve USDC + `purchase` en el escrow, con cantidad y estado de transacción (RF-C01) (Claude)
- [2026-06-11] — Compra por link de afiliado: el catálogo toma `?ref=<agente>` y lo pasa como agente de la venta (base de RF-D02) (Claude)
- [2026-06-11] — Saldo USDC y faucet de demo (+1000 USDC) en el catálogo (Claude)
- [2026-06-11] — `scripts/sync-abis.js` (`npm run sync:abis`): genera `frontend/lib/abis.ts` desde los artifacts compilados (Claude)
- [2026-06-11] — `scripts/deploy.js` ahora copia las direcciones a `frontend/public/deployments.json` para que el frontend las lea en runtime (Claude)

---

## [0.1.0] — 2026-06-11

Primera versión: toda la capa de smart contracts funcionando.

- Setup del monorepo con Hardhat 2.28 + OpenZeppelin v5 (EVM Cancun)
- `TourPackageNFT.sol` (ERC-1155): tokenización de paquetes turísticos con fechas, política de cancelación y proveedor (RF-B02)
- `CommissionEscrow.sol`: escrow con división automática 85% proveedor / 12% agente / 3% plataforma (RF-C01)
- `SecondaryMarket.sol`: reventa P2P con royalty forzoso al proveedor (RF-C02)
- `MockUSDC.sol`: stablecoin de prueba (6 decimales) para la demo local
- 21 tests pasando (split, reembolsos, royalty, permisos) + reporte de gas
- Script de deploy con datos de demo (3 paquetes: bodega, hotel, aventura)
- README con arquitectura, roadmap e instrucciones de Git para el equipo
