# Test Suite for Persistent Backend Task Management Service

This directory contains the comprehensive test suite for the **Persistent Backend Task Management Service** feature, written following Test-Driven Development (TDD) principles.

## Test Structure

The test suite is organized into three main categories:

### 1. Unit Tests (	ests/services/)
- **File**: ackground_task_service.test.ts
- **Purpose**: Test the business logic of BackgroundTaskService in complete isolation
- **Approach**: Uses mocked dependencies (London School TDD)
- **Coverage**: Task creation, state transitions, parent/child logic, progress aggregation

### 2. Integration Tests (	ests/integration/)
- **File**: 	ask_management_integration.test.ts
- **Purpose**: Verify interaction between service and repository layers
- **Approach**: Uses real BackgroundTaskRepository with in-memory SQLite database
- **Coverage**: Database schema, persistence, startup resume functionality

### 3. Edge Case Tests (	ests/edge_cases/)
- **File**: 	ask_management_edge_cases.test.ts
- **Purpose**: Test system behavior under edge conditions and failure scenarios
- **Approach**: Simulates invalid inputs, corrupted data, and system failures
- **Coverage**: Data validation, error handling, resilience patterns

## Running the Tests

### Prerequisites
`ash
npm install
`

### Run All Tests
`ash
npm test
`

### Run Specific Test Categories
`ash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Edge case tests only
npm run test:edge-cases
`

### Run Tests in Watch Mode
`ash
npm run test:watch
`

### Generate Coverage Report
`ash
npm run test:coverage
`

## Test Design Principles

### TDD Approach
These tests are written **before** the implementation exists, following the Red-Green-Refactor cycle:
1. **Red**: Tests fail initially (implementation doesn't exist)
2. **Green**: Implement minimal code to make tests pass
3. **Refactor**: Improve code while keeping tests green

### London School TDD
- **Unit tests** mock all dependencies to test behavior in isolation
- **Integration tests** use real dependencies to test component interaction
- Focus on **observable outcomes** rather than implementation details

### AI-Verifiable Success Criteria
Each test case represents an AI-verifiable task with clear:
- **Arrange**: Set up test conditions
- **Act**: Execute the operation being tested
- **Assert**: Verify expected outcomes

## Test Cases Implemented

### Unit Tests (UTC)
- UTC-01: Create a Single Task
- UTC-02: Create a Parent and Child Task
- UTC-03: Update Task Status
- UTC-04: Update Task Progress
- UTC-05: Parent Progress Aggregation
- UTC-06: Parent Status Aggregation (All Children Success)
- UTC-07: Parent Status Aggregation (One Child Fails)

### Integration Tests (ITC)
- ITC-01: Database Schema Creation
- ITC-02: Create and Retrieve Task
- ITC-03: Update and Retrieve Task
- ITC-04: Resume Unfinished Tasks on Startup

### Edge Case Tests (ECT)
- ECT-01: Invalid Data Inputs (null/empty titles, invalid progress)
- ECT-02: Invalid State Transitions (terminal state modifications)
- ECT-03: Circular Dependencies (parent-child cycles)
- ECT-04: Database Connection Failures
- ECT-05: File System Failures (read-only, disk full)
- ECT-06: Data Corruption Scenarios
- ECT-07: Resource Exhaustion (high volume operations)
- ECT-08: Concurrent Access (race conditions)

## Expected Behavior

### Initial State
**All tests should FAIL initially** because the implementation doesn't exist yet. This is the expected and desired behavior for TDD.

### Implementation Phase
As you implement the BackgroundTaskService, BackgroundTaskRepository, and related components, tests should gradually start passing.

### Completion Criteria
The feature is complete when:
1. All tests pass
2. Code coverage meets project standards
3. All edge cases are handled gracefully
4. Performance requirements are met

## Dependencies

The tests require these key dependencies:
- **Jest**: Testing framework
- **TypeScript**: Type safety and compilation
- **better-sqlite3**: In-memory database for integration tests
- **ts-jest**: TypeScript support for Jest

## Notes

- Tests use in-memory SQLite databases for speed and isolation
- Mock implementations follow the same interface as real components
- Error scenarios are thoroughly tested to ensure resilience
- Performance tests verify the system can handle high-volume operations

## Contributing

When adding new test cases:
1. Follow the existing naming convention (UTC/ITC/ECT-XX)
2. Include clear documentation of the test purpose
3. Use appropriate mocking strategies for the test type
4. Ensure tests are deterministic and isolated
5. Add performance assertions where relevant
