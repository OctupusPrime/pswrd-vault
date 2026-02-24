import crypto from "node:crypto";
import fs from "node:fs/promises";

import prompts from "prompts";
import z from "zod";

const PBKDF2_ITERATIONS = 600000;
const KEY_LEN = 32;
const DIGEST = "sha256";
const SALT_LEN = 16;
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;
const ALGORITHM = "aes-256-gcm";

function encrypt(plaintext: string, passKey: Buffer) {
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = crypto.pbkdf2Sync(
    passKey,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LEN,
    DIGEST,
  );

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, authTag, encrypted]).toString("base64");
}

function decrypt(ciphertext: string, passKey: Buffer) {
  const buffer = Buffer.from(ciphertext, "base64");

  if (buffer.length < SALT_LEN + IV_LEN + AUTH_TAG_LEN)
    throw new Error("Invalid ciphertext length");

  const salt = buffer.subarray(0, SALT_LEN);
  const iv = buffer.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const authTag = buffer.subarray(
    SALT_LEN + IV_LEN,
    SALT_LEN + IV_LEN + AUTH_TAG_LEN,
  );
  const encrypted = buffer.subarray(SALT_LEN + IV_LEN + AUTH_TAG_LEN);

  const key = crypto.pbkdf2Sync(
    passKey,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LEN,
    DIGEST,
  );

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

const VaultSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  entries: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
      items: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(["public", "secret"]),
          value: z.string(),
        }),
      ),
    }),
  ),
});

let vaultContents: z.infer<typeof VaultSchema> | undefined;

const refineId = (id: string) => {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

async function getPasswordBuffer(
  passwordWordsCount: number = 12,
): Promise<Buffer> {
  console.log(
    `[Recovery Phrase] Enter your ${passwordWordsCount}-word recovery phrase, one word at a time.`,
  );

  let keyBuffer = Buffer.alloc(0);

  for (let i = 0; i < passwordWordsCount; i++) {
    const { word } = await prompts({
      type: "password",
      name: "word",
      message: `${i + 1}:`,
      validate: (val: string) =>
        val.trim().length > 0 ? true : "Word cannot be empty",
    });

    const isNotLastWord = i < passwordWordsCount - 1;

    const wordBuffer = Buffer.from(
      word.trim() + (isNotLastWord ? " " : ""),
      "utf-8",
    );

    const newKeyBuffer = Buffer.alloc(keyBuffer.length + wordBuffer.length);
    keyBuffer.copy(newKeyBuffer);
    wordBuffer.copy(newKeyBuffer, keyBuffer.length);

    keyBuffer.fill(0);
    wordBuffer.fill(0);
    keyBuffer = newKeyBuffer;
  }

  return keyBuffer;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function vaultCLI(filePath: string, passwordWordsCount: number) {
  const vaultFileExists = await fileExists(filePath);

  const passwordBuffer = await getPasswordBuffer(passwordWordsCount);

  if (!vaultFileExists) {
    console.log(`\n[New Vault] No vault file found at "${filePath}".`);

    vaultContents = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entries: [],
    };

    console.log("New vault initialized. Remember to save before exiting.");
  } else {
    console.log(`\n[Unlock] Vault file found at "${filePath}".`);
    console.log("Decrypting vault with your recovery phrase...");

    const encryptedVault = await fs.readFile(filePath, "utf-8");

    try {
      vaultContents = VaultSchema.parse(
        JSON.parse(decrypt(encryptedVault, passwordBuffer)),
      );
      console.log(
        `Vault decrypted successfully. ${vaultContents.entries.length} entr${
          vaultContents.entries.length === 1 ? "y" : "ies"
        } loaded.`,
      );
    } catch (error) {
      throw new Error(
        "Decryption failed. Your recovery phrase may be incorrect or the vault file may be corrupted.",
      );
    }
  }

  if (!vaultContents) throw new Error("Failed to initialize vault contents.");
  console.log("");

  let running = true;

  while (running) {
    const vaultHasEntries = vaultContents.entries.length > 0;

    const { action } = await prompts({
      type: "select",
      name: "action",
      message: `Vault — ${vaultContents.entries.length} entr${
        vaultContents.entries.length === 1 ? "y" : "ies"
      } | What would you like to do?`,
      choices: [
        { title: "Add entry", value: "add_entry" },
        {
          title: "View entry",
          value: "view_entry",
          disabled: !vaultHasEntries,
        },
        {
          title: "Delete entry",
          value: "delete_entry",
          disabled: !vaultHasEntries,
        },
        { title: "Save vault", value: "save" },
        { title: "Exit", value: "exit" },
      ],
    });

    switch (action) {
      case "add_entry":
        const { newEntryName } = await prompts({
          type: "text",
          name: "newEntryName",
          message: "Enter entry name:",
          validate: (val: string) =>
            val.trim().length > 0 ? true : "Name cannot be empty",
        });

        const newEntryId = refineId(newEntryName);

        if (vaultContents.entries.some((e) => e.id === newEntryId)) {
          console.log(
            `An entry named "${newEntryName}" already exists. Please choose a different name.`,
          );
          break;
        }

        vaultContents.entries.push({
          id: newEntryId,
          name: newEntryName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: [],
        });
        vaultContents.updatedAt = new Date().toISOString();
        console.log(
          `Entry "${newEntryName}" added. Don't forget to save your vault.`,
        );
        break;
      case "view_entry":
        const { viewEntryId } = await prompts({
          type: "autocomplete",
          name: "viewEntryId",
          message: "Select entry to view:",
          choices: vaultContents.entries.map((e) => ({
            title: e.name,
            value: e.id,
          })),
        });

        const entryToView = vaultContents.entries.find(
          (e) => e.id === viewEntryId,
        );

        if (!entryToView) {
          console.log("Entry not found. It may have been deleted.");
          break;
        }

        await viewEntrySubMenu(viewEntryId, passwordBuffer);
        break;
      case "delete_entry":
        const { deleteEntryId } = await prompts({
          type: "autocomplete",
          name: "deleteEntryId",
          message: "Select entry to delete:",
          choices: vaultContents.entries.map((e) => ({
            title: e.name,
            value: e.id,
          })),
        });

        const entryToDelete = vaultContents.entries.find(
          (e) => e.id === deleteEntryId,
        );

        if (!entryToDelete) {
          console.log("Entry not found. It may have already been deleted.");
          break;
        }

        const { confirmEntryDelete } = await prompts({
          type: "confirm",
          name: "confirmEntryDelete",
          message: `Are you sure you want to delete the entry "${entryToDelete.name}"?`,
        });

        if (!confirmEntryDelete) {
          console.log("Deletion canceled. No changes were made.");
          break;
        }

        vaultContents.entries = vaultContents.entries.filter(
          (e) => e.id !== deleteEntryId,
        );
        vaultContents.updatedAt = new Date().toISOString();
        console.log(
          `Entry "${entryToDelete.name}" deleted. Don't forget to save your vault.`,
        );
        break;
      case "save":
        console.log(`Encrypting vault and writing to "${filePath}"...`);
        const encryptedVault = encrypt(
          JSON.stringify(vaultContents),
          passwordBuffer,
        );

        await fs.writeFile(`${filePath}.tmp`, encryptedVault, "utf-8");
        await fs.rename(`${filePath}.tmp`, filePath);
        await fs.chmod(filePath, 0o600);
        console.log(
          `Vault saved successfully. File permissions set to 600 (owner read/write only).`,
        );
        break;
      case "exit":
        running = false;
        break;
    }
  }

  passwordBuffer.fill(0);
  vaultContents = undefined;
  console.log(
    "\n[Exit] Session ended. All sensitive data has been cleared from memory.",
  );
}

async function viewEntrySubMenu(entryId: string, passKey: Buffer) {
  if (!vaultContents) {
    console.log("Error: vault is not loaded. Please restart the CLI.");
    return;
  }

  const selectedEntry = vaultContents.entries.find((e) => e.id === entryId);

  if (!selectedEntry) {
    console.log("Error: entry not found. It may have been removed.");
    return;
  }

  let running = true;

  while (running) {
    const entryHasItems = selectedEntry.items.length > 0;

    const { entryAction } = await prompts({
      type: "select",
      name: "entryAction",
      message: `Entry: "${selectedEntry.name}" — ${selectedEntry.items.length} item${
        selectedEntry.items.length === 1 ? "" : "s"
      } | What would you like to do?`,
      choices: [
        { title: "Add item", value: "add_item" },
        { title: "View items", value: "view_items", disabled: !entryHasItems },
        {
          title: "Delete item",
          value: "delete_item",
          disabled: !entryHasItems,
        },
        { title: "Back to main menu", value: "back" },
      ],
    });

    switch (entryAction) {
      case "add_item":
        const { newItemName } = await prompts({
          type: "text",
          name: "newItemName",
          message: "Enter item name:",
          validate: (val: string) =>
            val.trim().length > 0 ? true : "Name cannot be empty",
        });

        const newItemId = refineId(newItemName);

        if (selectedEntry.items.some((i) => i.id === newItemId)) {
          console.log(
            `An item named "${newItemName}" already exists in "${selectedEntry.name}". Please choose a different name.`,
          );
          break;
        }

        const { newItemType } = await prompts({
          type: "select",
          name: "newItemType",
          message: "Select item type:",
          choices: [
            { title: "Public", value: "public" },
            { title: "Secret", value: "secret" },
          ],
        });

        let newItemValue = "";
        const isSecret = newItemType === "secret";
        console.log(
          `Enter item value below${
            isSecret ? " (will be stored encrypted)" : ""
          }. Press Enter on an empty line to finish:`,
        );

        while (true) {
          const { line } = await prompts({
            type: "text",
            name: "line",
            message: ">",
          });

          if (!line || line.trim() === "") break;
          newItemValue += (newItemValue ? "\n" : "") + line;
        }

        if (newItemValue.trim().length === 0) {
          console.log("Item value cannot be empty. Item was not added.");
          break;
        }

        selectedEntry.items.push({
          id: newItemId,
          name: newItemName,
          type: newItemType,
          value:
            newItemType === "secret"
              ? encrypt(newItemValue, passKey)
              : newItemValue,
        });
        selectedEntry.updatedAt = new Date().toISOString();
        vaultContents.updatedAt = new Date().toISOString();
        console.log(
          `Item "${newItemName}" added to "${selectedEntry.name}"${
            newItemType === "secret" ? " (value encrypted)" : ""
          }. Don't forget to save your vault.`,
        );
        break;
      case "view_items":
        console.log(
          `\nItems in "${selectedEntry.name}" (${selectedEntry.items.length} total):`,
        );
        selectedEntry.items.forEach((item) => {
          console.log(`- ${item.name} (${item.type}):`);
          console.log(`${item.type === "secret" ? "*****" : item.value}`);
        });
        break;
      case "delete_item":
        const { deleteItemId } = await prompts({
          type: "autocomplete",
          name: "deleteItemId",
          message: "Select item to delete:",
          choices: selectedEntry.items.map((i) => ({
            title: i.name,
            value: i.id,
          })),
        });

        const itemToDelete = selectedEntry.items.find(
          (i) => i.id === deleteItemId,
        );

        if (!itemToDelete) {
          console.log("Item not found. It may have already been deleted.");
          break;
        }

        const { confirmItemDelete } = await prompts({
          type: "confirm",
          name: "confirmItemDelete",
          message: `Are you sure you want to delete the item "${itemToDelete.name}"?`,
        });

        if (!confirmItemDelete) {
          console.log("Deletion canceled. No changes were made.");
          break;
        }

        selectedEntry.items = selectedEntry.items.filter(
          (i) => i.id !== deleteItemId,
        );
        console.log(
          `Item "${itemToDelete.name}" deleted from "${selectedEntry.name}". Don't forget to save your vault.`,
        );
        selectedEntry.updatedAt = new Date().toISOString();
        vaultContents.updatedAt = new Date().toISOString();
        break;
      case "back":
        running = false;
        break;
    }
  }
}

export { vaultCLI };
