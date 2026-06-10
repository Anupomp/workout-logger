<div align="center">

# 💪 Workout Logger + AI Coach

**Log your lifts. Track your PRs. Get a training plan built from your actual data.**

A full-stack fitness app where the AI coach reads your real workout history — not a generic template.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)

</div>

---

## ✨ Features

| | |
|---|---|
| 🏋️ **Smart workout logging** | Each exercise only shows the metrics it actually tracks — lifts log weight × reps, cardio logs time, planks log duration, ab wheel logs reps. No "185 lbs plank" nonsense. |
| 🏆 **Automatic PR detection** | Personal records are flagged the moment you log a new max — no manual tracking. |
| 📈 **Progress charts** | Top-set weight and estimated 1RM (Epley formula) graphed over time for any exercise. |
| 🤖 **AI Coach (BYOK)** | Generates a weekly plan from your last 10 sessions. Works with **OpenAI, Anthropic Claude, or Google Gemini** — you bring your own API key, nothing is stored server-side. |
| 🛠️ **Custom exercises** | Create your own with configurable metrics (weight / reps / time / RPE), private to your account. |
| 🗓️ **Searchable history** | Every session, grouped by month, with full detail view and in-place editing. |
| 🌗 **Dark mode** | Automatic via `prefers-color-scheme`. |
| 🔐 **JWT auth** | Register/login with bcrypt-hashed passwords. |

## 🧠 Design decisions

**Bring-your-own-key AI.** No API keys live on the server. Users pick a provider and paste their key in the UI; it's sent with the single request, used once, and never stored or logged. Optionally remembered in the user's own browser (localStorage, opt-in). Provider error bodies are never echoed back — they can contain key fragments.

**Consistent output across three different LLMs.** Three layers keep coaching plans stable no matter which model a user picks:

1. **Pinned model snapshots** (`gpt-4o-2024-08-06`, `claude-sonnet-4-20250514`, `gemini-2.5-flash`) — not floating aliases, so provider updates can't silently change behavior
2. **Low temperature (0.3)** — the same history produces near-identical plans run to run
3. **Forced output template** — the prompt specifies an exact markdown skeleton (Weekly Split / Day-by-Day Plan / Insights / Overload Tip), so every provider returns the same structure

> Fun production bug: Gemini 2.5 is a "thinking" model whose reasoning tokens count against `maxOutputTokens` — plans were getting cut off mid-sentence until thinking was disabled via `thinkingBudget: 0`.

**Per-exercise metric flags.** Every exercise carries `tracks_weight / tracks_reps / tracks_time / tracks_rpe` booleans that drive the logging UI, the detail view columns, and PR eligibility. Validation enforces sane combos (weight tracking requires reps, for PR detection).

## 🚀 Quick start

```bash
git clone https://github.com/Anupomp/workout-logger.git
cd workout-logger
cp backend/.env.example backend/.env   # set a SECRET_KEY — no AI keys needed
docker-compose up --build
```

| Service | URL |
|---|---|
| App | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |

The Postgres schema is created and the exercise library seeded automatically on first boot.

<details>
<summary><b>Run locally without Docker</b></summary>

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# PostgreSQL must be running; configure DATABASE_URL in .env
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
</details>

## 🏗️ Architecture

```
React 18 (Vite) ──axios/JWT──▶ FastAPI ──SQLAlchemy──▶ PostgreSQL 16
                                  │
                                  └──BYOK──▶ OpenAI / Anthropic / Gemini
```

```
workout-logger/
├── backend/
│   ├── main.py            # App entry, CORS, startup seeding + DB retry
│   ├── db.py              # Engine + session factory
│   ├── models.py          # Users, Exercises (metric flags), Workouts, Sets, PRs
│   ├── schemas.py         # Pydantic request/response models
│   ├── auth.py            # JWT + bcrypt
│   ├── ai_coach.py        # Pluggable provider layer (pinned models, templated prompt)
│   └── routers/
│       ├── auth.py        # /auth — register, login, me
│       ├── exercises.py   # /exercises — library, search, custom CRUD
│       ├── workouts.py    # /workouts — CRUD, PR detection, progress data
│       └── coach.py       # /coach — AI plan generation
└── frontend/src/
    ├── index.css          # Design tokens (light/dark)
    ├── api/client.js      # Axios instance + endpoints
    ├── components/AuthContext.jsx
    └── pages/             # Login, Dashboard, LogWorkout, WorkoutDetail,
                           # History, Progress, Coach
```

## 📡 API reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Get JWT token |
| `GET` | `/auth/me` | Current user |
| `GET` | `/exercises/` | List exercises (built-in + your customs, filterable) |
| `POST` | `/exercises/` | Create custom exercise |
| `DELETE` | `/exercises/{id}` | Delete your custom exercise |
| `POST` | `/workouts/` | Log a workout (auto PR detection) |
| `GET` | `/workouts/` | List workouts |
| `GET` | `/workouts/{id}` | Workout detail |
| `PUT` | `/workouts/{id}` | Edit workout |
| `DELETE` | `/workouts/{id}` | Delete workout |
| `GET` | `/workouts/prs/all` | All personal records |
| `GET` | `/workouts/progress/{exercise_id}` | Top set + est. 1RM per session |
| `POST` | `/coach/generate` | Generate AI training plan (BYOK) |

Full interactive docs at `/docs` (Swagger) when running.

## 🗺️ Roadmap

- [ ] pytest suite for routers + PR detection logic
- [ ] GitHub Actions CI (lint + tests on push)
- [ ] Deploy (Render/Railway + managed Postgres)
- [ ] Rest-timer and supersets in the logging UI
- [ ] Body-weight tracking with trend chart

## 🛠️ Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router, Axios, Recharts, Vite |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 |
| Database | PostgreSQL 16 |
| AI | OpenAI GPT-4o · Anthropic Claude · Google Gemini (bring-your-own-key) |
| Auth | JWT (python-jose) + bcrypt |
| Dev | Docker Compose |

---

<div align="center">

Built by [Anupam Pradeep](https://github.com/Anupomp)

</div>
