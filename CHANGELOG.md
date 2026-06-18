# Registro de cambios (Changelog)

Todos los cambios importantes del proyecto se documentan acá.
Antes de pushear, anotá tu cambio en una línea bajo **"Sin publicar"**.

Formato: `[Fecha] — Descripción del cambio (autor)`

---

## Sin publicar

### Fix — z-index del calendario en el buscador

- [2026-06-18] — El popover del calendario quedaba tapado por las tarjetas de paquetes; ahora el buscador vive en un contexto de apilamiento `z-30` (sobre las tarjetas, bajo el header sticky) y el calendario se muestra sólido por encima (Claude)

### Demo — Reservas pre-cargadas + página "Mis reservas"

- [2026-06-18] — El deploy pre-carga 2 reservas REALES on-chain en la wallet del cliente/admin1 (Bodega vía agente + Rafting directa), para que el perfil ya tenga datos en la presentación (Claude)
- [2026-06-18] — El cliente queda con ~9.800 USDC de prueba gratis para crear más reservas en vivo sin costo (Claude)
- [2026-06-18] — Nueva página `/reservas` ("Mis reservas"): lista las reservas on-chain de la wallet conectada con estado (pendiente/liberada/reembolsada), fechas y monto; permite cancelar dentro del plazo. "Mis reservas" agregado al nav (Claude)
- [2026-06-18] — NOTA: admin1 (cuenta de login) usa la wallet Cliente de Hardhat (cuenta #3) para ver estas reservas, ya que viven on-chain por wallet (Claude)

### Frontend — Login/registro, landing y buscador funcional (RF-A01)

- [2026-06-18] — Autenticación Web2 de demo (`lib/auth.tsx`): registro, login y sesión persistente en localStorage, con roles cliente/proveedor/agente (RF-A01, lado Web2 de la "autenticación híbrida") (Claude)
- [2026-06-18] — Nuevas páginas: `/` ahora es la **landing pública** (hero, categorías, cómo funciona, beneficios); `/login` y `/registro` con formularios (Claude)
- [2026-06-18] — El catálogo se movió a `/catalogo` (protegido); `/mercado`, `/proveedor` y `/agente` ahora exigen login vía `AuthGate` (redirige a `/login?next=` conservando el destino, así sobreviven los links de afiliado) (Claude)
- [2026-06-18] — Header condicional: nav + wallet + menú de usuario (nombre, rol, cerrar sesión) si hay login; botones "Iniciar sesión"/"Crear cuenta" si no (Claude)
- [2026-06-18] — Buscador 100% funcional: calendario real con selección de rango (check-in/check-out, navegación por meses) y selector de adultos/niños con steppers; el destino sigue filtrando en vivo (Claude)
- [2026-06-18] — Clase `.input` reutilizable en `globals.css`; link de afiliado ahora apunta a `/catalogo?ref=` (Claude)
- [2026-06-18] — NOTA: el login es de demo (usuarios en localStorage, contraseña ofuscada con base64, no es seguridad real); en producción iría con backend + Account Abstraction según el PRD (Claude)

### Frontend — Mercado secundario (RF-C02)

- [2026-06-18] — Nueva página `/mercado` con interfaz de reventa, cerrando el último hueco visual del proyecto (Claude)
- [2026-06-18] — "Reservas en reventa": vitrina de publicaciones activas con desglose del reparto forzoso (royalty 5% proveedor + fee 2% plataforma + resto al vendedor) y compra (approve USDC + `buy`) (Claude)
- [2026-06-18] — "Revender mi reserva": lista los NFTs que posee el usuario y permite publicarlos (`setApprovalForAll` + `list`) con precio y cantidad (Claude)
- [2026-06-18] — Hooks `useListings` y `useOwnedReservations` en `lib/contracts.ts`; "Mercado" agregado al nav del Header (Claude)
- [2026-06-18] — Guion de presentación actualizado: la Escena 6 ahora se demuestra desde la UI; RF-C02 marcado con interfaz completa (Claude)

### Fase 6 — Presentación

- [2026-06-18] — `PRESENTACION.md`: guion de demo paso a paso (6 escenas), checklist pre-demo con cuentas de MetaMask, los 3 argumentos de defensa, tabla de cobertura de requisitos, preguntas probables del tribunal y plan B (Claude)

### UI — Estilo sitio de reservas + paleta atardecer

- [2026-06-16] — Nueva paleta: violeta como color de marca + rosa coral de acento (en `tailwind.config.ts` y `globals.css`); botón de acento `.btn-accent` (Claude)
- [2026-06-16] — Catálogo rediseñado como sitio de reservas: barra de búsqueda (destino/fechas/personas) con filtro en vivo por nombre (Claude)
- [2026-06-16] — Fichas tipo alojamiento: "foto" por categoría, badge, favoritos, ubicación, rating con estrellas, "cancelación gratis hasta {fecha}" (fecha real del refundDeadline) y stepper de cantidad (Claude)
- [2026-06-16] — Set de íconos SVG inline (`components/icons.tsx`); fondo aurora más sutil y recoloreado; botón de compra renombrado a "Reservar" (Claude)
- [2026-06-16] — NOTA: foto, ubicación, rating y reseñas son placeholders de demo (el contrato aún no guarda esa metadata); la fecha de cancelación y el cupo sí son datos on-chain reales (Claude)

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
