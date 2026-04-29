# UniHub Workshop

Monorepo scaffold for the UniHub workshop platform.

## Stack

- `backend/`: NestJS + Prisma + PostgreSQL + Redis
- `frontend/`: React + Vite + TailwindCSS
- `blueprint/`: proposal, design, and feature specs
- `data/`: seed script and sample CSV

## Quick start

1. Copy `.env.example` to `.env`.
2. Start infrastructure:
   `docker compose up -d`
3. Install dependencies:
   `cd backend && npm install`
   `cd ../frontend && npm install`
4. Create database schema:
   `cd ../backend && npx prisma db push`
5. Seed sample data:
   `npm run seed`
6. Run apps:
   `npm run start:dev`
   `cd ../frontend && npm run dev`

## Useful URLs

- API: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- MailHog: `http://localhost:8025`

