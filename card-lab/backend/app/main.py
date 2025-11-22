from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(
    title="Card Lab API",
    version="0.1.0",
    description="Backend for your custom card game lab.",
)

# Allow Vite dev server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Models (Pydantic) -----

class Card(BaseModel):
    id: int
    name: str
    cost: int
    fi: int
    hp: int
    type: str  # god, creature, spell, enchantment
    pantheon: str | None = None
    archetype: str | None = None
    # later: abilities, tags, text, etc.

class CardCreate(BaseModel):
    name: str
    cost: int
    fi: int
    hp: int
    type: str
    pantheon: str | None = None
    archetype: str | None = None


# ----- In-memory "DB" for now -----

_cards: list[Card] = []
_next_id: int = 1


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}


@app.get("/cards", response_model=List[Card], tags=["cards"])
def list_cards():
    return _cards


@app.post("/cards", response_model=Card, tags=["cards"])
def create_card(card: CardCreate):
    global _next_id
    new = Card(id=_next_id, **card.dict())
    _cards.append(new)
    _next_id += 1
    return new


@app.get("/cards/{card_id}", response_model=Card, tags=["cards"])
def get_card(card_id: int):
    for c in _cards:
        if c.id == card_id:
            return c
    raise HTTPException(status_code=404, detail="Card not found")


@app.delete("/cards/{card_id}", tags=["cards"])
def delete_card(card_id: int):
    global _cards
    before = len(_cards)
    _cards = [c for c in _cards if c.id != card_id]
    if len(_cards) == before:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"ok": True}
