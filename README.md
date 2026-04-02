# TacoMex 8-Bit Shop

A full-stack retro-themed Mexican food delivery platform built with Fastify, React, PostgreSQL, and Redis.

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Fastify 4, Drizzle ORM, TypeScript      |
| Frontend   | React 18, Vite 5, Zustand, React Query  |
| Database   | PostgreSQL 15                            |
| Cache      | Redis 7                                 |
| Queue      | RabbitMQ 3.13 (notifications)           |
| Infra      | Docker Compose                          |

## Quick Start

```bash
git clone https://github.com/AxeForging/tacomex-8bit-shop.git
cd tacomex-8bit-shop
docker compose up --build
```

| Service     | URL                          |
|-------------|------------------------------|
| Frontend    | http://localhost:5173        |
| API         | http://localhost:3001/api    |
| Swagger     | http://localhost:3001/docs   |
| Health      | http://localhost:3001/health |
| RabbitMQ UI | http://localhost:15672       |

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

### RabbitMQ

```
Host: localhost
Port: 5672 (AMQP) / 15672 (Management UI)
User: tacomex
Password: tacomex_secret
```

Open http://localhost:15672 to access the management dashboard.

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint    | Auth | Description                          |
|--------|-------------|------|--------------------------------------|
| POST   | `/register` | -    | Register new user                    |
| POST   | `/login`    | -    | Login, returns JWT                   |
| GET    | `/me`       | JWT  | Get current profile                  |
| POST   | `/logout`   | JWT  | Invalidate token (Redis blacklist)   |

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

### Notifications (`/api/notifications`) — RabbitMQ queue → PostgreSQL

| Method | Endpoint       | Auth | Description                       |
|--------|----------------|------|-----------------------------------|
| GET    | `/`            | JWT  | List notifications (email/sms)    |
| PATCH  | `/:id/read`    | JWT  | Mark notification as read         |
| POST   | `/read-all`    | JWT  | Mark all notifications as read    |

**Triggers:**
- **Email**: Order placed, order status change (confirmed, preparing, ready, delivered, cancelled)
- **SMS**: User registration (welcome), order ready for pickup/delivery, order delivered

### Cart (`/api/cart`) — Redis-backed, per user, 24 h TTL

| Method | Endpoint            | Auth | Description                       |
|--------|---------------------|------|-----------------------------------|
| GET    | `/`                 | JWT  | Get cart                          |
| POST   | `/items`            | JWT  | Add / update item                 |
| PATCH  | `/items/:productId` | JWT  | Update quantity (0 removes item)  |
| DELETE | `/items/:productId` | JWT  | Remove item                       |
| DELETE | `/`                 | JWT  | Clear entire cart                 |

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
│   │   ├── config/        # Redis & RabbitMQ configuration
│   │   ├── db/            # Drizzle schema & connection
│   │   ├── middleware/    # Auth (JWT) & error handling
│   │   ├── plugins/       # Swagger/OpenAPI docs
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Notification publisher & consumer
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

## Rate Limiting

Rate limits are Redis-backed and configurable via environment variables — the defaults are **very permissive in dev** so you can test freely.

| Variable | Dev default | Prod default | Window |
|---|---|---|---|
| `RATE_LIMIT_GLOBAL` | 10 000 | 100 | 15 min |
| `RATE_LIMIT_AUTH` | 1 000 | 5 | 15 min |
| `RATE_LIMIT_ORDERS` | 1 000 | 10 | 1 hour |

To simulate throttling locally, set low values in your `.env` or inline:

```bash
# Simulate tight auth throttling (3 login attempts / 15 min)
RATE_LIMIT_AUTH=3 docker compose up backend

# Or add to your .env:
# RATE_LIMIT_GLOBAL=10
# RATE_LIMIT_AUTH=3
# RATE_LIMIT_ORDERS=2
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

# Reset database and reseed (drops volumes, rebuilds, and reseeds automatically)
docker compose down -v && docker compose up --build
```

## GitHub Actions

This repo includes a **composite action** at `.github/actions/start-app/` that starts the full stack and waits for it to be healthy — as a step inside your job, so subsequent steps (like Playwright) share the same running containers.

The action works from **any repo** — it automatically clones the TacoMex source, builds, and starts everything. Your workspace stays untouched for your own code and tests.

### From another repo (e.g. a separate Playwright test suite)

```yaml
# .github/workflows/e2e.yml in your test repo
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4  # checks out YOUR test repo

      - name: Start TacoMex app
        uses: AxeForging/tacomex-8bit-shop/.github/actions/start-app@main

      # At this point:
      #   - TacoMex API is running on localhost:3001
      #   - Frontend is running on localhost:5173
      #   - Your workspace still has YOUR repo's files

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

The action clones the TacoMex source into a `.tacomex-app/` subdirectory, builds and starts everything via Docker Compose, then waits for the health check to pass. Your workspace stays clean with your own code.

### Inside the TacoMex repo

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start app
        uses: AxeForging/tacomex-8bit-shop/.github/actions/start-app@main
        with:
          checkout: "false"
          install-frontend-deps: "true"

      - run: npx playwright install --with-deps && npx playwright test
        working-directory: frontend
```

**Inputs:**

| Input | Default | Description |
|-------|---------|-------------|
| `health-timeout` | `180` | Max seconds to wait for the health check |
| `health-url` | `http://localhost:3001/health` | Health endpoint URL to poll |
| `docker-compose-file` | `docker-compose.yaml` | Path to docker-compose file |
| `checkout` | `true` | Clone the TacoMex repo automatically (set to `false` when running inside the TacoMex repo) |
| `app-ref` | `main` | Git ref (branch/tag/sha) of the TacoMex repo to checkout |
| `install-frontend-deps` | `false` | Install frontend deps on the host and restart the container (needed for Playwright) |
| `frontend-dir` | `frontend` | Relative path to frontend directory |
| `rate-limit-global` | _(permissive)_ | Set a low number (e.g. `10`) to simulate global throttling in tests |
| `rate-limit-auth` | _(permissive)_ | Set a low number (e.g. `3`) to simulate auth lockout in tests |
| `rate-limit-orders` | _(permissive)_ | Set a low number (e.g. `2`) to simulate order throttling in tests |

**Example — testing throttle behaviour:**

```yaml
- name: Start TacoMex app (tight rate limits)
  uses: AxeForging/tacomex-8bit-shop/.github/actions/start-app@main
  with:
    rate-limit-auth: "3"    # lock out after 3 login attempts
    rate-limit-orders: "2"  # throttle after 2 orders/hour
```

## License

MIT
