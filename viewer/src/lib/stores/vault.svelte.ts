import * as v from 'valibot';
import vaultFile from '$assets/vault.bin?raw';

const PBKDF2_ITERATIONS = 600000;
const KEY_LEN = 32;
const DIGEST = 'SHA-256';
const SALT_LEN = 16;
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;
const ALGORITHM = 'AES-GCM';

async function decrypt(ciphertext: string, passKey: Uint8Array): Promise<string> {
	const binaryString = atob(ciphertext);
	const buffer = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		buffer[i] = binaryString.charCodeAt(i);
	}

	if (buffer.length < SALT_LEN + IV_LEN + AUTH_TAG_LEN)
		throw new Error('Invalid ciphertext length');

	const salt = buffer.slice(0, SALT_LEN);
	const iv = buffer.slice(SALT_LEN, SALT_LEN + IV_LEN);
	const authTag = buffer.slice(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + AUTH_TAG_LEN);
	const encrypted = buffer.slice(SALT_LEN + IV_LEN + AUTH_TAG_LEN);

	const keyMaterial = await window.crypto.subtle.importKey(
		'raw',
		passKey.buffer as ArrayBuffer,
		{ name: 'PBKDF2' },
		false,
		['deriveKey']
	);

	const key = await window.crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: salt,
			iterations: PBKDF2_ITERATIONS,
			hash: DIGEST
		},
		keyMaterial,
		{ name: ALGORITHM, length: KEY_LEN * 8 },
		false,
		['decrypt']
	);

	const decipher = new Uint8Array(encrypted.length + authTag.length);
	decipher.set(encrypted);
	decipher.set(authTag, encrypted.length);

	const decrypted = await window.crypto.subtle.decrypt(
		{
			name: ALGORITHM,
			iv: iv
		},
		key,
		decipher
	);

	return new TextDecoder().decode(decrypted);
}

const VaultSchema = v.object({
	createdAt: v.string(),
	updatedAt: v.string(),
	entries: v.array(
		v.object({
			id: v.string(),
			name: v.string(),
			createdAt: v.string(),
			updatedAt: v.string(),
			items: v.array(
				v.object({
					id: v.string(),
					name: v.string(),
					type: v.enum({
						public: 'public',
						secret: 'secret'
					}),
					value: v.string()
				})
			)
		})
	)
});

class VaultStore {
	data = $state<v.InferOutput<typeof VaultSchema> | undefined>();
	isUnlocked = $state(false);

	#passwordBuffer = new Uint8Array(0);

	async unlock(passKey: string) {
		try {
			this.#passwordBuffer = new TextEncoder().encode(passKey);

			const decrypted = await decrypt(vaultFile, this.#passwordBuffer);

			this.data = v.parse(VaultSchema, JSON.parse(decrypted));
			this.isUnlocked = true;
		} catch (error) {
			this.lock();
			throw new Error('Failed to decrypt vault. Incorrect password or corrupted file.');
		}
	}

	lock() {
		this.#passwordBuffer.fill(0);
		this.#passwordBuffer = new Uint8Array(0);
		this.data = undefined;
		this.isUnlocked = false;
	}

	async revealItem(entryId: string, itemId: string): Promise<string> {
		if (!this.isUnlocked || !this.data) throw new Error('Vault is locked');

		const entry = this.data.entries.find((e) => e.id === entryId);
		if (!entry) throw new Error('Entry not found');

		const item = entry.items.find((i) => i.id === itemId);
		if (!item) throw new Error('Item not found');

		if (item.type === 'public') return item.value;

		return await decrypt(item.value, this.#passwordBuffer);
	}
}

export const vault = new VaultStore();
