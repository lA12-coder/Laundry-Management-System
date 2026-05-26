from __future__ import annotations

from .serializers import validate_e164_phone_number


def normalize_phone_number(raw: str) -> str:
    """Normalize Ethiopian/local input to E.164 (+251…)."""
    value = (raw or "").strip()
    if not value:
        raise ValueError("Phone number is required.")
    if value.startswith("+"):
        return validate_e164_phone_number(value)
    if value.startswith("0"):
        return validate_e164_phone_number(f"+251{value[1:]}")
    return validate_e164_phone_number(f"+251{value}")
