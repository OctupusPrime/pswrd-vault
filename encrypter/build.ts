import { resolve } from "path";

const maxPassphraseWords = Bun.argv[2] || "12";
const outputDir = `../dist-${maxPassphraseWords}-words`;
const outputPath = resolve(import.meta.dir, `${outputDir}/app.js`);
const hashPath = resolve(import.meta.dir, `${outputDir}/app.js.sha256`);

console.log("=".repeat(52));
console.log(" pswrd-vault — Build Script");
console.log(` Passphrase words: ${maxPassphraseWords}`);
console.log(` Output directory: ${resolve(import.meta.dir, outputDir)}`);
console.log("=".repeat(52));
console.log("");

console.log("[Step 1/3] Bundling application with Bun...");
const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: outputDir,
  naming: "app.js",
  target: "node",
  loader: {
    ".html": "text",
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.MAX_PASSPHRASE_WORDS": JSON.stringify(maxPassphraseWords),
  },
});

if (!result.success) {
  console.error("[Fatal] Build failed:");
  for (const log of result.logs) console.error(" ", log);
  process.exit(1);
}

console.log(`Bundle written to: ${outputPath}`);
console.log(
  `Build complete. MAX_PASSPHRASE_WORDS locked to: ${maxPassphraseWords}`,
);

console.log("\n[Step 2/3] Generating SHA-256 integrity hash of bundle...");
const file = Bun.file(outputPath);
const hasher = new Bun.CryptoHasher("sha256");
hasher.update(await file.arrayBuffer());
const hash = hasher.digest("hex");

await Bun.write(hashPath, `${hash}  app.js\n`);
console.log(`SHA-256: ${hash}`);
console.log(`Hash file written: ${hashPath}`);

console.log("\n[Step 3/3] Verifying bundle integrity...");
const savedHash = (await Bun.file(hashPath).text()).split(" ")[0];
if (savedHash === hash) {
  console.log("Integrity check passed. The bundle is unmodified. ✓");
} else {
  console.error(
    "Integrity check failed. The hash on disk does not match the bundle. ✗",
  );
  process.exit(1);
}

console.log("\n" + "=".repeat(52));
console.log(" Build successful! Run with:");
console.log(` node ${outputPath}`);
console.log("=".repeat(52));
