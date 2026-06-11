# Registro de cambios (Changelog)

Todos los cambios importantes del proyecto se documentan acá.
Antes de pushear, anotá tu cambio en una línea bajo **"Sin publicar"**.

Formato: `[Fecha] — Descripción del cambio (autor)`

---

## Sin publicar

<!-- Agregá acá tus cambios antes de hacer push, ej:
- [2026-06-12] — Agrego panel de proveedor en el frontend (Tu Nombre)
-->

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
