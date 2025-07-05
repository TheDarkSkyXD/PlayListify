# Arc 3: Secondary Findings - Secure Storage Sources

This document contains the direct URLs for the sources used to generate the primary findings related to the secure storage of sensitive data in an Electron application.

1.  **safeStorage | Electron**
    *   URL: https://www.electronjs.org/docs/latest/api/safe-storage
    *   Relevance: The official Electron documentation for the `safeStorage` API. This is the most authoritative source, explaining what the API does, how it works on different operating systems, and providing the basic API contract (`encryptString`, `decryptString`, `isEncryptionAvailable`).

2.  **security - Best practices to store sensitive information in Electron desktop application - Stack Overflow**
    *   URL: https://stackoverflow.com/questions/63748729/best-practices-to-store-sensitive-information-in-electron-desktop-application
    *   Relevance: A high-quality community discussion that directly addresses the problem. The accepted answer correctly identifies `safeStorage` as the modern, recommended best practice, explicitly advising against storing sensitive data in plaintext.

3.  **How to securely store sensitive information in Electron with node-keytar | by Cameron Nokes | Medium**
    *   URL: https://medium.com/cameron-nokes/how-to-securely-store-sensitive-information-in-electron-with-node-keytar-51af99f1cfc4
    *   Relevance: Although this article discusses `node-keytar`, it is highly relevant because `safeStorage` is the modern, built-in replacement for `node-keytar`. The article's core argument—that one must use the OS's native credential vault—is the same fundamental principle that makes `safeStorage` the correct choice. It provides excellent context on *why* this approach is secure.

4.  **Build and Secure an Electron App - OpenID, OAuth, Node.js, and Express**
    *   URL: https://auth0.com/blog/securing-electron-applications-with-openid-connect-and-oauth-2/
    *   Relevance: This article from a major identity provider (Auth0) discusses the broader context of securing Electron apps, including handling OAuth tokens. It reinforces the need for secure storage mechanisms when dealing with authentication credentials.
4.  **Context Isolation | Electron**
    *   URL: https://www.electronjs.org/docs/latest/tutorial/context-isolation
    *   Relevance: The core documentation explaining the "why" behind modern Electron security. It provides the foundational concepts and a clear, code-based example of a good vs. bad preload script, which is the basis for the recommended strategy.

5.  **contextBridge | Electron**
    *   URL: https://www.electronjs.org/docs/latest/api/context-bridge
    *   Relevance: The official API documentation for the `contextBridge` module itself. It explains the security benefits and provides the specific syntax for exposing APIs to the renderer process.

6.  **Using Preload Scripts | Electron**
    *   URL: https://www.electronjs.org/docs/latest/tutorial/tutorial-preload
    *   Relevance: A step-by-step tutorial on the basic mechanics of using a preload script, providing the necessary context for understanding how it fits into the overall application architecture.

7.  **How to use preload.js properly in Electron - Stack Overflow**
    *   URL: https://stackoverflow.com/questions/57807459/how-to-use-preload-js-properly-in-electron
    *   Relevance: A community discussion that reinforces the official documentation and provides real-world context for the challenges developers face when implementing this pattern, especially with TypeScript.