import uuid
from pydantic import BaseModel, Field
from typing import List, Optional

class LocationData(BaseModel):
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    name: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: Optional[str] = Field(default_factory=lambda: f"session_{uuid.uuid4().hex[:8]}")
    channel: Optional[str] = Field(default="web", example="web")  # web, whatsapp, sms
    user_id: Optional[str] = Field(default="user_default", example="user_default")
    message: str = Field(..., example="What are the symptoms of malaria?")
    language: Optional[str] = Field(default="auto", example="auto")  # auto, en, hi, or, bn, te
    location: Optional[LocationData] = None

class SourceItem(BaseModel):
    source: str = Field(..., example="malaria.txt")
    chunk_id: Optional[str] = Field(default=None, example="malaria.txt_0")

class SafetyMeta(BaseModel):
    level: str = Field(default="normal", example="normal")  # normal, high
    requires_human_attention: bool = Field(default=False, example=False)

class ChatResponse(BaseModel):
    success: bool = Field(default=True, example=True)
    session_id: str
    message: str
    language: str = Field(default="en", example="en")
    intent: str = Field(default="health_information", example="health_information")
    sources: List[SourceItem] = Field(default_factory=list)
    safety: SafetyMeta = Field(default_factory=SafetyMeta)

class PredictRiskRequest(BaseModel):
    symptoms: str = Field(..., example="High fever, joint pain, rash")
    district: Optional[str] = Field(default="Bhubaneswar", example="Bhubaneswar")
    duration_days: Optional[int] = Field(default=2, example=2)

class PredictRiskResponse(BaseModel):
    severity: str = Field(..., example="HIGH")
    risk_score: float = Field(..., example=0.85)
    summary: str
    immediate_steps: List[str]

class GovtAlert(BaseModel):
    id: str
    disease: str
    region: str
    severity: str
    message: str
    source: str
    updated_at: str

class LocationResult(BaseModel):
    name: str
    latitude: float
    longitude: float
    address: str
    distance_km: Optional[float] = None
    phone: Optional[str] = None

class LocationSearchResponse(BaseModel):
    results: List[LocationResult]

class VaccineInfoItem(BaseModel):
    name: str
    dose: str
    target_age: str
    due_days: Optional[int] = None
    description: str

class VaccinationResponse(BaseModel):
    schedule: List[VaccineInfoItem]

class SignUpRequest(BaseModel):
    email: str = Field(..., example="user@example.com")
    password: str = Field(..., example="SecurePass123!")
    full_name: Optional[str] = Field(default=None, example="John Doe")
    phone: Optional[str] = Field(default=None, example="+919876543210")
    preferred_language: Optional[str] = Field(default="en", example="en")

class SignInRequest(BaseModel):
    email: str = Field(..., example="user@example.com")
    password: str = Field(..., example="SecurePass123!")

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = "en"
    created_at: Optional[str] = None

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool = Field(default=True)
    message: str
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    expires_in: Optional[int] = None
    refresh_token: Optional[str] = None
    user: Optional[UserProfile] = None
