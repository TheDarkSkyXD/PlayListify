# Pseudocode: `PlaylistRepository.getAllPlaylists()`

**Objective:** To retrieve all playlists from the `playlists` table in the database.

**Author:** Pseudocode Writer

**Date:** 2025-07-05

---

### Function Signature

`getAllPlaylists(): Promise<Playlist[]>`

### Description

This method queries the database to fetch all existing playlists. It returns a promise that, upon successful execution, resolves with an array of `Playlist` objects. If the database query fails, the promise is rejected with the corresponding error. The results are ordered alphabetically by title to ensure a consistent return order.

---

### Pseudocode

```pseudocode
CLASS PlaylistRepository

  METHOD getAllPlaylists()
    // Returns a Promise that will resolve with an array of Playlist objects or reject with an error.
    RETURN NEW PROMISE((resolve, reject) => {

      // Define the SQL query to select all columns for all records from the 'playlists' table.
      // Ordering by 'title' in ascending order ensures a predictable and user-friendly sequence.
      CONSTANT sql_query = "SELECT id, title, description, type, createdAt, updatedAt, lastHealthCheck FROM playlists ORDER BY title ASC"

      // Use a TRY...CATCH block to gracefully handle potential database errors.
      TRY
        // Asynchronously execute the query using the database adapter.
        // The 'AWAIT' keyword pauses execution until the promise from the query method is settled.
        // The result will be an array of row objects matching the Playlist data model.
        CONSTANT allPlaylists = AWAIT this.db.query(sql_query)

        // If the query is successful, resolve the main promise with the array of playlists.
        // If no playlists exist, this will correctly resolve with an empty array.
        RESOLVE(allPlaylists)

      CATCH (error)
        // If an error occurs during the database operation (e.g., table not found, connection lost).
        LOG "Error in PlaylistRepository.getAllPlaylists: Failed to retrieve playlists from the database."
        LOG "SQL Query: " + sql_query
        LOG "Error Details: " + error.message

        // Reject the promise, passing the captured error object to the caller for handling.
        REJECT(error)
      END TRY

    }) // END PROMISE
  END METHOD

END CLASS
```

---

### Data Models

**`Playlist`**
- `id`: `integer` -- The unique identifier for the playlist.
- `title`: `string` -- The name of the playlist.
- `description`: `string` -- A brief description of the playlist's content.
- `type`: `string` -- The type or category of the playlist (e.g., 'Music', 'Podcast').
- `createdAt`: `timestamp` -- The timestamp when the playlist was created.
- `updatedAt`: `timestamp` -- The timestamp of the last update.
- `lastHealthCheck`: `timestamp` -- The timestamp of the last health check performed on the playlist's items.

### Dependencies

- **`this.db`**: An instance of `SQLiteAdapter` responsible for all database interactions.
- **`this.db.query(sql)`**: A method that executes a SQL query and returns a `Promise` with the results.