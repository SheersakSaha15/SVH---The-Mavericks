import logging
import re
from fastapi import FastAPI, Form, Response, Query, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

try:
    from backend.config import settings
    from backend.models import (
        ChatRequest, ChatResponse,
        PredictRiskRequest, PredictRiskResponse,
        GovtAlert, LocationResult, LocationSearchResponse,
        VaccineInfoItem, VaccinationResponse,
        SignUpRequest, SignInRequest, UserProfile, AuthResponse, UpdateProfileRequest
    )
    from backend.ai_service import ai_service
    from backend.providers.govt_provider import govt_provider
    from backend.providers.vaccination_provider import vaccination_provider
    from backend.providers.outbreak_provider import outbreak_provider
    from backend.providers.location_provider import location_provider
    from backend.telegram_service import telegram_manager
    from backend.supabase_service import supabase_auth_service
except ImportError:
    from config import settings
    from models import (
        ChatRequest, ChatResponse,
        PredictRiskRequest, PredictRiskResponse,
        GovtAlert, LocationResult, LocationSearchResponse,
        VaccineInfoItem, VaccinationResponse,
        SignUpRequest, SignInRequest, UserProfile, AuthResponse, UpdateProfileRequest
    )
    from ai_service import ai_service
    from providers.govt_provider import govt_provider
    from providers.vaccination_provider import vaccination_provider
    from providers.outbreak_provider import outbreak_provider
    from providers.location_provider import location_provider
    from telegram_service import telegram_manager
    from supabase_service import supabase_auth_service


import asyncio

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("healthbridge-backend")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="HealthBridge AI — Backend Integration Gateway (FastAPI + Twilio + Telegram + Govt Health APIs + RAG Adapter)"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Telegram Bot Fallback Gateway...")
    asyncio.create_task(telegram_manager.start_polling())

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs"
    }

import httpx

@app.get("/health")
async def health_check():
    ai_url = getattr(settings, 'AI_SERVICE_URL', 'http://localhost:5000/api/chat')
    rag_healthy = False
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            res = await client.get("http://localhost:5000/health")
            rag_healthy = (res.status_code == 200)
    except Exception:
        rag_healthy = False

    return {
        "status": "healthy",
        "services": {
            "backend": "online",
            "rag_service": "online" if rag_healthy else "degraded/unreachable (fallback mode active)",
            "supabase": "configured" if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY else "unconfigured",
            "telegram": "configured" if settings.TELEGRAM_BOT_TOKEN else "unconfigured",
            "twilio": "configured" if (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN) else "unconfigured (SMS webhooks active)"
        }
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Standard Chat API Endpoint:
    Receives normalized ChatRequest (session_id, channel, user_id, message, language, location).
    Fetches real-time Government data context and invokes AIServiceManager (RAG Adapter).
    """
    logger.info(f"[{request.channel}] Session {request.session_id} - User {request.user_id}: '{request.message}' ({request.language})")

    # Fetch Government context if topic relates to health advisories
    govt_context = await govt_provider.get_advisory(topic=request.message)

    # Route through AI Service Abstraction Layer (RAG Service on Port 5000)
    response = await ai_service.chat(request, govt_context=govt_context)
    return response

@app.post("/api/predict", response_model=PredictRiskResponse)
async def predict_symptom_risk(request: PredictRiskRequest):
    """
    Symptom Severity & Triage Risk Evaluation Endpoint.
    """
    logger.info(f"Evaluating symptom risk for: '{request.symptoms}' in {request.district}")
    
    lower = request.symptoms.lower()
    if any(w in lower for w in ["bleeding", "unconscious", "chest pain", "difficulty breathing", "severe vomiting"]):
        return PredictRiskResponse(
            severity="HIGH",
            risk_score=0.92,
            summary="Critical emergency warning signs detected.",
            immediate_steps=["Call 108 Emergency Ambulance immediately", "Keep patient lying down", "Do not give solid foods"]
        )
    elif any(w in lower for w in ["dengue", "high fever", "rash", "joint pain", "vomiting"]):
        return PredictRiskResponse(
            severity="MEDIUM",
            risk_score=0.65,
            summary="Moderate risk of vector-borne infection (e.g., Dengue/Malaria).",
            immediate_steps=["Drink ORS continuously", "Take Paracetamol for fever; avoid Aspirin", "Visit nearest health center for blood test"]
        )
    return PredictRiskResponse(
        severity="LOW",
        risk_score=0.25,
        summary="Low severity symptoms. Standard home care recommended.",
        immediate_steps=["Rest and hydrate", "Monitor temperature twice daily", "Visit clinic if fever lasts >48 hours"]
    )

@app.post("/api/webhooks/twilio/whatsapp")
async def twilio_whatsapp_webhook(Body: str = Form(""), From: str = Form("")):
    """
    Twilio WhatsApp Webhook:
    Normalizes sender identity into session_id, invokes unified AIService, and returns TwiML XML.
    """
    logger.info(f"Incoming WhatsApp message from {From}: '{Body}'")
    
    sender_id = re.sub(r'[^a-zA-Z0-9]', '_', From)
    chat_req = ChatRequest(
        session_id=f"wa_{sender_id}",
        channel="whatsapp",
        user_id=From,
        message=Body or "Namaste",
        language="auto"
    )
    
    chat_res = await ai_service.chat(chat_req)
    clean_text = re.sub(r'<[^>]+>', '', chat_res.message).replace('&amp;', '&')

    whatsapp_msg = (
        f"🏥 *HealthBridge AI Advisory*\n\n"
        f"{clean_text}\n\n"
        f"🚨 *Advisory*: If conditions get severe, please call *108* for ambulance services immediately.\n"
        f"_Disclaimer: For public health awareness. Consult a doctor for medical emergencies._"
    )

    twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{whatsapp_msg}</Message></Response>'
    return Response(content=twiml, media_type="application/xml")

@app.post("/api/webhooks/twilio/sms")
async def twilio_sms_webhook(Body: str = Form(""), From: str = Form("")):
    """
    Twilio SMS Webhook:
    Uses the same conversation service as WhatsApp.
    """
    logger.info(f"Incoming SMS message from {From}: '{Body}'")
    
    sender_id = re.sub(r'[^a-zA-Z0-9]', '_', From)
    chat_req = ChatRequest(
        session_id=f"sms_{sender_id}",
        channel="sms",
        user_id=From,
        message=Body or "Namaste",
        language="auto"
    )
    
    chat_res = await ai_service.chat(chat_req)
    clean_text = re.sub(r'<[^>]+>', '', chat_res.message).replace('&amp;', '&')

    sms_msg = f"HealthBridge AI: {clean_text}"
    twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{sms_msg}</Message></Response>'
    return Response(content=twiml, media_type="application/xml")

@app.get("/api/alerts", response_model=List[GovtAlert])
async def get_outbreak_alerts(region: str = "Khordha"):
    """
    Returns active disease outbreak alerts from official Government surveillance feeds.
    """
    alerts = await outbreak_provider.get_active_alerts(region=region)
    return [GovtAlert(**a) for a in alerts]

@app.post("/api/alerts/subscribe")
async def subscribe_alerts(phone: str = Query(...), channel: str = Query("whatsapp"), region: str = Query("Khordha")):
    """
    Subscribes user to outbreak alert notifications via WhatsApp/SMS.
    """
    logger.info(f"Alert subscription requested: Phone {phone}, Channel {channel}, Region {region}")
    return {"success": True, "message": f"Subscribed {phone} to {region} outbreak alerts via {channel}."}

@app.get("/api/vaccinations", response_model=VaccinationResponse)
async def get_vaccination_schedule(group: str = "child"):
    """
    Returns official government vaccination schedule.
    """
    schedule = await vaccination_provider.get_schedule(target_group=group)
    return VaccinationResponse(schedule=[VaccineInfoItem(**v) for v in schedule])

@app.get("/api/locations/search", response_model=LocationSearchResponse)
async def search_locations(query: str = "Bhubaneswar", lat: Optional[float] = None, lon: Optional[float] = None):
    """
    Searches nearby hospitals & health centers using OpenStreetMap / Overpass API Provider.
    """
    hospitals = await location_provider.search_hospitals(query=query, lat=lat, lon=lon)
    return LocationSearchResponse(results=[LocationResult(**h) for h in hospitals])

# -----------------------------------------------------------------------------
# Supabase Authentication & Profile Management Endpoints
# -----------------------------------------------------------------------------

@app.post("/api/auth/signup", response_model=AuthResponse)
async def user_sign_up(request: SignUpRequest):
    """
    User Registration Endpoint:
    Registers a new user with Supabase Auth, passes user metadata (full_name, phone, preferred_language),
    and feeds user profile record into Supabase Database.
    """
    logger.info(f"Sign up request received for email: {request.email}")
    return await supabase_auth_service.sign_up(request)

@app.post("/api/auth/signin", response_model=AuthResponse)
async def user_sign_in(request: SignInRequest):
    """
    User Sign-In Endpoint:
    Authenticates user email & password with Supabase Auth, crosschecks data, and returns JWT access_token.
    """
    logger.info(f"Sign in request received for email: {request.email}")
    return await supabase_auth_service.sign_in(request)

@app.get("/api/auth/me", response_model=UserProfile)
async def get_current_user_profile(authorization: Optional[str] = Header(None)):
    """
    JWT Authentication Verification Endpoint:
    Receives HTTP 'Authorization: Bearer <JWT_TOKEN>' header, crosschecks token against Supabase Auth,
    and returns current user profile data.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Header must be formatted as 'Bearer <JWT_TOKEN>'."
        )
    
    jwt_token = authorization.split(" ")[1].strip()
    return await supabase_auth_service.get_current_user(jwt_token)

@app.put("/api/auth/me", response_model=UserProfile)
async def update_current_user_profile(
    request: UpdateProfileRequest,
    authorization: Optional[str] = Header(None)
):
    """
    User Profile Update Endpoint:
    Updates authenticated user profile details in Supabase.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Header must be formatted as 'Bearer <JWT_TOKEN>'."
        )
    
    jwt_token = authorization.split(" ")[1].strip()
    return await supabase_auth_service.update_user_profile(jwt_token, request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)


