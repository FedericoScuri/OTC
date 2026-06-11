// Copia los ABIs compilados (artifacts/) al frontend como un .ts tipado.
// Uso: npm run sync:abis  (corre `hardhat compile` antes si hace falta).
const fs = require("fs");
const path = require("path");

const names = ["MockUSDC", "TourPackageNFT", "CommissionEscrow", "SecondaryMarket"];
const root = path.join(__dirname, "..");

let out =
  "// Generado automaticamente desde artifacts/ (npm run sync:abis).\n" +
  "// No editar a mano: regenera con `npm run sync:abis` en la raiz.\n\n";

for (const n of names) {
  const p = path.join(root, "artifacts", "contracts", `${n}.sol`, `${n}.json`);
  if (!fs.existsSync(p)) {
    console.error(`Falta ${p}. Corre \`npm run compile\` primero.`);
    process.exit(1);
  }
  const { abi } = JSON.parse(fs.readFileSync(p, "utf8"));
  out += `export const ${n}Abi = ${JSON.stringify(abi, null, 2)} as const;\n\n`;
}

const dest = path.join(root, "frontend", "lib", "abis.ts");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out);
console.log(`ABIs sincronizados -> frontend/lib/abis.ts`);
