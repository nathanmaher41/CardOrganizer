# app/main.py
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .database import init_db, get_session
from .models import (
    Card,
    CardCreate,
    CardRead,
    CardVersion,
    CardVersionRead,
    Pantheon,
    PantheonCreate,
    PantheonRead,
    Archetype,
    ArchetypeCreate,
    ArchetypeRead,
    PassiveDefinition,
    PassiveDefinitionCreate,
    PassiveDefinitionRead,
)

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


# =====================
# Cards
# =====================

@app.get("/cards", response_model=List[CardRead], tags=["cards"])
def list_cards(
    pantheon: Optional[str] = None,
    archetype: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    tag: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """
    Return all cards, optionally filtered by pantheon, archetype, type,
    name search, and tag.
    """
    statement = select(Card)

    if pantheon:
        statement = statement.where(Card.pantheon == pantheon)
    if archetype:
        statement = statement.where(Card.archetype == archetype)
    if type:
        statement = statement.where(Card.type == type)

    statement = statement.order_by(Card.id)
    results = session.exec(statement).all()

    # simple Python-side search/tag filtering (fine for small dataset)
    if search:
        lowered = search.lower()
        results = [
            c for c in results
            if lowered in c.name.lower()
        ]

    if tag:
        results = [
            c for c in results
            if c.tags and tag in c.tags
        ]

    return results


@app.post("/cards", response_model=CardRead, tags=["cards"])
def create_card(card_in: CardCreate, session: Session = Depends(get_session)):
    """
    Create a new card and store version 1.
    """
    card = Card.from_orm(card_in)
    session.add(card)
    session.commit()
    session.refresh(card)

    # initial version = 1
    snapshot = CardRead.from_orm(card).model_dump()
    version_row = CardVersion(card_id=card.id, version=1, data=snapshot)
    session.add(version_row)
    session.commit()

    return card


@app.get("/cards/{card_id}", response_model=CardRead, tags=["cards"])
def get_card(card_id: int, session: Session = Depends(get_session)):
    card = session.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@app.put("/cards/{card_id}", response_model=CardRead, tags=["cards"])
def update_card(
    card_id: int,
    card_in: CardCreate,
    session: Session = Depends(get_session),
):
    """
    Full update of a card, and store a new version (v+1).
    """
    card = session.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # apply all fields from input
    data = card_in.model_dump()
    for field, value in data.items():
        setattr(card, field, value)

    # compute next version
    version_stmt = (
        select(CardVersion)
        .where(CardVersion.card_id == card_id)
        .order_by(CardVersion.version.desc())
    )
    last_version = session.exec(version_stmt).first()
    next_version = (last_version.version if last_version else 1) + 1

    snapshot = CardRead.from_orm(card).model_dump()
    version_row = CardVersion(card_id=card_id, version=next_version, data=snapshot)

    session.add(card)
    session.add(version_row)
    session.commit()
    session.refresh(card)

    return card


@app.delete("/cards/{card_id}", tags=["cards"])
def delete_card(card_id: int, session: Session = Depends(get_session)):
    card = session.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    session.delete(card)
    session.commit()
    return {"ok": True}


# =====================
# Card versions
# =====================

@app.get(
    "/cards/{card_id}/versions",
    response_model=List[CardVersionRead],
    tags=["cards"],
)
def list_card_versions(card_id: int, session: Session = Depends(get_session)):
    """
    List all versions of a card (snapshots), newest first.
    """
    statement = (
        select(CardVersion)
        .where(CardVersion.card_id == card_id)
        .order_by(CardVersion.version.desc())
    )
    versions = session.exec(statement).all()
    return versions


@app.get(
    "/cards/{card_id}/versions/{version}",
    response_model=CardVersionRead,
    tags=["cards"],
)
def get_card_version(
    card_id: int,
    version: int,
    session: Session = Depends(get_session),
):
    """
    Get a specific version snapshot for a card.
    """
    statement = select(CardVersion).where(
        CardVersion.card_id == card_id,
        CardVersion.version == version,
    )
    version_row = session.exec(statement).first()
    if not version_row:
        raise HTTPException(status_code=404, detail="Version not found")
    return version_row

@app.post(
    "/cards/{card_id}/versions/{version}/restore",
    response_model=CardRead,
    tags=["cards"],
)
def restore_card_version(
    card_id: int,
    version: int,
    session: Session = Depends(get_session),
):
    """
    'Restore' a previous version by:
      - Updating the Card row to match that version's data
      - Creating a NEW latest version snapshot with the same data

    Old versions are not deleted or modified.
    """
    card = session.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Find the version we are restoring from
    stmt = select(CardVersion).where(
        CardVersion.card_id == card_id,
        CardVersion.version == version,
    )
    version_row = session.exec(stmt).first()
    if not version_row:
        raise HTTPException(status_code=404, detail="Version not found")

    snapshot_data = version_row.data or {}
    # Remove id from snapshot if present; we don't want to overwrite the primary key
    snapshot_data.pop("id", None)

    # Apply snapshot fields to the Card
    for field, value in snapshot_data.items():
        # Only set attributes that actually exist on Card
        if hasattr(card, field):
            setattr(card, field, value)

    # Compute next version number
    last_version_stmt = (
        select(CardVersion)
        .where(CardVersion.card_id == card_id)
        .order_by(CardVersion.version.desc())
    )
    last_version = session.exec(last_version_stmt).first()
    next_version = (last_version.version if last_version else 1) + 1

    # Create a new version snapshot matching this restored state
    new_snapshot = CardRead.from_orm(card).model_dump()
    new_version_row = CardVersion(
        card_id=card_id,
        version=next_version,
        data=new_snapshot,
    )

    session.add(card)
    session.add(new_version_row)
    session.commit()
    session.refresh(card)

    return card


# =====================
# Pantheons
# =====================

@app.get("/pantheons", response_model=List[PantheonRead], tags=["pantheons"])
def list_pantheons(session: Session = Depends(get_session)):
    stmt = select(Pantheon).order_by(Pantheon.name)
    return session.exec(stmt).all()


@app.post("/pantheons", response_model=PantheonRead, tags=["pantheons"])
def create_pantheon(
    pantheon_in: PantheonCreate,
    session: Session = Depends(get_session),
):
    pantheon = Pantheon.from_orm(pantheon_in)
    session.add(pantheon)
    session.commit()
    session.refresh(pantheon)
    return pantheon


# =====================
# Archetypes
# =====================

@app.get("/archetypes", response_model=List[ArchetypeRead], tags=["archetypes"])
def list_archetypes(session: Session = Depends(get_session)):
    stmt = select(Archetype).order_by(Archetype.name)
    return session.exec(stmt).all()


@app.post("/archetypes", response_model=ArchetypeRead, tags=["archetypes"])
def create_archetype(
    archetype_in: ArchetypeCreate,
    session: Session = Depends(get_session),
):
    archetype = Archetype.from_orm(archetype_in)
    session.add(archetype)
    session.commit()
    session.refresh(archetype)
    return archetype


# =====================
# Passive definitions
# =====================

@app.get(
    "/passives",
    response_model=List[PassiveDefinitionRead],
    tags=["passives"],
)
def list_passives(
    pantheon: Optional[str] = None,
    archetype: Optional[str] = None,
    session: Session = Depends(get_session),
):
    stmt = select(PassiveDefinition)
    if pantheon:
        stmt = stmt.where(PassiveDefinition.pantheon == pantheon)
    if archetype:
        stmt = stmt.where(PassiveDefinition.archetype == archetype)

    stmt = stmt.order_by(PassiveDefinition.group_name, PassiveDefinition.name)
    return session.exec(stmt).all()


@app.post(
    "/passives",
    response_model=PassiveDefinitionRead,
    tags=["passives"],
)
def create_passive(
    passive_in: PassiveDefinitionCreate,
    session: Session = Depends(get_session),
):
    passive = PassiveDefinition.from_orm(passive_in)
    session.add(passive)
    session.commit()
    session.refresh(passive)
    return passive
