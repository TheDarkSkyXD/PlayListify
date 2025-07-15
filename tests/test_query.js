// Simple test to verify the query method works
const { SQLiteAdapter } = require('./src/sqlite_adapter');

// Mock the database
const mockStatement = {
    bind: jest.fn(),
    all: jest.fn((callback) => callback(null, [{ id: 1, name: "test" }])),
    finalize: jest.fn()
};

const mockDb = {
    prepare: jest.fn(() => mockStatement)
};

// Create adapter and test
const adapter = new SQLiteAdapter('./test.db');
adapter.db = mockDb;

adapter.query('SELECT * FROM test', [])
    .then(result => {
        console.log('Test result:', result);
        console.log('Expected: [{ id: 1, name: "test" }]');
        console.log('Test passed:', JSON.stringify(result) === JSON.stringify([{ id: 1, name: "test" }]));
    })
    .catch(err => {
        console.error('Test failed:', err);
    });
