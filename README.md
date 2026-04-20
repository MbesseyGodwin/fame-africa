# VoteNaija

Nigeria's premier public voting competition platform.

## Architecture

```
votenaija/
├── apps/
│   ├── web/          # Next.js 14 web app (public site + dashboard)
│   └── mobile/       # React Native / Expo mobile app
├── services/
│   └── api/          # Node.js + Express backend API
├── packages/
│   └── database/     # Prisma schema + migrations + seed
└── .github/
    └── workflows/    # CI/CD pipelines
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Web Frontend | Next.js 14, Tailwind CSS, Zustand |
| Mobile | React Native, Expo |
| Real-time | Socket.io |
| Payments | Paystack |
| SMS / OTP | Termii |
| Email | Resend |
| File Storage | Cloudinary |
| Hosting (API) | Railway |
| Hosting (Web) | Vercel |
| CDN | Cloudflare |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/votenaija.git
cd votenaija
yarn install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Fill in all values in .env
cp apps/web/.env.local.example apps/web/.env.local
# Fill in web env values
```

### 3. Set up the database

```bash
# Run migrations
yarn db:migrate

# Generate Prisma client
yarn db:generate

# Seed with default data and admin user
yarn db:seed
```

### 4. Start development servers

```bash
# Terminal 1 — API
yarn dev:api

# Terminal 2 — Web
yarn dev:web

# Terminal 3 — Mobile
yarn dev:mobile
```

## Default admin credentials

```
Email: admin@votenaija.ng
Password: Admin@VoteNaija2026!
```

**Change this immediately after first login.**

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) |
| `TERMII_API_KEY` | SMS OTP provider (termii.com) |
| `RESEND_API_KEY` | Email provider (resend.com) |
| `PAYSTACK_SECRET_KEY` | Payment processing |
| `CLOUDINARY_API_KEY` | File uploads |
| `ENCRYPTION_KEY` | For hashing voter phone/email (min 32 chars) |

## Database

The full schema is in `packages/database/prisma/schema.prisma`.

All competition rules and platform configuration are stored in the `competition_settings` table as key-value pairs — no hardcoded rules anywhere in the codebase.

To view and edit the database visually:
```bash
yarn db:studio
```

## Key Features

- **OTP-verified voting** — phone number + email required, verified via Termii SMS
- **3-layer duplicate prevention** — phone hash, email hash, device fingerprint
- **All settings in database** — elimination count, vote limits, prize config, ad config — all editable via admin panel without code changes
- **Real-time vote counts** — participants see their live vote count via Socket.io
- **Per-user theme customization** — colors, fonts, dark mode, radius — all persisted to DB
- **Daily elimination cron** — runs at 23:59, reads elimination count from DB settings
- **Sponsor ad banners** — displayed during vote flow, configurable per cycle
- **Paystack payment integration** — for participant registration fees

## API

Base URL: `http://localhost:4000/api/v1`

Health check: `GET /health`

Key endpoints:
- `POST /auth/register` — create account
- `POST /auth/login` — sign in
- `POST /votes/send-otp` — request vote OTP
- `POST /votes/cast` — cast verified vote
- `GET /participants` — list active participants
- `GET /participants/:slug` — get participant by vote link slug
- `GET /participants/me/dashboard` — private dashboard (auth required)
- `GET /admin/dashboard` — admin overview (admin auth required)

## Deployment

### API → Railway

1. Create a Railway project
2. Add PostgreSQL plugin
3. Set all environment variables from `.env.example`
4. Connect GitHub repo and deploy

### Web → Vercel

1. Import repo to Vercel
2. Set root directory to `apps/web`
3. Add environment variables
4. Deploy

### Mobile → Expo EAS

```bash
cd apps/mobile
eas build --platform android
eas build --platform ios
eas submit
```

## License

Proprietary — Consolidated Software Solutions © 2026



Based on a deep dive into the VoteNaija codebase and our recent collaboration across several key areas, here is a comprehensive overview of the project.

🌟 Project Overview: VoteNaija
VoteNaija is Nigeria's premier digital platform for hosting public voting competitions and reality-style contests. Unlike simple poll tools, it is a high-integrity, full-featured ecosystem designed for transparency, mass engagement, and secure monetization.

🚀 Main Goal & Purpose
The primary goal of VoteNaija is to provide a trusted and transparent platform for talent hunts, popularity contests, and reality shows in Nigeria.

The platform addresses two critical pain points in the Nigerian competition space:

Integrity & Trust: By implementing multi-layer verification (OTP, phone/email hashing, and device fingerprinting), it prevents duplicate voting and ensures that results are credible.
Engagement & Scale: It provides tools for contestants to mobilize supporters (via "Stan" clubs and viral campaign cards) and see real-time performance on dynamic leaderboards.
🛠️ Core Architecture & Tech Stack
The project is structured as a modern typescript-based monorepo:

Backend (services/api): A Node.js & Express server. It handles the core business logic, Socket.io for real-time updates, and integration with third-party services like Paystack (payments), Termii (SMS/OTP), and Cloudinary (media).
Web App (apps/web): Built with Next.js 14 and Tailwind CSS. It serves as the primary portal for voters and the administrative dashboard.
Mobile App (apps/mobile): A React Native / Expo app that allows contestants to manage their accounts and supporters to vote on the go.
Database (packages/database): Uses Prisma ORM with PostgreSQL. The design is highly dynamic, with most business rules (elimination counts, vote costs, prize settings) stored in a competition_settings table rather than hardcoded.
💎 Key Features & Recent Developments
We have recently been focusing on shifting the platform from a simple voting tool to a legally compliant entertainment infrastructure:

Legal & KYC: We’ve implemented mandatory KYC (Know Your Customer) and AML (Anti-Money Laundering) verification for prize payouts to ensure the platform operates as a legitimate gaming/entertainment service.
Mobilization & Vitality: Features like the Stan Clubs system and custom Contestant Campaign Cards enable contestants to turn their fans into an organized mobilization force.
Secure Withdrawals: A robust two-step withdrawal flow for contestants to access their earnings securely.
Real-Time Engagement: Live leaderboards and real-time vote count broadasts via WebSockets to keep the high-stakes atmosphere "alive."
📂 Repository Structure Highlights
services/api/src/modules: Contains the domain-driven logic (e.g., voting, kyc, stans, winners).
apps/web/app: Contains the Next.js App Router pages for the public site and admin portal.
packages/database/prisma/schema.prisma: The "source of truth" for the entire platform's data model.
In summary: VoteNaija is a sophisticated "Reality TV as a Service" platform built to handle the unique technical and trust challenges of large-scale public competitions in the Nigerian market.

