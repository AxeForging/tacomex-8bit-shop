# TacoMex 8-Bit Shop

A full-stack retro-themed Mexican food delivery platform built with Fastify, React, PostgreSQL, and Redis.

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Fastify 4, Drizzle ORM, TypeScript      |
| Frontend   | React 18, Vite 5, Zustand, React Query  |
| Database   | PostgreSQL 15                            |
| Cache      | Redis 7                                 |
| Infra      | Docker Compose                          |

## Quick Start

```bash
git clone https://github.com/AxeForging/tacomex-8bit-shop.git
cd tacomex-8bit-shop
docker compose up --build
```

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:5173        |
| API       | http://localhost:3001/api    |
| Swagger   | http://localhost:3001/docs   |
| Health    | http://localhost:3001/health |

The seed service runs automatically on first start and populates the database with sample data.

## Demo Credentials

| Role     | Email                  | Password  |
|----------|------------------------|-----------|
| Admin    | admin@tacomex.com      | admin123  |
| Customer | customer@tacomex.com   | pass123   |

## Promo Codes

`TACO20` `BURRITO10` `FIRSTORDER` `FREEDELIVERY` `8BITDEAL`

## Connecting to Services

### PostgreSQL

```
Host: localhost
Port: 5432
Database: tacomex_shop
User: tacomex
Password: tacomex_secret
```

```bash
psql postgresql://tacomex:tacomex_secret@localhost:5432/tacomex_shop
```

### Redis

No password required.

```bash
redis-cli -h localhost -p 6379
```

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint    | Auth | Description          |
|--------|-------------|------|----------------------|
| POST   | `/register` | -    | Register new user    |
| POST   | `/login`    | -    | Login, returns JWT   |
| GET    | `/me`       | JWT  | Get current profile  |

### Products (`/api/products`)

| Method | Endpoint           | Auth  | Description                     |
|--------|--------------------|-------|---------------------------------|
| GET    | `/`                | -     | List with filters & pagination  |
| GET    | `/featured`        | -     | Featured products (max 10)      |
| GET    | `/:id`             | -     | Get by ID or slug               |
| POST   | `/`                | Admin | Create product                  |
| PATCH  | `/:id`             | Admin | Update product                  |
| DELETE | `/:id`             | Admin | Delete product                  |
| GET    | `/categories/list` | -     | Categories with product counts  |

**Query params:** `category`, `featured`, `available`, `minPrice`, `maxPrice`, `spiceLevel`, `search`, `sortBy`, `sortOrder`, `page`, `limit`

### Categories (`/api/categories`)

| Method | Endpoint | Auth | Description                 |
|--------|----------|------|-----------------------------|
| GET    | `/`      | -    | List all with product count |
| GET    | `/:id`   | -    | Get by ID/slug with products|

### Orders (`/api/orders`)

| Method | Endpoint      | Auth  | Description                           |
|--------|---------------|-------|---------------------------------------|
| GET    | `/`           | JWT   | List orders (own or all for admin)    |
| GET    | `/:id`        | JWT   | Order detail with items & history     |
| POST   | `/`           | JWT   | Place order with items & promo code   |
| PATCH  | `/:id/status` | Admin | Update status                         |

**Order status flow:** `pending` -> `confirmed` -> `preparing` -> `ready` -> `delivered` (or `cancelled`)

### Promotions (`/api/promotions`)

| Method | Endpoint    | Auth  | Description              |
|--------|-------------|-------|--------------------------|
| GET    | `/`         | Admin | List all promotions      |
| GET    | `/active`   | -     | Active promotions        |
| POST   | `/validate` | -     | Validate promo code      |
| POST   | `/`         | Admin | Create promotion         |
| PATCH  | `/:id`      | Admin | Update promotion         |

### Users (`/api/users`)

| Method | Endpoint | Auth  | Description              |
|--------|----------|-------|--------------------------|
| GET    | `/`      | Admin | List users with stats    |
| GET    | `/:id`   | JWT   | Profile (admin or self)  |
| PATCH  | `/:id`   | JWT   | Update (admin or self)   |

### Health

| Method | Endpoint  | Description                        |
|--------|-----------|------------------------------------|
| GET    | `/`       | API info and endpoint listing      |
| GET    | `/health` | DB & Redis connectivity status     |

## Project Structure

```
tacomex-8bit-shop/
├── backend/
│   ├── src/
│   │   ├── config/        # Redis configuration
│   │   ├── db/            # Drizzle schema & connection
│   │   ├── middleware/    # Auth (JWT) & error handling
│   │   ├── plugins/       # Swagger/OpenAPI docs
│   │   ├── routes/        # API route handlers
│   │   ├── seeds/         # Database seeding
│   │   └── index.ts       # Server entry point
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI (pixel art theme)
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # React Query hooks
│   │   ├── services/      # Axios API client
│   │   ├── stores/        # Zustand (auth, cart)
│   │   └── App.tsx        # Router setup
│   └── Dockerfile
├── scripts/
│   └── init-db.sql        # PostgreSQL schema init
├── .github/
│   ├── actions/
│   │   └── start-app/     # Composite action: spin up & wait
│   └── workflows/
│       └── ci.yml         # CI pipeline with Playwright
├── docker-compose.yaml
└── README.md
```

## Development

```bash
# Start all services
docker compose up --build

# Rebuild a single service
docker compose up --build backend

# View logs
docker compose logs -f backend

# Run database seeds manually
docker compose exec backend npm run seed

# Open Drizzle Studio
docker compose exec backend npm run db:studio

# Stop everything
docker compose down

# Stop and remove volumes
docker compose down -v
```

## GitHub Actions

This repo includes a **composite action** at `.github/actions/start-app/` that starts the full stack and waits for it to be healthy — as a step inside your job, so subsequent steps (like Playwright) share the same running containers.

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start app
        uses: AxeForging/tacomex-8bit-shop/.github/actions/start-app@main
        with:
          health-timeout: "120"

      # App is running — add your test steps here
      - run: npx playwright test
        working-directory: frontend
```

**Inputs:** `health-timeout` (default `120`), `health-url` (default `http://localhost:3001/health`), `docker-compose-file` (default `docker-compose.yaml`).

## License

MIT
