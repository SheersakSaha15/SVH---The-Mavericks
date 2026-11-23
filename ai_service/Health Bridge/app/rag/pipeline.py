import os
from pathlib import Path

import chromadb
from dotenv import load_dotenv
from google import genai
from google.genai import types


load_dotenv()
if not os.getenv("GEMINI_API_KEY"):
    for parent in Path(__file__).resolve().parents:
        env_file = parent / ".env"
        if env_file.exists():
            load_dotenv(dotenv_path=env_file)
            break


# --------------------------------------------------
# PROJECT PATH
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

CHROMA_PATH = BASE_DIR / "vector_store" / "chroma_db"


# --------------------------------------------------
# GEMINI
# --------------------------------------------------

gemini_client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# --------------------------------------------------
# CHROMADB
# --------------------------------------------------

chroma_client = chromadb.PersistentClient(
    path=str(CHROMA_PATH)
)


collection = chroma_client.get_collection(
    name="healthbridge_knowledge"
)


# --------------------------------------------------
# RAG FUNCTION
# --------------------------------------------------

def generate_rag_answer(
    message: str,
    language: str = "en"
) -> dict:
    import re

    # ----------------------------------------------
    # 1. Translate non-English queries for vector search
    # ----------------------------------------------
    search_text = message
    if language != "en" or re.search(r"[\u0900-\u0D7F]", message):
        try:
            trans_res = gemini_client.models.generate_content(
                model="gemini-3.6-flash",
                contents=f"Translate this health query to clear English: '{message}'. Return ONLY the translated English text."
            )
            if trans_res and trans_res.text:
                search_text = trans_res.text.strip()
        except Exception:
            try:
                trans_res = gemini_client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=f"Translate this health query to clear English: '{message}'. Return ONLY the translated English text."
                )
                if trans_res and trans_res.text:
                    search_text = trans_res.text.strip()
            except Exception:
                search_text = message

    # ----------------------------------------------
    # 2. Create embedding for search question
    # ----------------------------------------------
    try:
        embedding_result = gemini_client.models.embed_content(
            model="gemini-embedding-001",
            contents=search_text
        )
        query_embedding = embedding_result.embeddings[0].values
    except Exception:
        query_embedding = None

    # ----------------------------------------------
    # 3. Search ChromaDB
    # ----------------------------------------------
    if query_embedding:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=3
        )
        documents = results["documents"][0]
        metadata = results["metadatas"][0]
        distances = results["distances"][0]
    else:
        documents, metadata, distances = [], [], []

    # ----------------------------------------------
    # 4. Filter irrelevant results
    # ----------------------------------------------
    distance_threshold = 1.25

    filtered_documents = []
    filtered_metadata = []
    filtered_distances = []

    for document, meta, distance in zip(documents, metadata, distances):
        if distance <= distance_threshold:
            filtered_documents.append(document)
            filtered_metadata.append(meta)
            filtered_distances.append(distance)

    # ----------------------------------------------
    # 5. Build context
    # ----------------------------------------------
    if not filtered_documents:
        # Fallback to all retrieved documents if distance threshold was too strict
        filtered_documents = documents
        filtered_metadata = metadata
        filtered_distances = distances

    context_parts = []
    for document, meta in zip(filtered_documents, filtered_metadata):
        source = meta.get("source", "health knowledge base")
        context_parts.append(f"Source: {source}\nInformation:\n{document}")

    context = "\n\n".join(context_parts) if context_parts else "General public health guidelines apply."

    # ----------------------------------------------
    # 6. Generate answer with Gemini
    # ----------------------------------------------
    lang_names = {
        "en": "English",
        "hi": "Hindi",
        "bn": "Bengali",
        "or": "Odia",
        "te": "Telugu"
    }
    target_lang_name = lang_names.get(language, "English")

    prompt = f"""
You are HealthBridge, a friendly multilingual AI health-awareness assistant.

Target Language: {target_lang_name} (language code: {language})

User Question (original): {message}

Instructions:
1. Answer the user's question directly and thoroughly in {target_lang_name}.
2. Use the provided health information below as reference.
3. Do not invent medical facts or prescribe medications.
4. Keep tone compassionate, clear, and easy to read.

PROVIDED HEALTH INFORMATION:
{context}
"""

    answer_text = None
    try:
        response = gemini_client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3
            )
        )
        if response and hasattr(response, 'text') and response.text:
            answer_text = response.text.strip()
    except Exception as e:
        print(f"[RAG Pipeline] Gemini API call exception (e.g. rate limit/quota): {e}")

    if not answer_text:
        # Fallback 1: Use knowledge base facts retrieved from ChromaDB if available
        if context and len(context.strip()) > 0:
            answer_text = context.strip()
        else:
            # Fallback 2: Multilingual default health advisory template matching requested language
            default_fallbacks = {
                "hi": "स्वास्थ्य परामर्श: बुखार या अस्वस्थता होने पर पर्याप्त आराम करें, स्वच्छ जल और ORS का सेवन करें। यदि बुखार 100°F से अधिक रहता है या 48 घंटे से ज्यादा टिकता है, तो निकटतम स्वास्थ्य केंद्र या डॉक्टर से संपर्क करें।",
                "bn": "স্বাস্থ্য পরামর্শ: জ্বর বা অসুস্থ বোধ করলে পর্যাপ্ত বিশ্রাম নিন, প্রচুর পানি ও ওআরএস পান করুন। জ্বর ৪৮ ঘণ্টার বেশি থাকলে অবিলম্বে ডাক্তারের পরামর্শ নিন।",
                "or": "ସ୍ୱାସ୍ଥ୍ୟ ପରାମର୍ଶ: ଜ୍ୱର କିମ୍ବା ଅସୁସ୍ଥତା ଅନୁଭବ ହେଲେ ଯଥେଷ୍ଟ ବିଶ୍ରାମ ନିଅନ୍ତୁ, ପ୍ରଚୁର ପାଣି ଏବଂ ORS ପିଅନ୍ତୁ। ଜ୍ୱର ୪୮ ଘଣ୍ଟାରୁ ଅଧିକ ରହିଲେ ତୁରନ୍ତ ଡାକ୍ତରଙ୍କ ସହ ପରାମର୍ଶ କରନ୍ତୁ।",
                "te": "ఆరోగ్య సలహా: జ్వరం లేదా అనారోగ్యంగా అనిపిస్తే తగినంత విశ్రాంతి తీసుకోండి, పుష్కలంగా నీరు మరియు ORS తీసుకోండి. జ్వరం 48 గంటలకు పైగా ఉంటే వెంటనే వైద్యుడిని సంప్రదించండి.",
                "en": "Health Advisory: For fever or health symptoms, ensure adequate rest, stay hydrated with fluids and ORS. If symptoms persist for more than 48 hours, please consult a medical professional immediately."
            }
            answer_text = default_fallbacks.get(language, default_fallbacks["en"])

    sources = list(dict.fromkeys(meta.get("source", "health knowledge base") for meta in filtered_metadata)) if filtered_metadata else ["health_knowledge_base"]

    return {
        "answer": answer_text,
        "sources": sources,
        "distances": filtered_distances
    }