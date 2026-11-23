import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI

# Load single master .env from Main Code root
root_env = Path(__file__).parent.parent.parent.parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=True)
else:
    load_dotenv(override=True)

from .schemas import ChatRequest, ChatResponse
from .orchestrator import process_message



app = FastAPI(
    title="HealthBridge AI"
)


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }


@app.post(
    "/api/chat",
    response_model=ChatResponse
)
def chat(request: ChatRequest):

    result = process_message(
        request.message
    )

    return ChatResponse(**result)