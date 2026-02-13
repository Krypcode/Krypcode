# Krypcode

Client-side encrypted secret message sharing service

**All encryption happens in the browser.** The server only stores already-encrypted content and never has access to the original message or the Cipher Map (decryption key).

🔗 [Try Krypcode](https://krypcode.com/krypcode-secure-link/) · 📖 [How It Works](https://krypcode.com/how-it-works/) · 📝 [How to Use](https://krypcode.com/how-to-use/)

---

## How It Works

### 1. Creating Your Secret Message

Enter three fields to create an encrypted message:

- **Nickname** — Becomes part of the unique URL (e.g., `john-1706012345`). English letters and numbers only.
- **Password** — Protects access to the encrypted content page. Hashed with bcrypt before storage.
- **Secret Content** — The message to encrypt. English letters, numbers, and common punctuation.

When you click **"Create Secure Link"**:

1. A unique **Cipher Map** is randomly generated in your browser
2. Your content is **encrypted in the browser** using the Cipher Map
3. Only the encrypted content is sent to the server
4. The server hashes your password with bcrypt (cost 12) and stores the encrypted content
5. A unique URL is returned

Alternatively, **"Create Krypcode-only"** generates a Cipher Map without creating a server-side post — useful for offline encoding.

### 2. Understanding the Cipher Map

The Cipher Map is a **character mapping table** — the only key to decode your message.

Each letter (A-Z) and number (0-9) is assigned a unique random code (2-4 characters):

```
Example Cipher Map:
  H → 9xq
  E → k3m
  L → p7z
  O → a2f

"HELLO" → "9xqk3mp7zp7za2f"
```

- Each Cipher Map is **randomly generated** — no two are the same
- The Cipher Map is **never sent to or stored on the server**
- Without it, the encrypted content is impossible to decode

> ⚠️ **Save your Cipher Map!** Click "Save as Image" before closing. If lost, no one — including administrators — can recover your message.

### 3. Sharing and Decrypting

For maximum security, send the **link** and the **Cipher Map** through **different channels**:

| What to Share         | How to Send                                   |
| --------------------- | --------------------------------------------- |
| Secure Link / QR Code | Messenger, email, any digital channel         |
| Cipher Map (image)    | In person, printed handoff, or a separate app |
| Password              | Tell the recipient directly                   |

**For the recipient:**

1. Open the Secure Link
2. Enter the password → server verifies the bcrypt hash
3. View the encrypted content (still scrambled)
4. Use the Cipher Map to decode each code back to the original letters

> 💡 **Tip:** For one-time messages, delete the post after the recipient confirms decoding. This removes all traces from the server.

---

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT (Browser)                                               │
│                                                                 │
│  • Generates random Cipher Map                                  │
│  • Encodes content using the Cipher Map                         │
│  • Sends ENCRYPTED content + password to server                 │
│                                                                 │
│  ⚠️ Cipher Map is shown ONLY to the creator.                    │
│     It is NEVER sent to the server.                             │
└────────────────────────────┬────────────────────────────────────┘
                             │ AJAX
┌────────────────────────────▼────────────────────────────────────┐
│  SERVER                                                         │
│                                                                 │
│  Stores:                                                        │
│    ✓ Encrypted content (unreadable without Cipher Map)          │
│    ✓ bcrypt password hash (irreversible)                        │
│    ✗ Original message — never received                          │
│    ✗ Cipher Map — never received                                │
└─────────────────────────────────────────────────────────────────┘
```

**Triple-layer protection:**

1. **Password** — Only those who know it can access the page
2. **Cipher encryption** — Content is scrambled with a unique Cipher Map
3. **Separated delivery** — Link and Cipher Map travel through different channels

---

## File Structure

```
krypcode-core/
├── assets/js/
│   ├── crypto.js              ← Cipher Map generation & text encoding
│   ├── krypcode-form.js       ← Message creation flow (encrypt → AJAX)
│   └── single-krypcode.js     ← Password verification & post deletion
└── includes/
    └── class-krypcode-ajax.php ← Server AJAX handlers (create/verify/delete)
```

| File                      | Role                                                    | Runs On |
| ------------------------- | ------------------------------------------------------- | ------- |
| `crypto.js`               | Cipher Map generation, text encoding                    | Client  |
| `krypcode-form.js`        | Form validation, encryption, AJAX submission            | Client  |
| `single-krypcode.js`      | Password verification, post deletion                    | Client  |
| `class-krypcode-ajax.php` | Store encrypted post, verify password hash, delete post | Server  |

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

Copyright (c) 2026 Krypcode.com
