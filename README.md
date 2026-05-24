# Nutro API

Node.js + Express + MongoDB backend for the Nutro laundry app — user, agent, and admin sides.

## Stack

- Express 5
- Mongoose 9
- JWT (access + refresh, rotation, server-side revocation)
- bcryptjs · zod · helmet · cors · pino · morgan

## Layout (clean architecture)

```
src/
  config/         env + logger + mongo connect
  shared/         AppError, asyncHandler, respond, validate middleware,
                  centralised errorHandler, zod schemas
  domain/         (reserved for pure entities — currently lean)
  application/    use cases (auth, requests, …)
  infrastructure/
    db/models/        mongoose schemas
    db/repositories/  thin model wrappers
    security/         password hashing, jwt sign/verify
  interfaces/
    http/middleware/  authenticate, requireRole
    http/controllers/ thin HTTP adapters
    http/routes/      express routers per module
```

## Setup

```bash
cp .env.example .env
# edit MONGO_URI, JWT secrets

npm install
npm run seed       # creates an admin + sample data
npm run dev        # http://localhost:4000
curl localhost:4000/health
```

## Seeded credentials

| Role  | Email              | Password    |
| ----- | ------------------ | ----------- |
| admin | admin@nutro.in     | admin@1234  |
| user  | aisha@example.com  | user@1234   |
| agent | suresh@nutro.in    | agent@1234  |

## Auth

All non-public routes need `Authorization: Bearer <accessToken>`.

| Method | Path                  | Notes                                         |
| ------ | --------------------- | --------------------------------------------- |
| POST   | /api/auth/register    | User signup (name, phone, email, password)    |
| POST   | /api/auth/login/user  | User login                                    |
| POST   | /api/auth/login/agent | Agent login                                   |
| POST   | /api/auth/login/admin | Admin login                                   |
| POST   | /api/auth/refresh     | Body: `{ refreshToken }` → rotates pair       |
| POST   | /api/auth/logout      | Revokes the refresh token                     |
| GET    | /api/auth/me          | Current profile                               |

## Modules (all under `/api`)

| Resource     | Role gating                                     |
| ------------ | ----------------------------------------------- |
| users        | `me` user · admin list/get + status             |
| agents       | `me` agent + update-location · admin CRUD       |
| services     | public list · admin CRUD                        |
| items        | public list · admin CRUD                        |
| offers       | public active list · admin CRUD                 |
| maps         | admin CRUD only                                 |
| requests     | user create+mine · agent assigned+status · admin all+assign+status |
| reviews      | public approved feed · user create+mine · admin moderate          |

## Error response shape

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": { "issues": [{ "path": "body.email", "message": "..." }] }
  }
}
```

Validation, JWT, mongoose duplicate-key, cast, and not-found errors are all routed through the central `errorHandler` middleware.

## Wiring to the React Native app

The base URL is `http://<host>:4000/api`. Login endpoints return `{ accessToken, refreshToken, accessTtl, refreshTtl }` — store the refresh token securely (Expo SecureStore) and rotate on 401.
# Clean-Pro-Backend
