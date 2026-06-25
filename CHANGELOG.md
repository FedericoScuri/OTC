# Registro de cambios (Changelog)

Todos los cambios importantes del proyecto se documentan acá.
Antes de pushear, anotá tu cambio en una línea bajo **"Sin publicar"**.

Formato: `[Fecha] — Descripción del cambio (autor)`

---

## Sin publicar

### Reservas "sin wallet" (gasless) ahora aparecen en "Mis reservas"

- [2026-06-25] — Las compras gasless (botón "Reservar gratis / Pagar con tarjeta — sin wallet") quedan a nombre de la Smart Account que el backend deriva del email; antes no se veían en "Mis reservas" (que solo miraba la wallet conectada). Ahora `MyReservations` resuelve esa Smart Account vía `POST /api/aa/account` y muestra también esas reservas, con una etiqueta "sin wallet" (Claude)
- [2026-06-25] — `/reservas` ya no exige conectar MetaMask: con sólo estar logueado ves tus reservas sin wallet; si conectás una wallet, se suman las hechas con MetaMask. Botón para conectar opcional (Claude)
- [2026-06-25] — Verificado end-to-end: compra gasless del paquete gratis → booking on-chain a nombre de la Smart Account del email → coincide con lo que muestra "Mis reservas" (Claude)

### UX — Actividades gratuitas se muestran como "Gratis" + ayuda de nonce

- [2026-06-25] — Los paquetes/reservas sin costo ahora muestran **"Gratis"** en vez de "0,00 USDC" en todo el sitio: tarjeta del catálogo, "Mis reservas", panel proveedor (paquetes y reservas en escrow) y reventa. Los botones de reserva en paquetes gratis dicen "Reservar gratis". Helpers `isFree`/`formatPrice` en `lib/format.ts` (Claude)
- [2026-06-25] — Mensaje de error más útil al reservar: si MetaMask quedó desincronizada tras reiniciar el nodo local (error de *nonce*), el `BuyButton` explica cómo arreglarlo (Configuración → Avanzado → "Borrar datos de actividad y nonce") en vez de un genérico (Claude)

### Presentación de respaldo → clickthrough de capturas reales

- [2026-06-25] — `presentacion/index.html` pasó a ser un visor navegable de capturas REALES de la app (se ve literalmente como el sitio), con marco tipo navegador y cartel por pantalla. La lista de slides se edita arriba del archivo; si falta una captura, avisa cuál (Claude)
- [2026-06-25] — `presentacion/capturas/LEEME.txt` con la lista exacta de capturas a sacar y con qué cuenta/rol; las imágenes quedan gitignoreadas (Claude)
- [2026-06-25] — El deck narrado anterior (con calculadora interactiva 85/12/3) queda como alternativa en `presentacion/deck.html` (Claude)

### Branding + presentación de respaldo

- [2026-06-25] — Logo nuevo (`components/Logo.tsx`): un pin de destino con el degradé de la marca (violeta→coral) y un destello, en reemplazo de la "O" pelada del header (Claude)
- [2026-06-25] — Presentación interactiva de respaldo (`presentacion/index.html`): deck autónomo de 12 slides con el estilo de la web, navegable con flechas/click, con calculadora interactiva del reparto 85/12/3. Se abre sin nodo/backend/internet — plan B si la demo en vivo falla (Claude)

### Landing — sección "¿Por qué blockchain?"

- [2026-06-18] — Nueva sección en la página de inicio que explica POR QUÉ se usa blockchain, con 4 motivos concretos (pagos al instante, sin intermediarios que retengan fondos, transparente/auditable, la reserva es tuya como NFT revendible) + íconos nuevos (Claude)
- [2026-06-18] — Doc al día: `README.md` y `PRESENTACION.md` ahora dicen 16 paquetes (5 gratis) y 26 tests, en línea con el estado actual (Claude)

### Frontend — Cableado de las features del backend a la UI

- [2026-06-22] — Nuevo cliente `lib/backend.ts` (fetch tipado al backend, base URL configurable con `NEXT_PUBLIC_BACKEND_URL`) (Claude)
- [2026-06-22] — Compra **gasless** en el catálogo (#2): botón "Pagar con tarjeta (sin wallet)" en cada tarjeta; un usuario logueado reserva sin wallet ni cripto. Verificado en navegador (muestra "Reserva #N creada sin wallet") (Claude)
- [2026-06-22] — Cupo en tiempo real (#4): badge "N libres · Xms" en cada tarjeta, leído del Guardián de Latencia (supply on-chain − holds + latencia). Verificado en navegador (Claude)
- [2026-06-22] — Panel KYB en `/proveedor` (#1): estado del trámite + formulario de envío + verificación admin (gate de publicación). Retención fiscal (#5) read-only on-chain. Ambos detrás del ConnectGate (Claude)

### Contrato — Retención impositiva por jurisdicción (RNF-L01, cierra #5)

- [2026-06-22] — `CommissionEscrow` deja de tener el split 85/12/3 fijo: nueva `taxWallet` + `providerRetentionBps` por proveedor. Al liberar fondos, la retención (según la jurisdicción del proveedor) se descuenta de su parte y se gira a la cuenta recaudadora; evento `TaxWithheld`. Setters `setTaxWallet`/`setProviderRetention` (onlyOwner) (Claude)
- [2026-06-22] — Backward-compatible: retención default 0 → el reparto sigue siendo 85/12/3, los 21 tests previos pasan sin cambios (Claude)
- [2026-06-22] — 5 tests nuevos (26 en total): retención del 10% (proveedor 87% / tax 10% / plataforma 3%), exige taxWallet, tope PROVIDER_BPS, solo owner. ABIs resincronizados al frontend (Claude)

### Backend — KYC/KYB de proveedores (RF-A02, cierra #1)

- [2026-06-22] — Nuevo módulo `backend/src/kyb.js`: trámite KYB de proveedores con estados NONE → PENDING → VERIFIED/REJECTED (mock del pipeline legal digital) (Claude)
- [2026-06-22] — Nuevas rutas `/api/kyb/*`: `submit`, `status/:provider`, `decide` (admin) y `list` (Claude)
- [2026-06-22] — **Gate real**: `/api/pms/sync` ahora devuelve **403** si el proveedor que firma la publicación no tiene KYB verificado (RF-A02: verificar antes de publicar inventario masivo) (Claude)
- [2026-06-22] — Verificado E2E: sync sin KYB → 403; tras submit (PENDING) → 403; tras decide(approve) → VERIFIED y el sync publica 4 paquetes (Claude)

### Backend — Account Abstraction gasless (RF-A01 / PDR §2.1, cierra #2)

- [2026-06-22] — Nuevo módulo `backend/src/account-abstraction.js`: deriva la Smart Account del usuario Web2 de forma determinista a partir del email (mock MPC, HMAC con semilla `AA_MPC_SEED`) + Paymaster que patrocina el gas para que el turista no necesite cripto nativa (Claude)
- [2026-06-22] — Nuevas rutas `/api/aa/*`: `account` (dirección determinista por email) y `purchase` (compra **gasless** de punta a punta: on-ramp acredita USDC → Paymaster patrocina gas → la Smart Account aprueba y compra) (Claude)
- [2026-06-22] — `chain.escrow()` + ABI del escrow/approve en el backend; NonceManager en las cuentas de servicio y en la Smart Account para evitar "nonce too low" con automining (Claude)
- [2026-06-22] — Verificado E2E: usuario `turista@gmail.com` sin ETH ni USDC compra el Hotel (250 USDC) → bookingId minteado, gas patrocinado (0.05 ETH), `userHeldNativeCrypto: false`; misma cuenta determinista en cada llamada (Claude)
- [2026-06-22] — NOTA: AA emulada para la demo. En producción sería ERC-4337 (EntryPoint + bundler + contrato Paymaster) y nodos MPC/HSM reales (RNF-S02) (Claude)

### Backend — Guardián de Latencia anti-overbooking (RNF-P01 / PDR §2.2, cierra #4)

- [2026-06-22] — Nuevo módulo `backend/src/latency-guard.js`: presupuesto de respuesta de 800ms (`withLatencyBudget`, aborta si se supera) + bloqueos lógicos temporales de inventario con TTL (holds) para evitar la venta simultánea de la misma unidad mientras la tx on-chain se confirma (Claude)
- [2026-06-22] — Nuevas rutas `/api/inventory/*`: `availability/:id` (cupo libre = supply on-chain − holds), `hold` (toma bloqueo, **409 si haría overbooking**), `release`, `holds`. Middleware que expone `X-Response-Time` en cada respuesta (Claude)
- [2026-06-22] — Verificado E2E contra la cadena: paquete con cupo 19 libre → hold de 19 OK, la unidad 20 devuelve 409 OVERBOOKING; latencia ~15ms (< 800ms) (Claude)

### Revisión de documentos (PRD/PDR) + deploy a testnet

- [2026-06-22] — Revisión de PRD `OTC-PRD-001` y PDR `OTC-PDR-001` contra lo implementado. Se abrieron 5 issues en GitHub con los deltas reales: KYC/KYB (#1, RF-A02), Account Abstraction + Paymaster (#2, RF-A01/PDR §2.1), deploy a testnet pública (#3), capa de latencia anti-overbooking (#4, RNF-P01/PDR §2.2) y retención impositiva (#5, RNF-L01) (Claude)
- [2026-06-22] — Infra (cierra el código de #3): habilitada la red `baseSepolia` en `hardhat.config.js` (chainId 84532) + verificación en BaseScan; nuevos scripts `deploy:testnet`/`verify:testnet` y `scripts/verify.js` (verifica los 4 contratos con sus args de constructor); el deploy siembra 3 paquetes en testnet e imprime los links del explorer; `.env.example` con `BASESCAN_API_KEY`. Falta sólo cargar claves + ETH de faucet y correrlo (Claude)

### Roles y actividades — separación creador / usuario + más demo

- [2026-06-18] — Gateo por rol en `AuthGate` (prop `role`): `/proveedor` ahora es solo para el rol creador (proveedor) y `/agente` solo para agente; quien no corresponde ve un aviso de "Sección restringida" con link al catálogo (Claude)
- [2026-06-18] — Nav del Header según rol: el usuario general solo ve Catálogo / Mis reservas / Mercado; "Crear actividades" aparece solo para el creador y "Agente" solo para el agente (Claude)
- [2026-06-18] — Cuenta de demo del agente (`agente@otc.com` / agente123); ya hay una por rol. admin1 sigue siendo usuario general (cliente) (Claude)
- [2026-06-18] — Login con acceso rápido a las cuentas de demo (un click por rol) para la presentación (Claude)
- [2026-06-18] — Deploy con más variedad: 16 actividades, **5 gratuitas (precio 0)** para mostrar el flujo de reserva sin costo (Claude)

### UX — Claridad de "Mis reservas" (wallet vs login)

- [2026-06-18] — "Mis reservas" ahora muestra un banner con la wallet conectada y la cantidad de reservas, aclarando que las reservas son on-chain (atadas a la wallet, no al login) (Claude)
- [2026-06-18] — Si la wallet conectada no tiene reservas, el aviso explica que para la demo hay que conectar la cuenta Cliente (…b906) o reservar en el catálogo (Claude)

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
