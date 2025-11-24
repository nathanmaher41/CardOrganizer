import { useEffect, useMemo, useState } from "react";
import SidebarFilters from "./components/SidebarFilters";
import CardGrid from "./components/CardGrid";
import CardModal from "./components/CardModal";
import CardPreviewModal from "./components/CardPreviewModal";

// API
import {
  fetchCards,
  createCard,
  updateCard,
  fetchPantheons,
  fetchArchetypes,
  fetchPassives,
} from "./api";

export default function App() {
  /* ============================
   * STATE
   * ============================ */

  const [cards, setCards] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPantheon, setFilterPantheon] = useState("");
  const [filterArchetype, setFilterArchetype] = useState("");

  const [pantheons, setPantheons] = useState([]);
  const [archetypes, setArchetypes] = useState([]);
  const [abilityTimings, setAbilityTimings] = useState([
    "On Reveal",
    "Ongoing",
    "Start of Turn",
    "End of Turn",
  ]);

  const [passiveGroups, setPassiveGroups] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null); // NEW: edit flow
  const [previewCard, setPreviewCard] = useState(null);

  /* ============================
   * INITIAL LOAD
   * ============================ */

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    try {
      const [cardsData, pantheonData, archetypeData, passiveData] =
        await Promise.all([
          fetchCards(),
          fetchPantheons(),
          fetchArchetypes(),
          fetchPassives(),
        ]);

      setCards(cardsData);
      setPantheons(pantheonData.map((p) => p.name));
      setArchetypes(archetypeData.map((a) => a.name));

      // Passive groups (unique)
      const groups = Array.from(
        new Set(passiveData.map((p) => p.group_name))
      );
      setPassiveGroups(groups);
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  }

  /* ============================
   * FILTERED CARDS
   * ============================ */

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (
        searchTerm &&
        !card.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;

      if (filterPantheon && card.pantheon !== filterPantheon) return false;
      if (filterArchetype && card.archetype !== filterArchetype) return false;

      return true;
    });
  }, [cards, searchTerm, filterPantheon, filterArchetype]);

  /* ============================
   * CREATE
   * ============================ */

  async function handleCreateCard(cardData) {
    try {
      const saved = await createCard(cardData);
      setCards((prev) => [...prev, saved]);
      setIsCreateModalOpen(false);
    } catch (err) {
      alert("Error creating card: " + err.message);
    }
  }

  /* ============================
   * EDIT
   * ============================ */

  function openEditCard(card) {
    setEditingCard(card);
    setIsCreateModalOpen(true);
  }

  async function handleUpdateCard(cardData) {
    try {
      const updated = await updateCard(editingCard.id, cardData);

      setCards((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );

      setIsCreateModalOpen(false);
      setEditingCard(null);
    } catch (err) {
      alert("Error updating card: " + err.message);
    }
  }

  /* ============================
   * ADDING DROPDOWN ITEMS (Frontend only for now)
   * ============================ */

  const handleAddPantheon = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!pantheons.includes(trimmed)) {
      setPantheons((prev) => [...prev, trimmed]);
    }
    return trimmed;
  };

  const handleAddArchetype = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!archetypes.includes(trimmed)) {
      setArchetypes((prev) => [...prev, trimmed]);
    }
    return trimmed;
  };

  const handleAddPassiveGroup = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!passiveGroups.includes(trimmed)) {
      setPassiveGroups((prev) => [...prev, trimmed]);
    }
    return trimmed;
  };

  const handleAddAbilityTiming = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!abilityTimings.includes(trimmed)) {
      setAbilityTimings((prev) => [...prev, trimmed]);
    }
    return trimmed;
  };

  /* ============================
   * RENDER
   * ============================ */

  return (
    <div className="min-h-screen flex flex-col py-8 w-full">
      <div className="w-full px-4">
        {/* HEADER */}
        <header className="bg-white/90 backdrop-blur rounded-2xl shadow-lg px-6 py-4 flex items-center justify-between mb-6 w-full">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-1 to-brand-2 shadow-lg" />
            <h1 className="text-2xl font-semibold text-slate-900">Card Lab</h1>
          </div>
          <div className="text-xs text-slate-500">
            Gods only for now — spells/creatures later
          </div>
        </header>

        {/* MAIN */}
        <main className="bg-slate-50/90 backdrop-blur rounded-2xl shadow-lg p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-4 md:gap-6">
            {/* SIDEBAR */}
            <SidebarFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              pantheons={pantheons}
              archetypes={archetypes}
              filterPantheon={filterPantheon}
              filterArchetype={filterArchetype}
              onPantheonFilterChange={setFilterPantheon}
              onArchetypeFilterChange={setFilterArchetype}
            />

            {/* CARD AREA */}
            <section className="bg-white rounded-xl shadow-sm p-4 md:p-6 min-h-[260px] flex flex-col w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Cards</h2>
                  <p className="text-xs text-slate-500">
                    {filteredCards.length} shown · {cards.length} total
                  </p>
                </div>

                <button
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full 
                  bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm 
                  font-medium shadow-md hover:shadow-lg transition"
                  onClick={() => {
                    setEditingCard(null);
                    setIsCreateModalOpen(true);
                  }}
                >
                  + Create Card
                </button>
              </div>

              <div className="flex-1 min-h-[200px]">
                <CardGrid
                  cards={filteredCards}
                  onCardClick={(card) => {
                    setPreviewCard(card);
                  }}
                  onEditCard={openEditCard}
                />
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isCreateModalOpen && (
        <CardModal
          pantheons={pantheons}
          archetypes={archetypes}
          abilityTimings={abilityTimings}
          passiveGroups={passiveGroups}
          onAddPantheon={handleAddPantheon}
          onAddArchetype={handleAddArchetype}
          onAddAbilityTiming={handleAddAbilityTiming}
          onAddPassiveGroup={handleAddPassiveGroup}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingCard(null);
          }}
          onSave={editingCard ? handleUpdateCard : handleCreateCard}
          existingCard={editingCard} // NEW
        />
      )}

      {/* PREVIEW MODAL */}
      {previewCard && (
        <CardPreviewModal
          card={previewCard}
          onClose={() => setPreviewCard(null)}
          onEdit={() => {
            setEditingCard(previewCard);
            setIsCreateModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
