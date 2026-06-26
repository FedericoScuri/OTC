# Guion para armar la presentación en Canva — OTC

Todas las imágenes están en `presentacion/capturas/` (y el GIF en `presentacion/gifs/`).
En Canva: **Subir → arrastrá la imagen al slide**. Sugerencia de plantilla: cualquier
deck con fondo claro/violeta. Paleta de la marca: violeta `#7C3AED` + coral `#F0567E`.

> Tip: cada slide = un título grande arriba, la captura grande al centro, y 2-3 bullets
> al costado o abajo. La narración es lo que decís en voz, no hace falta ponerla en el slide.

---

## Slide 1 — Portada
- **Imagen:** `capturas/01-inicio.png`
- **Título:** OTC — Open Tourism Commerce
- **Subtítulo:** Marketplace de turismo descentralizado · reservá sin intermediarios
- **Narración:** "OTC conecta hoteles, bodegas y turismo aventura directo con el viajero
  y con agentes independientes. Sin OTAs que se queden con el 25%."

## Slide 2 — El problema / la propuesta
- **Imagen:** `capturas/01-inicio.png` (hero) — o un slide de solo texto
- **Título:** Comisiones justas, pagos al instante
- **Bullets:**
  - Las OTAs (Booking, Expedia) cobran 15-25% y liquidan a semanas.
  - OTC usa contratos inteligentes: el pago se reparte solo, al instante.
  - Transparente y auditable: sin cláusulas ocultas ni overbooking.

## Slide 3 — ¿Cómo funciona?
- **Imagen:** `capturas/12-comofunciona.png`
- **Título:** Cuatro pasos, sin saber nada de cripto
- **Bullets:** Pagás → queda en escrow → el proveedor confirma → el dinero se reparte solo.

## Slide 4 — ¿Por qué blockchain?
- **Imagen:** `capturas/10-porque-blockchain.png`
- **Título:** No es capricho: es eficiencia
- **Bullets:**
  - Pagos al instante (no semanas).
  - Sin intermediario que retenga los fondos.
  - Todo público y auditable.
  - Tu reserva es un NFT: te pertenece y la podés revender.

## Slide 5 — Login híbrido (RF-A01)
- **Imagen:** `capturas/02-login.png`
- **Título:** Entrás con email… o wallet
- **Bullets:** Autenticación híbrida Web2/Web3. Cuentas de demo de un click por rol.

## Slide 6 — Catálogo on-chain (RF-B02)
- **Imagen:** `capturas/03-catalogo.png`
- **Título:** 16 paquetes, leídos de la blockchain
- **Bullets:**
  - Cada paquete es un NFT (ERC-1155): hotel, bodega, aventura, cultural.
  - Hay actividades gratis.
  - Cupo en tiempo real (badge "N libres · Xms" — anti-overbooking, RNF-P01).

## Slide 7 — ⭐ Pagar con tarjeta, SIN wallet (Account Abstraction)
- **Imagen:** `capturas/09-tarjeta.png`  ·  **mejor aún: GIF** `gifs/gasless.gif`
- **Título:** Reservá sin cripto ni wallet
- **Bullets:**
  - Un usuario con email reserva pagando con "tarjeta".
  - El backend le crea una cuenta inteligente (mock MPC) y un Paymaster paga el gas.
  - Resultado: "Reserva creada sin wallet" — el turista nunca tocó cripto.
- **Narración:** "Esta es la pieza más fuerte: rompe la barrera de entrada de Web3."

## Slide 8 — Reservar con wallet (RF-C01)
- **Imagen:** `capturas/04-reservar.png`
- **Título:** El pago queda en escrow
- **Bullets:** approve + purchase. El dinero NO va al hotel hasta que confirme el servicio.

## Slide 9 — Mis reservas
- **Imagen:** `capturas/05-reservas.png`
- **Título:** Tus reservas viven on-chain
- **Bullets:** Se ven las hechas con wallet y las "sin wallet" (gasless), con estado, fecha y monto.

## Slide 10 — Mercado secundario (RF-C02)
- **Imagen:** `capturas/08-mercado.png`
- **Título:** ¿No podés viajar? Revendé tu reserva
- **Bullets:** Reventa P2P del NFT. Royalty forzoso 5% al proveedor original + 2% plataforma.
- **Narración:** "Las OTAs prohíben transferir reservas. Acá es un gana-gana."

## Slide 11 — Venta por agente intermedio (RF-D02)
- **Imagen:** `capturas/11-pay-publico.png`
- **Título:** El agente arma su link de pago
- **Bullets:**
  - El agente carga un sobreprecio y comparte un link.
  - El cliente ve el precio final y el detalle de comisiones.
  - El agente cobra su 12% + el sobreprecio, al instante.

## Slide 12 — El reparto automático 85 / 12 / 3
- **Imagen:** (diagrama de texto o `capturas/06-proveedor.png`)
- **Título:** Cuando el proveedor confirma, en UNA transacción:
- **Bullets:**
  - **85%** → Proveedor (hotel/bodega)
  - **12%** → Agente vendedor (o suma al proveedor si fue venta directa)
  - **3%** → Plataforma OTC
  - + retención impositiva configurable por jurisdicción (RNF-L01)

## Slide 13 — Paneles de proveedor y agente
- **Imágenes:** `capturas/06-proveedor.png` y `capturas/07-agente.png`
- **Título:** Cada rol tiene su panel
- **Bullets:**
  - Proveedor: publica paquetes (con KYB verificado) y confirma servicios.
  - Agente: genera links de afiliado y sigue sus comisiones.
  - *(Requieren conectar MetaMask en la red local.)*

## Slide 14 — Cierre
- **Título:** OTC — turismo descentralizado, comisiones justas
- **Bullets:** Contratos auditados (26 tests) · 16 paquetes · pago con o sin cripto.
- **Narración:** "Tecnología al servicio del turismo local: el proveedor cobra más, el
  viajero paga menos, y el agente se profesionaliza."

---

### Notas
- Las capturas de **proveedor (06)** y **agente (07)** se sacaron con la app real pero
  muestran la pantalla pidiendo conectar la wallet (el panel completo necesita MetaMask).
  Para la versión "conectada", capturalas en vivo con MetaMask en la red Hardhat local.
- El **GIF** `gifs/gasless.gif` es ideal para el slide 7 o para un story/video corto.
- ¿Querés más capturas (ej. el panel del proveedor con wallet conectada, o un GIF del
  mercado secundario)? Se pueden agregar.
