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


# NEW: Keyword Abilities (like MTG keywords)
class KeywordAbility(SQLModel, table=True):
    __tablename__ = "keyword_abilities"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    text: str
    
    # Versioning fields
    is_current: bool = Field(default=True, index=True)
    version: int = Field(default=1)
    parent_ability_id: Optional[int] = Field(default=None, foreign_key="keyword_abilities.id", index=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to get all versions
    versions: List["KeywordAbility"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={"foreign_keys": "[KeywordAbility.parent_ability_id]"}
    )
    parent: Optional["KeywordAbility"] = Relationship(
        back_populates="versions",
        sa_relationship_kwargs={"foreign_keys": "[KeywordAbility.parent_ability_id]", "remote_side": "[KeywordAbility.id]"}
    )


class Card(SQLModel, table=True):
    __tablename__ = "cards"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    cost: int = Field(default=1)
    
    # God-specific stats (optional for other card types)
    fi: Optional[int] = Field(default=None)
    hp: Optional[int] = Field(default=None)
    godDmg: Optional[int] = Field(default=None, sa_column_kwargs={"name": "god_dmg"})
    creatureDmg: Optional[int] = Field(default=None, sa_column_kwargs={"name": "creature_dmg"})
    
    # Creature/Weapon stats (single damage value)
    dmg: Optional[int] = Field(default=None)
    
    # Spell-specific
    speed: Optional[str] = Field(default=None)
    
    statTotal: Optional[int] = Field(default=None, sa_column_kwargs={"name": "stat_total"})
    type: str = Field(default="God", index=True)  # God, Creature, Weapon, Enchanted Item, Spell
    pantheon: Optional[str] = Field(default=None, index=True)
    archetype: Optional[str] = Field(default=None, index=True)
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    
    # God abilities (unique to gods)
    abilities: List[dict] = Field(default=[], sa_column=Column(JSON))
    
    # God passives
    passives: List[dict] = Field(default=[], sa_column=Column(JSON))
    
    # Card text (freeform, unique to this card)
    cardText: Optional[str] = Field(default=None, sa_column_kwargs={"name": "card_text"})
    
    # Keyword abilities (creatures/weapons - references to KeywordAbility)
    cardAbilities: List[dict] = Field(default=[], sa_column=Column(JSON, name="card_abilities"))
    
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


class Tag(SQLModel, table=True):
    __tablename__ = "tags"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


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


class KeywordAbilityCreate(SQLModel):
    name: str
    text: str


class KeywordAbilityRead(KeywordAbilityCreate):
    id: int
    is_current: bool
    version: int
    parent_ability_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class CardCreate(SQLModel):
    name: str
    cost: int = 1
    fi: Optional[int] = None
    hp: Optional[int] = None
    godDmg: Optional[int] = None
    creatureDmg: Optional[int] = None
    dmg: Optional[int] = None
    speed: Optional[str] = None
    statTotal: Optional[int] = None
    type: str = "God"
    pantheon: Optional[str] = None
    archetype: Optional[str] = None
    tags: List[str] = []
    abilities: List[dict] = []
    passives: List[dict] = []
    cardText: Optional[str] = None
    cardAbilities: List[dict] = []


class CardRead(CardCreate):
    id: int
    is_current: bool
    version: int
    parent_card_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class TagRead(SQLModel):
    id: int
    name: str
    created_at: datetime