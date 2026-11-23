from ..data.data_service import get_diseases, get_vaccinations
from ..data.data_service import (
    get_diseases,
    get_vaccinations,
    get_multilingual_terms,
)

EMERGENCY_KEYWORDS = [
    "emergency",
    "cannot breathe",
    "can't breathe",
    "not breathing",
    "severe chest pain",
    "heavy bleeding",
    "unconscious",
    "fainted",
    "seizure",
]


DISEASE_KEYWORDS = [
    "disease", "illness", "condition", "symptoms", "symptom", "signs", "causes", "cause",
    "transmission", "spread", "prevention", "prevent", "treatment", "what is", "what are", "tell me about",
    "बुखार", "लक्षण", "बीमारी", "रोग", "इलाज", "कारण", "रोकथाम", "क्या है", "क्या हैं",
    "ଜ୍ୱର", "ଲକ୍ଷଣ", "ରୋଗ", "ଚିକିତ୍ସା", "କାରଣ", "ପ୍ରତିଷେଧକ", "କ'ଣ", "କଣ",
    "জ্বর", "লক্ষণ", "রোগ", "চিকিৎসা", "কারণ", "প্রতিরোধ", "কী",
    "జ్వరం", "లక్షణాలు", "వ్యాధి", "చికిత్స", "కారణాలు", "ఏమిటి"
]


VACCINATION_KEYWORDS = [
    "vaccine", "vaccination", "vaccinate", "immunization", "immunisation", "dose", "booster",
    "bcg", "opv", "pentavalent", "rotavirus", "ipv", "fipv", "pcv", "mr vaccine", "measles vaccine", "je vaccine", "td vaccine",
    "टीका", "टीकाकरण", "खुराक", "टिका",
    "ଟିକା", "ଟିକାକରଣ",
    "টিকা", "টিকাদান",
    "టీకా", "వ్యాక్సిన్", "టీకాలు"
]


HOSPITAL_KEYWORDS = [
    "hospital", "clinic", "doctor near", "hospital near", "clinic near", "nearby doctor", "nearby hospital",
    "अस्पताल", "अस्पताल खोजें", "डॉक्टर", "स्वास्थ्य केंद्र",
    "ହସ୍ପିଟାଲ୍", "ଡାକ୍ତରଖାନା", "ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର",
    "হাসপাতাল", "ডাক্তার",
    "ఆసుపత్రి", "వైద్యుడు", "ఆసుపత్రులు"
]


def contains_keyword(text, keywords):
    text = text.lower()

    return any(
        keyword in text
        for keyword in keywords
    )


def contains_disease_name(text):
    """
    Check disease names, aliases and multilingual names.
    """

    text = text.lower()

    multilingual_terms = get_multilingual_terms()

    for disease in get_diseases():

        disease_name = disease.get("name", "").lower()

        names = [
            disease_name,
            *[
                alias.lower()
                for alias in disease.get("aliases", [])
            ]
        ]

        names.extend(
            term.lower()
            for term in multilingual_terms.get(disease_name, [])
        )

        for name in names:

            if name and name in text:
                return True

    return False

def contains_vaccine_name(text):
    """
    Check whether the user's message contains
    a vaccine name from vaccinations.json.
    """

    text = text.lower()

    for vaccine in get_vaccinations():

        name = vaccine.get("vaccine", "").lower().strip()

        if name and name in text:
            return True

    return False


def detect_intent(text: str) -> str:

    text = text.lower().strip()

    if not text:
        return "UNKNOWN"

    # Highest priority: emergency
    if contains_keyword(text, EMERGENCY_KEYWORDS):
        return "EMERGENCY"

    # Hospital search
    if contains_keyword(text, HOSPITAL_KEYWORDS):
        return "HOSPITAL_SEARCH"

    # Vaccination
    if contains_keyword(text, VACCINATION_KEYWORDS):
        return "VACCINATION"

    if contains_vaccine_name(text):
        return "VACCINATION"

    # Disease
    if contains_keyword(text, DISEASE_KEYWORDS):
        return "DISEASE_INFO"

    if contains_disease_name(text):
        return "DISEASE_INFO"

    # Otherwise general health
    return "GENERAL_HEALTH"