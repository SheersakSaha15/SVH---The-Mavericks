import json
import logging
from typing import Dict, Any, Tuple

try:
    from config import settings
    from models import RiskAssessment
except ImportError:
    from config import settings
    from models import RiskAssessment

logger = logging.getLogger(__name__)

# Try importing official Google GenAI SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-genai SDK not installed or unavailable. Using intelligent Gemini fallback service.")


class GeminiHealthService:
    """
    Google Gemini AI Engine:
    1. Evaluates symptom severity & emergency risk (HIGH, MEDIUM, LOW).
    2. Generates accurate, empathetic health advisories grounded in Government Health API data,
       responding natively in the user's language (Odia, Hindi, English, etc.).
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        if GENAI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")

    async def generate_health_advisory(self, user_message: str, govt_data: Dict[str, Any], language: str = "auto") -> Tuple[str, RiskAssessment]:
        """
        Calls Gemini API with system instructions incorporating live Government Health Database API context.
        Returns (rendered_reply_text, risk_assessment_model).
        """
        # If Gemini API key is configured and SDK is present
        if self.client:
            try:
                prompt = self._build_gemini_prompt(user_message, govt_data, language)
                response = self.client.models.generate_content(
                    model='gemini-3.6-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        response_mime_type="application/json"
                    )
                )
                if response.text:
                    parsed = json.loads(response.text)
                    reply = parsed.get("reply", "")
                    risk_dict = parsed.get("risk_assessment", {})
                    risk = RiskAssessment(
                        severity=risk_dict.get("severity", "MEDIUM"),
                        urgency=risk_dict.get("urgency", "Consult a healthcare professional if symptoms persist."),
                        warning_signs=risk_dict.get("warning_signs", []),
                        recommended_action=risk_dict.get("recommended_action", "Stay hydrated and rest.")
                    )
                    return reply, risk
            except Exception as err:
                logger.error(f"Gemini API execution error ({err}). Falling back to rule-guided generator.")

        # Fallback Gemini-emulated response generator when API key is pending
        return self._generate_fallback_advisory(user_message, govt_data)

    async def evaluate_symptom_risk(self, symptoms: str, district: str = "Bhubaneswar") -> Dict[str, Any]:
        """
        Evaluates symptom risk classification via Gemini API.
        Returns severity, risk score, summary, and immediate recommended steps.
        """
        if self.client:
            try:
                prompt = f"""You are an emergency medical triage AI evaluating symptom risk for public health in {district}.
Symptoms provided: "{symptoms}"

Respond STRICTLY in JSON format with keys:
- "severity": "HIGH", "MEDIUM", or "LOW"
- "risk_score": float between 0.0 and 1.0
- "summary": concise clinical summary
- "immediate_steps": list of 3 actionable steps
"""
                response = self.client.models.generate_content(
                    model='gemini-3.6-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        response_mime_type="application/json"
                    )
                )
                if response.text:
                    return json.loads(response.text)
            except Exception as e:
                logger.error(f"Gemini Risk Eval error: {e}")

        # Intelligent Fallback Risk Evaluator
        lower = symptoms.lower()
        if any(w in lower for w in ["bleeding", "unconscious", "chest pain", "difficulty breathing", "severe vomiting"]):
            return {
                "severity": "HIGH",
                "risk_score": 0.92,
                "summary": "Critical warning signs detected requiring immediate emergency medical evaluation.",
                "immediate_steps": ["Call 108 Emergency Ambulance immediately", "Keep the patient warm and lying down", "Do not give solid foods"]
            }
        elif any(w in lower for w in ["dengue", "high fever", "rash", "joint pain", "vomiting"]):
            return {
                "severity": "MEDIUM",
                "risk_score": 0.65,
                "summary": "Moderate risk of vector-borne illness (e.g. Dengue/Malaria) requiring prompt diagnostic testing.",
                "immediate_steps": ["Drink ORS / coconut water continuously", "Take Paracetamol for fever; avoid Aspirin", "Get blood test (CBC/NS1) at nearest health center"]
            }
        else:
            return {
                "severity": "LOW",
                "risk_score": 0.25,
                "summary": "Low risk symptoms. Standard home care and monitoring advised.",
                "immediate_steps": ["Rest and stay hydrated", "Monitor temperature twice daily", "Visit clinic if fever persists beyond 48 hours"]
            }

    def _build_gemini_prompt(self, user_message: str, govt_data: Dict[str, Any], language: str) -> str:
        govt_info = json.dumps(govt_data, indent=2)
        return f"""You are HealthBridge AI, a public health assistant empowered by official Government Health Database APIs.

Government Health Database Data Available:
{govt_info}

User Query: "{user_message}"
Requested Response Language: {language} (If "auto", detect and respond in the EXACT same language as the User Query - e.g. Odia, Hindi, English).

Instructions:
1. Provide accurate, empathetic, grounded health guidance using the Government Health Data provided.
2. Evaluate severity risk: "HIGH", "MEDIUM", or "LOW".
3. Return STRICT JSON matching this structure:
{{
  "reply": "HTML-formatted response text with <strong>, <ul>, <li> tags directly in user's language",
  "risk_assessment": {{
    "severity": "HIGH" | "MEDIUM" | "LOW",
    "urgency": "Clear urgency statement",
    "warning_signs": ["sign 1", "sign 2"],
    "recommended_action": "Actionable next steps"
  }}
}}
"""

    def _generate_fallback_advisory(self, user_message: str, govt_data: Dict[str, Any]) -> Tuple[str, RiskAssessment]:
        lower = user_message.lower()
        source = govt_data.get("source", "Government Health Data API")
        facts = govt_data.get("key_facts", [])
        facts_html = "".join([f"<li><i class='fa-solid fa-check'></i>{f}</li>" for f in facts])

        if "dengue" in lower:
            reply = f"<strong>Dengue Fever Guidance ({source})</strong><ul>{facts_html}</ul><p>⚠️ Stay hydrated and monitor platelet counts at your nearest health center.</p>"
            risk = RiskAssessment(
                severity="MEDIUM",
                urgency="Visit health center for CBC/NS1 blood test within 24 hours.",
                warning_signs=["Persistent vomiting", "Severe abdominal pain", "Gum bleeding"],
                recommended_action="Drink ORS, rest, and avoid aspirin/ibuprofen."
            )
        elif "malaria" in lower:
            reply = f"<strong>Malaria Prevention & Care ({source})</strong><ul>{facts_html}</ul>"
            risk = RiskAssessment(
                severity="MEDIUM",
                urgency="Get blood smear test if fever with chills appears.",
                warning_signs=["Extreme shivering", "High fever spikes"],
                recommended_action="Use mosquito nets and take prescribed antimalarials after blood test."
            )
        elif "ors" in lower or "diarrhea" in lower or "cholera" in lower:
            reply = f"<strong>ORS Hydration & Care ({source})</strong><ul>{facts_html}</ul>"
            risk = RiskAssessment(
                severity="LOW",
                urgency="Start ORS immediately to prevent dehydration.",
                warning_signs=["Severe lethargy", "No urine output for >6 hours"],
                recommended_action="Mix 1 ORS packet in 1L clean water and sip frequently."
            )
        else:
            reply = f"<strong>HealthBridge AI Guidance ({source})</strong><p>Namaste! 🙏 Here is verified public health advice:</p><ul>{facts_html}</ul>"
            risk = RiskAssessment(
                severity="LOW",
                urgency="Monitor symptoms and consult local health center if needed.",
                warning_signs=["Fever > 3 days", "Shortness of breath"],
                recommended_action="Drink clean water, rest, and follow vaccination schedules."
            )

        return reply, risk

gemini_service = GeminiHealthService()
