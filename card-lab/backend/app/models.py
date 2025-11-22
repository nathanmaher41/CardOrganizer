# app/models.py
from typing import Optional

from sqlmodel import SQLModel, Field


class CardBase(SQLModel):
    name: str
    cost: int
    fi: int
    hp: int
    type: str                   # e.g. "god", "creature", "spell", "enchantment"
    pantheon: Optional[str] = None  # e.g. "Greek", "Aztec"
    archetype: Optional[str] = None # e.g. "Sea", "Sky", "Sun"
    # later: ability_type, tags, text, etc.


class Card(CardBase, table=True):
    """
    This is the actual DB table.
    """
    id: Optional[int] = Field(default=None, primary_key=True)


class CardCreate(CardBase):
    """
    Request body for creating a card.
    """
    pass


class CardRead(CardBase):
    """
    Response model for returning cards to the client.
    """
    id: int
