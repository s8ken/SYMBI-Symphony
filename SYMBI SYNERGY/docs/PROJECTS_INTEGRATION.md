Projects Collaboration Integration Guide
=======================================

Overview
- Purpose: Enable department AIs to collaborate on real projects, with knowledge ingestion and build workflows.
- Implementation: Embedded into existing backend/frontend; no separate CF Pages app required.

Local Development
- Backend: `npm run dev:backend` (port 5000)
- Frontend: `npm run dev:frontend` (port 3000)
- Projects UI: navigate to `/projects` in the app.

Backend CORS/Socket
- CORS allows local frontend origins; sockets mirror the same policy.

Environment
- Add `REDIS_URL` for background jobs (e.g., `redis://localhost:6379`).
- Keep provider keys on the server side (never in the browser).

- Integration Approach
- Backend models/APIs in `backend`:
  - Projects, Departments, KnowledgeBases, Tasks, BuildJobs
  - REST: `/api/projects/...` for project CRUD, knowledge ingestion (Weaviate), task updates, and build triggers.
  - Socket rooms: `project:<id>` for collaboration streams.
- Auth: Use existing JWT from `/api/auth`.

Deployment
- Backend/DB/Queue: Use docker-compose (MongoDB + Redis + Backend).

Next Steps
- Confirm if we should:
  1) Rename folder to `apps/bolt-on` (safer than a space in path), and/or
  2) Add a frontend route `/bolt` that embeds Bolt via iframe (dev and prod URLs).
- If yes, I will:
  - Move folder and wire root scripts/workspaces.
  - Add `/api/projects` endpoints and minimal models.
  - Add a UI entry-point and Socket.IO channel for project collaboration.
