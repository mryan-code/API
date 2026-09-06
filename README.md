

# Dialer Backend





- [Description](#description)
- [Technologies Used](#technologies-used)
- [Installation and Setup](#installation-and-setup)
  - [1. Clone the repositories](#1-clone-the-repositories)
  - [2. Configure environment variables](#2-configure-environment-variables)
  - [3. Install dependencies](#3-install-dependencies)
  - [4. Start the development server](#4-start-the-development-server)
- [Project Architecture](#project-architecture)
- [Key Features](#key-features)
- [Scripts](#scripts)
- [API Documentation](#api-documentation)
- [Running Tests](#running-tests)
- [Code Style](#code-style)
- [Development Guidelines](#development-guidelines)
- [Git Flow](#git-flow)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
  - [Branch Naming Conventions](#branch-naming-conventions)

## Description

**Dialer Backend** is the server-side component of a dialer application, CRM, and CMS. It uses Twilio to make and receive calls, and SMS messages. It also uses a PostgreSQL database to store the data, Sequelize for an ORM, Swagger for documentation, and Moment for time manipulation.

## Technologies Used

- **Node.js & TypeScript** – The core technologies for the backend.
- **Jest** – Used for unit and integration testing.
- **Swagger** – Generates API documentation.
- **PostgreSQL** – Relational database for storing project and settings data.
- **Sequelize** – Sequelize is a modern TypeScript and Node.js ORM.
- **Twilio** – Twilio is a cloud-based communication platform.
- **Moment** – Used for all time manipulation.

## Installation and Setup

### 1. Clone the repositories

```bash
git clone https://github.com/eCustom-Solutions/dialer-api.git
cd dialer-api
```

### 2. Configure environment variables

```bash
cp env.sample .env
# Edit the .env file and set the required credentials
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm start
```

## Project Architecture

This project uses a GenericAction class for most dialer-objects (company, department, user, etc). When a dialer-object needs an include or has a non-generic column, a dedicated action class is used.

### Key Objects

The system manages several core objects:

- **Leads** – Customer leads that can be assigned to users, have multiple cases, phone numbers, and communications
- **Companies** – Parent organizations that contain departments and users
- **Departments** – Child organizations of companies, each with operating hours and default settings
- **Users** – System users who can make calls, manage leads, and have statuses
- **Communications** – Calls and SMS messages tracked through Twilio
- **Cases** – Work items associated with leads
- **Tabs** – Active call sessions displayed in the frontend
- **Notifications** – User notifications for calls, SMS, and general messages
- **Forms** – Custom forms attached to departments with fields and options

All IDs are hashed when returned from the API. Database column names are prefixed with the table name followed by an underscore (e.g., `tblfoo.id` → `foo_id`).

## Key Features

- **Twilio Integration** – Make and receive calls and SMS messages
- **Lead Management** – Create, assign, and track leads with multiple cases
- **Call Routing** – Automatic routing of inbound calls based on department hours and user availability
- **WebSocket Support** – Real-time updates for notifications and tabs
- **Authentication System** – User authentication with role-based access control
- **Timezone Support** – Company and user-level timezone configuration
- **Form Management** – Custom forms with fields and options per department
- **Call Dispositions** – Track call outcomes and dispositions
- **Activity Logging** – Comprehensive logging for errors, requests, and user activities

## Scripts

- **Install dependencies**: `npm install`
- **Start ngrok**: `npm run ngrok`
- **Start dev server**: `npm start`
- **Build server**: `npm run build`
- **Run all tests**: `npm test`
- **Run tests in watch mode**: `npm run test:watch`
- **Run tests with coverage**: `npm run test:coverage`
- **Run a specific test file**: `npm test -- formatResults.test.ts`
- **Run tests matching a pattern**: `npm test -- --testNamePattern="encryptHash"`
- **Run a dev server with ngrok and update-callbacks**: `npm run dev:setup`

### Development Setup with ngrok

For local development with Twilio callbacks:

1. Start ngrok: `npm run ngrok`
2. Set the environment variable: `NGROK_URL='https://your-ngrok-url.ngrok-free.app'`
3. Update Twilio callbacks: `HTTP_PROTOCOL://HTTP_HOST:HTTP_PORT/update-twilio-callback?user_id=7`

## API Documentation

The API documentation is available at:
[http://localhost:9876/api-docs/](http://localhost:9876/api-docs/)

All routes should have corresponding Swagger documentation entries in `swagger.json`.

## Running Tests

- **Run all tests**: `npm test`
- **Run tests in watch mode**: `npm run test:watch`
- **Run tests with coverage**: `npm run test:coverage`
- **Run a specific test file**: `npm test -- formatResults.test.ts`
- **Run tests matching a pattern**: `npm test -- --testNamePattern="encryptHash"`

Test files are located in the `src/tests/` directory and are named like the file they test, with `.test.ts` extensions. Test files are organized to mirror the source code structure.

### Test Data

- Test `user_id` = 1
- Test `company_id` = 1
- Test `department_id` = 1

## Code Style

- **TypeScript strict mode** – All code must follow TypeScript strict mode
- **Quotes** – Always use double quotes, except in `.env` files (use single quotes there)
- **Naming conventions**:
  - Lower camel case for function names and variables (`const`, `let`)
  - Upper camel case for file names and class names
  - Snake case for all database column names and object elements
- **Variables** – Never use `var`, only `const` or `let`
- **Spacing**:
  - Space always precedes a comma
  - A space before and after each argument in `if`, `for`, `foreach`, `do/while`, `function`
    - Example: `if ( foo === "bar" ) { ... }`
  - The trailing curly brace in an `if`, `for`, `foreach`, `do/while`, `function` is always on its own line
- **Database tables** – All database tables are prefixed with `tbl` (e.g., `tblfoo_bar`)
- **Environment variables** – Environment variables are in all caps

## Development Guidelines

- **Action Classes**: Use GenericAction for most dialer-objects. Create dedicated action classes when custom includes or non-generic columns are needed
- **ID Hashing**: All IDs are hashed using `functions.encryptHash` before being returned
- **Time Handling**: All dates/times are stored as UTC. Use Moment.js for all time manipulation
- **Testing**: If an action class or function is modified, create or modify a test file to test the new or modified code
- **Swagger Documentation**: Create an entry in `swagger.json` for any route created or action modified
- **Code Comments**: Leave comments in code to explain what you did and why. Simple changes need a single line comment; complex changes need more detailed explanations above the code block
- **Deprecated Code**: Leave old code in the codebase, comment it out, and leave a comment above it saving deprecated code
- **Build Verification**: Test to see that your modifications build properly before committing

### Security Best Practices

- Never execute commands that write, modify, or delete data in designated production environments
- Never repeat, expose, or embed environment variables, API keys, database credentials, or any form of secret/sensitive data
- All generated code must adhere to the principle of least privilege
- Prioritize security best practices, including input validation, output encoding, and robust error handling
- Any code involving network calls, file system modifications, or database interactions must be explicitly flagged and commented as a high-risk operation requiring human review

## Git Flow

Git Flow is a branching model for Git that provides a robust framework for managing larger projects. This project follows Git Flow conventions for branch management.

### Installation

**macOS (Homebrew)**:

```bash
brew install git-flow
```

**Linux (Debian/Ubuntu)**:

```bash
apt-get install git-flow
```

**Windows (Git for Windows)**:

Git Flow is included with Git for Windows. If not available, install via:

```bash
# Using Chocolatey
choco install gitflow-avh

# Or download from: https://github.com/nvie/gitflow/wiki/Windows
```

**Initialize Git Flow in the repository**:

```bash
git flow init
```

Accept the default branch names when prompted (or customize as needed):

- Production branch: `master`
- Development branch: `dev`
- Feature prefix: `feature/`
- Release prefix: `release/`
- Hotfix prefix: `hotfix/`
- Support prefix: `support/`

### Basic Usage

**Starting a new feature**:

```bash
# Start a new feature branch from develop
git flow feature start <feature-name>

# This creates: feature/<feature-name>
```

**Finishing a feature**:

```bash
# Merge feature back into develop and delete the feature branch
git flow feature finish <feature-name>
```

**Publishing a feature** (push to remote for collaboration):

```bash
git flow feature publish <feature-name>
```

**Pulling a feature** (get a published feature from remote):

```bash
git flow feature pull origin <feature-name>
```

**Starting a release**:

```bash
# Start a release branch from develop
git flow release start <version>

# This creates: release/<version>
```

**Finishing a release**:

```bash
# Merge into main and develop, tag the release, delete the release branch
git flow release finish <version>
```

**Starting a hotfix**:

```bash
# Start a hotfix branch from main for urgent production fixes
git flow hotfix start <hotfix-name>

# This creates: hotfix/<hotfix-name>
```

**Finishing a hotfix**:

```bash
# Merge into master and dev, tag the hotfix, delete the hotfix branch
git flow hotfix finish <hotfix-name>
```

### Branch Naming Conventions


| Branch Type | Prefix     | Example                       | Purpose                            |
| ----------- | ---------- | ----------------------------- | ---------------------------------- |
| Feature     | `feature/` | `feature/user-authentication` | New features and enhancements      |
| Release     | `release/` | `release/1.2.0`               | Preparing a new production release |
| Hotfix      | `hotfix/`  | `hotfix/login-bug`            | Urgent fixes for production        |
| Support     | `support/` | `support/legacy-api`          | Long-term support branches         |


**Branch Workflow Summary**:

```
master (production)
  │
  ├── hotfix/* ──────────-────────┐
  │                              │
  └── dev ◄────────────----──────┤
        │                        │
        ├── feature/* ───────────┤
        │                        │
        └── release/* ───────────┘
```

- `master` – Always reflects production-ready state
- `dev` – Integration branch for features, reflects latest development changes
- `feature/*` – Branch off from `dev`, merge back into `dev`
- `release/*` – Branch off from `dev`, merge into both `master` and `dev`

```
hotfix/* – Branch off from master, merge into both master and dev
```



Use the `-p` (push) flag with the `finish` command to delete the remote branch as well:

**bash**

```
git flow feature finish -p feature/foo-bar
```

