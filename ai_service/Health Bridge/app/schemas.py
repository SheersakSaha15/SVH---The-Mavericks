from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    input_type: str = "text"


class ChatResponse(BaseModel):
    answer: str
    language: str
    intent: str
    safety_status: str
    sources: list[str] = []