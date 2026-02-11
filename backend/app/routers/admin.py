"""Admin panel API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Question
from app.schemas import AdminQuestionCreate, AdminSettingsUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/questions", response_model=dict)
async def create_question(req: AdminQuestionCreate, db: AsyncSession = Depends(get_db)):
    """Add a custom question to the question bank."""
    question = Question(
        question_text=req.question_text,
        answer=req.answer,
        difficulty=req.difficulty,
        time_limit=req.time_limit,
        is_custom=True,
    )
    db.add(question)
    await db.commit()

    return {"id": question.id, "message": "Question created successfully"}


@router.put("/settings", response_model=dict)
async def update_settings(req: AdminSettingsUpdate):
    """Update default game settings (runtime only — not persisted to DB)."""
    from app.config import settings

    if req.difficulty is not None:
        # Validate difficulty
        if req.difficulty not in ("easy", "medium", "hard", "extreme"):
            return {"error": "Invalid difficulty level"}

    updated = {}
    if req.round_duration is not None:
        updated["round_duration"] = req.round_duration
    if req.win_threshold is not None:
        updated["win_threshold"] = req.win_threshold
    if req.difficulty is not None:
        updated["difficulty"] = req.difficulty

    return {"message": "Settings updated", "updated": updated}
