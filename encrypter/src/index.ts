import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";

import { vaultCLI } from "./vault-cli";

const DEVELOPMENT_MODE = process.env.NODE_ENV === "development";

const VAULT_FILE_PATH = path.resolve(
  import.meta.dirname,
  DEVELOPMENT_MODE ? "../../viewer/src/assets/vault.bin" : "./vault.bin",
);
const MAX_PASSPHRASE_WORDS = parseInt(
  process.env.MAX_PASSPHRASE_WORDS ?? "12",
  10,
);

function getDateStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function main() {
  if (!VAULT_FILE_PATH)
    throw new Error("VAULT_PATH environment variable is not set.");

  await vaultCLI(VAULT_FILE_PATH, MAX_PASSPHRASE_WORDS);

  if (DEVELOPMENT_MODE) return;

  const templateModule = await import("../../viewer/dist/index.html");
  const htmlTemplate = templateModule.default;

  const vaultData = await fs.readFile(VAULT_FILE_PATH, "utf-8");

  //@ts-ignore bcs i know that htmlTemplate is a string
  const finalHtml = htmlTemplate.replace("{{%VAULT_VALUE%}}", vaultData);

  const vaultsDir = path.resolve(import.meta.dirname, "./vaults");
  await fs.mkdir(vaultsDir, { recursive: true });

  const fileName = `vault-${getDateStamp()}.html`;
  const filePath = path.join(vaultsDir, fileName);

  await fs.writeFile(filePath, finalHtml, "utf-8");
  console.log(`Output written to ${filePath}`);

  // Generate SHA-256 hash and write hash file
  const hash = crypto.createHash("sha256").update(finalHtml).digest("hex");
  const hashFilePath = `${filePath}.sha256`;
  await fs.writeFile(hashFilePath, `${hash}  ${fileName}\n`, "utf-8");
  console.log(`SHA-256: ${hash}`);

  // Verify integrity
  const savedHash = (await fs.readFile(hashFilePath, "utf-8")).split(" ")[0];
  if (savedHash === hash) {
    console.log("Integrity verified ✓");
  } else {
    console.error("Integrity check failed ✗");
    process.exit(1);
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
