# 🎤 Guion de presentación y demo — OTC

Documento para defender el proyecto en vivo. Incluye el **guion de demo paso a paso**, los **argumentos de defensa** y las **preguntas probables** del tribunal.

> Duración sugerida: 10–12 min (3 min de contexto + 6 min de demo + cierre).

---

## 1. Pitch de apertura (30 seg, sin pantalla)

> "Las OTAs como Booking o Expedia cobran entre **15% y 25%** de comisión y le pagan al hotel **semanas después**. OTC reemplaza ese intermediario por **contratos inteligentes**: el cliente paga, y en el mismo instante en que el hotel confirma el servicio, el dinero se reparte solo —85% al proveedor, 12% al agente, 3% a la plataforma— de forma automática, transparente y auditable. Todo sobre blockchain."

**Idea fuerza:** la blockchain acá no es un capricho, es una **herramienta de eficiencia** (pagos instantáneos vs. semanas).

---

## 2. Checklist pre-demo (preparar ANTES de exponer)

Dejá **3 terminales** abiertas en `~/Desktop/OTC` y, la primera vez, instalá dependencias:

```bash
# (solo una vez) instalar deps del front y back
cd ~/Desktop/OTC/frontend && npm install
cd ~/Desktop/OTC/backend && npm install
```

Orden de arranque el día de la demo:

| Terminal | Comando | Qué hace |
|----------|---------|----------|
| **1** | `npm run node` | Nodo blockchain local (chainId 31337). **Dejar corriendo.** |
| **2** | `npm run deploy:local` | Despliega los 4 contratos + crea 16 paquetes de demo (5 gratis) + 2 reservas |
| **3** | `npm run backend` | API REST (PMS/CRS + on-ramp) en `http://localhost:4000` |
| **4** | `cd frontend && npm run dev` | Web en `http://localhost:3000` |

**MetaMask** (red ya agregada): RPC `http://127.0.0.1:8545`, chainId `31337`. Importá estas cuentas de prueba (claves públicas de Hardhat, sin valor real):

| Rol | Dirección | Clave privada (importar en MetaMask) |
|-----|-----------|--------------------------------------|
| Proveedor | `0x7099...79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| Agente | `0x3C44...93BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| Cliente (**admin1**) | `0x90F7...b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |

> 🎒 **Datos pre-cargados para la demo:** la wallet **Cliente** (que usás logueado como **admin1**) ya viene con **2 reservas reales** en `/reservas` (una Bodega vía agente, una Rafting directa) y **~9.800 USDC gratis** para reservar más en vivo. Así "Mis reservas" no está vacío y podés ir directo a confirmar/revender sin tener que comprar primero.

> El cliente ya arranca con 10.000 USDC de prueba. Cualquier cuenta puede usar el **faucet** del catálogo (+1000 USDC).

---

## 3. Guion de demo paso a paso

### Escena 1 — "Nace el inventario" (contratos)
- Mostrá la **Terminal 2** (deploy): se ven desplegarse los 4 contratos y crearse **16 paquetes mendocinos on-chain** (bodega, hotel, aventura y más, incluidas **5 actividades gratuitas**).
- Frase: *"Cada paquete turístico es un NFT (ERC-1155) con sus fechas, cupo y política de cancelación grabados en la blockchain."* (RF-B02)

### Escena 2 — "El cliente entra y reserva" (frontend, cuenta Cliente)
1. Abrí `http://localhost:3000` → **página de inicio**. Mostrá la propuesta de valor 5 seg.
2. **Crear cuenta**: registrate (nombre, email, contraseña, rol "Cliente") → quedás logueado. (RF-A01, lado Web2)
3. Ya en `/catalogo`, **conectá MetaMask** con la cuenta **Cliente** (RF-A01, lado Web3 — "autenticación híbrida").
4. Probá el **buscador**: escribí en *Destino*, abrí el *calendario* y elegí fechas, sumá *personas* (adultos/niños).
5. Reservá la **"Cata premium en Bodega Mendoza"** → botón **Reservar**. Señalá los **2 pasos**: `approve` de USDC + `purchase`.
6. Frase: *"El dinero NO va al hotel todavía: queda retenido en el contrato de escrow hasta que se preste el servicio."* (RF-C01)

> 💡 **Truco de afiliado (RF-D02):** entrá con `http://localhost:3000/catalogo?ref=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`. Esa compra le atribuye la comisión al **agente**. Es el link que un influencer difundiría por WhatsApp.

> 🧩 **Punto fuerte para la defensa:** OTC combina **login tradicional (email/contraseña)** para usuarios no-cripto con **wallet Web3** para firmar las transacciones. Eso es exactamente la "autenticación híbrida Web2/Web3" del RF-A01.

### Escena 3 — "El hotel confirma y el dinero se reparte solo" (panel Proveedor) ⭐
**Este es el momento estrella.**
1. Cambiá MetaMask a la cuenta **Proveedor**, andá a `/proveedor`.
2. Mostrá la reserva pendiente → botón **Confirmar servicio**.
3. **Mostrá los saldos antes/después**: al confirmar, en una sola transacción el proveedor recibe **85%**, el agente **12%** y la plataforma **3%**.
4. Frase: *"Esto que en Booking tarda semanas, acá pasó en 2 segundos y quedó registrado público."*

### Escena 4 — "El agente cobró sin esperar" (panel Agente)
1. Cambiá a la cuenta **Agente**, andá a `/agente`.
2. Mostrá el **dashboard de comisiones**: su 12% ya está cobrado.
3. Mostrá el **generador de link de afiliado** (el que se difunde). (RF-D02)

### Escena 4-bis — "El agente arma su propia oferta con sobreprecio" (link de pago) ⭐
**Este es el flujo de venta por agente intermedio (RF-D02).**
1. En `/agente` (cuenta **Agente**), bajá a **"Generar link de venta"**: elegí un paquete y cargá un **sobreprecio** (ej. 150 USDC). La **vista previa** muestra en vivo el desglose: precio base + sobreprecio = **precio final**, y cuánto cobra el agente (12% del base + sobreprecio).
2. **Generar link** → se crea una URL única `/pay/<CÓDIGO>`. Copiala (o mostrá el **QR**).
3. Abrí esa URL en otra pestaña (es la **página pública de venta** que vería el cliente): info comercial del paquete, **precio final**, **disclaimer de comisiones** ("el precio incluye las comisiones del intermediario...") y el detalle del reparto.
4. Cargá email/teléfono, **conectá la wallet Cliente** y **Pagá**. Por detrás pasan: `approve` de la base + `purchase` (la base queda en escrow) + **transferencia del sobreprecio directo al agente**.
5. Volvé a `/agente` → **"Ventas y liquidación por link"**: la venta aparece con todos los datos (cliente, hash, base, sobreprecio, comisiones, estado) y podés **exportar el reporte en CSV**.
6. Frase: *"El agente no necesita armar su propia web: arma un link, le pone su margen, y cobra su sobreprecio al instante. Todo queda trazado en blockchain y asociado a él."*

> 💡 **Reparto (sin tocar el contrato):** la **base** del paquete se reparte 85/12/3 al confirmar el servicio; el **sobreprecio** se le transfiere al agente en el acto. Por eso el agente cobra 12% del base + el sobreprecio íntegro.

### Escena 5 — "Paga con tarjeta, sin saber de cripto" (on-ramp, opcional)
- Mostrá que el cliente puede pagar con **tarjeta** y el sistema le acredita USDC (sandbox MoonPay/Transak). (RF-D01)
- Frase: *"El usuario final nunca toca una billetera cripto si no quiere; la complejidad queda escondida."*

### Escena 6 — "Si no podés viajar, revendés" (mercado secundario) ⭐
1. Con la cuenta **Cliente** (que ya reservó en la Escena 2), andá a `/mercado`.
2. En **"Revender mi reserva"** poné un precio (ej. más alto que el original) y **Publicar en reventa**.
3. Cambiá a **otra cuenta** (otro viajero), volvé a `/mercado` → en **"Reservas en reventa"** mostrá el **desglose del reparto**: royalty 5% al proveedor, fee 2% a la plataforma, resto al vendedor. Comprala.
4. Frase: *"Las OTAs PROHÍBEN revender tu reserva. Acá, si no podés viajar, la revendés: vos recuperás tu plata, el hotel cobra un royalty forzoso y no pierde la ocupación. Ganan todos."* (RF-C02)

> 🛟 **Plan B**: si la UI falla, el comportamiento está testeado — `npx hardhat test --grep "revende"`.

---

## 4. Los 3 argumentos de defensa (cierre)

1. **El beneficio es real, no la palabra "blockchain".** Se usa porque permite pagar al hotel al instante y al agente en segundos —algo que el sistema financiero tradicional tarda semanas—.
2. **Enfoque de mercado regional (bodegas y aventura).** No es una copia genérica: apunta al enoturismo y turismo aventura de Mendoza, donde los pequeños productores sufren el abuso de comisiones de las plataformas globales.
3. **El mercado secundario (reventa).** La gran innovación Web3: convierte una reserva en un activo transferible con royalty forzoso. Un ganar-ganar que las OTAs no permiten.

---

## 5. Cobertura de requisitos (para mostrar si lo piden)

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-A01 | Login híbrido: email/contraseña (registro) + wallet Web3 | ✅ |
| RF-B02 | Tokenización de paquetes (ERC-1155) | ✅ |
| RF-C01 | Dispersión automática 85/12/3 | ✅ |
| RF-C02 | Royalty forzoso en reventa | ✅ contrato + test + UI (`/mercado`) |
| RF-D01 | On-ramp fiat (tarjeta → USDC) | ✅ sandbox |
| RF-D02 | Links de afiliado | ✅ |
| RF-B01 | Sync con PMS/CRS | ✅ mock + sync on-chain |
| RNF-P02 | Gas < $0.05 en L2 | ✅ ~111k gas en el split |
| RNF-S01 | Auditoría externa | ⏳ fase de producción |

---

## 6. Preguntas probables del tribunal (y respuestas)

**¿Por qué blockchain y no una base de datos normal?**
Porque ninguna de las partes confía en un intermediario central. El contrato garantiza que las reglas (split, reembolsos, royalties) **nadie las puede cambiar unilateralmente**, y todo es auditable. Una base de datos la controla una empresa; esto no.

**¿No es carísimo el gas?**
En Ethereum sí. Por eso se despliega en una **L2 (Base/Polygon)**: el mismo código corre idéntico y el split cuesta **menos de un centavo** (lo medimos: ~111k gas). Para la demo usamos una red local, que es la misma EVM.

**¿Cómo paga un usuario que no sabe de cripto?**
Con **tarjeta**. Un proveedor on-ramp (MoonPay/Transak) convierte el dinero a USDC por detrás. El usuario ni se entera de que hay blockchain.

**¿Qué pasa si el hotel no presta el servicio?**
El dinero está en **escrow**: si se cancela dentro del plazo de la política, el cliente recupera el 100%. El hotel solo cobra cuando confirma.

**¿Está auditado / es seguro para producción?**
Usamos **OpenZeppelin** (librerías estándar de la industria) y tenemos 26 tests. Para Mainnet faltaría una **auditoría externa** (RNF-S01), que es el paso previo al lanzamiento real.

**¿Qué falta para que sea un producto real?**
La interfaz del mercado secundario, el KYC/KYB de proveedores, las integraciones reales con Channel Managers, y la auditoría de seguridad. El núcleo económico (la lógica de comisiones) ya funciona.

---

## 7. Plan B (si algo falla en vivo)

**Presentación de respaldo (capturas reales):** [`presentacion/index.html`](presentacion/index.html) es un clickthrough navegable de **capturas reales de la app** — se ve literalmente como el sitio. Antes de la defensa, sacá las capturas siguiendo [`presentacion/capturas/LEEME.txt`](presentacion/capturas/LEEME.txt) y dropealas en esa carpeta. Se abre con doble click, sin nodo/backend/internet. *(También está [`presentacion/deck.html`](presentacion/deck.html): un deck narrado con calculadora interactiva del reparto 85/12/3, por si preferís ese formato.)*

Si la web o MetaMask fallan, **los tests son la red de seguridad**: demuestran todo el comportamiento sin depender de la UI.

```bash
npm test          # 26 tests: split, reembolsos, royalty, permisos
npm run test:gas  # prueba del costo de gas (RNF-P02)
```
Frase de respaldo: *"Más allá de la interfaz, la lógica de negocio está 100% testeada; estos 26 tests son la prueba de que el reparto, los reembolsos y los royalties funcionan exactamente como deben."*
