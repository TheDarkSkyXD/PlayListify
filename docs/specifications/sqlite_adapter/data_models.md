# SQLiteAdapter Data Models

This document details the data models used by the `SQLiteAdapter` class, including the constructor and `query` method.

## DM.2: Query Parameters

| Parameter | Type    | Description                                                                                                                                                                                                                                |
| --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| sql       | string  | The SQL query to execute.  It is crucial that this query is treated as a template for a parameterized query, and that the parameters are bound separately to prevent SQL injection attacks.  The specific syntax depends on the library. |
| params    | any\[] | An array of parameters to bind to the SQL query. The types of parameters depend on the query and the database schema.  It's crucial that the database library used handles proper escaping and parameter binding.                                                                                                        |

## DM.3: Query Result

| Property | Type    | Description                                                                                                                                                                                                |
| -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rows     | any\[] | An array of objects representing the rows returned by the query.  The structure of each object depends on the query and the database schema.  Each object should contain key-value pairs corresponding to the column names and values. |