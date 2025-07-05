# Arc 3: Primary Findings - Secure Storage of Sensitive Data

## Finding 1: The Use of `safeStorage` is Non-Negotiable

**Source(s):** Electron Docs (safeStorage), Stack Overflow, Medium (Cameron Nokes)

**Key Insight:** Storing sensitive information, particularly OAuth tokens, directly in a plain-text JSON file (the default behavior of `electron-store`) is a major security vulnerability. The correct and only recommended approach is to use Electron's native `safeStorage` API, which integrates with the host operating system's credential vault.

**Paraphrased Summary:**
The `electron-store` library is excellent for managing non-sensitive user settings like window size or theme preference. However, for any data that could be exploited if compromised—such as API keys or OAuth refresh tokens—it is mandatory to use an additional layer of encryption.

**The `safeStorage` API:**
*   **What it is:** A built-in Electron module that provides methods for encrypting and decrypting data using the OS's native, hardware-backed secret storage (e.g., Keychain on macOS, Windows Data Protection API, libsecret on Linux).
*   **Why it's secure:** The encryption key is managed entirely by the operating system and is often tied to the user's login credentials. This means that another user on the same machine cannot access the encrypted data, and it is significantly more difficult for malware to extract the secrets compared to a plain-text file.

**Implementation Strategy for Playlistify:**

The `settingsService` will be designed with a clear separation between sensitive and non-sensitive data.

1.  **Non-Sensitive Data:** Standard settings will be stored directly using `electron-store`'s `set` and `get` methods.
    ```javascript
    // Storing a non-sensitive setting
    settingsStore.set('theme', 'dark');
    ```

2.  **Sensitive Data (e.g., YouTube OAuth Token):**
    *   Before being stored, the token will first be encrypted using `safeStorage.encryptString()`.
    *   The result of the encryption is a `Buffer`, which can then be converted to a string (e.g., base64) and stored in `electron-store`.
    *   When retrieving the token, the application will get the encrypted string from `electron-store`, convert it back to a `Buffer`, and then decrypt it using `safeStorage.decryptString()`.

**Example Workflow:**

```javascript
import { safeStorage } from 'electron';
import Store from 'electron-store';

const store = new Store();

// To save a token
const oauthToken = 'some-very-secret-oauth-token';
const encryptedToken = safeStorage.encryptString(oauthToken);
store.set('youtube_oauth_token', encryptedToken.toString('base64'));

// To retrieve a token
const encryptedTokenB64 = store.get('youtube_oauth_token');
if (encryptedTokenB64 && safeStorage.isEncryptionAvailable()) {
  const buffer = Buffer.from(encryptedTokenB64, 'base64');
  const decryptedToken = safeStorage.decryptString(buffer);
  // Now use the decryptedToken
}
```

This hybrid approach leverages the convenience of `electron-store` for general settings while ensuring that all sensitive data is handled according to modern security best practices.