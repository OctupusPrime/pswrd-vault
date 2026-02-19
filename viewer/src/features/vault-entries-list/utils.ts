/**
 * Generates a deterministic emoji based on a string input.
 * @param {string} str - The input string (e.g., a username or item name).
 * @returns {string} - A single emoji character.
 */
export function getDeterministicEmoji(str: string): string {
	// 1. Create a simple hash from the string
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		// Simple bitwise arithmetic to generate a unique number
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	// 2. Define a range of Emoji Unicode code points
	// This range (0x1F600 to 0x1F64F) covers "Emoticons" (😀 to 🙀)
	// You can extend this range to include objects, animals, etc.
	const min = 0x1f600; // Start of Emoticons
	const max = 0x1f64f; // End of Emoticons
	const range = max - min;

	// 3. Map the hash to the emoji range
	// We use Math.abs to handle negative hash values
	const codePoint = min + (Math.abs(hash) % range);

	// 4. Return the emoji character
	return String.fromCodePoint(codePoint);
}
