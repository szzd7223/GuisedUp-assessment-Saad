"""Replace deterministic_embedding with an OpenAI or sentence-transformer adapter in production."""
import os
import json
import urllib.request
import urllib.error
import hashlib
import math
import re
from fastapi import FastAPI
from pydantic import BaseModel, Field

DIMENSIONS = 64
app = FastAPI(title="Guised Up Embeddings")

class EmbedRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)

class EmbedResponse(BaseModel):
    embedding: list[float]
    dimensions: int = DIMENSIONS
    provider: str = "deterministic-demo"

def deterministic_embedding(text: str) -> list[float]:
    vector = [0.0] * DIMENSIONS
    for token in re.findall(r"[a-z0-9']+", text.lower()):
        digest = hashlib.sha256(token.encode()).digest()
        index = int.from_bytes(digest[:2], "big") % DIMENSIONS
        vector[index] += 1.0 if digest[2] % 2 else -1.0
    magnitude = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [round(value / magnitude, 8) for value in vector]

def gemini_embedding(text: str, api_key: str) -> list[float] | None:
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {
                "parts": [{"text": text}]
            },
            "outputDimensionality": DIMENSIONS
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            values = res_data.get("embedding", {}).get("values", [])
            if isinstance(values, list) and len(values) == DIMENSIONS:
                return values
    except Exception as e:
        print(f"Gemini API request failed: {e}")
    return None

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/embed", response_model=EmbedResponse)
def embed(payload: EmbedRequest) -> EmbedResponse:
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        values = gemini_embedding(payload.text, api_key)
        if values is not None:
            return EmbedResponse(embedding=values, provider="gemini-api")
            
    return EmbedResponse(embedding=deterministic_embedding(payload.text), provider="deterministic-demo")
