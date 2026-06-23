# Backend OTC — API REST

API de integración del marketplace OTC. Dos responsabilidades:

- **RF-B01 — PMS/CRS:** expone el inventario externo del proveedor y lo
  sincroniza on-chain como paquetes (`TourPackageNFT.createPackage`).
- **RF-D01 — On-ramp fiat:** sandbox tipo MoonPay/Transak que convierte "tarjeta"
  a USDC, minteando USDC de prueba a la wallet del comprador.
- **RNF-P01 — Guardián de Latencia:** bloqueos lógicos temporales de inventario
  (con TTL) para evitar overbooking mientras la compra se confirma on-chain, bajo
  un presupuesto de respuesta de **800ms** (PDR §2.2). Cada respuesta incluye la
  cabecera `X-Response-Time`.
- **RF-A01 — Account Abstraction:** un usuario que entra con email reserva **sin
  poseer cripto nativa**. El backend deriva su Smart Account (mock MPC), un
  Paymaster patrocina el gas y el USDC llega vía on-ramp (PDR §2.1). *Emulado para
  la demo; en prod sería ERC-4337 con EntryPoint + bundler y nodos MPC/HSM reales.*

## Correr

Necesita el nodo local de Hardhat corriendo y los contratos desplegados (desde
la **raíz**: `npm run node` y `npm run deploy:local`).

```bash
cd backend
cp .env.example .env   # claves de prueba de Hardhat para la demo local
npm install
npm run dev            # http://localhost:4000 (recarga con --watch)
```

## Endpoints

| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/health` | Estado del backend + si hay nodo en el RPC |
| GET | `/api/pms/inventory` | Inventario externo del PMS (mock) |
| GET | `/api/pms/inventory/:extId` | Un item del PMS |
| GET | `/api/pms/sync-status` | Qué items del PMS ya están on-chain |
| POST | `/api/pms/sync` | Publica on-chain los items faltantes (dedup por nombre) |
| POST | `/api/onramp/quote` | Cotiza tarjeta → USDC (fee 1.5%), sin tocar la cadena |
| POST | `/api/onramp/buy` | Simula el pago y acredita USDC en la wallet (mintea MockUSDC) |
| GET | `/api/inventory/availability/:packageId` | Cupo libre = supply on-chain − holds activos |
| POST | `/api/inventory/hold` | Toma un bloqueo lógico temporal (`{packageId, qty}`); **409 si haría overbooking** |
| POST | `/api/inventory/release` | Suelta el bloqueo (`{packageId, token}`) |
| GET | `/api/inventory/holds` | Holds activos + presupuesto de latencia |
| POST | `/api/aa/account` | Smart Account determinista de un usuario Web2 (`{email}`) |
| POST | `/api/aa/purchase` | Compra **gasless** (`{email, packageId, quantity?, agent?}`): on-ramp + Paymaster + compra |

### Ejemplos

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/pms/inventory
curl -X POST http://localhost:4000/api/pms/sync

# On-ramp: cotizar y "comprar" USDC con tarjeta
curl -X POST http://localhost:4000/api/onramp/quote \
  -H 'content-type: application/json' -d '{"fiatAmount":100}'
curl -X POST http://localhost:4000/api/onramp/buy \
  -H 'content-type: application/json' \
  -d '{"fiatAmount":250,"address":"0xTuWallet"}'

# Guardián de Latencia: ver cupo, tomar un hold y comprobar el bloqueo de overbooking
curl http://localhost:4000/api/inventory/availability/1
curl -X POST http://localhost:4000/api/inventory/hold \
  -H 'content-type: application/json' -d '{"packageId":1,"qty":1}'

# Account Abstraction: compra gasless de un usuario Web2 (sin cripto nativa)
curl -X POST http://localhost:4000/api/aa/account \
  -H 'content-type: application/json' -d '{"email":"turista@gmail.com"}'
curl -X POST http://localhost:4000/api/aa/purchase \
  -H 'content-type: application/json' \
  -d '{"email":"turista@gmail.com","packageId":2,"quantity":1}'
```

> Las claves del `.env.example` son las cuentas deterministas de Hardhat, **solo
> para la demo local**. En testnet/producción se usan claves de prueba propias y
> nunca una wallet con fondos reales.
