import { resolve } from "path";

const maxPassphraseWords = Bun.argv[2] || "12";

const outputDir = `../dist-${maxPassphraseWords}-words`;

await Bun.build({
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

console.log(
  `Build complete! (MAX_PASSPHRASE_WORDS set to: ${maxPassphraseWords})`,
);

// Generate SHA-256 hash of the built file
const outputPath = resolve(import.meta.dir, `${outputDir}/app.js`);
const hashPath = resolve(import.meta.dir, `${outputDir}/app.js.sha256`);

const file = Bun.file(outputPath);
const hasher = new Bun.CryptoHasher("sha256");
hasher.update(await file.arrayBuffer());
const hash = hasher.digest("hex");

await Bun.write(hashPath, `${hash}  app.js\n`);
console.log(`SHA-256: ${hash}`);

// Verify integrity by reading back the hash file
const savedHash = (await Bun.file(hashPath).text()).split(" ")[0];
if (savedHash === hash) {
  console.log("Integrity verified ✓");
} else {
  console.error("Integrity check failed ✗");
  process.exit(1);
}
