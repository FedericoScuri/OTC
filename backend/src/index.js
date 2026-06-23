const express = require("express");
const cors = require("cors");
const config = require("./config");
const chain = require("./chain");
const pmsRouter = require("./routes/pms");
const onrampRouter = require("./routes/onramp");
const inventoryRouter = require("./routes/inventory");
const aaRouter = require("./routes/aa");
const kybRouter = require("./routes/kyb");

const app = express();
app.use(cors());
app.use(express.json());

// Mide la latencia de cada request y la expone en la cabecera X-Response-Time
// (visibilidad del presupuesto de 800ms del Guardián de Latencia, RNF-P01).
app.use((_req, res, next) => {
  const start = process.hrtime.bigint();
  const origJson = res.json.bind(res);
  res.json = (body) => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.headersSent) res.setHeader("X-Response-Time", `${ms.toFixed(1)}ms`);
    return origJson(body);
  };
  next();
});

// Estado del backend y de la conexión a la cadena.
app.get("/health", async (_req, res) => {
  res.json({
    status: "ok",
    chainUp: await chain.isChainUp(),
    rpcUrl: config.rpcUrl,
    addresses: config.addresses,
  });
});

// RF-B01 — sincronización con PMS/CRS.
app.use("/api/pms", pmsRouter);

// RF-D01 — on-ramp fiat (tarjeta → USDC).
app.use("/api/onramp", onrampRouter);

// RNF-P01 / PDR §2.2 — Guardián de Latencia: disponibilidad + holds anti-overbooking.
app.use("/api/inventory", inventoryRouter);

// RF-A01 / PDR §2.1 — Account Abstraction: Smart Account (mock MPC) + Paymaster.
app.use("/api/aa", aaRouter);

// RF-A02 — KYC/KYB de proveedores (trámite + resolución).
app.use("/api/kyb", kybRouter);

app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

app.listen(config.port, () => {
  console.log(`\nOTC backend escuchando en http://localhost:${config.port}`);
  console.log(`  RPC      : ${config.rpcUrl}`);
  console.log(`  Contratos: ${config.addresses.TourPackageNFT} (NFT)\n`);
});
