import crypto from "node:crypto";
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

async function getPasswordBuffer() {
  console.log("Enter your 12-word recovery phrase one by one.");

  const words = await prompts(
    Array.from({ length: 12 }).map((_, i) => ({
      type: "password",
      name: `words.${i}`,
      message: `${i + 1}:`,
      validate: (val: string) =>
        val.trim().length > 0 ? true : "Word cannot be empty",
    })),
  );

  const passwordString = Object.values(words).join(" ");

  const buffer = Buffer.from(passwordString, "utf-8");

  return buffer;
}

async function main() {
  if (!process.env.VAULT_PATH)
    throw new Error("VAULT_PATH environment variable is not set.");

  const vaultFile = Bun.file(process.env.VAULT_PATH);
  const vaultFileExists = await vaultFile.exists();

  const passwordBuffer = await getPasswordBuffer();

  if (!vaultFileExists) {
    console.log("No vault file found. Creating new vault...");

    vaultContents = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entries: [],
    };
  } else {
    console.log("Vault file found. Decrypting...");

    const encryptedVault = await vaultFile.text();

    try {
      vaultContents = VaultSchema.parse(
        JSON.parse(decrypt(encryptedVault, passwordBuffer)),
      );
    } catch (error) {
      console.log(
        "Failed to decrypt vault. Incorrect password or corrupted file.",
      );
      return;
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

        await vaultFile.write(encryptedVault);
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
          console.log(
            `- ${item.name} (${item.type}): ${item.type === "secret" ? "*****" : item.value}`,
          );
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

main().catch(console.error);
