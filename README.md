# UniHub Workshop

Monorepo scaffold for the UniHub workshop platform.

## Stack

- `server/`: NestJS + Prisma + PostgreSQL + Redis
- `client/`: React + Vite + TailwindCSS
- `blueprint/`: proposal, design, and feature specs; the source of truth for product and technical specs
- `data/`: seed script and sample CSV

## Quick start

1. Copy `.env.example` to `.env`.
2. Start infrastructure:
   `docker compose up -d`
3. Install dependencies:
   `cd server && npm install`
   `cd ../client && npm install`
4. Create database schema:
   `cd ../server && npm run prisma:push`
5. Seed sample data:
   `npm run seed`
6. Run apps:
   `npm run start:dev`
   `cd ../client && npm run dev`

## Useful URLs

- API: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- MailHog: `http://localhost:8025`
