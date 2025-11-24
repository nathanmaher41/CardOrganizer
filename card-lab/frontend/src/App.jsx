import { useEffect, useMemo, useState } from "react";
import SidebarFilters from "./components/SidebarFilters";
import CardGrid from "./components/CardGrid";
import CardModal from "./components/CardModal";
import CardPreviewModal from "./components/CardPreviewModal";
import PassiveManager from "./components/PassiveManager";


import {
  fetchCards,
  createCard,
  updateCard,
  deleteCard,
  fetchPantheons,
  fetchArchetypes,
  fetchPassives,
  fetchAbilityTimings,
  createAbilityTiming,
  createPassive,
  updatePassive,
  deletePassiveApi,
} from "./api";

export default function App() {
  const [cards, setCards] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPantheon, setFilterPantheon] = useState("");
  const [filterArchetype, setFilterArchetype] = useState("");

  const [pantheons, setPantheons] = useState([]);
  const [archetypes, setArchetypes] = useState([]);
  const [abilityTimings, setAbilityTimings] = useState([]);
  const [passiveGroups, setPassiveGroups] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null); // null = create mode
  const [previewCard, setPreviewCard] = useState(null);

  const [page, setPage] = useState("cards");
  const [passives, setPassives] = useState([]);



  /* --------------------------
   * Initial load from backend
   * -------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const [
          cardsData,
          pantheonData,
          archetypeData,
          passiveData,
          abilityTimingData,
        ] = await Promise.all([
          fetchCards(),
          fetchPantheons(),
          fetchArchetypes(),
          fetchPassives(),
          fetchAbilityTimings(),
        ]);

        setCards(cardsData);
        setPantheons(pantheonData.map((p) => p.name));
        setArchetypes(archetypeData.map((a) => a.name));

        setPassives(passiveData);
        const groups = Array.from(new Set(passiveData.map((p) => p.group_name)));
        setPassiveGroups(groups);

        // Ability timings from DB (fallback to defaults if DB is empty)
        const timingNames = abilityTimingData.map((t) => t.name);
        if (timingNames.length > 0) {
          setAbilityTimings(timingNames);
        } else {
          setAbilityTimings([
            "On Reveal",
            "Ongoing",
            "Start of Turn",
            "End of Turn",
          ]);
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
      }
    })();
  }, []);

  /* --------------------------
   * Filtering
   * -------------------------- */

  const handleCreatePassive = async (passiveData) => {
    try {
      const saved = await createPassive(passiveData);
      setPassives((prev) => [...prev, saved]);
    } catch (err) {
      console.error(err);
      alert("Error creating passive: " + err.message);
    }
  };

  const handleUpdatePassive = async (id, passiveData) => {
    try {
      const updated = await updatePassive(id, passiveData);
      setPassives((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
    } catch (err) {
      console.error(err);
      alert("Error updating passive: " + err.message);
    }
  };

  const handleDeletePassive = async (id) => {
    try {
      await deletePassiveApi(id);
      setPassives((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting passive: " + err.message);
    }
  };

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (
        searchTerm &&
        !card.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (filterPantheon && card.pantheon !== filterPantheon) {
        return false;
      }
      if (filterArchetype && card.archetype !== filterArchetype) {
        return false;
      }
      return true;
    });
  }, [cards, searchTerm, filterPantheon, filterArchetype]);

  /* --------------------------
   * Create / Edit / Delete
   * -------------------------- */

  // Create
  const handleCreateCard = async (cardData) => {
    try {
      const saved = await createCard(cardData);
      setCards((prev) => [...prev, saved]);
      setIsCreateModalOpen(false);
      setEditingCard(null);
    } catch (err) {
      console.error(err);
      alert("Error creating card: " + err.message);
    }
  };

  // Edit (save changes)
  const handleUpdateCard = async (cardData) => {
    if (!editingCard) return;
    try {
      const updated = await updateCard(editingCard.id, cardData);
      setCards((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setIsCreateModalOpen(false);
      setEditingCard(null);
      setPreviewCard(updated); // optionally reopen / update preview
    } catch (err) {
      console.error(err);
      alert("Error updating card: " + err.message);
    }
  };

  // Delete (called from CardModal after user confirms)
  const handleDeleteCard = async (card) => {
    if (!card?.id) return;
    try {
      await deleteCard(card.id);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      setIsCreateModalOpen(false);
      setEditingCard(null);
      setPreviewCard(null);
    } catch (err) {
      console.error(err);
      alert("Error deleting card: " + err.message);
    }
  };

  // Wrapper so CardModal just calls onSave, and we decide create vs edit
  const handleSaveFromModal = (cardData) => {
    if (editingCard) {
      return handleUpdateCard(cardData);
    }
    return handleCreateCard(cardData);
  };

  /* --------------------------
   * Dropdown adders (frontend-only for now)
   * -------------------------- */
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

  const handleAddAbilityTiming = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      const created = await createAbilityTiming(trimmed);
      if (!created) return;

      if (!abilityTimings.includes(created.name)) {
        setAbilityTimings((prev) => [...prev, created.name]);
      }
      return created.name;
    } catch (err) {
      console.error("Error creating ability timing:", err);
      // Optional: fallback to local-only if backend fails
      if (!abilityTimings.includes(trimmed)) {
        setAbilityTimings((prev) => [...prev, trimmed]);
      }
      return trimmed;
    }
  };

  /* --------------------------
   * Render
   * -------------------------- */

  return (
    <div className="min-h-screen flex flex-col py-8 w-full">
      <div className="w-full px-4">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur rounded-2xl shadow-lg px-6 py-4 flex items-center justify-between mb-6 w-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-1 to-brand-2 shadow-lg" />
              <h1 className="text-2xl font-semibold text-slate-900">Card Lab</h1>
            </div>

            <button
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 hover:border-brand-3 hover:text-brand-3"
              onClick={() => setPage("passives")}
            >
              Passives
            </button>

            <button
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 hover:border-brand-3 hover:text-brand-3"
              onClick={() => setPage("cards")}
            >
              Cards
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Gods only for now – spells/creatures later
          </div>
        </header>

        {/* Main content: sidebar + cards */}
        <main className="bg-slate-50/90 backdrop-blur rounded-2xl shadow-lg p-4 md:p-6">
          {page === "cards" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-4 md:gap-6">
                {/* Sidebar */}
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

                {/* Right column – controls + card grid */}
                <section className="bg-white rounded-xl shadow-sm p-4 md:p-6 min-h-[260px] flex flex-col w-full">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">
                        Cards
                      </h2>
                      <p className="text-xs text-slate-500">
                        {filteredCards.length} shown · {cards.length} total
                      </p>
                    </div>
                    <button
                      className="inline-flex items-center justify-center px-4 py-2 rounded-full 
                                bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm 
                                font-medium shadow-md hover:shadow-lg transition"
                      onClick={() => {
                        setEditingCard(null); // create mode
                        setIsCreateModalOpen(true);
                      }}
                    >
                      + Create Card
                    </button>
                  </div>

                  <div className="flex-1 min-h-[200px]">
                    <CardGrid
                      cards={filteredCards}
                      onCardClick={setPreviewCard}
                    />
                  </div>
                </section>
              </div>
            </>
          ) : (
            <PassiveManager
              passives={passives}
              pantheons={pantheons}
              archetypes={archetypes}
              onCreate={handleCreatePassive}
              onUpdate={handleUpdatePassive}
              onDelete={handleDeletePassive}
            />
          )}
        </main>
      </div>

      {/* Create / Edit Card Modal */}
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
          onSave={handleSaveFromModal}
          onDelete={handleDeleteCard}       // NEW
          initialCard={editingCard}         // NEW: edit mode data
        />
      )}

      {/* Card Preview Modal */}
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
