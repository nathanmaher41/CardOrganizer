import { useEffect, useMemo, useState } from "react";
import SidebarFilters from "./components/SidebarFilters";
import CardGrid from "./components/CardGrid";
import CardModal from "./components/CardModal";
import CardPreviewModal from "./components/CardPreviewModal";
import PassiveManager from "./components/PassiveManager";
import PantheonArchetypeManager from "./components/PantheonArchetypeManager";
import TagManager from "./components/TagManager";
import KeywordAbilityManager from "./components/KeyWordAbilityManager";
import LocationsTab from "./components/LocationsTab";

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
  createPantheon,
  updatePantheon,
  deletePantheon,
  createArchetype,
  updateArchetype,
  deleteArchetype,
  fetchTags,
  deleteTag,
  fetchKeywordAbilities,
  createKeywordAbility,
  updateKeywordAbility,
  deleteKeywordAbility,
} from "./api";

export default function App() {
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  
  const [pantheonsData, setPantheonsData] = useState([]);
  const [archetypesData, setArchetypesData] = useState([]);
  const [tagsData, setTagsData] = useState([]);
  
  const [abilityTimings, setAbilityTimings] = useState([]);
  const [passiveGroups, setPassiveGroups] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [previewCard, setPreviewCard] = useState(null);
  
  // Initialize page from URL hash, default to "cards"
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.slice(1); // Remove the '#'
    return hash || "cards";
  });
  
  const [passives, setPassives] = useState([]);
  const [keywordAbilities, setKeywordAbilities] = useState([]);

  const pantheons = useMemo(() => pantheonsData.map((p) => p.name), [pantheonsData]);
  const archetypes = useMemo(() => archetypesData.map((a) => a.name), [archetypesData]);

  // Update URL hash when page changes
  useEffect(() => {
    window.location.hash = page;
  }, [page]);

  // Listen for hash changes (browser back/forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setPage(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [
        cardsData,
        pantheonData,
        archetypeData,
        passiveData,
        abilityTimingData,
        tagsDataRes,
        abilitiesData,
      ] = await Promise.all([
        fetchCards(),
        fetchPantheons(),
        fetchArchetypes(),
        fetchPassives(),
        fetchAbilityTimings(),
        fetchTags(),
        fetchKeywordAbilities(),
      ]);

      setCards(cardsData);
      setPantheonsData(pantheonData);
      setArchetypesData(archetypeData);
      setPassives(passiveData);
      setTagsData(tagsDataRes);
      setKeywordAbilities(abilitiesData);
      
      const groups = Array.from(new Set(passiveData.map((p) => p.group_name)));
      setPassiveGroups(groups);

      const timingNames = abilityTimingData.map((t) => t.name);
      if (timingNames.length > 0) {
        setAbilityTimings(timingNames);
      } else {
        setAbilityTimings(["On Reveal", "Ongoing", "Start of Turn", "End of Turn"]);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  };

  const handleApplyFilters = async (filters) => {
    try {
      setAppliedFilters(filters);
      const cardsData = await fetchCards(filters);
      setCards(cardsData);
    } catch (err) {
      console.error("Error applying filters:", err);
    }
  };

  // ==================== Tag Management ====================
  const handleDeleteTag = async (tagId) => {
    try {
      await deleteTag(tagId);
      setTagsData((prev) => prev.filter((t) => t.id !== tagId));
      // Refresh cards to show updated tag lists
      const cardsData = await fetchCards(appliedFilters);
      setCards(cardsData);
    } catch (err) {
      console.error(err);
      alert("Error deleting tag: " + err.message);
    }
  };

  // ==================== Keyword Ability Management ====================
  const handleCreateKeywordAbility = async (data) => {
    try {
      const newAbility = await createKeywordAbility(data);
      setKeywordAbilities((prev) => [...prev, newAbility]);
    } catch (err) {
      console.error("Error creating keyword ability:", err);
      alert("Error creating keyword ability: " + err.message);
    }
  };

  const handleUpdateKeywordAbility = async (id, data) => {
    try {
      const updated = await updateKeywordAbility(id, data);
      setKeywordAbilities((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      );
      // Reload cards since they may have been updated by cascade
      const cardsData = await fetchCards();
      setCards(cardsData);
    } catch (err) {
      console.error("Error updating keyword ability:", err);
      alert("Error updating keyword ability: " + err.message);
    }
  };

  const handleDeleteKeywordAbility = async (id) => {
    if (!confirm("Delete this keyword ability and all its versions? This cannot be undone.")) return;
    
    try {
      await deleteKeywordAbility(id);
      setKeywordAbilities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting keyword ability:", err);
      alert("Error deleting keyword ability: " + err.message);
    }
  };

  // ==================== Pantheon Management ====================
  const handleCreatePantheon = async (data) => {
    try {
      const saved = await createPantheon(data);
      setPantheonsData((prev) => [...prev, saved]);
      return saved;
    } catch (err) {
      console.error(err);
      alert("Error creating pantheon: " + err.message);
      throw err;
    }
  };

  const handleUpdatePantheon = async (id, data) => {
    try {
      const updated = await updatePantheon(id, data);
      setPantheonsData((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err) {
      console.error(err);
      alert("Error updating pantheon: " + err.message);
      throw err;
    }
  };

  const handleDeletePantheon = async (id) => {
    try {
      await deletePantheon(id);
      setPantheonsData((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting pantheon: " + err.message);
      throw err;
    }
  };

  // ==================== Archetype Management ====================
  const handleCreateArchetype = async (data) => {
    try {
      const saved = await createArchetype(data);
      setArchetypesData((prev) => [...prev, saved]);
      return saved;
    } catch (err) {
      console.error(err);
      alert("Error creating archetype: " + err.message);
      throw err;
    }
  };

  const handleUpdateArchetype = async (id, data) => {
    try {
      const updated = await updateArchetype(id, data);
      setArchetypesData((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err) {
      console.error(err);
      alert("Error updating archetype: " + err.message);
      throw err;
    }
  };

  const handleDeleteArchetype = async (id) => {
    try {
      await deleteArchetype(id);
      setArchetypesData((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting archetype: " + err.message);
      throw err;
    }
  };

  // ==================== Passive Management ====================
  const handleCreatePassive = async (passiveData) => {
    try {
      const saved = await createPassive(passiveData);
      setPassives((prev) => [...prev, saved]);
      
      if (saved.group_name && !passiveGroups.includes(saved.group_name)) {
        setPassiveGroups((prev) => [...prev, saved.group_name]);
      }
      return saved;
    } catch (err) {
      console.error(err);
      alert("Error creating passive: " + err.message);
      throw err;
    }
  };

  const handleUpdatePassive = async (id, passiveData) => {
    try {
      const updated = await updatePassive(id, passiveData);
      setPassives((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err) {
      console.error(err);
      alert("Error updating passive: " + err.message);
      throw err;
    }
  };

  const handleDeletePassive = async (id) => {
    try {
      await deletePassiveApi(id);
      setPassives((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting passive: " + err.message);
      throw err;
    }
  };

  const handlePassiveCreatedFromCardModal = (savedPassive) => {
    const exists = passives.some((p) => p.id === savedPassive.id);
    if (!exists) {
      setPassives((prev) => [...prev, savedPassive]);
      
      if (savedPassive.group_name && !passiveGroups.includes(savedPassive.group_name)) {
        setPassiveGroups((prev) => [...prev, savedPassive.group_name]);
      }
    }
  };

  const handlePantheonCreatedFromCardModal = (saved) => {
    const exists = pantheonsData.some((p) => p.id === saved.id);
    if (!exists) {
      setPantheonsData((prev) => [...prev, saved]);
    }
  };

  const handleArchetypeCreatedFromCardModal = (saved) => {
    const exists = archetypesData.some((a) => a.id === saved.id);
    if (!exists) {
      setArchetypesData((prev) => [...prev, saved]);
    }
  };

  // ==================== Card CRUD ====================
  const handleCreateCard = async (cardData) => {
    try {
      const saved = await createCard(cardData);
      setIsCreateModalOpen(false);
      setEditingCard(null);
      
      // Refresh tags
      const tagsDataRes = await fetchTags();
      setTagsData(tagsDataRes);
      
      // Refresh cards with current filters
      const cardsData = await fetchCards(appliedFilters);
      setCards(cardsData);
    } catch (err) {
      console.error(err);
      alert("Error creating card: " + err.message);
    }
  };

  const handleUpdateCard = async (cardData) => {
    if (!editingCard) return;
    try {
      const updated = await updateCard(editingCard.id, cardData);
      setIsCreateModalOpen(false);
      setEditingCard(null);
      setPreviewCard(updated);
      
      // Refresh tags
      const tagsDataRes = await fetchTags();
      setTagsData(tagsDataRes);
      
      // Refresh cards with current filters
      const cardsData = await fetchCards(appliedFilters);
      setCards(cardsData);
    } catch (err) {
      console.error(err);
      alert("Error updating card: " + err.message);
    }
  };

  const handleDeleteCard = async (card) => {
    if (!card?.id) return;
    try {
      await deleteCard(card.id);
      setIsCreateModalOpen(false);
      setEditingCard(null);
      setPreviewCard(null);
      
      // Refresh cards with current filters
      const cardsData = await fetchCards(appliedFilters);
      setCards(cardsData);
    } catch (err) {
      console.error(err);
      alert("Error deleting card: " + err.message);
    }
  };

  const handleSaveFromModal = (cardData) => {
    if (editingCard) {
      return handleUpdateCard(cardData);
    }
    return handleCreateCard(cardData);
  };

  // ==================== Dropdown adders (fallback) ====================
  const handleAddPantheon = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!pantheons.includes(trimmed)) {
      setPantheonsData((prev) => [...prev, { id: Date.now(), name: trimmed, description: null }]);
    }
    return trimmed;
  };

  const handleAddArchetype = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!archetypes.includes(trimmed)) {
      setArchetypesData((prev) => [...prev, { id: Date.now(), name: trimmed, description: null }]);
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
      if (!abilityTimings.includes(trimmed)) {
        setAbilityTimings((prev) => [...prev, trimmed]);
      }
      return trimmed;
    }
  };

  return (
    <div className="min-h-screen flex flex-col py-8 w-full">
      <div className="w-full px-4">
        <header className="bg-white/90 backdrop-blur rounded-2xl shadow-lg px-6 py-4 flex items-center justify-between mb-6 w-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-1 to-brand-2 shadow-lg" />
              <h1 className="text-2xl font-semibold text-slate-900">Card Lab</h1>
            </div>

            <nav className="flex gap-2">
              <button
                className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                  page === "cards"
                    ? "border-brand-3 text-brand-3 bg-brand-3/5"
                    : "border-slate-300 hover:border-brand-3 hover:text-brand-3"
                }`}
                onClick={() => setPage("cards")}
              >
                Cards
              </button>

              <button
                className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                  page === "locations"
                    ? "border-brand-3 text-brand-3 bg-brand-3/5"
                    : "border-slate-300 hover:border-brand-3 hover:text-brand-3"
                }`}
                onClick={() => setPage("locations")}
              >
                Locations
              </button>

              <button
                className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                  page === "passives"
                    ? "border-brand-3 text-brand-3 bg-brand-3/5"
                    : "border-slate-300 hover:border-brand-3 hover:text-brand-3"
                }`}
                onClick={() => setPage("passives")}
              >
                Passives
              </button>

              <button
                className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                  page === "abilities"
                    ? "border-brand-3 text-brand-3 bg-brand-3/5"
                    : "border-slate-300 hover:border-brand-3 hover:text-brand-3"
                }`}
                onClick={() => setPage("abilities")}
              >
                Abilities
              </button>

              <button
                className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                  page === "pantheons"
                    ? "border-brand-3 text-brand-3 bg-brand-3/5"
                    : "border-slate-300 hover:border-brand-3 hover:text-brand-3"
                }`}
                onClick={() => setPage("pantheons")}
              >
                Pantheons & Archetypes
              </button>

              <button
                className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                  page === "tags"
                    ? "border-brand-3 text-brand-3 bg-brand-3/5"
                    : "border-slate-300 hover:border-brand-3 hover:text-brand-3"
                }`}
                onClick={() => setPage("tags")}
              >
                Tags
              </button>
            </nav>
          </div>
        </header>

        <main className="bg-slate-50/90 backdrop-blur rounded-2xl shadow-lg p-4 md:p-6">
          {page === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-4 md:gap-6">
              <SidebarFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                pantheons={pantheons}
                archetypes={archetypes}
                tags={tagsData}
                onApplyFilters={handleApplyFilters}
              />

              <section className="bg-white rounded-xl shadow-sm p-4 md:p-6 min-h-[260px] flex flex-col w-full">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Cards</h2>
                    <p className="text-xs text-slate-500">{cards.length} cards shown</p>
                  </div>
                  <button
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition"
                    onClick={() => {
                      setEditingCard(null);
                      setIsCreateModalOpen(true);
                    }}
                  >
                    + Create Card
                  </button>
                </div>

                <div className="flex-1 min-h-[200px]">
                  <CardGrid cards={cards} onCardClick={setPreviewCard} />
                </div>
              </section>
            </div>
          )}

          {page === "locations" && <LocationsTab />}

          {page === "passives" && (
            <PassiveManager
              passives={passives}
              pantheons={pantheons}
              archetypes={archetypes}
              onCreate={handleCreatePassive}
              onUpdate={handleUpdatePassive}
              onDelete={handleDeletePassive}
            />
          )}

          {page === "abilities" && (
            <KeywordAbilityManager
              abilities={keywordAbilities}
              onCreate={handleCreateKeywordAbility}
              onUpdate={handleUpdateKeywordAbility}
              onDelete={handleDeleteKeywordAbility}
            />
          )}

          {page === "pantheons" && (
            <PantheonArchetypeManager
              pantheons={pantheonsData}
              archetypes={archetypesData}
              onCreatePantheon={handleCreatePantheon}
              onUpdatePantheon={handleUpdatePantheon}
              onDeletePantheon={handleDeletePantheon}
              onCreateArchetype={handleCreateArchetype}
              onUpdateArchetype={handleUpdateArchetype}
              onDeleteArchetype={handleDeleteArchetype}
            />
          )}

          {page === "tags" && (
            <TagManager tags={tagsData} onDeleteTag={handleDeleteTag} />
          )}
        </main>
      </div>

      {isCreateModalOpen && (
        <CardModal
          pantheons={pantheons}
          archetypes={archetypes}
          abilityTimings={abilityTimings}
          passiveGroups={passiveGroups}
          allPassives={passives}
          allKeywordAbilities={keywordAbilities}
          onAddPantheon={handleAddPantheon}
          onAddArchetype={handleAddArchetype}
          onAddAbilityTiming={handleAddAbilityTiming}
          onAddPassiveGroup={handleAddPassiveGroup}
          onPassiveCreated={handlePassiveCreatedFromCardModal}
          onPantheonCreated={handlePantheonCreatedFromCardModal}
          onArchetypeCreated={handleArchetypeCreatedFromCardModal}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingCard(null);
          }}
          onSave={handleSaveFromModal}
          onDelete={handleDeleteCard}
          initialCard={editingCard}
        />
      )}

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