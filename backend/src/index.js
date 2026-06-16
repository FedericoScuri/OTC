const express = require("express");
const cors = require("cors");
const config = require("./config");
const chain = require("./chain");
const pmsRouter = require("./routes/pms");

const app = express();
app.use(cors());
app.use(express.json());

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

app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

app.listen(config.port, () => {
  console.log(`\nOTC backend escuchando en http://localhost:${config.port}`);
  console.log(`  RPC      : ${config.rpcUrl}`);
  console.log(`  Contratos: ${config.addresses.TourPackageNFT} (NFT)\n`);
});
