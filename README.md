# Workout Logger + AI Coach

A full stack fitness app built with **React**, **FastAPI**, **PostgreSQL**, and a pluggable AI provider (OpenAI, Anthropic, or AWS Bedrock).

## Features

- **Workout logging** — log sessions with exercises, sets, reps, weight, and RPE
- **Exercise library** — 35+ pre-seeded exercises across all muscle groups
- **PR auto-detection** — personal records are flagged automatically on every log
- **AI Coach** — sends your workout history to an LLM and returns a personalized weekly training plan
- **JWT auth** — register, login, token refresh

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, React Router, Axios |
| Backend | Python 3.12, FastAPI, SQLAlchemy |
| Database | PostgreSQL 16 |
| AI | OpenAI GPT-4o / Anthropic Claude / AWS Bedrock |
| Auth | JWT (python-jose) + bcrypt |
| Dev | Docker Compose |

## Getting started

### 1. Clone and configure

```bash
git clone https://github.com/YOUR_USERNAME/workout-logger.git
cd workout-logger
cp backend/.env.example backend/.env
# Edit backend/.env — add your DB credentials and AI API key
```

### 2. Run with Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### 3. Run locally (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Make sure PostgreSQL is running and .env is configured
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## AI Provider setup

Set `AI_PROVIDER` in `backend/.env` to one of:

- `openai` — requires `OPENAI_API_KEY`
- `anthropic` — requires `ANTHROPIC_API_KEY`
- `bedrock` — requires `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `BEDROCK_MODEL_ID`

## Project structure

```
workout-logger/
├── backend/
│   ├── main.py           # FastAPI app entry point
│   ├── db.py             # PostgreSQL connection
│   ├── models.py         # SQLAlchemy ORM models
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── auth.py           # JWT + bcrypt utilities
│   ├── ai_coach.py       # Pluggable AI provider layer
│   └── routers/
│       ├── auth.py       # /auth — register, login
│       ├── exercises.py  # /exercises — library + search
│       ├── workouts.py   # /workouts — CRUD + PR detection
│       └── coach.py      # /coach — AI plan generation
└── frontend/
    └── src/
        ├── App.jsx        # Routing + nav
        ├── api/client.js  # Axios + all API calls
        ├── components/
        │   └── AuthContext.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── LogWorkout.jsx
            └── Coach.jsx
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| POST | /auth/register | Create account |
| POST | /auth/login | Get JWT token |
| GET | /auth/me | Current user |
| GET | /exercises/ | List exercises (filterable) |
| POST | /workouts/ | Log a workout |
| GET | /workouts/ | List workouts |
| GET | /workouts/{id} | Workout detail |
| DELETE | /workouts/{id} | Delete workout |
| GET | /workouts/prs/all | All personal records |
| POST | /coach/generate | Generate AI training plan |
