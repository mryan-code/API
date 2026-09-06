# Testing System Documentation

This document outlines the testing system for the Dialer Backend API. The project uses Jest as the testing framework with TypeScript support.

## Table of Contents

- [Overview](#overview)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Mocking Patterns](#mocking-patterns)
- [Test Helpers](#test-helpers)
- [Coverage Reports](#coverage-reports)
- [Best Practices](#best-practices)
- [Common Testing Scenarios](#common-testing-scenarios)

## Overview

The testing system is built on:
- **Jest**: JavaScript testing framework
- **ts-jest**: TypeScript preprocessor for Jest
- **Test Helpers**: Custom utilities for mocking database and Express objects

Tests are located in `__tests__` directories adjacent to the code they test, or in files with `.test.ts` or `.spec.ts` extensions.

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

Watch mode automatically re-runs tests when files change:

```bash
npm run test:watch
```

### Run Tests with Coverage

Generate coverage reports to see which parts of your code are tested:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser to view the detailed coverage report.

### Run Specific Test Files

Run a specific test file:

```bash
npm test -- formatResults.test.ts
```

Run tests matching a pattern:

```bash
npm test -- --testNamePattern="encryptHash"
```

## Test Structure

### Test File Naming

Test files should follow one of these naming conventions:
- `*.test.ts` - Standard test files
- `*.spec.ts` - Alternative naming convention
- Located in `__tests__` directories

### Test Organization

Tests are organized to mirror the source code structure:

```
src/
├── functions/
│   ├── __tests__/
│   │   ├── formatResults.test.ts
│   │   └── encryptDecrypt.test.ts
│   ├── formatResults.ts
│   └── encryptDecrypt.ts
├── actions/
│   ├── __tests__/
│   │   └── GenericAction.test.ts
│   └── GenericAction.ts
└── __tests__/
    └── helpers/
        ├── setup.ts
        ├── mockDatabase.ts
        └── mockRequest.ts
```

## Writing Tests

### Basic Test Structure

```typescript
import { functionToTest } from "../functionToTest";

describe("functionToTest", () => {
	it("should do something specific", () => {
		const result = functionToTest(input);
		expect(result).toBe(expected);
	});
});
```

### Test Suites

Use `describe` blocks to group related tests:

```typescript
describe("MyClass", () => {
	describe("methodA", () => {
		it("should handle case 1", () => {
			// test code
		});
		
		it("should handle case 2", () => {
			// test code
		});
	});
});
```

### Setup and Teardown

Use `beforeEach`, `afterEach`, `beforeAll`, and `afterAll` for setup and cleanup:

```typescript
describe("MyTests", () => {
	beforeAll(() => {
		// Run once before all tests
	});
	
	beforeEach(() => {
		// Run before each test
	});
	
	afterEach(() => {
		// Run after each test
		jest.clearAllMocks();
	});
	
	afterAll(() => {
		// Run once after all tests
	});
});
```

## Mocking Patterns

### Mocking Functions

Mock a function from another module:

```typescript
jest.mock("../functions", () => ({
	...jest.requireActual("../functions"),
	encryptHash: jest.fn((value) => `encrypted_${value}`),
}));
```

### Mocking Database Models

Use the test helpers to mock Sequelize models:

```typescript
import { createMockModel } from "../../__tests__/helpers/mockDatabase";

jest.mock("../../models", () => ({
	User: createMockModel({ id: 1, name: "Test User" }),
}));
```

### Mocking Express Request/Response

Use the test helpers to create mock Express objects:

```typescript
import { createMockRequestResponse } from "../../__tests__/helpers/mockRequest";

const { req, res } = createMockRequestResponse({
	body: { id: 1, name: "test" },
	params: { userId: "123" },
	query: { status: "active" },
});
```

### Mocking Environment Variables

Set environment variables in tests:

```typescript
beforeAll(() => {
	process.env.OPENSSL_ALGORITHM = "aes-256-cbc";
	process.env.OPENSSL_KEY = "test-key";
	process.env.OPENSSL_IV = "test-iv";
});
```

## Test Helpers

### Database Mocking (`mockDatabase.ts`)

#### `createMockSequelize()`

Creates a mock Sequelize instance:

```typescript
import { createMockSequelize } from "../../__tests__/helpers/mockDatabase";

const mockSequelize = createMockSequelize();
```

#### `createMockModel(mockData)`

Creates a mock Sequelize model with common methods:

```typescript
import { createMockModel } from "../../__tests__/helpers/mockDatabase";

const mockUserModel = createMockModel({ id: 1, name: "Test User" });
```

#### `createMockModelInstance(data)`

Creates a mock Sequelize model instance:

```typescript
import { createMockModelInstance } from "../../__tests__/helpers/mockDatabase";

const mockUser = createMockModelInstance({ id: 1, name: "Test User" });
```

### Express Mocking (`mockRequest.ts`)

#### `createMockRequest(overrides)`

Creates a mock Express Request object:

```typescript
import { createMockRequest } from "../../__tests__/helpers/mockRequest";

const req = createMockRequest({
	body: { id: 1 },
	params: { userId: "123" },
});
```

#### `createMockResponse()`

Creates a mock Express Response object:

```typescript
import { createMockResponse } from "../../__tests__/helpers/mockRequest";

const res = createMockResponse();
```

#### `createMockRequestResponse(overrides)`

Creates both request and response mocks:

```typescript
import { createMockRequestResponse } from "../../__tests__/helpers/mockRequest";

const { req, res } = createMockRequestResponse({
	body: { id: 1 },
});
```

#### `getResponseData(res)`

Extracts data from a mocked response:

```typescript
import { getResponseData } from "../../__tests__/helpers/mockRequest";

const data = getResponseData(res);
```

#### `getResponseStatus(res)`

Gets the status code from a mocked response:

```typescript
import { getResponseStatus } from "../../__tests__/helpers/mockRequest";

const status = getResponseStatus(res);
```

## Coverage Reports

### Viewing Coverage

After running `npm run test:coverage`, coverage reports are generated in the `coverage/` directory:

- **HTML Report**: `coverage/lcov-report/index.html` - Open in a browser for detailed coverage
- **LCOV Report**: `coverage/lcov.info` - For CI/CD integration
- **Text Summary**: Displayed in the terminal

### Coverage Thresholds

Coverage thresholds can be configured in `jest.config.js`:

```javascript
coverageThreshold: {
	global: {
		branches: 80,
		functions: 80,
		lines: 80,
		statements: 80,
	},
},
```

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on the state of other tests:

```typescript
beforeEach(() => {
	jest.clearAllMocks();
});
```

### 2. Descriptive Test Names

Use clear, descriptive test names that explain what is being tested:

```typescript
// Good
it("should encrypt a string and return a hex string", () => {
	// test
});

// Bad
it("encrypt works", () => {
	// test
});
```

### 3. Arrange-Act-Assert Pattern

Structure tests with clear sections:

```typescript
it("should format a single object", async () => {
	// Arrange
	const input = { id: 1, name: "test" };
	
	// Act
	const result = await formatResults(input);
	
	// Assert
	expect(result).toBeDefined();
	expect(result[0].id).toBe("encrypted_1");
});
```

### 4. Test Edge Cases

Don't just test the happy path. Test edge cases, error conditions, and boundary values:

```typescript
it("should handle null input", async () => {
	const result = await formatResults(null);
	expect(result).toBeNull();
});

it("should handle empty array", async () => {
	const result = await formatResults([]);
	expect(result).toEqual([]);
});
```

### 5. Mock External Dependencies

Mock external dependencies like database calls, API requests, and file system operations:

```typescript
jest.mock("../../models", () => ({
	User: createMockModel(),
}));
```

### 6. Use Async/Await Properly

Always use `async/await` or return promises in async tests:

```typescript
it("should handle async operations", async () => {
	const result = await asyncFunction();
	expect(result).toBeDefined();
});
```

## Common Testing Scenarios

### Testing Utility Functions

```typescript
import { formatPhone } from "../formatPhone";

describe("formatPhone", () => {
	it("should format phone number correctly", async () => {
		const result = await formatPhone("5551234567");
		expect(result).toBe("(555) 123-4567");
	});
});
```

### Testing Action Classes

```typescript
import GenericAction from "../GenericAction";
import { createMockRequestResponse } from "../../__tests__/helpers/mockRequest";

describe("GenericAction", () => {
	it("should initialize correctly", () => {
		const { req, res } = createMockRequestResponse();
		const action = new GenericAction(req as any, res as any, false);
		expect(action.req).toBe(req);
		expect(action.res).toBe(res);
	});
});
```

### Testing Database Operations

```typescript
import { createMockModel } from "../../__tests__/helpers/mockDatabase";

jest.mock("../../models", () => ({
	User: createMockModel({ id: 1, name: "Test User" }),
}));

describe("User operations", () => {
	it("should find user by id", async () => {
		const user = await models.User.findByPk(1);
		expect(user).toBeDefined();
		expect(user.id).toBe(1);
	});
});
```

### Testing Error Handling

```typescript
it("should handle errors gracefully", async () => {
	const originalAlgorithm = process.env.OPENSSL_ALGORITHM;
	delete process.env.OPENSSL_ALGORITHM;
	
	const result = encryptHash("test");
	expect(result).toBe("test");
	
	process.env.OPENSSL_ALGORITHM = originalAlgorithm;
});
```

## Configuration

The Jest configuration is in `jest.config.js`. Key settings:

- **preset**: `ts-jest` for TypeScript support
- **testEnvironment**: `node` for Node.js environment
- **testMatch**: Patterns for test files
- **setupFilesAfterEnv**: Test setup file that runs before tests
- **coverageDirectory**: Where coverage reports are saved

## Troubleshooting

### Tests Not Running

- Ensure test files match the patterns in `jest.config.js`
- Check that `ts-jest` is properly configured
- Verify TypeScript compilation is working

### Mock Not Working

- Ensure mocks are defined before imports
- Use `jest.clearAllMocks()` in `beforeEach` to reset mocks
- Check that the module path in `jest.mock()` matches the actual import path

### Async Test Issues

- Always use `async/await` or return promises
- Increase timeout if needed: `jest.setTimeout(10000)`
- Use `await` when calling async functions in tests

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

