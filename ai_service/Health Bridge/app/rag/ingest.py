import os
from pathlib import Path

import chromadb
from dotenv import load_dotenv
from google import genai


load_dotenv()
if not os.getenv("GEMINI_API_KEY"):
    for parent in Path(__file__).resolve().parents:
        env_file = parent / ".env"
        if env_file.exists():
            load_dotenv(dotenv_path=env_file)
            break


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

KNOWLEDGE_DIR = BASE_DIR / "knowledge"

VECTOR_STORE_DIR = BASE_DIR / "vector_store" / "chroma_db"


# --------------------------------------------------
# Gemini
# --------------------------------------------------

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# --------------------------------------------------
# ChromaDB
# --------------------------------------------------

chroma_client = chromadb.PersistentClient(
    path=str(VECTOR_STORE_DIR)
)


collection = chroma_client.get_or_create_collection(
    name="healthbridge_knowledge"
)


# --------------------------------------------------
# Read knowledge files
# --------------------------------------------------

documents = []
metadatas = []
ids = []


for file_path in KNOWLEDGE_DIR.glob("*.txt"):

    text = file_path.read_text(
        encoding="utf-8"
    )

    if not text.strip():
        continue

    documents.append(text)

    metadatas.append({
        "source": file_path.name
    })

    ids.append(
        file_path.stem
    )


# --------------------------------------------------
# Create embeddings
# --------------------------------------------------

if not documents:

    print("No knowledge documents found.")

    raise SystemExit


embedding_result = client.models.embed_content(
    model="gemini-embedding-001",
    contents=documents
)


embeddings = [
    embedding.values
    for embedding in embedding_result.embeddings
]


# --------------------------------------------------
# Store in ChromaDB
# --------------------------------------------------

collection.upsert(
    ids=ids,
    documents=documents,
    metadatas=metadatas,
    embeddings=embeddings
)


print("RAG knowledge base created successfully.")

print(
    "Documents stored:",
    collection.count()
)

print(
    "Database location:",
    VECTOR_STORE_DIR
)