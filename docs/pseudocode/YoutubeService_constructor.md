# Pseudocode for `YoutubeService.constructor`

This document provides the detailed, language-agnostic pseudocode for the constructor of the `YoutubeService` class.

---

## `CONSTRUCTOR(key: string)`

### **Description**

Initializes a new instance of the `YoutubeService`, setting the required API key for subsequent operations.

### **Parameters**

-   `key` (STRING)-- The API key for the service. While this service uses `yt-dlp-wrap` and not the official YouTube Data API, this key may be used for a related service or future integrations.

### **Pre-conditions**

-   The `key` parameter must be a valid, non-empty string.

### **Post-conditions**

-   A new `YoutubeService` object is successfully instantiated.
-   The class property `this.apiKey` is initialized with the value of the `key` parameter.

### **Error Handling**

-   **`ArgumentException`**: Thrown if the `key` parameter does not meet the validation criteria.
    -   **Condition**: `key` is `NULL`, `UNDEFINED`, not of type `STRING`, or is an empty string (`""`).
    -   **Message**: "API key must be a non-empty string."

---

### **Step-by-Step Logic**

```pseudocode
CONSTRUCTOR YoutubeService(key)
    // 1. Input Validation
    // Check if the provided key is null, not a string, or an empty string.
    IF key IS NULL OR TYPEOF(key) IS NOT STRING OR key IS "" THEN
        // If validation fails, throw an exception.
        THROW new ArgumentException("API key must be a non-empty string.")
    ENDIF

    // 2. Property Assignment
    // If validation is successful, assign the key to the instance's apiKey property.
    this.apiKey = key

    // The constructor does not have an explicit return value.
END CONSTRUCTOR