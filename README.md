# PeopleFlow HRIS

A Next.js/Vinext and Cloudflare D1 HRIS starter with employees, departments, positions, attendance, leave approvals, monthly base-salary payroll snapshots, dashboard, people analytics, and CSV export.

Portfolio demonstration by RowLee Tanawan. The implementation uses Next.js-compatible App Router APIs with the Vinext runtime; deployment targets Cloudflare Workers. It is not a conventional standalone `next dev` deployment.

## Features

See the implemented workflows in [setup and project documentation](docs/SETUP.md).

## Technology

React, TypeScript, Next.js-compatible App Router, Vinext, Vite and responsive CSS. Cloudflare D1 SQLite and Drizzle migrations provide persistent data.

## Run locally

Node.js 22.13+ is required. Follow [installation, database initialization and walkthrough instructions](docs/SETUP.md), including the project-specific migration command. Dependencies and local database files are excluded from source control.

## Screenshots

Actual application screenshots are pending capture. No mockup is presented as a running application screenshot.

## Project layout

- `app/page.tsx`: application interface
- `app/globals.css`: responsive styling
- `app/api/`: server workflows, where applicable
- `db/` and `drizzle/`: schema and migrations, where applicable
- `docs/SETUP.md`: full setup, workflow rules and limitations

## Demo scope

Use fictional data for portfolio demonstrations. See [documented limitations](docs/SETUP.md) before deployment; authentication, payment integrations and operational safeguards vary by project and are not implied by the portfolio presentation.
