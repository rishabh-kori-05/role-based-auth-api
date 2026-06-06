# Role-Based Authentication REST API

A production-ready Auth API built with **Node.js · Express · TypeScript · PostgreSQL**.

---

## Folder Structure

```
auth-api/
├── src/
│   ├── config/
│   │   ├── db.ts           # pg Pool + query helper
│   │   ├── env.ts          # Typed env vars (dotenv)
│   │   └── migrate.ts      # DB migration script
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts     # authenticate + requireRole
│   │   ├── error.middleware.ts    # AppError + global error handler
│   │   └── validate.middleware.ts # Zod validation factory
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts    # register / login / refresh / logout
│   │   ├── token.service.ts   # JWT generation + DB token ops
│   │   └── user.service.ts    # CRUD for users
│   │
│   ├── types/
│   │   └── index.ts           # Shared types + Express augmentation
│   │
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   └── user.validator.ts
│   │
│   └── index.ts               # App entry point
│
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## Quick Start

### 1. Clone & Install

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secrets
```

### 3. Run Migrations

```bash
npm run db:migrate
```

### 4. Start Dev Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
npm start
```

---

## API Reference

### Auth Routes

| Method | Endpoint              | Access  | Description                            |
|--------|-----------------------|---------|----------------------------------------|
| POST   | `/api/auth/register`  | Public  | Register a new user                    |
| POST   | `/api/auth/login`     | Public  | Login, receive access + refresh tokens |
| POST   | `/api/auth/refresh`   | Public  | Issue a new access token               |
| POST   | `/api/auth/logout`    | Public  | Blacklist refresh token                |

### User Routes

| Method | Endpoint               | Access  | Description                |
|--------|------------------------|---------|----------------------------|
| GET    | `/api/profile`         | Any auth user | Get own profile        |
| GET    | `/api/users`           | admin   | List all users             |
| PUT    | `/api/users/:id/role`  | admin   | Update a user's role       |

---

## Request / Response Examples

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "Secret123"
}
```
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "user": { "id": 1, "email": "alice@example.com", "role": "user", "created_at": "..." }
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "Secret123"
}
```
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": 1, "email": "alice@example.com", "role": "user" }
  }
}
```

### Refresh
```http
POST /api/auth/refresh
Content-Type: application/json

{ "refreshToken": "eyJ..." }
```
```json
{ "status": "success", "data": { "accessToken": "eyJ..." } }
```

### Protected Route
```http
GET /api/profile
Authorization: Bearer eyJ...
```

### Change Role (admin only)
```http
PUT /api/users/2/role
Authorization: Bearer eyJ...   (admin token)
Content-Type: application/json

{ "role": "manager" }
```

---

## Security Notes

- Passwords hashed with **bcrypt** (12 rounds)
- Access tokens expire in **15 minutes** — short window limits blast radius
- Refresh tokens stored in PostgreSQL, blacklisted on logout
- Expired tokens are pruned automatically every 24 hours
- All inputs validated with **Zod** before reaching service layer
- Role guard runs after authentication — no roles without a valid token

---

## Environment Variables

| Variable              | Description                          | Default  |
|-----------------------|--------------------------------------|----------|
| `PORT`                | HTTP port                            | `3000`   |
| `NODE_ENV`            | `development` / `production`         | —        |
| `DB_HOST`             | PostgreSQL host                      | —        |
| `DB_PORT`             | PostgreSQL port                      | `5432`   |
| `DB_NAME`             | Database name                        | —        |
| `DB_USER`             | Database user                        | —        |
| `DB_PASSWORD`         | Database password                    | —        |
| `JWT_ACCESS_SECRET`   | Secret for signing access tokens     | —        |
| `JWT_REFRESH_SECRET`  | Secret for signing refresh tokens    | —        |
| `JWT_ACCESS_EXPIRES_IN`  | Access token TTL              | `15m`    |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL             | `7d`     |
