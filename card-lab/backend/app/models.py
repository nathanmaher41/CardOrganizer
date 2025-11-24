from sqlmodel import Field, SQLModel, JSON, Column, Relationship
from typing import Optional, List
from datetime import datetime


class Pantheon(SQLModel, table=True):
    __tablename__ = "pantheons"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = None


class Archetype(SQLModel, table=True):
    __tablename__ = "archetypes"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = None


class AbilityTiming(SQLModel, table=True):
    __tablename__ = "ability_timings"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)


class PassiveDefinition(SQLModel, table=True):
    __tablename__ = "passive_definitions"
    id: Optional[int] = Field(default=None, primary_key=True)
    group_name: Optional[str] = Field(default=None, index=True)
    name: str = Field(index=True)
    text: str
    pantheon: Optional[str] = Field(default=None, index=True)
    archetype: Optional[str] = Field(default=None, index=True)
    
    # Versioning fields
    is_current: bool = Field(default=True, index=True)
    version: int = Field(default=1)
    parent_passive_id: Optional[int] = Field(default=None, foreign_key="passive_definitions.id", index=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to get all versions
    versions: List["PassiveDefinition"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={"foreign_keys": "[PassiveDefinition.parent_passive_id]"}
    )
    parent: Optional["PassiveDefinition"] = Relationship(
        back_populates="versions",
        sa_relationship_kwargs={"foreign_keys": "[PassiveDefinition.parent_passive_id]", "remote_side": "[PassiveDefinition.id]"}
    )


class Card(SQLModel, table=True):
    __tablename__ = "cards"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    cost: int = Field(default=1)
    fi: int = Field(default=1)
    hp: int = Field(default=1)
    godDmg: int = Field(default=1, sa_column_kwargs={"name": "god_dmg"})
    creatureDmg: int = Field(default=1, sa_column_kwargs={"name": "creature_dmg"})
    statTotal: int = Field(default=4, sa_column_kwargs={"name": "stat_total"})
    type: str = Field(default="God", index=True)
    pantheon: Optional[str] = Field(default=None, index=True)
    archetype: Optional[str] = Field(default=None, index=True)
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    abilities: List[dict] = Field(default=[], sa_column=Column(JSON))
    passives: List[dict] = Field(default=[], sa_column=Column(JSON))
    
    # Versioning fields
    is_current: bool = Field(default=True, index=True)
    version: int = Field(default=1)
    parent_card_id: Optional[int] = Field(default=None, foreign_key="cards.id", index=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to get all versions
    versions: List["Card"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={"foreign_keys": "[Card.parent_card_id]"}
    )
    parent: Optional["Card"] = Relationship(
        back_populates="versions",
        sa_relationship_kwargs={"foreign_keys": "[Card.parent_card_id]", "remote_side": "[Card.id]"}
    )


# ===============
# Pydantic models
# ===============

class PantheonCreate(SQLModel):
    name: str
    description: Optional[str] = None


class PantheonRead(PantheonCreate):
    id: int


class ArchetypeCreate(SQLModel):
    name: str
    description: Optional[str] = None


class ArchetypeRead(ArchetypeCreate):
    id: int


class AbilityTimingCreate(SQLModel):
    name: str


class AbilityTimingRead(AbilityTimingCreate):
    id: int


class PassiveDefinitionCreate(SQLModel):
    group_name: Optional[str] = None
    name: str
    text: str
    pantheon: Optional[str] = None
    archetype: Optional[str] = None


class PassiveDefinitionRead(PassiveDefinitionCreate):
    id: int
    is_current: bool
    version: int
    parent_passive_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class CardCreate(SQLModel):
    name: str
    cost: int = 1
    fi: int = 1
    hp: int = 1
    godDmg: int = 1
    creatureDmg: int = 1
    statTotal: int = 4
    type: str = "God"
    pantheon: Optional[str] = None
    archetype: Optional[str] = None
    tags: List[str] = []
    abilities: List[dict] = []
    passives: List[dict] = []


class CardRead(CardCreate):
    id: int
    is_current: bool
    version: int
    parent_card_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

class Tag(SQLModel, table=True):
    __tablename__ = "tags"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TagRead(SQLModel):
    id: int
    name: str
    created_at: datetime