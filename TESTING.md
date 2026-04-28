# End-to-End Testing Guide

## Overview
This project uses Jest and Supertest for end-to-end API testing. The tests cover authentication, provider management, practice management, and search functionality.

## Prerequisites

1. **MySQL Database**: You need a MySQL server running locally
2. **Test Database**: Create a test database called `arcm_test`

## Setup

### 1. Create Test Database

```bash
cd packages/server
npx tsx tests/setupTestDb.ts
```

### 2. Run Migrations on Test Database

```bash
cd packages/server
MYSQL_DATABASE=arcm_test npx drizzle-kit push
```

Or set the database in your `.env.test` file and run:
```bash
npx drizzle-kit push
```

### 3. Update Test Environment

Edit `.env.test` with your MySQL credentials:
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=arcm_test
```

## Running Tests

### Run all tests:
```bash
cd packages/server
npm test
```

### Run specific test file:
```bash
npm test -- auth.e2e.test.ts
npm test -- providers.e2e.test.ts
npm test -- practices.e2e.test.ts
npm test -- search.e2e.test.ts
```

### Run tests with watch mode:
```bash
npm test -- --watch
```

## Test Structure

```
packages/server/tests/
├── e2e/
│   ├── auth.e2e.test.ts          # Authentication flows
│   ├── providers.e2e.test.ts     # Provider CRUD operations
│   ├── practices.e2e.test.ts     # Practice CRUD operations
│   └── search.e2e.test.ts       # Search functionality
├── helpers/
│   └── testApp.ts                # Express app setup for testing
├── setup.ts                      # Database setup utilities
└── setupTestDb.ts                # Test database creation script
```

## What's Being Tested

### Authentication (`auth.e2e.test.ts`)
- Login with valid/invalid credentials
- Token refresh
- Protected route access
- Logout

### Providers (`providers.e2e.test.ts`)
- Create provider
- Get all providers with filters
- Get provider by ID
- Update provider
- Delete provider
- Add/remove from favorites

### Practices (`practices.e2e.test.ts`)
- Create practice
- Get all practices with filters
- Get practice by ID
- Update practice
- Delete practice
- Practice locations CRUD
- Add/remove from favorites

### Search (`search.e2e.test.ts`)
- Search providers by name
- Search providers by specialization
- Search practices by name
- Combined filters

## Notes

- Tests use a separate test database (`arcm_test`) to avoid polluting development data
- Each test cleans up after itself by deleting created records
- JWT secrets are set to test values in the test files
- Test timeout is set to 30 seconds to accommodate database operations
