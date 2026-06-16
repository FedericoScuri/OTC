# Backend OTC — API REST

API de integración del marketplace OTC. Dos responsabilidades:

- **RF-B01 — PMS/CRS:** expone el inventario externo del proveedor y lo
  sincroniza on-chain como paquetes (`TourPackageNFT.createPackage`).
- **RF-D01 — On-ramp fiat:** sandbox tipo MoonPay/Transak que convierte "tarjeta"
  a USDC, minteando USDC de prueba a la wallet del comprador.

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
```

> Las claves del `.env.example` son las cuentas deterministas de Hardhat, **solo
> para la demo local**. En testnet/producción se usan claves de prueba propias y
> nunca una wallet con fondos reales.
