/**
 * crypto.js — Krypcode Cipher Engine
 * 
 * This is the core encryption module.
 * ALL encryption/encoding happens here, on the CLIENT SIDE.
 * The server never sees the original content or the Cipher Map.
 * 
 * How it works:
 *   1. generateCipherMap() creates a random mapping:
 *      Each character (A-Z, 0-9) → a unique 2-4 character random code
 *      Example: { A: "x7k", B: "m2", C: "qp9f", ... }
 * 
 *   2. encodeWithCipherMap() converts plaintext using the map:
 *      "HELLO" → "x7km2qp9f..." (each letter replaced by its code)
 * 
 * Security Model:
 *   - The Cipher Map is shown ONLY to the message creator
 *   - The Cipher Map is NEVER sent to or stored on the server
 *   - Without the Cipher Map, the encoded content cannot be reversed
 *   - Even if the server/database is compromised, content remains encoded
 */

const cipherUtils = {

  /**
   * Generate a random Cipher Map.
   * Maps each of A-Z and 0-9 to a unique random code (2-4 lowercase chars + digits).
   * 
   * @returns {Object} e.g. { A: "x7k", B: "m2", C: "qp9f", D: "ab", ... }
   */
  generateCipherMap() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const map = {};
    const usedCodes = new Set();

    const generateRandomCode = () => {
      const len = Math.floor(Math.random() * 3) + 2; // 2-4 characters
      let code = "";
      const codeChars = "abcdefghijklmnopqrstuvwxyz0123456789";
      for (let i = 0; i < len; i++) {
        code += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
      }
      return code;
    };

    for (const char of chars) {
      let code;
      do {
        code = generateRandomCode();
      } while (usedCodes.has(code)); // Ensure uniqueness
      usedCodes.add(code);
      map[char] = code;
    }

    return map;
  },

  /**
   * Encode text using a Cipher Map.
   * Converts each character to its mapped code. Unmapped characters
   * (spaces, punctuation) are preserved as-is.
   * 
   * @param {string} text - Plaintext to encode
   * @param {Object} map - Cipher Map from generateCipherMap()
   * @returns {string} Encoded string
   */
  encodeWithCipherMap(text, map) {
    let encoded = "";
    for (const char of text.toUpperCase()) {
      if (map[char]) {
        encoded += map[char];
      } else {
        encoded += char; // Preserve unmapped characters
      }
    }
    return encoded;
  },
};

// Expose as global object (for WordPress environment)
window.cipherUtils = cipherUtils;
