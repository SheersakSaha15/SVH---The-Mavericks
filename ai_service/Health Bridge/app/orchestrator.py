from .nlp.language import detect_language
from .intent.classifier import detect_intent
from .safety.precheck import check_emergency, get_emergency_response
from .rag.pipeline import generate_rag_answer
from .data.data_service import (
    search_diseases,
    search_vaccinations,
)
from .nlp.response_generator import generate_localized_response
from .safety.postcheck import post_safety_check


def format_disease_response(disease: dict) -> str:
    symptoms = ", ".join(disease.get("symptoms", []))
    prevention = " ".join(disease.get("prevention", []))

    return (
        f"{disease['name']}\n\n"
        f"{disease.get('description', '')}\n\n"
        f"Symptoms: {symptoms}.\n\n"
        f"Transmission: "
        f"{disease.get('transmission', 'Not available.')}\n\n"
        f"Prevention: {prevention}"
    )


def format_vaccination_response(records: list) -> str:
    if not records:
        return "No vaccination information was found."

    response = []
    seen = set()

    for record in records:

        key = (
            record.get("vaccine"),
            record.get("age_group"),
            record.get("dose"),
            record.get("prevents")
        )

        if key in seen:
            continue

        seen.add(key)

        response.append(
            f"{record['vaccine']} - "
            f"{record['age_group']} - "
            f"{record['dose']} - "
            f"Prevents: {record['prevents']}"
        )

    return "\n".join(response[:5])

def apply_post_safety(answer: str, language: str, intent: str) -> dict:
    """
    Run the final answer through the safety check.
    """

    safety_result = post_safety_check(answer)

    if not safety_result["safe"]:

        fallback_messages = {
            "en": (
                "I can provide general health information, "
                "but I cannot diagnose a condition or prescribe "
                "treatment based only on this conversation."
            ),

            "hi": (
                "मैं सामान्य स्वास्थ्य जानकारी प्रदान कर सकता हूँ, "
                "लेकिन केवल इस बातचीत के आधार पर किसी बीमारी का "
                "निदान या उपचार निर्धारित नहीं कर सकता।"
            ),

            "bn": (
                "আমি সাধারণ স্বাস্থ্য তথ্য দিতে পারি, "
                "কিন্তু শুধুমাত্র এই কথোপকথনের ভিত্তিতে কোনো রোগ "
                "নির্ণয় বা চিকিৎসা নির্ধারণ করতে পারি না।"
            ),

            "or": (
                "ମୁଁ ସାଧାରଣ ସ୍ୱାସ୍ଥ୍ୟ ସୂଚନା ଦେଇପାରେ, "
                "କିନ୍ତୁ କେବଳ ଏହି କଥୋପକଥନ ଆଧାରରେ କୌଣସି ରୋଗର "
                "ନିରାକରଣ କିମ୍ବା ଚିକିତ୍ସା ନିର୍ଦ୍ଦେଶ ଦେଇପାରିବି ନାହିଁ।"
            ),

            "te": (
                "నేను సాధారణ ఆరోగ్య సమాచారాన్ని అందించగలను, "
                "కానీ ఈ సంభాషణ ఆధారంగా మాత్రమే వ్యాధిని నిర్ధారించలేను "
                "లేదా చికిత్సను సూచించలేను."
            )
        }

        return {
            "answer": fallback_messages.get(
                language,
                fallback_messages["en"]
            ),
            "language": language,
            "intent": intent,
            "safety_status": "postcheck_blocked",
            "sources": []
        }

    return {
        "answer": answer,
        "language": language,
        "intent": intent,
        "safety_status": "passed",
        "sources": None
    }

def find_disease_from_message(message: str):
    """
    Search the complete disease dataset.

    No disease names are hardcoded here.
    """

    results = search_diseases(message)

    if results:
        return results[0]

    return None


def find_vaccines_from_message(message: str):
    """
    Search the complete vaccination dataset.
    """

    results = search_vaccinations(message)

    return results


def process_message(message: str) -> dict:

    # --------------------------------------------------
    # 1. LANGUAGE DETECTION
    # --------------------------------------------------

    language = detect_language(message)

    # --------------------------------------------------
    # 2. EMERGENCY SAFETY CHECK
    # --------------------------------------------------

    if check_emergency(message):

        return {
            "answer": get_emergency_response(language),
            "language": language,
            "intent": "EMERGENCY",
            "safety_status": "emergency_detected",
            "sources": []
        }

    # --------------------------------------------------
    # 3. INTENT DETECTION
    # --------------------------------------------------

    intent = detect_intent(message)

    # --------------------------------------------------
    # 4. DISEASE INFORMATION
    # --------------------------------------------------

    if intent == "DISEASE_INFO":

        disease = find_disease_from_message(message)

        if disease:
            facts = format_disease_response(disease)

            answer = generate_localized_response(
                facts=facts,
                user_message=message,
                language=language
            )

            safety_result = apply_post_safety(
                answer,
                language,
                "DISEASE_INFO"
            )

            if safety_result["safety_status"] == "postcheck_blocked":
                safety_result["sources"] = ["diseases.json"]
                return safety_result

            return {
                "answer": safety_result["answer"],
                "language": language,
                "intent": "DISEASE_INFO",
                "safety_status": "passed",
                "sources": ["diseases.json"]
            }
        # No specific disease found.
        # Use RAG for general disease/health information.

        result = generate_rag_answer(message, language)

        return {
            "answer": result["answer"],
            "language": language,
            "intent": "DISEASE_INFO",
            "safety_status": "passed",
            "sources": result["sources"]
        }

    # --------------------------------------------------
    # 5. VACCINATION INFORMATION
    # --------------------------------------------------

    if intent == "VACCINATION":

        records = find_vaccines_from_message(message)

        if records:
            facts = format_vaccination_response(records)

            answer = generate_localized_response(
                facts=facts,
                user_message=message,
                language=language
            )

            safety_result = apply_post_safety(
                answer,
                language,
                "VACCINATION"
            )

            if safety_result["safety_status"] == "postcheck_blocked":
                safety_result["sources"] = ["vaccinations.json"]
                return safety_result

            return {
                "answer": safety_result["answer"],
                "language": language,
                "intent": "VACCINATION",
                "safety_status": "passed",
                "sources": ["vaccinations.json"]
            }

        return {
            "answer": (
                "Vaccination information is available, "
                "but a specific vaccination record could not "
                "be identified from the question."
            ),
            "language": language,
            "intent": "VACCINATION",
            "safety_status": "passed",
            "sources": ["vaccinations.json"]
        }

    # --------------------------------------------------
    # 6. HOSPITAL SEARCH
    # --------------------------------------------------

    if intent == "HOSPITAL_SEARCH":

        return {
            "answer": (
                "Hospital and doctor search will be connected "
                "to the backend location service."
            ),
            "language": language,
            "intent": "HOSPITAL_SEARCH",
            "safety_status": "passed",
            "sources": []
        }

    # --------------------------------------------------
    # 7. GENERAL HEALTH → RAG
    # --------------------------------------------------

    if intent == "GENERAL_HEALTH":

        result = generate_rag_answer(
            message,
            language
        )

        safety_result = apply_post_safety(
            result["answer"],
            language,
            "GENERAL_HEALTH"
        )

        if safety_result["safety_status"] == "postcheck_blocked":
            safety_result["sources"] = result["sources"]
            return safety_result

        return {
            "answer": safety_result["answer"],
            "language": language,
            "intent": "GENERAL_HEALTH",
            "safety_status": "passed",
            "sources": result["sources"]
        }

    # --------------------------------------------------
    # 8. UNKNOWN
    # --------------------------------------------------

    return {
        "answer": (
            "I could not understand the request. "
            "Please ask a health-related question."
        ),
        "language": language,
        "intent": "UNKNOWN",
        "safety_status": "passed",
        "sources": []
    }