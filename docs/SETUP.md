# PeopleFlow HRIS — Next.js source

A Next.js/Vinext and Cloudflare D1 HRIS starter with employees, departments, positions, attendance, leave approvals, monthly base-salary payroll snapshots, dashboard, people analytics, and CSV export.

## Local setup

Requirements: Node.js 22.13+ and pnpm. Run `corepack enable` if pnpm is not installed.

Extract the ZIP, open a terminal in the `peopleflow-hris` folder, then run:

```bash
pnpm install
pnpm build
pnpm exec wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_striped_the_fallen.sql
pnpm dev
```

Open the address printed by `pnpm dev`, normally http://localhost:5173. Run the migration command only once per fresh local database. The first build creates the local Worker configuration. The sanitized `.openai/hosting.json` in this ZIP declares logical D1 binding `DB` without the original deployed Site ID. This project uses Vinext on Cloudflare Workers; plain `next dev` does not supply the D1 binding.

## Explore the workflows

1. Click **Load sample data** on the Overview page, or create departments, positions and employees yourself.
2. Edit employee profiles, filter the directory and export a CSV.
3. Record today's clock-in and clock-out for active employees.
4. Submit and approve or reject a leave request.
5. Generate a draft payroll run for a month and inspect the employee salary snapshot before finalizing.

## Code map

- `app/page.tsx` — HRIS screens and interactions
- `app/api/hris/route.ts` — API, validation and workflows
- `db/schema.ts` — seven relational tables
- `drizzle/0000_striped_the_fallen.sql` — initial migration
- `app/globals.css` — responsive design

## Production scope

This is a working HRIS foundation, not a production payroll or compliance system. Payroll uses monthly base salary only: no tax, SSS, PhilHealth, Pag-IBIG, overtime, benefits, proration, or deductions. Leave duration counts calendar days and does not deduct a balance. The private hosted Site restricts access to its owner, but the source does not implement company roles, employee self-service, approval audit history, or tenant isolation. Add those safeguards and verify Philippine employment and payroll rules before entering real employee data.
