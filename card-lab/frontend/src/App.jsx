import { useMemo, useState } from "react";
import SidebarFilters from "./components/SidebarFilters";
import CardGrid from "./components/CardGrid";
import CardModal from "./components/CardModal";
import CardPreviewModal from "./components/CardPreviewModal";

const initialPantheons = ["Greek", "Norse", "Shinto", "Aztec"];
const initialArchetypes = ["Sea", "Sky", "Sun"];
const initialAbilityTimings = [
  "On Reveal",
  "Ongoing",
  "Start of Turn",
  "End of Turn",
];
const initialPassiveGroups = [
  "Norse passive",
  "Greek passive",
  "Underworld passive",
];

export default function App() {
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPantheon, setFilterPantheon] = useState("");
  const [filterArchetype, setFilterArchetype] = useState("");

  const [pantheons, setPantheons] = useState(initialPantheons);
  const [archetypes, setArchetypes] = useState(initialArchetypes);
  const [abilityTimings, setAbilityTimings] = useState(initialAbilityTimings);  
  const [passiveGroups, setPassiveGroups] = useState(initialPassiveGroups);


  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState(null);

  // Filter cards based on sidebar filters
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

  // CRUD-ish handlers (for now, local-only)
  const handleCreateCard = (cardData) => {
    const newCard = {
      id: Date.now(), // temporary; later use DB id
      ...cardData,
    };
    setCards((prev) => [...prev, newCard]);
    setIsCreateModalOpen(false);
  };

  const handleAddPantheon = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!pantheons.includes(trimmed)) {
      setPantheons((prev) => [...prev, trimmed]);
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


  const handleAddArchetype = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!archetypes.includes(trimmed)) {
      setArchetypes((prev) => [...prev, trimmed]);
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

  return (
    <div className="min-h-screen flex flex-col py-8 w-full">
      <div className="w-full px-4">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur rounded-2xl shadow-lg px-6 py-4 flex items-center justify-between mb-6 w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-1 to-brand-2 shadow-lg" />
                <h1 className="text-2xl font-semibold text-slate-900">Card Lab</h1>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Gods only for now – spells/creatures later
          </div>
        </header>

        {/* Main content: sidebar + cards */}
        <main className="bg-slate-50/90 backdrop-blur rounded-2xl shadow-lg p-4 md:p-6">
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
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  + Create Card
                </button>
              </div>

              <div className="flex-1 min-h-[200px]">
                <CardGrid cards={filteredCards} onCardClick={setPreviewCard} />
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Create Card Modal */}
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
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateCard}
        />
      )}

      {/* Card Preview Modal */}
      {previewCard && (
        <CardPreviewModal
          card={previewCard}
          onClose={() => setPreviewCard(null)}
        />
      )}
    </div>
  );
}
