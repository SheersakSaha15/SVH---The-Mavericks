import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load .env searching up directory tree if needed
load_dotenv()
if not os.getenv("GEMINI_API_KEY"):
    for parent in Path(__file__).resolve().parents:
        env_file = parent / ".env"
        if env_file.exists():
            load_dotenv(dotenv_path=env_file)
            break

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "or": "Odia",
    "te": "Telugu",
}


def generate_localized_response(
    facts: str,
    user_message: str,
    language: str
) -> str:

    language_name = LANGUAGE_NAMES.get(language, "English")

    prompt = f"""
You are HealthBridge AI, a helpful multilingual public health assistant.

User question ({language_name}): "{user_message}"

Verified Reference Information:
{facts}

Instructions:
1. Provide a helpful, clear, and compassionate answer entirely in {language_name}.
2. Explain the symptoms, transmission, prevention, and health care advice clearly in {language_name}.
3. Structure the response cleanly with bullet points and bold section titles in {language_name}.
4. Keep the explanation easy to read for general public health awareness.

Return only the final response formatted in {language_name}.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3
            )
        )
        if response and hasattr(response, 'text') and response.text:
            return response.text.strip()
        return facts
    except Exception as err:
        print(f"[response_generator] Error calling Gemini API: {err}")
        return facts


# Backward compatibility alias
generate_response = generate_localized_response