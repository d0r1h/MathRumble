"""Dynamic math question generator by difficulty level."""

import random
import uuid

from app.config import settings
from app.schemas import QuestionResponse


def generate_question(difficulty: str) -> QuestionResponse:
    """Generate a math question based on difficulty level."""
    generators = {
        "easy": _easy,
        "medium": _medium,
        "hard": _hard,
        "extreme": _extreme,
    }
    gen = generators.get(difficulty, _easy)
    text, answer = gen()

    time_limits = {
        "easy": settings.QUESTION_TIME_LIMIT_EASY,
        "medium": settings.QUESTION_TIME_LIMIT_MEDIUM,
        "hard": settings.QUESTION_TIME_LIMIT_HARD,
        "extreme": settings.QUESTION_TIME_LIMIT_EXTREME,
    }

    return QuestionResponse(
        id=str(uuid.uuid4()),
        question=text,
        difficulty=difficulty,
        time_limit=time_limits.get(difficulty, 10),
    ), answer


def _easy() -> tuple[str, float]:
    """Single-digit addition or subtraction."""
    a = random.randint(1, 9)
    b = random.randint(1, 9)
    op = random.choice(["+", "-"])
    if op == "+":
        return f"{a} + {b}", float(a + b)
    else:
        # Ensure non-negative result
        a, b = max(a, b), min(a, b)
        return f"{a} - {b}", float(a - b)


def _medium() -> tuple[str, float]:
    """Two-digit addition or subtraction."""
    a = random.randint(10, 99)
    b = random.randint(10, 99)
    op = random.choice(["+", "-"])
    if op == "+":
        return f"{a} + {b}", float(a + b)
    else:
        a, b = max(a, b), min(a, b)
        return f"{a} - {b}", float(a - b)


def _hard() -> tuple[str, float]:
    """Multiplication or division with clean results."""
    op = random.choice(["×", "÷"])
    if op == "×":
        a = random.randint(2, 12)
        b = random.randint(2, 12)
        return f"{a} × {b}", float(a * b)
    else:
        b = random.randint(2, 12)
        result = random.randint(2, 12)
        a = b * result  # Ensures clean division
        return f"{a} ÷ {b}", float(result)


def _extreme() -> tuple[str, float]:
    """Mixed operations, multi-step problems."""
    variant = random.choice(["mul_add", "mul_sub", "div_add", "two_mul"])
    if variant == "mul_add":
        a = random.randint(2, 15)
        b = random.randint(2, 9)
        c = random.randint(1, 20)
        return f"({a} × {b}) + {c}", float(a * b + c)
    elif variant == "mul_sub":
        a = random.randint(2, 15)
        b = random.randint(2, 9)
        c = random.randint(1, 20)
        result = a * b - c
        return f"({a} × {b}) - {c}", float(result)
    elif variant == "div_add":
        b = random.randint(2, 9)
        quotient = random.randint(2, 12)
        a = b * quotient
        c = random.randint(1, 20)
        return f"({a} ÷ {b}) + {c}", float(quotient + c)
    else:  # two_mul
        a = random.randint(2, 9)
        b = random.randint(2, 9)
        c = random.randint(2, 9)
        return f"{a} × {b} × {c}", float(a * b * c)
