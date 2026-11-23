import re


SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "or": "Odia",
    "te": "Telugu",
}


def detect_language(text: str) -> str:

    if not text or not text.strip():
        return "en"

    # Hindi / Devanagari
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"

    # Bengali
    if re.search(r"[\u0980-\u09FF]", text):
        return "bn"

    # Odia
    if re.search(r"[\u0B00-\u0B7F]", text):
        return "or"

    # Telugu
    if re.search(r"[\u0C00-\u0C7F]", text):
        return "te"

    # If none of the Indian scripts are detected,
    # treat the input as English.
    if re.search(r"[A-Za-z]", text):
        return "en"

    return "unsupported"