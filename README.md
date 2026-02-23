# Online Judge (MERN)

## Stack
- Frontend: React (Vite)
- Backend: Express + TypeScript (MongoDB via Mongoose)
- Queue: Redis + BullMQ, Node worker uses Docker (gcc/openjdk)

## Run
1. Start: `docker compose up --build`
2. API: http://localhost:3000 (Docs: use route list below)
3. Frontend: http://localhost:5173

## Seed 5 Problems
```
docker compose exec server npm run -w server --silent -- run --silent || true
# or run node directly inside the server container
docker compose exec server node -r ts-node/register src/seed.ts
```

## API Routes
- Auth: `POST /auth/register`, `POST /auth/token`
- Problems: `POST /problems`, `GET /problems`, `GET /problems/:id`, `DELETE /problems/:id`
- Submissions: `POST /submissions`, `GET /submissions`, `GET /submissions/:id`
- Stats: `GET /stats/leaderboard`, `GET /stats/problems`, `GET /stats/users/:username`
- Health: `GET /health`

## Environment (compose sets defaults)
- `MONGO_URL=mongodb://mongo:27017/oj`
- `REDIS_URL=redis://redis:6379/0`
- `JWT_SECRET=change-me`
- `TIME_LIMIT_MS=2000`, `MEMORY_LIMIT_MB=256`
- `CPP_IMAGE=gcc:13`, `JAVA_IMAGE=openjdk:21`

## Notes
- Worker mounts Docker socket and compiles/runs code inside language images
- Verdicts: AC, WA (with diff), TLE, RE
