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
  console.log("=".repeat(52));
  console.log(" pswrd-vault — Password Vault Manager");
  console.log(
    ` Mode: ${DEVELOPMENT_MODE ? "development (vault.bin output only)" : "production (HTML bundle output)"}`,
  );
  console.log(` Vault file: ${VAULT_FILE_PATH}`);
  console.log("=".repeat(52));
  console.log("");

  await vaultCLI(VAULT_FILE_PATH, MAX_PASSPHRASE_WORDS);

  if (DEVELOPMENT_MODE) {
    console.log(
      "\n[Dev] Development mode — skipping HTML bundle generation. vault.bin has been updated.",
    );
    return;
  }

  console.log("\n[Step 1/5] Loading HTML template from viewer build output...");
  const templateModule = await import("../../viewer/dist/index.html");
  const htmlTemplate = templateModule.default;
  console.log("HTML template loaded.");

  console.log("\n[Step 2/5] Reading encrypted vault data from disk...");
  const vaultData = await fs.readFile(VAULT_FILE_PATH, "utf-8");
  console.log(`Vault data read (${vaultData.length} bytes).`);

  console.log(
    "\n[Step 3/5] Injecting vault data into HTML template and preparing output directory...",
  );
  //@ts-ignore bcs i know that htmlTemplate is a string
  const finalHtml = htmlTemplate.replace("{{%VAULT_VALUE%}}", vaultData);

  const vaultsDir = path.resolve(import.meta.dirname, "./vaults");
  await fs.mkdir(vaultsDir, { recursive: true });

  const fileName = `vault-${getDateStamp()}.html`;
  const filePath = path.join(vaultsDir, fileName);

  console.log(`Writing output file: ${filePath}`);
  await fs.writeFile(filePath, finalHtml, "utf-8");
  console.log(`Output file written (${finalHtml.length} bytes).`);

  console.log("\n[Step 4/5] Generating SHA-256 integrity hash...");
  const hash = crypto.createHash("sha256").update(finalHtml).digest("hex");
  const hashFilePath = `${filePath}.sha256`;
  await fs.writeFile(hashFilePath, `${hash}  ${fileName}\n`, "utf-8");
  console.log(`SHA-256: ${hash}`);
  console.log(`Hash file written: ${hashFilePath}`);

  console.log("\n[Step 5/5] Verifying file integrity...");
  const savedHash = (await fs.readFile(hashFilePath, "utf-8")).split(" ")[0];
  if (savedHash === hash) {
    console.log("Integrity check passed. The output file is unmodified. ✓");
  } else {
    console.error(
      "Integrity check failed. The hash on disk does not match the generated file. ✗",
    );
    process.exit(1);
  }

  console.log("\n" + "=".repeat(52));
  console.log(` Done! Vault bundle ready at:`);
  console.log(` ${filePath}`);
  console.log("=".repeat(52));
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\n[Fatal Error] ${message}`);
  console.error("The vault was not saved. No changes were written to disk.");
  process.exit(1);
});
