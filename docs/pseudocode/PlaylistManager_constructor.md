# Pseudocode for PlaylistManager.constructor

This document outlines the pseudocode for the constructor of the `PlaylistManager` class.

## Constructor

**Name:** `constructor`

**Description:**
Initializes a new instance of the `PlaylistManager` class, setting up its dependencies.

**Parameters:**
- `pRepo`: `PlaylistRepository` -- An instance of the PlaylistRepository for playlist data operations.
- `vRepo`: `VideoRepository` -- An instance of the VideoRepository for video data operations.

**Return Type:** `void`

---

### **Logic**

```plaintext
CONSTRUCTOR(pRepo, vRepo)
    //-- Validate that the PlaylistRepository instance is provided.
    IF pRepo IS NULL THEN
        THROW New ArgumentException("PlaylistRepository instance cannot be null.")
    END IF

    //-- Validate that the VideoRepository instance is provided.
    IF vRepo IS NULL THEN
        THROW New ArgumentException("VideoRepository instance cannot be null.")
    END IF

    //-- Assign the repository instances to the class properties.
    this.playlistRepository = pRepo
    this.videoRepository = vRepo

END CONSTRUCTOR
```

---

### **Error Handling**

- **`ArgumentException`**: Thrown if either the `pRepo` or `vRepo` parameter is null, ensuring that the `PlaylistManager` is instantiated with valid dependencies.