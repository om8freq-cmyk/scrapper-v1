# Cognitive CRM

> An intelligent CRM platform that automatically scrapes target websites for lead generation data, stores structured data securely, and triggers autonomous, personalized email workflows.

## Architecture

- **Backend**: NestJS 11 (TypeScript) — REST API, BullMQ workers, Playwright scraper
- **Frontend**: React 19 + Vite 8 + Tailwind CSS — Premium dashboard with light/dark theme
- **Database**: PostgreSQL 16 + Prisma ORM 7.8
- **Queue**: Redis 7 + BullMQ 5.77
- **Email**: Nodemailer 8 with HTML templates
- **Scraper**: Playwright 1.60 (headless Chromium)

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL & Redis)
- [Git](https://git-scm.com/)

## Quick Start

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis containers.

### 2. Backend Setup

```bash
cd backend
cp ../.env.example .env    # Edit with your SMTP credentials
npm install
npx prisma migrate dev     # Run database migrations
npm run start:dev           # Start NestJS in watch mode
```

Backend runs at `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev                 # Start Vite dev server
```

Frontend runs at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List leads (paginated, filterable) |
| GET | `/api/leads/stats` | Dashboard statistics |
| GET | `/api/leads/:id` | Get lead detail |
| PATCH | `/api/leads/:id` | Update lead status |
| DELETE | `/api/leads/:id` | Delete a lead |
| POST | `/api/scraper/jobs` | Create a scrape job |
| GET | `/api/scraper/jobs` | List scrape jobs |
| GET | `/api/scraper/jobs/:id` | Get job detail |

## Project Structure

```
ScRaPpEr/
├── docker-compose.yml          # PostgreSQL + Redis
├── .env.example                # Environment template
├── backend/                    # NestJS API + Workers
│   ├── prisma/                 # Database schema & migrations
│   └── src/
│       ├── leads/              # Lead CRUD module
│       ├── scraper/            # Web scraper module
│       ├── email/              # Email dispatch module
│       ├── queue/              # BullMQ configuration
│       └── prisma/             # Database service
└── frontend/                   # React Dashboard
    └── src/
        ├── components/         # UI + Dashboard components
        ├── pages/              # Route pages
        ├── store/              # Zustand state
        └── api/                # API client
```

## Environment Variables

See [.env.example](.env.example) for all configuration options.

## License

Private — All rights reserved.
