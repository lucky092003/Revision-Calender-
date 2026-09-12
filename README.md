# Revision Calendar

A full-stack **spaced repetition planner** for students. Add the topics you've studied,
and the app automatically generates a revision schedule (Day 1, 3, 7, 15, 30, 90, 180,
360) shown on a clean monthly calendar.

![Project structure: React + FastAPI + PostgreSQL]

## 1. Overview

- **Dashboard** – today's / upcoming / completed revisions, streak, progress (Phase 4)
- **Add Topic** – record what you studied and when
- **Auto revision schedule** – revision dates are generated automatically from the study date
- **Monthly calendar** – every revision appears on the correct date (Phase 3)
- **Today's Revision** – a focused review queue (Phase 2)
- **Topic details** – full revision schedule with per-revision completion
- **Search & filters** – by name, subject, difficulty, status; sorted by study date / next revision
- **Auth** – register, login, logout with JWT; every user's data is private

This repository currently implements **Phase 1** (project setup, database, authentication,
Add Topic, topic listing). Later phases add the calendar, dashboard, today's revision page,
search refinement and polish.

## 2. Tech stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Frontend   | React 18, TypeScript, Tailwind CSS, React Router, Vite, Axios |
| Backend    | Python 3.13, FastAPI, SQLAlchemy 2            |
| Database   | PostgreSQL (Supabase), SQLAlchemy ORM models  |
| Auth       | JWT (PyJWT) + bcrypt password hashing         |

## 3. Folder structure

```
Calender Todo/
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/              # Axios API service functions
│   │   ├── components/
│   │   │   ├── layout/       # App shell, sidebar, nav guards
│   │   │   ├── topics/       # Topic card
│   │   │   └── ui/           # Button, Input, Select, Card, Badge, …
│   │   ├── context/          # Auth + Toast contexts
│   │   ├── lib/              # API client, date formatters
│   │   ├── pages/            # Login, Register, Topics, Add Topic, Detail
│   │   └── types/            # Shared TypeScript types
│   ├── .env.example
│   └── package.json
├── backend/                  # FastAPI
│   ├── app/
│   │   ├── api/              # Routers: auth, topics, revisions
│   │   ├── core/             # config, database, security
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   └── services/         # revision algorithm, serializers
│   ├── tests/                # API smoke tests
│   ├── .env.example
│   └── requirements.txt
├── database/
│   └── init.sql              # (Optional) create database SQL
└── README.md
```

## 4. Revision algorithm

Spaced repetition cycle, relative to **Studied On** (Day 0):

| Day | Offset | Example (studied 12 Sep 2026) |
| --- | ------ | ----------------------------- |
| Studied    | +0   | 12 September 2026 |
| Revision 1 | +1   | 13 September 2026 |
| Revision 2 | +3   | 15 September 2026 |
| Revision 3 | +7   | 19 September 2026 |
| Revision 4 | +15  | 27 September 2026 |
| Revision 5 | +30  | 12 October 2026  |
| Revision 6 | +90  | 11 December 2026 |
| Revision 7 | +180 | 11 March 2027   |
| Revision 8 | +360 | 7 September 2027|

Implemented in `backend/app/services/revision_algorithm.py`. Dates are generated
automatically when a topic is created and regenerated if the study date changes.

Each revision status is derived (not stored) as one of:
`upcoming`, `due_today`, `completed`, `overdue`. Completed dates are stored in the
`revision_completions` table.

## 5. Database design

```
users ─┬── topics ───┬── revision_schedules ──── revision_completions
       │             │         │
       └── (1:N)     └ (1:N)    └ (1:1, optional, FK)
```

- `users` – `id, email (uniq), username (uniq), hashed_password, full_name, is_active, created_at`
- `topics` – `id, user_id (FK), title, subject, description, studied_on, source, difficulty, notes, created_at, updated_at`
- `revision_schedules` – `id, topic_id (FK, CASCADE), revision_number, scheduled_date (+ unique topic_id+revision_number)`
- `revision_completions` – `id, revision_id (FK, CASCADE, uniq), completed_at`

Indexes exist on `users.email`, `users.username`, `topics.user_id`,
`topics.user_id+studied_on`, `revision_schedules.topic_id`, `revision_schedules.scheduled_date`.

## 6. Environment variables

### Backend (`backend/.env`)

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `DATABASE_URL` | SQLAlchemy PostgreSQL URL | `postgresql+psycopg://postgres:postgres@localhost:5432/revision_calendar` |
| `DATABASE_NAME` | Database name (auto-created locally) | `postgres` for Supabase |
| `AUTO_CREATE_TABLES` | Create tables on startup (dev) | `true` |
| `JWT_SECRET` | Secret for signing tokens | **change me** |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `1440` |
| `BACKEND_CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,...` |

Generate a secret: `python -c "import secrets; print(secrets.token_urlsafe(48))"`

### Frontend (`frontend/.env`)

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `VITE_API_URL` | Base URL of the API | `http://localhost:8000/api` |

## 7. Database setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **Project Settings → Database → Connection strings** and copy the
   **Session pooler** (or direct) connection string.
3. Put it in `backend/.env` as:
   ```
   DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
   DATABASE_NAME=postgres
   ```
4. On first backend start, the tables are created automatically
   (`AUTO_CREATE_TABLES=true`). Set it to `false` and use Alembic for production.

For a self-hosted PostgreSQL instead:

```
psql -U postgres -f database/init.sql        # creates the revision_calendar DB
```

## 8. Backend setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # then edit .env with your credentials

python run.py               # http://localhost:8000  (docs at /docs)
```

Run tests:

```bash
python -m pytest tests -v
```

*Note: the smoke tests run against a temporary SQLite file so the full API
logic (auth, topic CRUD, revision generation, calendar, completion, user
isolation) can be verified without a live PostgreSQL instance.*

## 9. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env        # defaults point to http://localhost:8000/api

npm run dev                 # http://localhost:5173
npm run build               # type-check + production build
```

## 10. Run locally (both servers)

```bash
# Terminal 1 - backend
cd backend && python run.py

# Terminal 2 - frontend
cd frontend && npm run dev
```

Open http://localhost:5173, create an account, add a topic, and watch its
revision schedule appear.

## 11. API endpoints

### Auth

| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| POST   | `/api/auth/register` | Create account, returns JWT |
| POST   | `/api/auth/login`    | Log in (email or username) |
| GET    | `/api/auth/me`       | Current user           |

### Topics (auth required)

| Method | Endpoint                     | Description |
| ------ | ---------------------------- | ----------- |
| GET    | `/api/topics`                | List (query params: `q`, `subject`, `difficulty`, `status`, `sort`, `order`) |
| POST   | `/api/topics`                | Create topic + revision schedule |
| GET    | `/api/topics/{id}`           | Topic detail with revisions |
| PUT    | `/api/topics/{id}`           | Update topic (regenerates schedule if study date changes) |
| DELETE | `/api/topics/{id}`           | Delete topic          |

### Revisions (auth required)

| Method | Endpoint                          | Description |
| ------ | --------------------------------- | ----------- |
| GET    | `/api/revisions/today`            | Revisions due today |
| GET    | `/api/revisions/upcoming?limit=`  | Upcoming revisions |
| GET    | `/api/revisions/calendar?year=&month=` | Revisions per day for a month |
| POST   | `/api/revisions/{id}/complete`    | Mark a revision completed |

## 12. Roadmap

- **Phase 1 (done):** setup, database, auth, add topic, topic listing
- **Phase 2:** today's revision queue, revision status polish
- **Phase 3:** monthly calendar + calendar interactions
- **Phase 4:** dashboard with charts, streak, progress
- **Phase 5:** comprehensive testing, error handling, responsive polish