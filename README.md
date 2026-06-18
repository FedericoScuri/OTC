# OTC — Open Tourism Commerce

Plataforma **descentralizada de paquetes turísticos** sobre blockchain. Elimina a las OTAs tradicionales (Booking, Expedia) automatizando la distribución de comisiones mediante smart contracts: el pago se divide de forma instantánea entre **proveedor, agente vendedor y plataforma**, sin liquidaciones que tardan semanas.

> Proyecto académico — Sistemas de Información, Universidad Champagnat (Mendoza).
> Referencia: PRD `OTC-PRD-001`.

---

## ¿Por qué blockchain acá?

No es un capricho tecnológico: los **contratos inteligentes** permiten transferir el dinero al hotel al instante y pagarle al agente en segundos — algo que en el sistema financiero tradicional tarda semanas. Además, todo queda registrado de forma **pública y auditable** (sin cláusulas ocultas, sin reseñas falsas, sin overbooking).

## Arquitectura

```
Cliente paga con tarjeta
        │  (MoonPay / Transak — on-ramp fiat, RF-D01)
        ▼
     USDC  ──────────►  CommissionEscrow  (retiene el pago)
                              │
              hotel confirma el servicio
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
      85% Proveedor     12% Agente        3% Plataforma OTC
```

### Smart contracts (`contracts/`)

| Contrato | Estándar | Requisito | Rol |
|----------|----------|-----------|-----|
| [`TourPackageNFT.sol`](contracts/TourPackageNFT.sol) | ERC-1155 | RF-B02 | Tokeniza cada paquete/reserva con fechas, política de cancelación y proveedor. |
| [`CommissionEscrow.sol`](contracts/CommissionEscrow.sol) | — | RF-C01 | Retiene el pago en escrow y lo divide **85 / 12 / 3** al confirmar el servicio. |
| [`SecondaryMarket.sol`](contracts/SecondaryMarket.sol) | — | RF-C02 | Reventa P2P con **royalty forzoso** al proveedor original (5%) + fee plataforma (2%). |
| [`MockUSDC.sol`](contracts/MockUSDC.sol) | ERC-20 | — | Stablecoin de prueba (6 decimales) para la demo local. |

## Stack

- **Contratos:** Solidity `0.8.28` + OpenZeppelin v5 (corre sobre la EVM)
- **Testing:** Hardhat + Chai (21 tests)
- **Red:** Hardhat local para la demo · en producción una L2 EVM (Base / Polygon) para gas < $0.05 (RNF-P02)
- **Frontend:** Next.js + wagmi *(en construcción)*
- **Backend:** Node.js + Express + ethers, mock de PMS/CRS y on-ramp fiat sandbox

---

## 🤝 Trabajo en equipo (Git)

> **Importante:** el repo NO incluye `node_modules/` (está en `.gitignore`). Después de clonar o de traer cambios, corré `npm install` para instalar las dependencias en tu máquina.

### Primera vez — clonar el proyecto

```bash
# 1. Clonar el repositorio
git clone https://github.com/FedericoScuri/OTC.git
cd OTC

# 2. Instalar dependencias
npm install

# 3. Verificar que todo funciona
npm test
```

### Antes de empezar a trabajar — traer lo nuevo

Siempre **antes de ponerte a codear**, traé los últimos cambios para no pisarte con el otro:

```bash
git pull origin main
npm install   # por si el otro agregó alguna dependencia nueva
```

### Después de trabajar — subir tus cambios

```bash
git add .
git commit -m "describí qué hiciste, ej: agrego panel de proveedor"
git pull origin main   # traé cambios del otro ANTES de pushear (evita conflictos)
git push origin main
```

### 📝 Documentar los cambios (obligatorio)

Cada vez que hagas un cambio, **dejá registro de qué hiciste**. Esto es clave para que el equipo (y el profesor) entienda la evolución del proyecto:

1. **Mensaje de commit claro**: describí *qué* cambiaste y *por qué*, no `"cambios"` ni `"update"`.
   - ✅ Bien: `git commit -m "agrego validación de fechas en createPackage"`
   - ❌ Mal: `git commit -m "arreglos"`
2. **Actualizá el [`CHANGELOG.md`](CHANGELOG.md)**: anotá tu cambio en una línea bajo la sección "Sin publicar" antes de pushear. Así queda un historial legible sin tener que leer todos los commits.

### Consejos para no chocarse

- **Hablen antes de arrancar**: dividan el trabajo por carpetas (uno `frontend/`, otro `backend/`) para no editar los mismos archivos.
- **Commits chicos y seguido**: es más fácil resolver un conflicto chico que uno gigante.
- **Si aparece un conflicto** al hacer `pull`: Git marca las líneas en conflicto con `<<<<<<<` y `>>>>>>>`. Editás el archivo dejando la versión correcta, borrás esas marcas, y hacés `git add` + `git commit`.
- **Nunca subas el `.env`** (tiene claves): ya está en `.gitignore`. Para compartir qué variables hacen falta, está el `.env.example`.

---

## Cómo correrlo

Requiere Node.js 18+.

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar los contratos
npm run compile

# 3. Correr los tests
npm test

# 3b. Tests con reporte de gas (demuestra el RNF-P02)
npm run test:gas
```

### Demo en red local

```bash
# Terminal 1 — levantar el nodo local de Hardhat
npm run node

# Terminal 2 — desplegar contratos + datos de demo
npm run deploy:local
```

El deploy crea 3 paquetes de ejemplo (bodega, hotel, aventura), reparte USDC de prueba y guarda las direcciones en `deployments/localhost.json` para el frontend.

---

## Cobertura de requisitos (PRD)

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-B02 | Tokenización de paquetes (ERC-1155) | ✅ Implementado |
| RF-C01 | Dispersión automática de fondos 85/12/3 | ✅ Implementado |
| RF-C02 | Royalty forzoso en reventa | ✅ Implementado (contrato + UI `/mercado`) |
| RF-D01 | On-ramp fiat (tarjeta → USDC) | ✅ Implementado (sandbox) |
| RF-D02 | Generador de links de afiliado | ✅ Implementado |
| RF-A01 | Login híbrido Web2/Web3 | ✅ Implementado (email/registro + wallet MetaMask) |
| RF-B01 | Sincronización con PMS/CRS | ✅ Implementado (mock de PMS + sync on-chain) |
| RNF-P02 | Gas < $0.05 en L2 | ✅ Verificado (~111k gas en el split) |
| RNF-S01 | Auditoría externa de contratos | ⏳ Fase de producción |

---

## 🗺️ Plan de trabajo (roadmap)

El proyecto se construye por fases. Prioridad: **contratos → tests → frontend → backend**.

| Fase | Qué incluye | Estado |
|------|-------------|--------|
| **0 — Setup** | Monorepo, Hardhat, OpenZeppelin, configuración | ✅ Hecho |
| **1 — Contratos core** | `MockUSDC`, `TourPackageNFT`, `CommissionEscrow`, `SecondaryMarket` | ✅ Hecho |
| **2 — Testing** | 21 tests (split, reembolsos, royalty, permisos) + reporte de gas | ✅ Hecho |
| **3 — Deploy local** | Script de deploy con datos de demo | ✅ Hecho |
| **4 — Frontend** | Next.js + wagmi: wallet, catálogo, compra, dashboard de agente (links de afiliado), panel de proveedor | ✅ Hecho |
| **5 — Backend** | API REST Node.js: mock de PMS/CRS (RF-B01) + on-ramp fiat sandbox MoonPay/Transak (RF-D01) | ✅ Hecho |
| **6 — Presentación** | Guion de demo + argumentos de defensa ([`PRESENTACION.md`](PRESENTACION.md)) | ✅ Hecho |

### Próximos pasos concretos

1. ~~**Frontend (Fase 4)**~~ ✅ Hecho — Next.js + wagmi: catálogo, compra, panel de proveedor y panel de agente con links de afiliado. Ver [`frontend/README.md`](frontend/README.md) para correrlo.
2. ~~**Backend (Fase 5)**~~ ✅ Hecho — API REST (Express + ethers): mock de PMS/CRS con sync on-chain y on-ramp fiat sandbox. Ver [`backend/README.md`](backend/README.md).
3. ~~**Presentación (Fase 6)**~~ ✅ Hecho — guion de demo en vivo y argumentos de defensa en [`PRESENTACION.md`](PRESENTACION.md).

---

## Estructura del repo

```
OTC/
├── contracts/        # Smart contracts en Solidity
├── test/             # Tests con Hardhat + Chai
├── scripts/          # Script de deploy
├── frontend/         # Next.js + wagmi: catálogo, compra, paneles
├── backend/          # API REST Node.js: PMS/CRS + on-ramp fiat
├── hardhat.config.js
└── package.json
```
