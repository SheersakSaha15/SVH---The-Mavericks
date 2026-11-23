EMERGENCY_PATTERNS = {
    "en": [
        "cannot breathe",
        "can't breathe",
        "difficulty breathing",
        "severe difficulty breathing",
        "not breathing",
        "breathing stopped",
        "severe chest pain",
        "crushing chest pain",
        "unconscious",
        "loss of consciousness",
        "passed out",
        "fainted",
        "heavy bleeding",
        "severe bleeding",
        "severe seizure",
        "continuous seizure",
        "medical emergency",
        "life threatening",
        "life-threatening",
    ],

    "hi": [
        "सांस लेने में बहुत कठिनाई",
        "सांस लेने में कठिनाई",
        "सांस नहीं आ रही",
        "सांस नहीं ले पा रहा",
        "सांस नहीं ले पा रही",
        "सीने में तेज दर्द",
        "बहुत ज्यादा खून बहना",
        "बेहोश",
        "बेहोशी",
        "दौरा पड़ रहा",
        "चिकित्सीय आपात स्थिति",
    ],

    "bn": [
        "শ্বাস নিতে খুব কষ্ট",
        "শ্বাস নিতে কষ্ট",
        "শ্বাস নিতে পারছি না",
        "শ্বাস বন্ধ",
        "তীব্র বুকে ব্যথা",
        "অতিরিক্ত রক্তপাত",
        "অজ্ঞান",
        "খিঁচুনি হচ্ছে",
        "চিকিৎসাগত জরুরি অবস্থা",
    ],

    "or": [
        "ନିଶ୍ୱାସ ନେବାରେ ବହୁତ କଷ୍ଟ",
        "ନିଶ୍ୱାସ ନେବାରେ କଷ୍ଟ",
        "ନିଶ୍ୱାସ ନେଇ ପାରୁନାହିଁ",
        "ନିଶ୍ୱାସ ବନ୍ଦ",
        "ଛାତିରେ ତୀବ୍ର ଯନ୍ତ୍ରଣା",
        "ଅତ୍ୟଧିକ ରକ୍ତସ୍ରାବ",
        "ଚେତାଶୂନ୍ୟ",
        "ବେହୋସ",
        "ଖିଚୁଣି ହେଉଛି",
        "ଚିକିତ୍ସାଜନିତ ଜରୁରୀ ପରିସ୍ଥିତି",
    ],

    "te": [
        "శ్వాస తీసుకోవడంలో చాలా ఇబ్బంది",
        "శ్వాస తీసుకోవడంలో ఇబ్బంది",
        "శ్వాస తీసుకోలేకపోతున్నాను",
        "శ్వాస ఆగిపోయింది",
        "తీవ్రమైన ఛాతీ నొప్పి",
        "అధిక రక్తస్రావం",
        "స్పృహ కోల్పోయారు",
        "స్పృహలో లేరు",
        "మూర్ఛ",
        "మూర్ఛ వస్తోంది",
        "వైద్యపరమైన అత్యవసర పరిస్థితి",
    ]
}


def check_emergency(text: str) -> bool:

    if not text:
        return False

    text = text.lower().strip()

    for patterns in EMERGENCY_PATTERNS.values():

        for pattern in patterns:

            if pattern.lower() in text:
                return True

    return False


def get_emergency_response(language: str) -> str:

    responses = {

        "en": (
            "This may be a medical emergency. "
            "Please seek urgent medical attention or "
            "contact your local emergency services immediately."
        ),

        "hi": (
            "यह एक चिकित्सीय आपात स्थिति हो सकती है। "
            "कृपया तुरंत चिकित्सा सहायता लें या "
            "स्थानीय आपातकालीन सेवा से संपर्क करें।"
        ),

        "bn": (
            "এটি একটি চিকিৎসাগত জরুরি অবস্থা হতে পারে। "
            "অনুগ্রহ করে অবিলম্বে চিকিৎসা সহায়তা নিন "
            "অথবা স্থানীয় জরুরি পরিষেবার সাথে যোগাযোগ করুন।"
        ),

        "or": (
            "ଏହା ଏକ ଚିକିତ୍ସାଜନିତ ଜରୁରୀ ପରିସ୍ଥିତି ହୋଇପାରେ। "
            "ଦୟାକରି ତୁରନ୍ତ ଚିକିତ୍ସା ସହାୟତା ନିଅନ୍ତୁ "
            "କିମ୍ବା ସ୍ଥାନୀୟ ଜରୁରୀକାଳୀନ ସେବା ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।"
        ),

        "te": (
            "ఇది వైద్యపరమైన అత్యవసర పరిస్థితి కావచ్చు. "
            "దయచేసి వెంటనే వైద్య సహాయం పొందండి "
            "లేదా స్థానిక అత్యవసర సేవలను సంప్రదించండి."
        )
    }

    return responses.get(
        language,
        responses["en"]
    )