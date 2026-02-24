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
    `Enter your ${passwordWordsCount}-word recovery phrase one by one.`,
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
    console.log("No vault file found. Creating new vault...");

    vaultContents = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entries: [],
    };
  } else {
    console.log("Vault file found. Decrypting...");

    const encryptedVault = await fs.readFile(filePath, "utf-8");

    try {
      vaultContents = VaultSchema.parse(
        JSON.parse(decrypt(encryptedVault, passwordBuffer)),
      );
    } catch (error) {
      throw new Error(
        "Failed to decrypt vault. Please check your recovery phrase and try again.",
      );
    }
  }

  if (!vaultContents) throw new Error("Failed to initialize vault contents.");

  let running = true;

  while (running) {
    const vaultHasEntries = vaultContents.entries.length > 0;

    const { action } = await prompts({
      type: "select",
      name: "action",
      message: "What do you want to do?",
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
          console.log("An entry with that name already exists.");
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
        console.log("Entry added successfully.");
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
          console.log("Entry not found.");
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
          console.log("Entry not found.");
          break;
        }

        const { confirmEntryDelete } = await prompts({
          type: "confirm",
          name: "confirmEntryDelete",
          message: `Are you sure you want to delete the entry "${entryToDelete.name}"?`,
        });

        if (!confirmEntryDelete) {
          console.log("Entry deletion canceled.");
          break;
        }

        vaultContents.entries = vaultContents.entries.filter(
          (e) => e.id !== deleteEntryId,
        );
        vaultContents.updatedAt = new Date().toISOString();
        console.log("Entry deleted successfully.");
        break;
      case "save":
        const encryptedVault = encrypt(
          JSON.stringify(vaultContents),
          passwordBuffer,
        );

        await fs.writeFile(`${filePath}.tmp`, encryptedVault, "utf-8");
        await fs.rename(`${filePath}.tmp`, filePath);
        await fs.chmod(filePath, 0o600);
        console.log("Vault saved successfully.");
        break;
      case "exit":
        running = false;
        break;
    }
  }

  passwordBuffer.fill(0);
  vaultContents = undefined;
  console.log("Exiting. All sensitive data cleared from memory.");
}

async function viewEntrySubMenu(entryId: string, passKey: Buffer) {
  if (!vaultContents) {
    console.log("Vault contents not loaded.");
    return;
  }

  const selectedEntry = vaultContents.entries.find((e) => e.id === entryId);

  if (!selectedEntry) {
    console.log("Entry not found.");
    return;
  }

  let running = true;

  while (running) {
    const entryHasItems = selectedEntry.items.length > 0;

    const { entryAction } = await prompts({
      type: "select",
      name: "entryAction",
      message: "What do you want to do with this entry?",
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
          console.log("An item with that name already exists in this entry.");
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
        console.log("Enter item value (press Enter twice to finish):");

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
          console.log("Value cannot be empty");
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
        console.log("Item added successfully.");
        break;
      case "view_items":
        console.log("Items:");
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
          console.log("Item not found.");
          break;
        }

        const { confirmItemDelete } = await prompts({
          type: "confirm",
          name: "confirmItemDelete",
          message: `Are you sure you want to delete the item "${itemToDelete.name}"?`,
        });

        if (!confirmItemDelete) {
          console.log("Item deletion canceled.");
          break;
        }

        selectedEntry.items = selectedEntry.items.filter(
          (i) => i.id !== deleteItemId,
        );
        console.log("Item deleted successfully.");
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
