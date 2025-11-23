# app/main.py
from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .database import init_db, get_session
from .models import Card, CardCreate, CardRead

app = FastAPI(
    title="Card Lab API",
    version="0.1.0",
    description="Backend for your custom card game lab.",
)

# --- CORS so Vite frontend can talk to this API ---

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


# --- Startup: create tables ---

@app.on_event("startup")
def on_startup():
    init_db()


# --- Health check ---

@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}


# --- Card endpoints ---

@app.get("/cards", response_model=List[CardRead], tags=["cards"])
def list_cards(session: Session = Depends(get_session)):
    """
    Return all cards.
    """
    statement = select(Card).order_by(Card.id)
    results = session.exec(statement)
    return results.all()


@app.post("/cards", response_model=CardRead, tags=["cards"])
def create_card(card_in: CardCreate, session: Session = Depends(get_session)):
    """
    Create a new card.
    """
    card = Card.from_orm(card_in)  # copies fields
    session.add(card)
    session.commit()
    session.refresh(card)
    return card


@app.get("/cards/{card_id}", response_model=CardRead, tags=["cards"])
def get_card(card_id: int, session: Session = Depends(get_session)):
    card = session.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@app.delete("/cards/{card_id}", tags=["cards"])
def delete_card(card_id: int, session: Session = Depends(get_session)):
    card = session.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    session.delete(card)
    session.commit()
    return {"ok": True}
