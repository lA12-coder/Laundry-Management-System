from __future__ import annotations

import re

from rest_framework import serializers

E164_PHONE_REGEX = re.compile(r"^\+[1-9]\d{7,14}$")


def normalize_phone_number(raw: str) -> str:
    """Accept 09.. / 9.. / 251.. / +251.. and normalize to +251XXXXXXXXX."""
    value = (raw or "").strip()
    if not value:
        raise serializers.ValidationError("Phone number is required.")

    digits = re.sub(r"\D", "", value)
    if not digits:
        raise serializers.ValidationError("Phone number is required.")

    if digits.startswith("0"):
        digits = f"251{digits[1:]}"
    elif digits.startswith("251"):
        pass
    elif len(digits) == 9 and digits.startswith("9"):
        digits = f"251{digits}"

    normalized = f"+{digits}"
    if not E164_PHONE_REGEX.match(normalized):
        raise serializers.ValidationError(
            "Invalid phone number. Use 09XXXXXXXX or +2519XXXXXXXX."
        )
    return normalized
