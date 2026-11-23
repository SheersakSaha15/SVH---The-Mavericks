import httpx
import logging
import re
from typing import Dict, Any, List, Tuple

try:
    from backend.config import settings
    from backend.models import ChatRequest, ChatResponse, SourceItem, SafetyMeta
except ImportError:
    from config import settings
    from models import ChatRequest, ChatResponse, SourceItem, SafetyMeta

logger = logging.getLogger(__name__)

def detect_language(text: str, requested_lang: str = "auto") -> str:
    """
    Detects language from non-Latin Indian scripts first (Devanagari, Odia, Bengali, Telugu).
    Falls back to requested_lang if provided and not 'auto', or defaults to 'en'.
    """
    if text:
        if re.search(r'[\u0900-\u097F]', text):
            return "hi"  # Hindi
        elif re.search(r'[\u0B00-\u0B7F]', text):
            return "or"  # Odia
        elif re.search(r'[\u0980-\u09FF]', text):
            return "bn"  # Bengali
        elif re.search(r'[\u0C00-\u0C7F]', text):
            return "te"  # Telugu
            
    if requested_lang and requested_lang not in ["auto", "", None]:
        return requested_lang

    return "en"

def resolve_conversational_gesture(text: str, current_answer: str = "", requested_lang: str = "auto") -> str:
    """
    Handles conversational gestures (greetings, thanks, bot identity, and 'not available' fallbacks)
    in English, Hindi, Odia, Bengali, and Telugu.
    """
    lower = text.strip().lower()
    lang = detect_language(text, requested_lang)

    # Greetings
    greeting_keywords = [
        "hi", "hello", "hey", "namaste", "namaskar", "good morning", "good evening", "good afternoon",
        "नमस्ते", "नमस्कार", "हेलो", "हाय", "प्रणाम",
        "ନମସ୍କାର", "ହେଲୋ", "ପ୍ରଣାମ",
        "হ্যালো", "নমস্কার", "হাই",
        "హలో", "నమస్కారం"
    ]
    
    words = set(re.findall(r'\w+', lower, re.UNICODE))
    is_greeting = any(g == lower or g in words or lower.startswith(g + " ") or lower.endswith(" " + g) for g in greeting_keywords)
    word_count = len(lower.split())

    if is_greeting and word_count <= 5:
        if lang == "or":
            return (
                "ନମସ୍କାର! 🙏 ମୁଁ HealthBridge AI, ଆପଣଙ୍କର ସ୍ୱାସ୍ଥ୍ୟ ସହାୟକ। ଆଜି ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?\n\n"
                "💡 *ପ୍ରସ୍ତାବିତ ପ୍ରଶ୍ନ (Suggested Questions)*:\n"
                "➔ 💉 *ଜନ୍ମ ସମୟରେ କେଉଁ ଟିକା ଦିଆଯାଏ?*\n"
                "➔ 🦟 *ଡେଙ୍ଗୁ ଜ୍ୱରର ଲକ୍ଷଣ କ'ଣ?*\n"
                "➔ 🏥 *ନିକଟସ୍ଥ ହସ୍ପିଟାଲ୍ ସନ୍ଧାନ କରନ୍ତୁ*\n"
                "➔ 💧 *ORS ର ବ୍ୟବହାର କିପରି କରିବେ?*"
            )
        elif lang == "hi":
            return (
                "नमस्ते! 🙏 मैं HealthBridge AI हूँ, आपका जन स्वास्थ्य सहायक। आज मैं आपकी क्या सहायता कर सकता हूँ?\n\n"
                "💡 *सुझाए गए प्रश्न (Suggested Questions)*:\n"
                "➔ 💉 *जन्म के समय कौन से टीके दिए जाते हैं?*\n"
                "➔ 🦟 *डेंगू बुखार के क्या लक्षण हैं?*\n"
                "➔ 🏥 *नजदीकी अस्पताल और स्वास्थ्य केंद्र खोजें*\n"
                "➔ 💧 *ओआरएस (ORS) का उपयोग कैसे करें?*"
            )
        elif lang == "bn":
            return (
                "নমস্কার! 🙏 আমি HealthBridge AI, আপনার জনস্বাস্থ্য সহকারী। আজ আপনাকে কীভাবে সাহায্য করতে পারি?\n\n"
                "💡 *পরামর্শযুক্ত প্রশ্ন (Suggested Questions)*:\n"
                "➔ 💉 *জন্মের সময় কোন কোন টিকা দেওয়া হয়?*\n"
                "➔ 🦟 *ডেঙ্গু জ্বরের লক্ষণগুলি কী কী?*\n"
                "➔ 🏥 *কাছাকাছি হাসপাতাল সন্ধান করুন*\n"
                "➔ 💧 *ওআরএস (ORS) কীভাবে ব্যবহার করবেন?*"
            )
        elif lang == "te":
            return (
                "నమస్కారం! 🙏 నేను HealthBridge AI, మీ ప్రజా ఆరోగ్య సహాయకుడిని. నేడు నేను మీకు ఎలా సహాయపడగలను?\n\n"
                "💡 *సూచించిన ప్రశ్నలు (Suggested Questions)*:\n"
                "➔ 💉 *పుట్టినప్పుడు ఏ వ్యాక్సిన్లు ఇస్తారు?*\n"
                "➔ 🦟 *డెంగ్యూ జ్వరం లక్షణాలు ఏమిటి?*\n"
                "➔ 🏥 *సమీపంలోని ఆసుపత్రులను కనుగొనండి*\n"
                "➔ 💧 *ORS వినియోగం ఎలా చేయాలి?*"
            )
        return (
            "Namaste! 🙏 I am HealthBridge AI, your public health & wellness assistant. How can I help you today?\n\n"
            "💡 *Suggested Questions*:\n"
            "➔ 💉 *What vaccines are given at birth?*\n"
            "➔ 🦟 *What are the symptoms of dengue fever?*\n"
            "➔ 🏥 *Find nearby hospitals & health centers*\n"
            "➔ 💧 *How to use ORS for dehydration?*"
        )

    # Gratitude / Thanks
    thanks_keywords = [
        "thank you", "thanks", "thank u", "thx", "dhanyawad", "shukriya",
        "धन्यवाद", "शुक्रिया", "ଧନ୍ୟବାଦ", "ধন্যবাদ", "ధన్యవాదాలు"
    ]
    if any(w in lower for w in thanks_keywords):
        if lang == "or":
            return "ଆପଣଙ୍କୁ ବହୁତ ଧନ୍ୟବାଦ! ସୁସ୍ଥ ରୁହନ୍ତୁ ଏବଂ ନିଜର ଯତ୍ନ ନିଅନ୍ତୁ। ଯଦି କୌଣସି ଜରୁରୀକାଳୀନ ପରିସ୍ଥିତି ଥାଏ, ତୁରନ୍ତ 108 ରେ କଲ୍ କରନ୍ତୁ।"
        elif lang == "hi":
            return "आपका बहुत-बहुत धन्यवाद! स्वस्थ रहें और अपना ख्याल रखें। किसी भी स्वास्थ्य संबंधी आपात स्थिति में तुरंत 108 पर कॉल करें।"
        elif lang == "bn":
            return "আপনাকে অনেক ধন্যবাদ! সুস্থ থাকুন এবং নিজের যত্ন নিন। যেকোনো জরুরি স্বাস্থ্য পরিস্থিতিতে অবিলম্বে ১০৮ নম্বরে কল করুন।"
        elif lang == "te":
            return "మీకు చాలా ధన్యవాదాలు! ఆరోగ్యంగా ఉండండి మరియు జాగ్రత్త వహించండి. ఏవైనా అకస్మాత్తు అత్యవసర పరిస్థితుల్లో వెంటనే 108 కి కాల్ చేయండి।"
        return "You're most welcome! Stay healthy, take care, and remember to call 108 in any medical emergency."

    # Identity / Bot info
    identity_keywords = ["who are you", "what can you do", "what is your name", "help me", "आप कौन हैं", "ଆପଣ କିଏ"]
    if any(w in lower for w in identity_keywords):
        return "I am HealthBridge AI, an intelligent multilingual health assistant. I provide verified health advisories, symptom risk evaluation, government vaccination schedules, active disease outbreak alerts, and hospital locator services."

    # Intercept 'not available' answers from upstream RAG for short or gesture queries
    if current_answer and any(phrase in current_answer.lower() for phrase in ["not available", "no information available", "information not available", "sorry, i don't know"]):
        if lang == "or":
            return "କ୍ଷମା କରିବେ, ଏହି ପ୍ରଶ୍ନ ପାଇଁ ମୋ ପାଖରେ ସିଧାସଳଖ ତଥ୍ୟ ନାହିଁ। ଦୟାକରି ଲକ୍ଷଣ, ଟିକାକରଣ କିମ୍ବା ରୋଗ ସଚେତନତା ବିଷୟରେ ପଚାରନ୍ତୁ।"
        elif lang == "hi":
            return "क्षमा करें, इस विशिष्ट विषय पर जानकारी उपलब्ध नहीं है। कृपया लक्षणों, टीकाकरण या स्वास्थ्य जागरूकता से संबंधित प्रश्न पूछें।"
        return "I am sorry, I don't have specific information on that exact topic in my public health knowledge base. Please ask about symptoms, vaccination schedules, disease prevention, or nearby health services."

    return ""

class MockAIService:
    """
    Mock AI Service for development and fallback testing.
    """
    async def chat(self, request: ChatRequest, govt_context: Dict[str, Any] = None) -> ChatResponse:
        message_lower = request.message.lower()
        
        intent = self._classify_intent(message_lower)
        lang = self._detect_language(request.message, request.language)
        safety = self._evaluate_safety(message_lower)
        reply_text, sources = self._generate_response(request.message, intent, lang, govt_context)

        return ChatResponse(
            success=True,
            session_id=request.session_id,
            message=reply_text,
            language=lang,
            intent=intent,
            sources=sources,
            safety=safety
        )

    def _classify_intent(self, text: str) -> str:
        if any(w in text for w in ["vaccine", "vaccination", "tika", "dose", "schedule"]):
            return "vaccination"
        elif any(w in text for w in ["outbreak", "alert", "spreading", "cases in"]):
            return "outbreak"
        elif any(w in text for w in ["hospital", "center", "centre", "near me", "clinic"]):
            return "location"
        elif any(w in text for w in ["severe", "vomiting", "bleeding", "unconscious", "emergency", "chest pain"]):
            return "symptom_risk"
        return "health_information"

    def _detect_language(self, text: str, requested_lang: str) -> str:
        if requested_lang and requested_lang != "auto":
            return requested_lang
        
        if re.search(r'[\u0900-\u097F]', text):
            return "hi"  # Hindi
        elif re.search(r'[\u0B00-\u0B7F]', text):
            return "or"  # Odia
        elif re.search(r'[\u0980-\u09FF]', text):
            return "bn"  # Bengali
        elif re.search(r'[\u0C00-\u0C7F]', text):
            return "te"  # Telugu
        return "en"

    def _evaluate_safety(self, text: str) -> SafetyMeta:
        return evaluate_dynamic_safety(text)

    def _generate_response(self, text: str, intent: str, lang: str, govt_context: Dict[str, Any]) -> Tuple[str, List[SourceItem]]:
        sources = [SourceItem(source="health_knowledge_base.txt", chunk_id="hkb_01")]
        text_lower = text.lower()
        
        if "dengue" in text_lower:
            sources = [SourceItem(source="dengue.txt", chunk_id="dengue.txt_0")]
            if lang == "or":
                return "ଡେଙ୍ଗୁ ଜ୍ୱର: ଏହା ଏଡିସ୍ ମଶା ଦ୍ୱାରା ବ୍ୟାପିଥାଏ। ଉଚ୍ଚ ଜ୍ୱର, ପ୍ରବଳ ମୁଣ୍ଡବିନ୍ଧା ଏବଂ ଗଣ୍ଠି ଯନ୍ତ୍ରଣା ଏହାର ପ୍ରମୁଖ ଲକ୍ଷଣ। ପ୍ରଚୁର ପରିମାଣରେ ପାଣି ଏବଂ ORS ପିଅନ୍ତୁ।", sources
            elif lang == "hi":
                return "डेंगू बुखार: यह एडीज मच्छर के काटने से फैलता है। तेज बुखार, सिरदर्द और जोड़ों का दर्द मुख्य लक्षण हैं। पर्याप्त तरल पदार्थ और ORS लें।", sources
            elif lang == "bn":
                return "ডেঙ্গু জ্বর: এটি এডিস মশার কামড়ে ছড়ায়। উচ্চ জ্বর, তীব্র মাথাব্যথা এবং জয়েন্টে ব্যথা প্রধান লক্ষণ। প্রচুর তরল এবং ওআরএস পান করুন।", sources
            elif lang == "te":
                return "డెంగ్యూ జ్వరం: ఇది ఈడెస్ దోమ కాటు ద్వారా వ్యాపిస్తుంది. అధిక జ్వరం, తీవ్రమైన తలనొప్పి మరియు కీళ్ల నొప్పులు ప్రధాన లక్షణాలు. ధారాళంగా ద్రవాలు మరియు ORS తీసుకోండి.", sources
            return "Dengue Fever: Transmitted by Aedes mosquitoes. High fever, severe headache, and joint pain are key symptoms. Stay hydrated with ORS and rest.", sources

        elif "malaria" in text_lower:
            sources = [SourceItem(source="malaria.txt", chunk_id="malaria.txt_0")]
            if lang == "or":
                return "ମ୍ୟାଲେରିଆ: ମଶାରି ବ୍ୟବହାର କରନ୍ତୁ ଏବଂ ଜ୍ୱର ହେଲେ ତୁରନ୍ତ ରକ୍ତ ପରୀକ୍ଷା କରାନ୍ତୁ।", sources
            elif lang == "hi":
                return "मलेरिया: मच्छरदानी का उपयोग करें और बुखार आने पर तुरंत रक्त परीक्षण करवाएं।", sources
            elif lang == "bn":
                return "ম্যালেরিয়া: মশারি ব্যবহার করুন এবং জ্বর হলে অবিলম্বে রক্ত পরীক্ষা করান।", sources
            elif lang == "te":
                return "మలేరియా: దోమతెరలను ఉపయోగించండి మరియు జ్వరం వచ్చినప్పుడు వెంటనే రక్త పరీక్ష చేయించుకోండి.", sources
            return "Malaria: Transmitted by Anopheles mosquitoes. Symptoms include cyclical fever with chills. Sleep under mosquito nets and get tested promptly.", sources

        # General fever & symptom matchers
        elif any(w in text_lower for w in ["fever", "bukhar", "बुखार", "জ্বর", "ଜ୍ୱର", "జ్వరం", "sick", "unwell", "temperature"]):
            sources = [SourceItem(source="fever_guidance.txt", chunk_id="fg_01")]
            if lang == "hi":
                return "बुखार एवं स्वास्थ्य परामर्श: पर्याप्त विश्राम करें, स्वच्छ जल तथा ORS का सेवन करें। यदि बुखार 100°F से अधिक रहता है या 48 घंटे से अधिक टिकता है, तो तुरंत निकटतम प्राथमिक स्वास्थ्य केंद्र या डॉक्टर से संपर्क करें।", sources
            elif lang == "bn":
                return "জ্বর ও স্বাস্থ্যের যত্ন: পর্যাপ্ত বিশ্রাম নিন, প্রচুর বিশুদ্ধ পানি এবং ওআরএস পান করুন। জ্বর ১০০° ফারেনহাইটের বেশি হলে বা ৪৮ ঘণ্টার বেশি স্থায়ী হলে চিকিৎসকের পরামর্শ নিন।", sources
            elif lang == "or":
                return "ଜ୍ୱର ସଚେତନତା: ଯଥେଷ୍ଟ ବିଶ୍ରାମ ନିଅନ୍ତୁ, ପ୍ରଚୁର ପାଣି ଏବଂ ORS ପିଅନ୍ତୁ। ଜ୍ୱର ୪୮ ଘଣ୍ଟାରୁ ଅଧିକ ରହିଲେ ତୁରନ୍ତ ଡାକ୍ତରଙ୍କ ସହ ପରାମର୍ଶ କରନ୍ତୁ।", sources
            elif lang == "te":
                return "జ్వరం మరియు ఆరోగ్య సలహా: తగినంత విశ్రాంతి తీసుకోండి, పుష్కలంగా నీరు మరియు ORS తీసుకోండి. జ్వరం 48 గంటలకు పైగా ఉంటే వెంటనే వైద్యుడిని సంప్రదించండి.", sources
            return "Fever & General Health Guidance: Ensure adequate rest, stay hydrated with fluids and ORS. If fever persists above 100°F for more than 48 hours, please consult a medical professional immediately.", sources

        # Multilingual default fallback
        if lang == "hi":
            return "हेल्थब्रिज एआई स्वास्थ्य मार्गदर्शन: पर्याप्त हाइड्रेशन, स्वच्छ पेयजल, और समय पर टीकाकरण रोग निवारण के लिए अत्यंत आवश्यक हैं।", sources
        elif lang == "bn":
            return "হেলথব্রিজ এআই স্বাস্থ্য নির্দেশিকা: সঠিক হাইড্রেশন, বিশুদ্ধ পানীয় জল এবং সময়মত টিকাদান রোগ প্রতিরোধের জন্য অত্যন্ত জরুরি।", sources
        elif lang == "or":
            return "ହେଲ୍ଥବ୍ରିଜ୍ AI ସ୍ୱାସ୍ଥ୍ୟ ମାର୍ଗଦର୍ଶନ: ସଠିକ୍ ହାଇଡ୍ରେସନ୍, ବିଶୁଦ୍ଧ ପାନୀୟ ଜଳ ଏବଂ ସମୟାନୁସାରେ ଟିକାକରଣ ରୋଗ ପ୍ରତିରୋଧ ପାଇଁ ଏକାନ୍ତ ଆବଶ୍ୟକ।", sources
        elif lang == "te":
            return "హెల్త్‌బ్రిడ్జ్ AI ఆరోగ్య మార్గదర్శకత్వం: వ్యాధి నివారణకు సరైన హైడ్రేషన్, స్వచ్ఛమైన తాగునీరు మరియు సకాలంలో టీకాలు వేయడం చాలా అవసరం.", sources
        return "HealthBridge AI Public Health Guidance: Hydration, clean drinking water, and age-appropriate vaccinations are essential for disease prevention.", sources

def evaluate_dynamic_safety(text: str, answer_text: str = "") -> SafetyMeta:
    """
    Evaluates query for critical red flag conditions.
    """
    combined = (text + " " + answer_text).lower()

    critical_terms = [
        "chest pain", "difficulty breathing", "shortness of breath", "unconscious", "fainted",
        "heavy bleeding", "bleeding profusely", "severe allergic", "anaphylaxis", "choking",
        "poison", "poisoning", "suicide", "stroke", "seizure", "fit", "paralysis",
        "snake bite", "stiff neck with fever", "blue lips", "cardiac", "heart attack"
    ]
    if any(term in combined for term in critical_terms):
        return SafetyMeta(
            level="EMERGENCY",
            requires_human_attention=True
        )

    return SafetyMeta(
        level="NORMAL",
        requires_human_attention=False
    )

class HealthBridgeRAGService:
    """
    RAG Service Adapter: Connects backend gateway to teammate's RAG AI Service (Port 5000).
    Maps backend ChatRequest -> teammate's ChatRequest (message, input_type)
    and normalizes teammate's ChatResponse (answer, language, intent, safety_status, sources) -> ChatResponse contract.
    """
    def __init__(self, ai_service_url: str = None):
        self.ai_service_url = ai_service_url or getattr(settings, 'AI_SERVICE_URL', 'http://localhost:5000/api/chat')

    async def chat(self, request: ChatRequest, govt_context: Dict[str, Any] = None) -> ChatResponse:
        # Match teammate's app/schemas.py format
        ai_payload = {
            "message": request.message,
            "input_type": "text"
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                logger.info(f"Forwarding query to RAG AI Service at {self.ai_service_url}: '{request.message}'")
                response = await client.post(self.ai_service_url, json=ai_payload)
                if response.status_code == 200:
                    raw = response.json()
                    
                    # Normalize teammate's response to ChatResponse contract
                    answer_text = raw.get("answer", "")
                    sources_raw = raw.get("sources", [])
                    safety_str = raw.get("safety_status", "safe")
                    
                    formatted_sources = [
                        SourceItem(source=s) if isinstance(s, str) else SourceItem(source=s.get("source", "rag_doc"))
                        for s in sources_raw
                    ]
                    
                    safety_meta = evaluate_dynamic_safety(request.message, answer_text)

                    return ChatResponse(
                        success=True,
                        session_id=request.session_id,
                        message=answer_text,
                        language=raw.get("language", request.language),
                        intent=raw.get("intent", "health_information"),
                        sources=formatted_sources,
                        safety=safety_meta
                    )
        except Exception as err:
            logger.warning(f"RAG AI Service unreachable at {self.ai_service_url} ({err}). Falling back to MockAIService.")

        # Fallback to MockAIService if teammate's service is temporarily starting up
        mock = MockAIService()
        return await mock.chat(request, govt_context)


class AIServiceManager:
    """
    Unified AI Service Manager.
    Automatically routes to HealthBridgeRAGService (teammate's RAG server) when configured.
    """
    def __init__(self):
        self.mock_service = MockAIService()
        self.rag_service = HealthBridgeRAGService()

    async def chat(self, request: ChatRequest, govt_context: Dict[str, Any] = None) -> ChatResponse:
        # Pre-check for conversational gestures (greetings, thanks, bot identity)
        gesture_text = resolve_conversational_gesture(request.message, requested_lang=request.language)
        if gesture_text:
            return ChatResponse(
                success=True,
                session_id=request.session_id,
                message=gesture_text,
                language=request.language if request.language != "auto" else detect_language(request.message),
                intent="greeting",
                sources=[SourceItem(source="healthbridge_assistant")],
                safety=SafetyMeta(level="normal", requires_human_attention=False)
            )

        # Route to HealthBridgeRAGService which hits teammate's port 5000 API
        res = await self.rag_service.chat(request, govt_context)
        
        # Post-check: if upstream RAG returned 'not available', replace with friendly guidance
        fallback_gesture = resolve_conversational_gesture(request.message, res.message, requested_lang=request.language)
        if fallback_gesture:
            res.message = fallback_gesture

        # Ensure follow-up interactive pills match detected language if not already present
        if "➔" not in res.message:
            lang = res.language
            if lang == "hi":
                res.message += (
                    "\n\n💡 *सुझाए गए प्रश्न (Suggested Questions)*:\n"
                    "➔ 💉 *जन्म के समय कौन से टीके दिए जाते हैं?*\n"
                    "➔ 🦟 *डेंगू बुखार के क्या लक्षण हैं?*\n"
                    "➔ 🏥 *नजदीकी अस्पताल और स्वास्थ्य केंद्र खोजें*\n"
                    "➔ 💧 *ओआरएस (ORS) का उपयोग कैसे करें?*"
                )
            elif lang == "or":
                res.message += (
                    "\n\n💡 *ପ୍ରସ୍ତାବିତ ପ୍ରଶ୍ନ (Suggested Questions)*:\n"
                    "➔ 💉 *ଜନ୍ମ ସମୟରେ କେଉଁ ଟିକା ଦିଆଯାଏ?*\n"
                    "➔ 🦟 *ଡେଙ୍ଗୁ ଜ୍ୱରର ଲକ୍ଷଣ କ'ଣ?*\n"
                    "➔ 🏥 *ନିକଟସ୍ଥ ହସ୍ପିଟାଲ୍ ସନ୍ଧାନ କରନ୍ତୁ*\n"
                    "➔ 💧 *ORS ର ବ୍ୟବହାର କିପରି କରିବେ?*"
                )
            elif lang == "bn":
                res.message += (
                    "\n\n💡 *পরামর্শযুক্ত প্রশ্ন (Suggested Questions)*:\n"
                    "➔ 💉 *জন্মের সময় কোন কোন টিকা দেওয়া হয়?*\n"
                    "➔ 🦟 *ডেঙ্গু জ্বরের লক্ষণগুলি কী কী?*\n"
                    "➔ 🏥 *কাছাকাছি হাসপাতাল সন্ধান করুন*\n"
                    "➔ 💧 *ওআরএস (ORS) কীভাবে ব্যবহার করবেন?*"
                )
            elif lang == "te":
                res.message += (
                    "\n\n💡 *సూచించిన ప్రశ్నలు (Suggested Questions)*:\n"
                    "➔ 💉 *పుట్టినప్పుడు ఏ వ్యాక్సిన్లు ఇస్తారు?*\n"
                    "➔ 🦟 *డెంగ్యూ జ్వరం లక్షణాలు ఏమిటి?*\n"
                    "➔ 🏥 *సమీపంలోని ఆసుపత్రులను కనుగొనండి*\n"
                    "➔ 💧 *ORS వినియోగం ఎలా చేయాలి?*"
                )
            else:
                res.message += (
                    "\n\n💡 *Suggested Questions*:\n"
                    "➔ 💉 *What vaccines are given at birth?*\n"
                    "➔ 🦟 *What are the symptoms of dengue fever?*\n"
                    "➔ 🏥 *Find nearby hospitals & health centers*\n"
                    "➔ 💧 *How to use ORS for dehydration?*"
                )

        # Always attach dynamic multi-tier medical safety triage
        res.safety = evaluate_dynamic_safety(request.message, res.message)

        return res

ai_service = AIServiceManager()
