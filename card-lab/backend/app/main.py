from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, create_engine, SQLModel, select, or_, and_
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime

from app.models import (
    Pantheon,
    PantheonCreate,
    PantheonRead,
    Archetype,
    ArchetypeCreate,
    ArchetypeRead,
    AbilityTiming,
    AbilityTimingCreate,
    AbilityTimingRead,
    PassiveDefinition,
    PassiveDefinitionCreate,
    PassiveDefinitionRead,
    Card,
    CardCreate,
    CardRead,
    Tag, 
    TagRead,
    KeywordAbility, 
    KeywordAbilityCreate,
    KeywordAbilityRead,
)

DATABASE_URL = "sqlite:///./cardlab.db"
engine = create_engine(DATABASE_URL, echo=True)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Card Lab API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    # New filters
    pantheons: Optional[str] = Query(None, description="Comma-separated pantheons"),
    archetypes: Optional[str] = Query(None, description="Comma-separated archetypes"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    filter_mode: str = Query("or", description="'and' or 'or' filtering"),
    min_cost: Optional[int] = None,
    max_cost: Optional[int] = None,
    min_fi: Optional[int] = None,
    max_fi: Optional[int] = None,
    min_hp: Optional[int] = None,
    max_hp: Optional[int] = None,
    min_god_dmg: Optional[int] = None,
    max_god_dmg: Optional[int] = None,
    min_creature_dmg: Optional[int] = None,
    max_creature_dmg: Optional[int] = None,
    session: Session = Depends(get_session),
):
    """
    List all CURRENT cards with optional filters.
    Supports AND/OR filtering with relevance scoring.
    """

    print("\n=== FILTER DEBUG ===")
    print(f"pantheons param: {pantheons}")
    print(f"archetypes param: {archetypes}")
    print(f"tags param: {tags}")
    print(f"filter_mode: {filter_mode}")
    print(f"search: {search}")

    statement = select(Card).where(Card.is_current == True)

    # Legacy single filters (for backwards compatibility)
    if pantheon:
        statement = statement.where(Card.pantheon == pantheon)
    if archetype:
        statement = statement.where(Card.archetype == archetype)
    if type:
        statement = statement.where(Card.type == type)
    if search:
        statement = statement.where(Card.name.contains(search))

    cards = session.exec(statement).all()

    # Stat range filters
    if min_cost is not None:
        cards = [c for c in cards if c.cost >= min_cost]
    if max_cost is not None:
        cards = [c for c in cards if c.cost <= max_cost]
    if min_fi is not None:
        cards = [c for c in cards if c.fi >= min_fi]
    if max_fi is not None:
        cards = [c for c in cards if c.fi <= max_fi]
    if min_hp is not None:
        cards = [c for c in cards if c.hp >= min_hp]
    if max_hp is not None:
        cards = [c for c in cards if c.hp <= max_hp]
    if min_god_dmg is not None:
        cards = [c for c in cards if c.godDmg >= min_god_dmg]
    if max_god_dmg is not None:
        cards = [c for c in cards if c.godDmg <= max_god_dmg]
    if min_creature_dmg is not None:
        cards = [c for c in cards if c.creatureDmg >= min_creature_dmg]
    if max_creature_dmg is not None:
        cards = [c for c in cards if c.creatureDmg <= max_creature_dmg]

    # Advanced multi-filter with AND/OR and relevance scoring
    pantheon_list = [p.strip() for p in pantheons.split(",")] if pantheons else []
    archetype_list = [a.strip() for a in archetypes.split(",")] if archetypes else []
    tag_list = [t.strip().lower() for t in tags.split(",")] if tags else []
    
    print(f"\nParsed filters:")
    print(f"  pantheon_list: {pantheon_list}")
    print(f"  archetype_list: {archetype_list}")
    print(f"  tag_list: {tag_list}")
    # Legacy single tag filter
    if tag:
        tag_list.append(tag.lower())

    if pantheon_list or archetype_list or tag_list:
        scored_cards = []
        
        for card in cards:
            score = 0
            matches = []
            
            # Check pantheon matches
            if card.pantheon in pantheon_list:
                score += 1
                matches.append("pantheon")
            
            # Check archetype matches
            if card.archetype in archetype_list:
                score += 1
                matches.append("archetype")
            
            # Check tag matches
            card_tags_lower = [t.lower() for t in card.tags]
            for tag in tag_list:
                if tag in card_tags_lower:
                    score += 1
                    matches.append("tag")
                    break  # Only count tags once per card
            
            # Apply filter mode
            if filter_mode == "and":
                # Must match ALL specified filters
                required_matches = 0
                if pantheon_list:
                    required_matches += 1
                if archetype_list:
                    required_matches += 1
                if tag_list:
                    required_matches += 1
                
                if score >= required_matches:
                    scored_cards.append((card, score))
            else:  # "or" mode
                # Must match at least ONE filter
                if score > 0:
                    scored_cards.append((card, score))
        
        # Sort by score descending (highest relevance first)
        scored_cards.sort(key=lambda x: x[1], reverse=True)
        cards = [card for card, score in scored_cards]

    return cards


@app.get("/cards/{card_id}", response_model=CardRead, tags=["cards"])
def get_card(card_id: int, session: Session = Depends(get_session)):
    """Get the CURRENT version of a card."""
    card = session.get(Card, card_id)
    if not card or not card.is_current:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@app.post("/cards", response_model=CardRead, tags=["cards"])
def create_card(card_in: CardCreate, session: Session = Depends(get_session)):
    """Create a new card (version 1)."""
    card = Card(**card_in.model_dump())
    card.is_current = True
    card.version = 1
    card.parent_card_id = None
    
    session.add(card)
    session.commit()
    session.refresh(card)
    return card


@app.put("/cards/{card_id}", response_model=CardRead, tags=["cards"])
def update_card(
    card_id: int,
    card_in: CardCreate,
    session: Session = Depends(get_session),
):
    """
    Update a card by creating a new version.
    The old current version becomes a historical version.
    """
    current_card = session.get(Card, card_id)
    if not current_card or not current_card.is_current:
        raise HTTPException(status_code=404, detail="Current card not found")

    # Mark current as non-current
    current_card.is_current = False
    session.add(current_card)

    # Determine the root card (for tracking all versions)
    root_id = current_card.parent_card_id if current_card.parent_card_id else current_card.id
    
    # Find max version number
    all_versions_stmt = select(Card).where(
        or_(
            Card.id == root_id,
            Card.parent_card_id == root_id
        )
    )
    all_versions = session.exec(all_versions_stmt).all()
    max_version = max([v.version for v in all_versions])

    # Create new current version
    new_card = Card(**card_in.model_dump())
    new_card.is_current = True
    new_card.version = max_version + 1
    new_card.parent_card_id = root_id
    new_card.created_at = datetime.utcnow()
    new_card.updated_at = datetime.utcnow()

    session.add(new_card)
    session.commit()
    session.refresh(new_card)
    return new_card


@app.delete("/cards/{card_id}", tags=["cards"])
def delete_card(card_id: int, session: Session = Depends(get_session)):
    """Delete a card and all its versions."""
    card = session.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Find root
    root_id = card.parent_card_id if card.parent_card_id else card.id
    
    # Delete all versions
    all_versions_stmt = select(Card).where(
        or_(
            Card.id == root_id,
            Card.parent_card_id == root_id
        )
    )
    all_versions = session.exec(all_versions_stmt).all()
    for version in all_versions:
        session.delete(version)
    
    session.commit()
    return {"ok": True}


@app.get("/cards/{card_id}/versions", response_model=List[CardRead], tags=["cards"])
def get_card_versions(card_id: int, session: Session = Depends(get_session)):
    """Get all versions of a card."""
    card = session.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    root_id = card.parent_card_id if card.parent_card_id else card.id
    
    statement = select(Card).where(
        or_(
            Card.id == root_id,
            Card.parent_card_id == root_id
        )
    ).order_by(Card.version.desc())
    
    return session.exec(statement).all()


@app.get("/cards/{card_id}/versions/{version}", response_model=CardRead, tags=["cards"])
def get_card_version(
    card_id: int,
    version: int,
    session: Session = Depends(get_session)
):
    """Get a specific version of a card."""
    card = session.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    root_id = card.parent_card_id if card.parent_card_id else card.id
    
    statement = select(Card).where(
        and_(
            or_(
                Card.id == root_id,
                Card.parent_card_id == root_id
            ),
            Card.version == version
        )
    )
    
    version_card = session.exec(statement).first()
    if not version_card:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return version_card


@app.post("/cards/{card_id}/versions/{version}/restore", response_model=CardRead, tags=["cards"])
def restore_card_version(
    card_id: int,
    version: int,
    session: Session = Depends(get_session)
):
    """
    Restore a specific version as current.
    Current version becomes a new historical version.
    Passive references are updated to use current passive names/data.
    """
    card = session.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    root_id = card.parent_card_id if card.parent_card_id else card.id

    # Get the version to restore
    version_stmt = select(Card).where(
        and_(
            or_(
                Card.id == root_id,
                Card.parent_card_id == root_id
            ),
            Card.version == version
        )
    )
    version_to_restore = session.exec(version_stmt).first()
    if not version_to_restore:
        raise HTTPException(status_code=404, detail="Version not found")

    # Get current version
    current_stmt = select(Card).where(
        and_(
            or_(
                Card.id == root_id,
                Card.parent_card_id == root_id
            ),
            Card.is_current == True
        )
    )
    current_card = session.exec(current_stmt).first()

    # Mark current as non-current
    if current_card:
        current_card.is_current = False
        session.add(current_card)

    # Find max version
    all_versions_stmt = select(Card).where(
        or_(
            Card.id == root_id,
            Card.parent_card_id == root_id
        )
    )
    all_versions = session.exec(all_versions_stmt).all()
    max_version = max([v.version for v in all_versions])

    # Resolve passive references to current versions
    updated_passives = []
    for passive_data in version_to_restore.passives:
        passive_id = passive_data.get("passive_id")
        if passive_id:
            # Find the root passive and get its current version
            old_passive = session.get(PassiveDefinition, passive_id)
            if old_passive:
                root_passive_id = old_passive.parent_passive_id if old_passive.parent_passive_id else old_passive.id
                
                # Get current version of this passive
                current_passive_stmt = select(PassiveDefinition).where(
                    and_(
                        or_(
                            PassiveDefinition.id == root_passive_id,
                            PassiveDefinition.parent_passive_id == root_passive_id
                        ),
                        PassiveDefinition.is_current == True
                    )
                )
                current_passive = session.exec(current_passive_stmt).first()
                
                if current_passive:
                    # Use current passive data
                    updated_passives.append({
                        "passive_id": current_passive.id,
                        "group": current_passive.group_name,
                        "name": current_passive.name,
                        "text": current_passive.text,
                    })
                else:
                    # Fallback to stored data if passive was deleted
                    updated_passives.append(passive_data)
            else:
                # Passive no longer exists, keep old data
                updated_passives.append(passive_data)
        else:
            # No passive_id reference, keep as-is
            updated_passives.append(passive_data)

    # Create new current version (copy of restored version with updated passive refs)
    restored_card = Card(
        name=version_to_restore.name,
        cost=version_to_restore.cost,
        fi=version_to_restore.fi,
        hp=version_to_restore.hp,
        godDmg=version_to_restore.godDmg,
        creatureDmg=version_to_restore.creatureDmg,
        statTotal=version_to_restore.statTotal,
        type=version_to_restore.type,
        pantheon=version_to_restore.pantheon,  # Keep pantheon/archetype as-is (they don't version)
        archetype=version_to_restore.archetype,
        tags=version_to_restore.tags,
        abilities=version_to_restore.abilities,
        passives=updated_passives,  # Use updated passive references
        is_current=True,
        version=max_version + 1,
        parent_card_id=root_id,
    )

    session.add(restored_card)
    session.commit()
    session.refresh(restored_card)
    return restored_card


# =====================
# Passive Definitions
# =====================

@app.get("/passives", response_model=List[PassiveDefinitionRead], tags=["passives"])
def list_passives(session: Session = Depends(get_session)):
    """List all CURRENT passive definitions."""
    statement = select(PassiveDefinition).where(PassiveDefinition.is_current == True)
    return session.exec(statement).all()


@app.get("/passives/{passive_id}", response_model=PassiveDefinitionRead, tags=["passives"])
def get_passive(passive_id: int, session: Session = Depends(get_session)):
    """Get the CURRENT version of a passive."""
    passive = session.get(PassiveDefinition, passive_id)
    if not passive or not passive.is_current:
        raise HTTPException(status_code=404, detail="Passive not found")
    return passive


@app.post("/passives", response_model=PassiveDefinitionRead, tags=["passives"])
def create_passive(
    passive_in: PassiveDefinitionCreate,
    session: Session = Depends(get_session)
):
    """Create a new passive (version 1)."""
    passive = PassiveDefinition(**passive_in.model_dump())
    passive.is_current = True
    passive.version = 1
    passive.parent_passive_id = None
    
    session.add(passive)
    session.commit()
    session.refresh(passive)
    return passive


@app.put("/passives/{passive_id}", response_model=PassiveDefinitionRead, tags=["passives"])
def update_passive(
    passive_id: int,
    passive_in: PassiveDefinitionCreate,
    session: Session = Depends(get_session),
):
    """
    Update a passive by creating a new version.
    Also creates new versions of all cards using this passive (CASCADE).
    """
    current_passive = session.get(PassiveDefinition, passive_id)
    if not current_passive or not current_passive.is_current:
        raise HTTPException(status_code=404, detail="Current passive not found")

    # Mark current passive as non-current
    current_passive.is_current = False
    session.add(current_passive)

    # Determine root passive
    root_passive_id = current_passive.parent_passive_id if current_passive.parent_passive_id else current_passive.id
    
    # Find max version for this passive
    all_passive_versions_stmt = select(PassiveDefinition).where(
        or_(
            PassiveDefinition.id == root_passive_id,
            PassiveDefinition.parent_passive_id == root_passive_id
        )
    )
    all_passive_versions = session.exec(all_passive_versions_stmt).all()
    max_passive_version = max([v.version for v in all_passive_versions])

    # Create new current passive version
    new_passive = PassiveDefinition(**passive_in.model_dump())
    new_passive.is_current = True
    new_passive.version = max_passive_version + 1
    new_passive.parent_passive_id = root_passive_id
    new_passive.created_at = datetime.utcnow()
    new_passive.updated_at = datetime.utcnow()

    session.add(new_passive)
    session.flush()  # Get the new passive ID

    # CASCADE: Find all CURRENT cards that use this passive
    all_current_cards_stmt = select(Card).where(Card.is_current == True)
    all_current_cards = session.exec(all_current_cards_stmt).all()

    affected_cards = []
    for card in all_current_cards:
        for passive_data in card.passives:
            if passive_data.get("passive_id") == root_passive_id:
                affected_cards.append(card)
                break

    # Create new versions of affected cards
    for old_card in affected_cards:
        # Mark old card as non-current
        old_card.is_current = False
        session.add(old_card)

        # Determine root card
        root_card_id = old_card.parent_card_id if old_card.parent_card_id else old_card.id
        
        # Find max version for this card
        all_card_versions_stmt = select(Card).where(
            or_(
                Card.id == root_card_id,
                Card.parent_card_id == root_card_id
            )
        )
        all_card_versions = session.exec(all_card_versions_stmt).all()
        max_card_version = max([v.version for v in all_card_versions])

        # Update passives list with new passive data
        updated_passives = []
        for passive_data in old_card.passives:
            if passive_data.get("passive_id") == root_passive_id:
                updated_passives.append({
                    "passive_id": new_passive.id,
                    "group": new_passive.group_name,
                    "name": new_passive.name,
                    "text": new_passive.text,
                })
            else:
                updated_passives.append(passive_data)

        # Create new card version
        new_card = Card(
            name=old_card.name,
            cost=old_card.cost,
            fi=old_card.fi,
            hp=old_card.hp,
            godDmg=old_card.godDmg,
            creatureDmg=old_card.creatureDmg,
            statTotal=old_card.statTotal,
            type=old_card.type,
            pantheon=old_card.pantheon,
            archetype=old_card.archetype,
            tags=old_card.tags,
            abilities=old_card.abilities,
            passives=updated_passives,
            is_current=True,
            version=max_card_version + 1,
            parent_card_id=root_card_id,
        )
        session.add(new_card)

    session.commit()
    session.refresh(new_passive)
    return new_passive


@app.delete("/passives/{passive_id}", tags=["passives"])
def delete_passive(passive_id: int, session: Session = Depends(get_session)):
    """Delete a passive and all its versions."""
    passive = session.get(PassiveDefinition, passive_id)
    if not passive:
        raise HTTPException(status_code=404, detail="Passive not found")

    root_id = passive.parent_passive_id if passive.parent_passive_id else passive.id
    
    # Delete all versions
    all_versions_stmt = select(PassiveDefinition).where(
        or_(
            PassiveDefinition.id == root_id,
            PassiveDefinition.parent_passive_id == root_id
        )
    )
    all_versions = session.exec(all_versions_stmt).all()
    for version in all_versions:
        session.delete(version)
    
    session.commit()
    return {"ok": True}


@app.get("/passives/{passive_id}/versions", response_model=List[PassiveDefinitionRead], tags=["passives"])
def get_passive_versions(passive_id: int, session: Session = Depends(get_session)):
    """Get all versions of a passive."""
    passive = session.get(PassiveDefinition, passive_id)
    if not passive:
        raise HTTPException(status_code=404, detail="Passive not found")

    root_id = passive.parent_passive_id if passive.parent_passive_id else passive.id
    
    statement = select(PassiveDefinition).where(
        or_(
            PassiveDefinition.id == root_id,
            PassiveDefinition.parent_passive_id == root_id
        )
    ).order_by(PassiveDefinition.version.desc())
    
    return session.exec(statement).all()


@app.get("/passives/{passive_id}/versions/{version}", response_model=PassiveDefinitionRead, tags=["passives"])
def get_passive_version(
    passive_id: int,
    version: int,
    session: Session = Depends(get_session)
):
    """Get a specific version of a passive."""
    passive = session.get(PassiveDefinition, passive_id)
    if not passive:
        raise HTTPException(status_code=404, detail="Passive not found")

    root_id = passive.parent_passive_id if passive.parent_passive_id else passive.id
    
    statement = select(PassiveDefinition).where(
        and_(
            or_(
                PassiveDefinition.id == root_id,
                PassiveDefinition.parent_passive_id == root_id
            ),
            PassiveDefinition.version == version
        )
    )
    
    version_passive = session.exec(statement).first()
    if not version_passive:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return version_passive


@app.post("/passives/{passive_id}/versions/{version}/restore", response_model=PassiveDefinitionRead, tags=["passives"])
def restore_passive_version(
    passive_id: int,
    version: int,
    session: Session = Depends(get_session)
):
    """
    Restore a specific version of a passive as current.
    Also creates new versions of all cards using this passive (CASCADE).
    Cards get the restored passive data, but other passive refs use current versions.
    """
    passive = session.get(PassiveDefinition, passive_id)
    if not passive:
        raise HTTPException(status_code=404, detail="Passive not found")

    root_passive_id = passive.parent_passive_id if passive.parent_passive_id else passive.id

    # Get the version to restore
    version_stmt = select(PassiveDefinition).where(
        and_(
            or_(
                PassiveDefinition.id == root_passive_id,
                PassiveDefinition.parent_passive_id == root_passive_id
            ),
            PassiveDefinition.version == version
        )
    )
    version_to_restore = session.exec(version_stmt).first()
    if not version_to_restore:
        raise HTTPException(status_code=404, detail="Version not found")

    # Get current version
    current_stmt = select(PassiveDefinition).where(
        and_(
            or_(
                PassiveDefinition.id == root_passive_id,
                PassiveDefinition.parent_passive_id == root_passive_id
            ),
            PassiveDefinition.is_current == True
        )
    )
    current_passive = session.exec(current_stmt).first()

    # Mark current as non-current
    if current_passive:
        current_passive.is_current = False
        session.add(current_passive)

    # Find max version
    all_versions_stmt = select(PassiveDefinition).where(
        or_(
            PassiveDefinition.id == root_passive_id,
            PassiveDefinition.parent_passive_id == root_passive_id
        )
    )
    all_versions = session.exec(all_versions_stmt).all()
    max_version = max([v.version for v in all_versions])

    # Create new current version (copy of restored version)
    restored_passive = PassiveDefinition(
        group_name=version_to_restore.group_name,
        name=version_to_restore.name,
        text=version_to_restore.text,
        pantheon=version_to_restore.pantheon,
        archetype=version_to_restore.archetype,
        is_current=True,
        version=max_version + 1,
        parent_passive_id=root_passive_id,
    )

    session.add(restored_passive)
    session.flush()

    # Helper function to resolve a passive reference to its current version
    def resolve_passive_reference(passive_data):
        passive_id = passive_data.get("passive_id")
        if not passive_id:
            return passive_data
            
        old_passive = session.get(PassiveDefinition, passive_id)
        if not old_passive:
            return passive_data
            
        # Find root and get current version
        root_id = old_passive.parent_passive_id if old_passive.parent_passive_id else old_passive.id
        
        # If this is the passive we're restoring, use the restored version
        if root_id == root_passive_id:
            return {
                "passive_id": restored_passive.id,
                "group": restored_passive.group_name,
                "name": restored_passive.name,
                "text": restored_passive.text,
            }
        
        # Otherwise, use the current version of this other passive
        current_other_stmt = select(PassiveDefinition).where(
            and_(
                or_(
                    PassiveDefinition.id == root_id,
                    PassiveDefinition.parent_passive_id == root_id
                ),
                PassiveDefinition.is_current == True
            )
        )
        current_other = session.exec(current_other_stmt).first()
        
        if current_other:
            return {
                "passive_id": current_other.id,
                "group": current_other.group_name,
                "name": current_other.name,
                "text": current_other.text,
            }
        
        return passive_data

    # CASCADE: Update all current cards using this passive
    all_current_cards_stmt = select(Card).where(Card.is_current == True)
    all_current_cards = session.exec(all_current_cards_stmt).all()

    affected_cards = []
    for card in all_current_cards:
        for passive_data in card.passives:
            if passive_data.get("passive_id"):
                # Check if this passive links to our root passive
                check_passive = session.get(PassiveDefinition, passive_data.get("passive_id"))
                if check_passive:
                    check_root = check_passive.parent_passive_id if check_passive.parent_passive_id else check_passive.id
                    if check_root == root_passive_id:
                        affected_cards.append(card)
                        break

    for old_card in affected_cards:
        old_card.is_current = False
        session.add(old_card)

        root_card_id = old_card.parent_card_id if old_card.parent_card_id else old_card.id
        
        all_card_versions_stmt = select(Card).where(
            or_(
                Card.id == root_card_id,
                Card.parent_card_id == root_card_id
            )
        )
        all_card_versions = session.exec(all_card_versions_stmt).all()
        max_card_version = max([v.version for v in all_card_versions])

        # Update ALL passive references to use current versions
        updated_passives = [resolve_passive_reference(p) for p in old_card.passives]

        new_card = Card(
            name=old_card.name,
            cost=old_card.cost,
            fi=old_card.fi,
            hp=old_card.hp,
            godDmg=old_card.godDmg,
            creatureDmg=old_card.creatureDmg,
            statTotal=old_card.statTotal,
            type=old_card.type,
            pantheon=old_card.pantheon,
            archetype=old_card.archetype,
            tags=old_card.tags,
            abilities=old_card.abilities,
            passives=updated_passives,
            is_current=True,
            version=max_card_version + 1,
            parent_card_id=root_card_id,
        )
        session.add(new_card)

    session.commit()
    session.refresh(restored_passive)
    return restored_passive


# =====================
# Pantheons
# =====================

@app.get("/pantheons", response_model=List[PantheonRead], tags=["pantheons"])
def list_pantheons(session: Session = Depends(get_session)):
    return session.exec(select(Pantheon)).all()


@app.post("/pantheons", response_model=PantheonRead, tags=["pantheons"])
def create_pantheon(
    pantheon_in: PantheonCreate, session: Session = Depends(get_session)
):
    pantheon = Pantheon(**pantheon_in.model_dump())
    session.add(pantheon)
    session.commit()
    session.refresh(pantheon)
    return pantheon


@app.get("/pantheons/{pantheon_id}", response_model=PantheonRead, tags=["pantheons"])
def get_pantheon(pantheon_id: int, session: Session = Depends(get_session)):
    pantheon = session.get(Pantheon, pantheon_id)
    if not pantheon:
        raise HTTPException(status_code=404, detail="Pantheon not found")
    return pantheon


@app.put("/pantheons/{pantheon_id}", response_model=PantheonRead, tags=["pantheons"])
def update_pantheon(
    pantheon_id: int,
    pantheon_in: PantheonCreate,
    session: Session = Depends(get_session),
):
    pantheon = session.get(Pantheon, pantheon_id)
    if not pantheon:
        raise HTTPException(status_code=404, detail="Pantheon not found")

    pantheon.name = pantheon_in.name
    pantheon.description = pantheon_in.description

    session.add(pantheon)
    session.commit()
    session.refresh(pantheon)
    return pantheon


@app.delete("/pantheons/{pantheon_id}", tags=["pantheons"])
def delete_pantheon(pantheon_id: int, session: Session = Depends(get_session)):
    pantheon = session.get(Pantheon, pantheon_id)
    if not pantheon:
        raise HTTPException(status_code=404, detail="Pantheon not found")
    session.delete(pantheon)
    session.commit()
    return {"ok": True}


# =====================
# Archetypes
# =====================

@app.get("/archetypes", response_model=List[ArchetypeRead], tags=["archetypes"])
def list_archetypes(session: Session = Depends(get_session)):
    return session.exec(select(Archetype)).all()


@app.post("/archetypes", response_model=ArchetypeRead, tags=["archetypes"])
def create_archetype(
    archetype_in: ArchetypeCreate, session: Session = Depends(get_session)
):
    archetype = Archetype(**archetype_in.model_dump())
    session.add(archetype)
    session.commit()
    session.refresh(archetype)
    return archetype


@app.get("/archetypes/{archetype_id}", response_model=ArchetypeRead, tags=["archetypes"])
def get_archetype(archetype_id: int, session: Session = Depends(get_session)):
    archetype = session.get(Archetype, archetype_id)
    if not archetype:
        raise HTTPException(status_code=404, detail="Archetype not found")
    return archetype


@app.put("/archetypes/{archetype_id}", response_model=ArchetypeRead, tags=["archetypes"])
def update_archetype(
    archetype_id: int,
    archetype_in: ArchetypeCreate,
    session: Session = Depends(get_session),
):
    archetype = session.get(Archetype, archetype_id)
    if not archetype:
        raise HTTPException(status_code=404, detail="Archetype not found")

    archetype.name = archetype_in.name
    archetype.description = archetype_in.description

    session.add(archetype)
    session.commit()
    session.refresh(archetype)
    return archetype


@app.delete("/archetypes/{archetype_id}", tags=["archetypes"])
def delete_archetype(archetype_id: int, session: Session = Depends(get_session)):
    archetype = session.get(Archetype, archetype_id)
    if not archetype:
        raise HTTPException(status_code=404, detail="Archetype not found")
    session.delete(archetype)
    session.commit()
    return {"ok": True}


# =====================
# Ability Timings
# =====================

@app.get("/ability-timings", response_model=List[AbilityTimingRead], tags=["ability-timings"])
def list_ability_timings(session: Session = Depends(get_session)):
    return session.exec(select(AbilityTiming)).all()


@app.post("/ability-timings", response_model=AbilityTimingRead, tags=["ability-timings"])
def create_ability_timing(
    timing_in: AbilityTimingCreate, session: Session = Depends(get_session)
):
    timing = AbilityTiming(**timing_in.model_dump())
    session.add(timing)
    session.commit()
    session.refresh(timing)
    return timing
@app.get("/tags", response_model=List[TagRead], tags=["tags"])
def list_tags(session: Session = Depends(get_session)):
    """List all unique tags found in cards."""
    # Get all tags from all current cards
    cards = session.exec(select(Card).where(Card.is_current == True)).all()
    tag_set = set()
    for card in cards:
        for tag in card.tags:
            tag_set.add(tag.lower().strip())
    
    # Get or create Tag records
    tag_records = []
    for tag_name in sorted(tag_set):
        existing = session.exec(select(Tag).where(Tag.name == tag_name)).first()
        if not existing:
            existing = Tag(name=tag_name)
            session.add(existing)
    
    session.commit()
    
    # Return all tags
    return session.exec(select(Tag).order_by(Tag.name)).all()


@app.delete("/tags/{tag_id}", tags=["tags"])
def delete_tag(tag_id: int, session: Session = Depends(get_session)):
    """Delete a tag and remove it from all cards."""
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    tag_name = tag.name
    
    # Remove from all cards
    cards = session.exec(select(Card).where(Card.is_current == True)).all()
    for card in cards:
        if tag_name in [t.lower() for t in card.tags]:
            # Remove the tag (case-insensitive)
            card.tags = [t for t in card.tags if t.lower() != tag_name]
            session.add(card)
    
    session.delete(tag)
    session.commit()
    return {"ok": True}

@app.get("/keyword-abilities", response_model=List[KeywordAbilityRead], tags=["keyword-abilities"])
def list_keyword_abilities(session: Session = Depends(get_session)):
    """List all CURRENT keyword abilities."""
    statement = select(KeywordAbility).where(KeywordAbility.is_current == True)
    return session.exec(statement).all()


@app.get("/keyword-abilities/{ability_id}", response_model=KeywordAbilityRead, tags=["keyword-abilities"])
def get_keyword_ability(ability_id: int, session: Session = Depends(get_session)):
    """Get the CURRENT version of a keyword ability."""
    ability = session.get(KeywordAbility, ability_id)
    if not ability or not ability.is_current:
        raise HTTPException(status_code=404, detail="Keyword ability not found")
    return ability


@app.post("/keyword-abilities", response_model=KeywordAbilityRead, tags=["keyword-abilities"])
def create_keyword_ability(
    ability_in: KeywordAbilityCreate,
    session: Session = Depends(get_session)
):
    """Create a new keyword ability (version 1)."""
    ability = KeywordAbility(**ability_in.model_dump())
    ability.is_current = True
    ability.version = 1
    ability.parent_ability_id = None
    
    session.add(ability)
    session.commit()
    session.refresh(ability)
    return ability


@app.put("/keyword-abilities/{ability_id}", response_model=KeywordAbilityRead, tags=["keyword-abilities"])
def update_keyword_ability(
    ability_id: int,
    ability_in: KeywordAbilityCreate,
    session: Session = Depends(get_session),
):
    """
    Update a keyword ability by creating a new version.
    Also creates new versions of all cards using this ability (CASCADE).
    """
    current_ability = session.get(KeywordAbility, ability_id)
    if not current_ability or not current_ability.is_current:
        raise HTTPException(status_code=404, detail="Current keyword ability not found")

    # Mark current ability as non-current
    current_ability.is_current = False
    session.add(current_ability)

    # Determine root ability
    root_ability_id = current_ability.parent_ability_id if current_ability.parent_ability_id else current_ability.id
    
    # Find max version for this ability
    all_ability_versions_stmt = select(KeywordAbility).where(
        or_(
            KeywordAbility.id == root_ability_id,
            KeywordAbility.parent_ability_id == root_ability_id
        )
    )
    all_ability_versions = session.exec(all_ability_versions_stmt).all()
    max_ability_version = max([v.version for v in all_ability_versions])

    # Create new current ability version
    new_ability = KeywordAbility(**ability_in.model_dump())
    new_ability.is_current = True
    new_ability.version = max_ability_version + 1
    new_ability.parent_ability_id = root_ability_id
    new_ability.created_at = datetime.utcnow()
    new_ability.updated_at = datetime.utcnow()

    session.add(new_ability)
    session.flush()  # Get the new ability ID

    # CASCADE: Find all CURRENT cards that use this ability
    all_current_cards_stmt = select(Card).where(Card.is_current == True)
    all_current_cards = session.exec(all_current_cards_stmt).all()

    affected_cards = []
    for card in all_current_cards:
        for ability_data in card.cardAbilities:
            if ability_data.get("ability_id") == root_ability_id:
                affected_cards.append(card)
                break

    # Create new versions of affected cards
    for old_card in affected_cards:
        # Mark old card as non-current
        old_card.is_current = False
        session.add(old_card)

        # Determine root card
        root_card_id = old_card.parent_card_id if old_card.parent_card_id else old_card.id
        
        # Find max version for this card
        all_card_versions_stmt = select(Card).where(
            or_(
                Card.id == root_card_id,
                Card.parent_card_id == root_card_id
            )
        )
        all_card_versions = session.exec(all_card_versions_stmt).all()
        max_card_version = max([v.version for v in all_card_versions])

        # Update abilities list with new ability data
        updated_abilities = []
        for ability_data in old_card.cardAbilities:
            if ability_data.get("ability_id") == root_ability_id:
                updated_abilities.append({
                    "ability_id": new_ability.id,
                    "name": new_ability.name,
                    "text": new_ability.text,
                })
            else:
                updated_abilities.append(ability_data)

        # Create new card version
        new_card = Card(
            name=old_card.name,
            cost=old_card.cost,
            fi=old_card.fi,
            hp=old_card.hp,
            godDmg=old_card.godDmg,
            creatureDmg=old_card.creatureDmg,
            dmg=old_card.dmg,
            speed=old_card.speed,
            statTotal=old_card.statTotal,
            type=old_card.type,
            pantheon=old_card.pantheon,
            archetype=old_card.archetype,
            tags=old_card.tags,
            abilities=old_card.abilities,
            passives=old_card.passives,
            cardText=old_card.cardText,
            cardAbilities=updated_abilities,
            is_current=True,
            version=max_card_version + 1,
            parent_card_id=root_card_id,
        )
        session.add(new_card)

    session.commit()
    session.refresh(new_ability)
    return new_ability


@app.delete("/keyword-abilities/{ability_id}", tags=["keyword-abilities"])
def delete_keyword_ability(ability_id: int, session: Session = Depends(get_session)):
    """Delete a keyword ability and all its versions."""
    ability = session.get(KeywordAbility, ability_id)
    if not ability:
        raise HTTPException(status_code=404, detail="Keyword ability not found")

    root_id = ability.parent_ability_id if ability.parent_ability_id else ability.id
    
    # Delete all versions
    all_versions_stmt = select(KeywordAbility).where(
        or_(
            KeywordAbility.id == root_id,
            KeywordAbility.parent_ability_id == root_id
        )
    )
    all_versions = session.exec(all_versions_stmt).all()
    for version in all_versions:
        session.delete(version)
    
    session.commit()
    return {"ok": True}


@app.get("/keyword-abilities/{ability_id}/versions", response_model=List[KeywordAbilityRead], tags=["keyword-abilities"])
def get_keyword_ability_versions(ability_id: int, session: Session = Depends(get_session)):
    """Get all versions of a keyword ability."""
    ability = session.get(KeywordAbility, ability_id)
    if not ability:
        raise HTTPException(status_code=404, detail="Keyword ability not found")

    root_id = ability.parent_ability_id if ability.parent_ability_id else ability.id
    
    statement = select(KeywordAbility).where(
        or_(
            KeywordAbility.id == root_id,
            KeywordAbility.parent_ability_id == root_id
        )
    ).order_by(KeywordAbility.version.desc())
    
    return session.exec(statement).all()


@app.post("/keyword-abilities/{ability_id}/versions/{version}/restore", response_model=KeywordAbilityRead, tags=["keyword-abilities"])
def restore_keyword_ability_version(
    ability_id: int,
    version: int,
    session: Session = Depends(get_session)
):
    """
    Restore a specific version of a keyword ability as current.
    Also creates new versions of all cards using this ability (CASCADE).
    """
    ability = session.get(KeywordAbility, ability_id)
    if not ability:
        raise HTTPException(status_code=404, detail="Keyword ability not found")

    root_ability_id = ability.parent_ability_id if ability.parent_ability_id else ability.id

    # Get the version to restore
    version_stmt = select(KeywordAbility).where(
        and_(
            or_(
                KeywordAbility.id == root_ability_id,
                KeywordAbility.parent_ability_id == root_ability_id
            ),
            KeywordAbility.version == version
        )
    )
    version_to_restore = session.exec(version_stmt).first()
    if not version_to_restore:
        raise HTTPException(status_code=404, detail="Version not found")

    # Get current version
    current_stmt = select(KeywordAbility).where(
        and_(
            or_(
                KeywordAbility.id == root_ability_id,
                KeywordAbility.parent_ability_id == root_ability_id
            ),
            KeywordAbility.is_current == True
        )
    )
    current_ability = session.exec(current_stmt).first()

    # Mark current as non-current
    if current_ability:
        current_ability.is_current = False
        session.add(current_ability)

    # Find max version
    all_versions_stmt = select(KeywordAbility).where(
        or_(
            KeywordAbility.id == root_ability_id,
            KeywordAbility.parent_ability_id == root_ability_id
        )
    )
    all_versions = session.exec(all_versions_stmt).all()
    max_version = max([v.version for v in all_versions])

    # Create new current version (copy of restored version)
    restored_ability = KeywordAbility(
        name=version_to_restore.name,
        text=version_to_restore.text,
        is_current=True,
        version=max_version + 1,
        parent_ability_id=root_ability_id,
    )

    session.add(restored_ability)
    session.flush()

    # Helper function to resolve an ability reference to its current version
    def resolve_ability_reference(ability_data):
        ability_id = ability_data.get("ability_id")
        if not ability_id:
            return ability_data
            
        old_ability = session.get(KeywordAbility, ability_id)
        if not old_ability:
            return ability_data
            
        # Find root and get current version
        root_id = old_ability.parent_ability_id if old_ability.parent_ability_id else old_ability.id
        
        # If this is the ability we're restoring, use the restored version
        if root_id == root_ability_id:
            return {
                "ability_id": restored_ability.id,
                "name": restored_ability.name,
                "text": restored_ability.text,
            }
        
        # Otherwise, use the current version of this other ability
        current_other_stmt = select(KeywordAbility).where(
            and_(
                or_(
                    KeywordAbility.id == root_id,
                    KeywordAbility.parent_ability_id == root_id
                ),
                KeywordAbility.is_current == True
            )
        )
        current_other = session.exec(current_other_stmt).first()
        
        if current_other:
            return {
                "ability_id": current_other.id,
                "name": current_other.name,
                "text": current_other.text,
            }
        
        return ability_data

    # CASCADE: Update all current cards using this ability
    all_current_cards_stmt = select(Card).where(Card.is_current == True)
    all_current_cards = session.exec(all_current_cards_stmt).all()

    affected_cards = []
    for card in all_current_cards:
        for ability_data in card.cardAbilities:
            if ability_data.get("ability_id"):
                # Check if this ability links to our root ability
                check_ability = session.get(KeywordAbility, ability_data.get("ability_id"))
                if check_ability:
                    check_root = check_ability.parent_ability_id if check_ability.parent_ability_id else check_ability.id
                    if check_root == root_ability_id:
                        affected_cards.append(card)
                        break

    for old_card in affected_cards:
        old_card.is_current = False
        session.add(old_card)

        root_card_id = old_card.parent_card_id if old_card.parent_card_id else old_card.id
        
        all_card_versions_stmt = select(Card).where(
            or_(
                Card.id == root_card_id,
                Card.parent_card_id == root_card_id
            )
        )
        all_card_versions = session.exec(all_card_versions_stmt).all()
        max_card_version = max([v.version for v in all_card_versions])

        # Update ALL ability references to use current versions
        updated_abilities = [resolve_ability_reference(a) for a in old_card.cardAbilities]

        new_card = Card(
            name=old_card.name,
            cost=old_card.cost,
            fi=old_card.fi,
            hp=old_card.hp,
            godDmg=old_card.godDmg,
            creatureDmg=old_card.creatureDmg,
            dmg=old_card.dmg,
            speed=old_card.speed,
            statTotal=old_card.statTotal,
            type=old_card.type,
            pantheon=old_card.pantheon,
            archetype=old_card.archetype,
            tags=old_card.tags,
            abilities=old_card.abilities,
            passives=old_card.passives,
            cardText=old_card.cardText,
            cardAbilities=updated_abilities,
            is_current=True,
            version=max_card_version + 1,
            parent_card_id=root_card_id,
        )
        session.add(new_card)

    session.commit()
    session.refresh(restored_ability)
    return restored_ability
