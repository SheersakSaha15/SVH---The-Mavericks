def post_safety_check(answer: str) -> dict:
    """
    Basic output safety check.

    Prevents the system from presenting a diagnosis
    or direct medication prescription as a confirmed fact.
    """

    if not answer:
        return {
            "safe": False,
            "reason": "empty_response"
        }

    dangerous_phrases = [
        "you definitely have",
        "you have this disease",
        "take this medicine",
        "take this medication",
        "prescribe",
        "dosage for you"
    ]

    answer_lower = answer.lower()

    for phrase in dangerous_phrases:
        if phrase in answer_lower:
            return {
                "safe": False,
                "reason": "potentially_unsafe_medical_advice"
            }

    return {
        "safe": True,
        "reason": "passed"
    }