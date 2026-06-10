from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone

from db import get_db
from models import User, Workout, WorkoutSet
from schemas import CoachRequest, CoachResponse
from auth import get_current_user
from ai_coach import build_prompt, get_ai_coaching

router = APIRouter(prefix="/coach", tags=["coach"])


@router.post("/generate", response_model=CoachResponse)
async def generate_plan(
    req: CoachRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fetch last 10 workouts with full set/exercise detail
    workouts = (
        db.query(Workout)
        .options(joinedload(Workout.sets).joinedload(WorkoutSet.exercise))
        .filter(Workout.user_id == current_user.id)
        .order_by(Workout.date.desc())
        .limit(10)
        .all()
    )

    if not workouts:
        raise HTTPException(
            status_code=400,
            detail="Log at least one workout before requesting a coaching plan.",
        )

    # Serialize history into a clean structure for the prompt
    history = []
    for w in workouts:
        history.append({
            "date": w.date.strftime("%Y-%m-%d"),
            "name": w.name or "Unnamed session",
            "duration_minutes": w.duration_minutes,
            "exercises": [
                {
                    "exercise": s.exercise.name,
                    "muscle_group": s.exercise.muscle_group.value,
                    "set": s.set_number,
                    "reps": s.reps,
                    "weight_lbs": s.weight_lbs,
                    "duration_seconds": s.duration_seconds,
                    "rpe": s.rpe,
                }
                for s in sorted(w.sets, key=lambda x: (x.set_number,))
            ],
        })

    prompt = build_prompt(history, req.goal, req.days_per_week, req.additional_notes)
    try:
        plan = await get_ai_coaching(prompt, provider=req.provider, api_key=req.api_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        # Never echo provider error bodies — they can contain key fragments.
        raise HTTPException(
            status_code=502,
            detail="AI provider request failed. Check that your API key is valid and has credit.",
        )

    return CoachResponse(plan=plan, generated_at=datetime.now(timezone.utc))
