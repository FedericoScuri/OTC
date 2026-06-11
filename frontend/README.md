# Frontend OTC — Next.js + wagmi

Interfaz web del marketplace OTC. Lee y escribe en los contratos desplegados en
la red local de Hardhat.

## Requisitos previos

Desde la **raíz** del repo, con el nodo local corriendo y los contratos desplegados:

```bash
npm run node          # Terminal 1 — nodo Hardhat (chainId 31337)
npm run deploy:local  # Terminal 2 — despliega contratos + datos de demo
```

El deploy escribe las direcciones en `frontend/public/deployments.json`, que el
frontend lee en runtime. Si no corriste el deploy, usa las direcciones
deterministas de un nodo Hardhat recién levantado (ver `lib/deployments.ts`).

## Correr el frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

## Configurar MetaMask para la demo

1. Agregá una red manual: **RPC** `http://127.0.0.1:8545`, **chainId** `31337`.
2. Importá una de las cuentas de prueba que imprime `npm run node` (clave privada).
   La cuenta "cliente" del deploy ya tiene 10.000 USDC de prueba; cualquier otra
   puede usar el faucet del catálogo (+1000 USDC).

## Estructura

```
frontend/
├── app/                # Páginas (App Router)
│   ├── page.tsx        # Catálogo + compra
│   ├── proveedor/      # Panel del proveedor (en construcción)
│   └── agente/         # Panel del agente (en construcción)
├── components/         # WalletButton, PackageCard, BuyButton, UsdcBalance…
└── lib/                # wagmi, chains, ABIs, direcciones, helpers
```

Los ABIs en `lib/abis.ts` se generan desde los artifacts con `npm run sync:abis`
(en la raíz). No editarlos a mano.
