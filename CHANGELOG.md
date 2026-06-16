# Registro de cambios (Changelog)

Todos los cambios importantes del proyecto se documentan acá.
Antes de pushear, anotá tu cambio en una línea bajo **"Sin publicar"**.

Formato: `[Fecha] — Descripción del cambio (autor)`

---

## Sin publicar

### UI — Rediseño visual del frontend

- [2026-06-15] — Sistema de diseño glassmorphism: tarjetas translúcidas con blur, fondo "aurora" animado (blobs flotantes) y grilla sutil (Claude)
- [2026-06-15] — Apartado de wallet terminado: avatar generado de la dirección, badge de red, copiar al portapapeles y dropdown animado para desconectar; aviso si no hay MetaMask (Claude)
- [2026-06-15] — Header sticky con blur, logo animado e indicador de sección en el nav; tipografía Inter (Claude)
- [2026-06-15] — Catálogo con hero degradé, animación de entrada escalonada de las tarjetas, barra de disponibilidad y skeletons de carga (Claude)
- [2026-06-15] — Botones con degradé + efecto shine/glow, micro-interacciones (hover/elevación) y estados con spinner; paneles de proveedor/agente con el mismo estilo glass (Claude)

### Fase 5 — Backend

- [2026-06-15] — Scaffold del backend en `backend/`: API REST con Express + ethers v6 (CommonJS) (Claude)
- [2026-06-15] — `GET /health`: estado del backend y de la conexión al nodo (RPC) (Claude)
- [2026-06-15] — RF-B01 (PMS/CRS): `GET /api/pms/inventory` expone el inventario externo del proveedor (mock) (Claude)
- [2026-06-15] — RF-B01: `POST /api/pms/sync` publica on-chain los items del PMS faltantes (createPackage), idempotente por nombre; `GET /api/pms/sync-status` compara PMS vs cadena (Claude)
- [2026-06-15] — `NonceManager` en el sync para mandar varias createPackage seguidas sin error de nonce (Claude)
- [2026-06-15] — Script `npm run backend` en la raíz para levantar el backend (Claude)
- [2026-06-15] — RF-D01 (on-ramp): `POST /api/onramp/quote` cotiza tarjeta → USDC con fee del 1.5% (Claude)
- [2026-06-15] — RF-D01: `POST /api/onramp/buy` simula el pago y acredita USDC en la wallet (mintea MockUSDC), con validación de monto y dirección (Claude)

### Fase 4 — Frontend

- [2026-06-11] — Scaffold del frontend en `frontend/`: Next.js 14 (App Router) + TypeScript + Tailwind + wagmi v2/viem (Claude)
- [2026-06-11] — Login Web3 con MetaMask y verificación/cambio de red a Hardhat local (RF-A01) (Claude)
- [2026-06-11] — Catálogo de paquetes: lee `TourPackageNFT` on-chain (totalPackages + getPackage) y los muestra en tarjetas (Claude)
- [2026-06-11] — Flujo de compra desde la UI: approve USDC + `purchase` en el escrow, con cantidad y estado de transacción (RF-C01) (Claude)
- [2026-06-11] — Compra por link de afiliado: el catálogo toma `?ref=<agente>` y lo pasa como agente de la venta (base de RF-D02) (Claude)
- [2026-06-11] — Saldo USDC y faucet de demo (+1000 USDC) en el catálogo (Claude)
- [2026-06-11] — `scripts/sync-abis.js` (`npm run sync:abis`): genera `frontend/lib/abis.ts` desde los artifacts compilados (Claude)
- [2026-06-11] — `scripts/deploy.js` ahora copia las direcciones a `frontend/public/deployments.json` para que el frontend las lea en runtime (Claude)
- [2026-06-11] — Panel del proveedor (`/proveedor`): formulario para publicar paquetes (RF-B02) con validación de fechas/precio/cupo (Claude)
- [2026-06-11] — Panel del proveedor: confirmar servicio (libera el escrow 85/12/3) y reembolsar reservas dentro del plazo (Claude)
- [2026-06-11] — Panel del proveedor: lista de paquetes propios con pausar/activar la venta (Claude)
- [2026-06-11] — Helpers de frontend: `useTx` (envío de tx + espera de recibo) y `ConnectGate` (exige wallet conectada) (Claude)
- [2026-06-11] — Panel del agente (`/agente`): generador de link de afiliado con copiar al portapapeles (RF-D02 completo) (Claude)
- [2026-06-11] — Panel del agente: dashboard de comisiones (cobradas/pendientes 12%) con tabla de ventas atribuidas (Claude)

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
