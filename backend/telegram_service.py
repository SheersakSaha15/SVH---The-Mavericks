import asyncio
import logging
import re
import httpx

try:
    from backend.config import settings
    from backend.models import ChatRequest
    from backend.ai_service import ai_service
except ImportError:
    from config import settings
    from models import ChatRequest
    from ai_service import ai_service

logger = logging.getLogger("healthbridge-telegram")

def get_localized_inline_keyboard(lang: str = "en") -> dict:
    if lang == "hi":
        return {
            "inline_keyboard": [
                [{"text": "💉 जन्म के समय के टीके ➔", "callback_data": "जन्म के समय कौन से टीके दिए जाते हैं?"}],
                [{"text": "🦟 डेंगू के लक्षण और देखभाल ➔", "callback_data": "डेंगू बुखार के क्या लक्षण हैं?"}],
                [{"text": "🏥 नजदीकी अस्पताल खोजें ➔", "callback_data": "नजदीकी अस्पताल और स्वास्थ्य केंद्र खोजें"}],
                [{"text": "💧 ओआरएस (ORS) का उपयोग ➔", "callback_data": "ओआरएस का उपयोग कैसे करें?"}]
            ]
        }
    elif lang == "or":
        return {
            "inline_keyboard": [
                [{"text": "💉 ଜନ୍ମ ସମୟର ଟିକା ➔", "callback_data": "ଜନ୍ମ ସମୟରେ କେଉଁ ଟିକା ଦିଆଯାଏ?"}],
                [{"text": "🦟 ଡେଙ୍ଗୁର ଲକ୍ଷଣ ➔", "callback_data": "ଡେଙ୍ଗୁ ଜ୍ୱରର ଲକ୍ଷଣ କ'ଣ?"}],
                [{"text": "🏥 ନିକଟସ୍ଥ ହସ୍ପିଟାଲ୍ ➔", "callback_data": "ନିକଟସ୍ଥ ହସ୍ପିଟାଲ୍ ସନ୍ଧାନ କରନ୍ତୁ"}],
                [{"text": "💧 ORS ର ବ୍ୟବହାର ➔", "callback_data": "ORS ର ବ୍ୟବହାର କିପରି କରିବେ?"}]
            ]
        }
    elif lang == "bn":
        return {
            "inline_keyboard": [
                [{"text": "💉 জন্মের সময় টিকা ➔", "callback_data": "জন্মের সময় কোন কোন টিকা দেওয়া হয়?"}],
                [{"text": "🦟 ডেঙ্গুর লক্ষণ ➔", "callback_data": "ডেঙ্গু জ্বরের লক্ষণগুলি কী কী?"}],
                [{"text": "🏥 কাছাকাছি হাসপাতাল ➔", "callback_data": "কাছাকাছি হাসপাতাল সন্ধান করুন"}],
                [{"text": "💧 ওআরএস ব্যবহার ➔", "callback_data": "ওআরএস কীভাবে ব্যবহার করবেন?"}]
            ]
        }
    elif lang == "te":
        return {
            "inline_keyboard": [
                [{"text": "💉 పుట్టినప్పటి టీకాలు ➔", "callback_data": "పుట్టినప్పుడు ఏ వ్యాక్సిన్లు ఇస్తారు?"}],
                [{"text": "🦟 డెంగ్యూ లక్షణాలు ➔", "callback_data": "డెంగ్యూ జ్వరం లక్షణాలు ఏమిటి?"}],
                [{"text": "🏥 సమీప ఆసుపత్రులు ➔", "callback_data": "సమీపంలోని ఆసుపత్రులను కనుగొనండి"}],
                [{"text": "💧 ORS వినియోగం ➔", "callback_data": "ORS వినియోగం ఎలా చేయాలి?"}]
            ]
        }
    return {
        "inline_keyboard": [
            [{"text": "💉 Vaccines at birth ➔", "callback_data": "What vaccines are given at birth?"}],
            [{"text": "🦟 Dengue symptoms & care ➔", "callback_data": "What are the symptoms of dengue fever?"}],
            [{"text": "🏥 Find nearby hospitals ➔", "callback_data": "Find nearby hospitals in Bhubaneswar"}],
            [{"text": "💧 ORS dehydration care ➔", "callback_data": "Tell me about ORS and its use"}]
        ]
    }

def get_localized_advisory(lang: str = "en") -> str:
    if lang == "hi":
        return "🚨 *सलाह*: यदि स्थिति गंभीर हो जाए, तो तुरंत एम्बुलेंस सेवा के लिए **108** पर कॉल करें।"
    elif lang == "or":
        return "🚨 *ପରାମର୍ଶ*: ଯଦି ସ୍ୱାସ୍ଥ୍ୟାବସ୍ଥା ଗୁରୁତର ହୁଏ, ତୁରନ୍ତ ଆମ୍ବୁଲାନ୍ସ ସେବା ପାଇଁ **108** ରେ କଲ୍ କରନ୍ତୁ।"
    elif lang == "bn":
        return "🚨 *পরামর্শ*: শারীরিক অবস্থা আশঙ্কাজনক হলে অবিলম্বে অ্যাম্বুলেন্স পরিষেবার জন্য **১০৮** নম্বরে কল করুন।"
    elif lang == "te":
        return "🚨 *సలహా*: పరిస్థితి తీవ్రంగా మారితే, వెంటనే అంబులెన్స్ సేవల కోసం **108** కి కాల్ చేయండి।"
    return "🚨 *Advisory*: If conditions get severe, please call **108** for ambulance services immediately."

class TelegramBotManager:
    def __init__(self):
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.api_url = f"https://api.telegram.org/bot{self.token}"
        self.offset = 0
        self.is_running = False

    async def start_polling(self):
        if not self.token:
            logger.warning("Telegram Bot token not found. Polling disabled.")
            return

        self.is_running = True
        logger.info(f"Starting Telegram Bot polling loop for token: {self.token[:10]}...")

        async with httpx.AsyncClient(timeout=30.0) as client:
            while self.is_running:
                try:
                    res = await client.get(f"{self.api_url}/getUpdates", params={"offset": self.offset, "timeout": 20})
                    if res.status_code == 200:
                        data = res.json()
                        if data.get("ok"):
                            for update in data.get("result", []):
                                self.offset = update["update_id"] + 1
                                
                                callback_query = update.get("callback_query")
                                if callback_query:
                                    asyncio.create_task(self.handle_callback_query(client, callback_query))
                                    continue

                                message = update.get("message")
                                if message and "text" in message:
                                    asyncio.create_task(self.handle_message(client, message))
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Error in Telegram polling loop: {e}")
                    await asyncio.sleep(3)

    async def handle_callback_query(self, client: httpx.AsyncClient, callback_query: dict):
        callback_id = callback_query["id"]
        chat_id = callback_query["message"]["chat"]["id"]
        question_text = callback_query.get("data", "").strip()
        first_name = callback_query.get("from", {}).get("first_name", "User")

        logger.info(f"[Telegram Button Click] {first_name} (chat_id: {chat_id}): '{question_text}'")

        try:
            await client.post(f"{self.api_url}/answerCallbackQuery", json={"callback_query_id": callback_id})
        except Exception:
            pass

        lang = "en"
        if re.search(r'[\u0900-\u097F]', question_text):
            lang = "hi"
        elif re.search(r'[\u0B00-\u0B7F]', question_text):
            lang = "or"
        elif re.search(r'[\u0980-\u09FF]', question_text):
            lang = "bn"
        elif re.search(r'[\u0C00-\u0C7F]', question_text):
            lang = "te"

        await self.process_and_reply(client, chat_id, question_text, lang=lang)

    async def handle_message(self, client: httpx.AsyncClient, message: dict):
        chat_id = message["chat"]["id"]
        text = message.get("text", "").strip()
        first_name = message.get("from", {}).get("first_name", "User")
        
        logger.info(f"[Telegram] Received message from {first_name} (chat_id: {chat_id}): '{text}'")

        # Detect language script for greetings & request routing
        if re.search(r'[\u0900-\u097F]', text):
            lang = "hi"
        elif re.search(r'[\u0B00-\u0B7F]', text):
            lang = "or"
        elif re.search(r'[\u0980-\u09FF]', text):
            lang = "bn"
        elif re.search(r'[\u0C00-\u0C7F]', text):
            lang = "te"
        else:
            lang = "en"

        if text.startswith("/start"):
            welcome_msg = (
                f"🏥 *Welcome to HealthBridge AI*\n\n"
                f"Namaste {first_name}! 🙏 I am your AI Health & Wellness Assistant.\n"
                f"You can ask me health questions in any language (English, Hindi, Odia, Bengali, Telugu).\n\n"
                f"👇 *Click any question below to ask instantly*:"
            )
            await self.send_telegram_message(client, chat_id, welcome_msg, reply_markup=get_localized_inline_keyboard(lang))
            return

        await self.process_and_reply(client, chat_id, text, lang=lang)

    async def process_and_reply(self, client: httpx.AsyncClient, chat_id: int, text: str, lang: str = "auto"):
        if lang == "auto":
            if re.search(r'[\u0900-\u097F]', text):
                lang = "hi"
            elif re.search(r'[\u0B00-\u0B7F]', text):
                lang = "or"
            elif re.search(r'[\u0980-\u09FF]', text):
                lang = "bn"
            elif re.search(r'[\u0C00-\u0C7F]', text):
                lang = "te"
            else:
                lang = "en"

        chat_req = ChatRequest(
            session_id=f"tg_{chat_id}",
            channel="telegram",
            user_id=str(chat_id),
            message=text or "Namaste",
            language=lang
        )

        try:
            chat_res = await ai_service.chat(chat_req)
            clean_text = chat_res.message
            # If Gemini returned an empty message (model output error), fall back to a generic response
            if not clean_text:
                logger.warning(f"Empty response from AI service for chat_id {chat_id}, falling back to default answer.")
                clean_text = "I couldn't find an answer right now. Please try rephrasing your question or ask in English."
            advisory = get_localized_advisory(chat_res.language)

            formatted_reply = (
                f"🏥 *HealthBridge AI Advisory*\n\n"
                f"{clean_text}\n\n"
                f"{advisory}\n"
                f"_Disclaimer: For public health awareness. Consult a doctor for medical emergencies._"
            )

            # Attach localized interactive buttons matching detected language
            reply_markup = get_localized_inline_keyboard(chat_res.language)
            await self.send_telegram_message(client, chat_id, formatted_reply, reply_markup=reply_markup)
        except Exception as e:
            # Log error safely without Unicode encoding issues
            try:
                sys.stderr.buffer.write(f"Error handling Telegram message from chat_id {chat_id}: {e}\n".encode('utf-8'))
            except Exception:
                pass
            # Send a plain fallback message so the user gets a response
            try:
                await self.send_telegram_message(
                    client,
                    chat_id,
                    "Sorry, I could not process your request right now. Please try again in a moment."
                )
            except Exception:
                pass

    async def send_telegram_message(self, client: httpx.AsyncClient, chat_id: int, text: str, reply_markup: dict = None):
        url = f"{self.api_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown"
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup

        try:
            res = await client.post(url, json=payload)
            if res.status_code != 200:
                logger.warning(f"Telegram Markdown send returned status {res.status_code}: {res.text}. Retrying without parse_mode.")
                payload.pop("parse_mode", None)
                res2 = await client.post(url, json=payload)
                if res2.status_code != 200:
                    logger.error(f"Telegram plain text send failed with status {res2.status_code}: {res2.text}")
        except Exception as e:
            logger.error(f"Failed to send Telegram message to chat_id {chat_id}: {e}")

telegram_manager = TelegramBotManager()
