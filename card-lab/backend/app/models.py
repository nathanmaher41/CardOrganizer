# app/models.py
from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlmodel import SQLModel, Field
from sqlalchemy import Column
from sqlalchemy.dialects.sqlite import JSON


# ---------- Card + versions ----------

class CardBase(SQLModel):
    name: str

    cost: int
    fi: int
    hp: int
    godDmg: int
    creatureDmg: int
    statTotal: int

    type: str  # e.g. "God", "Creature", "Spell", etc.
    pantheon: Optional[str] = None  # e.g. "Greek", "Norse"
    archetype: Optional[str] = None  # e.g. "Sea", "Sky", "Underworld"

    # JSON fields for now – easy & flexible for v1
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    abilities: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    passives: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))


class Card(CardBase, table=True):
    """
    Main Card table.
    """
    id: Optional[int] = Field(default=None, primary_key=True)


class CardCreate(CardBase):
    """
    Request body for creating/updating a card.
    """
    pass


class CardRead(CardBase):
    """
    Response model for returning cards.
    """
    id: int


class CardVersionBase(SQLModel):
    """
    Snapshot of a card at a given version.
    """
    card_id: int = Field(foreign_key="card.id")
    version: int

    data: Dict[str, Any] = Field(sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CardVersion(CardVersionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class CardVersionRead(CardVersionBase):
    id: int


# ---------- Pantheons ----------

class PantheonBase(SQLModel):
    name: str
    description: Optional[str] = None


class Pantheon(PantheonBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class PantheonCreate(PantheonBase):
    pass


class PantheonRead(PantheonBase):
    id: int


# ---------- Archetypes ----------

class ArchetypeBase(SQLModel):
    name: str
    description: Optional[str] = None


class Archetype(ArchetypeBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class ArchetypeCreate(ArchetypeBase):
    pass


class ArchetypeRead(ArchetypeBase):
    id: int


# ---------- Passive definitions ----------

class PassiveDefinitionBase(SQLModel):
    group_name: str           # e.g. "Norse passive", "Underworld passive"
    name: str                # e.g. "Rage after Death"
    text: str
    pantheon: Optional[str] = None     # tie to Norse, Greek, etc.
    archetype: Optional[str] = None    # tie to Underworld, Sea, etc.


class PassiveDefinition(PassiveDefinitionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class PassiveDefinitionCreate(PassiveDefinitionBase):
    pass


class PassiveDefinitionRead(PassiveDefinitionBase):
    id: int


class AbilityTimingBase(SQLModel):
    name: str


class AbilityTiming(AbilityTimingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class AbilityTimingCreate(AbilityTimingBase):
    pass


class AbilityTimingRead(AbilityTimingBase):
    id: int