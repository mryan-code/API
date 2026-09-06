# AGENTS.md

## Project description

- This is the backend for a dialer application, CRM, and CMS. It uses Twilio to make and receive calls, and SMS messages. It also uses a PostgreSQL database to store the data, sequelize for an ORM, swagger for documentation, and Moment for time manipulation.

## Project details and Primary Rules

- We use a GenericAction class for most dialer-objects (company, department, user, etc). When a dialer-object needs an include or has a non-generic column, a dedicated action class is used.
    - eg: FooBarAction
- in some cases classes call external functions directly, these functions are located in the functions directory
    - eg: functions.createTab(this, tab)
- This project uses Sequelize for an ORM
    - API Documentation: https://sequelize.org/docs/v6/
- This project uses Swagger for all documentation
    - API Documentation: https://swagger.io/docs/
    - Please create an entry in swagger.json for any route created or action modified
- This project uses moment for all time manipulation
    - All dates/times are stored as UTC
    - API Documentation: https://momentjs.com/docs/
- This project uses Jest for testing
    - API Documentation: https://jestjs.io/docs/getting-started
    - Test files are located in the **src/**tests/\*\* directory
    - Test files are named like the file they test, with **.test.ts** extensions
    - Test files are organized to mirror the source code structure
    - If an action class or function is modified, a test file is created or modified, create or modify a test file to test the new or modified code, and run that test file to see if the new or modified code works as expected.
- Most directories have an index, to include all exports

- if you are modifying the database, append to the migrations.sql file and add the new columns to the file in the form of update statements in separate update statements for each column and a timestamp comment to start and end the update statements, followed by a newline.
- Always fix tests that might be affected by the changes you are making.
- If a test fails, fix the test, and test again.
- Test to see that your modifications build properly. Warn me if they don't.
- You are allowed to read the codebase to help you complete the task
- ```See @CODEBASE``` to read the codebase
- every ```id``` is returned as whatever the table name is followed by an underscore and the column name is named in the database
    - eg: ```tblfoo.id``` -> ```foo_id```
    - eg: ```tblfoo_bar.id``` -> ```foo_bar_id```

- API Documentation: https://www.handbrake.fr/docs/en/latest/cli/command-reference.html
    - This project uses Handbrake-js to convert videos to a smaller size for storage in the database
    - This project uses Handbrake-js to convert videos to a smaller size for storage in the database

## Scripts

- Install deps: `npm install`
- Start ngrok: `npm run ngrok`
- Set the environment variables
    - eg **NGROK_URL='https://baa2f4277a56.ngrok-free.app'**
- Start dev server: `npm start`
- Build server: `npm run build`
- Run all tests: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run tests with coverage: `npm run test:coverage`
- Run a specific test file: `npm test -- formatResults.test.ts`
- Run tests matching a pattern: `npm test -- --testNamePattern="formatResults"`
- Run a dev server with ngrok and update-callbacks: `npm run dev:setup`

## Code Style

- TypeScript strict mode
- Always use double quotes, except in .env, use single quotes there
- Lower camel case for function names and variables (const, let)
- Never use var, only const or let
- Upper camel case for file names and class names
- Snake case for all database column names and object elements
- Space always preceeds a comma
- A space before and after each argument in an if, for, foreach, do/while, function
    - eg: ```if ( foo === "bar" ) { ... }```
- The trialing curly brace in an if, for, foreach, do/while, function is always on its own line
- All database tables are prefixed with tbl
    - eg: tblfoo_bar
- Environment variables are in all caps

## Rules

- If I type "cs" as a response, this means "cite sources": Give me evidence for your claim.
- Never call code "production ready"
- Do not install third party libraries without permission
- Never update 3rd party libraries without permission
- If you don't know what code to call for a given purpose, just put in a TODO and move on
- Do not remove comments I've added, simply add comment text below them if the comment becomes invalid with a given change
- Never execute commands that write, modify, or delete data in designated production environments. All proposed operations targeting production data must be presented only as code examples or descriptions, never run directly.
- Never repeat, expose, or embed environment variables, API keys, database credentials, or any form of secret/sensitive data (even masked or obfuscated) within conversation logs, code comments, or configuration files.
- All generated code and proposed configuration changes must adhere strictly to the principle of least privilege, utilizing only the minimum permissions necessary to accomplish the stated task.
- Prioritize security best practices, including input validation, output encoding, and robust error handling to prevent information leakage.
- Any code that involves network calls, file system modifications, or database interactions (side effects) must be explicitly flagged and commented as a high-risk operation requiring human review.
- Operate under the assumption that all generated code is a draft and requires mandatory human review and testing before deployment to any non-local or production environment.
- When suggesting new dependencies or libraries, favor widely used, well-maintained, and verified packages, and highlight any known security vulnerabilities associated with suggested packages.
- If the user requests an action that could potentially impact non-local infrastructure (staging, testing, or production), respond by asking for explicit confirmation, rather than providing runnable code immediately.
- Leave a comment in the code to explain what you did, and why you did it.
    - If its a simple change, a single line comment is sufficient, otherwise above a block of code.
    - If the change is complex, explain the change in a way that is easy to understand.
    - If the change is a new feature, explain the feature in a way that is easy to understand.
    - If the change is a bug fix, explain the bug fix in a way that is easy to understand.
    - If the change is a performance improvement, explain the performance improvement in a way that is easy to understand.
    - If the change is a security improvement, explain the security improvement in a way that is easy to understand.
    - If the change is a new dependency, explain the dependency in a way that is easy to understand.
    - If the change is a new library, explain the library in a way that is easy to understand.
    - If the change is a new tool, explain the tool in a way that is easy to understand.
    - If the change is a new process, explain the process in a way that is easy to understand.
- Use existing code as a guide, and do not duplicate code.
- If code can be improved, tell me how to improve it, and why it should be improved.
    - Only suggest improvements if the code is not already at its optimal performance, and I explicitly ask for it.
    - Only improve code if I explicitly ask for it.
- Old Code:
    - leave old code in the codebase, and comments it out, and leave a comment above it saving deprecated code
