import { useState, useMemo } from "react";

export default function SidebarFilters({
  searchTerm,
  onSearchChange,
  pantheons,
  archetypes,
  tags,
  onApplyFilters,
}) {
  const [filterMode, setFilterMode] = useState("or"); // "and" or "or"
  const [selectedPantheons, setSelectedPantheons] = useState([]);
  const [selectedArchetypes, setSelectedArchetypes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCardTypes, setSelectedCardTypes] = useState([]);
  const [selectedSpellSpeeds, setSelectedSpellSpeeds] = useState([]);

  // Stat ranges
  const [costRange, setCostRange] = useState([0, 10]);
  const [fiRange, setFiRange] = useState([0, 40]);
  const [hpRange, setHpRange] = useState([0, 40]);
  const [godDmgRange, setGodDmgRange] = useState([0, 40]);
  const [creatureDmgRange, setCreatureDmgRange] = useState([0, 40]);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const togglePantheon = (pantheon) => {
    setSelectedPantheons((prev) =>
      prev.includes(pantheon) ? prev.filter((p) => p !== pantheon) : [...prev, pantheon]
    );
  };

  const toggleArchetype = (archetype) => {
    setSelectedArchetypes((prev) =>
      prev.includes(archetype) ? prev.filter((a) => a !== archetype) : [...prev, archetype]
    );
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleCardType = (cardType) => {
    setSelectedCardTypes((prev) =>
      prev.includes(cardType) ? prev.filter((t) => t !== cardType) : [...prev, cardType]
    );
  };

  const toggleSpellSpeed = (speed) => {
    setSelectedSpellSpeeds((prev) =>
      prev.includes(speed) ? prev.filter((s) => s !== speed) : [...prev, speed]
    );
  };

  const handleApplyFilters = () => {
    onApplyFilters({
      search: searchTerm,
      pantheons: selectedPantheons,
      archetypes: selectedArchetypes,
      tags: selectedTags,
      cardTypes: selectedCardTypes,
      spellSpeeds: selectedSpellSpeeds,
      filterMode,
      minCost: costRange[0],
      maxCost: costRange[1],
      minFi: fiRange[0],
      maxFi: fiRange[1],
      minHp: hpRange[0],
      maxHp: hpRange[1],
      minGodDmg: godDmgRange[0],
      maxGodDmg: godDmgRange[1],
      minCreatureDmg: creatureDmgRange[0],
      maxCreatureDmg: creatureDmgRange[1],
    });
  };

  const handleClearFilters = () => {
    setSelectedPantheons([]);
    setSelectedArchetypes([]);
    setSelectedTags([]);
    setSelectedCardTypes([]);
    setSelectedSpellSpeeds([]);
    setCostRange([0, 10]);
    setFiRange([0, 40]);
    setHpRange([0, 40]);
    setGodDmgRange([0, 40]);
    setCreatureDmgRange([0, 40]);
    onSearchChange("");
    onApplyFilters({
        search: "",
        pantheons: [],
        archetypes: [],
        tags: [],
        cardTypes: [],
        spellSpeeds: [],
        filterMode: "or",
        minCost: 0,
        maxCost: 10,
        minFi: 0,
        maxFi: 10,
        minHp: 0,
        maxHp: 10,
        minGodDmg: 0,
        maxGodDmg: 10,
        minCreatureDmg: 0,
        maxCreatureDmg: 10,
    });
  };

  const hasActiveFilters =
    selectedPantheons.length > 0 ||
    selectedArchetypes.length > 0 ||
    selectedTags.length > 0 ||
    selectedCardTypes.length > 0 ||
    selectedSpellSpeeds.length > 0 ||
    searchTerm ||
    costRange[0] > 0 ||
    costRange[1] < 10 ||
    fiRange[0] > 0 ||
    fiRange[1] < 10 ||
    hpRange[0] > 0 ||
    hpRange[1] < 10 ||
    godDmgRange[0] > 0 ||
    godDmgRange[1] < 10 ||
    creatureDmgRange[0] > 0 ||
    creatureDmgRange[1] < 10;

  return (
    <aside className="bg-white rounded-xl shadow-sm p-4 h-fit sticky top-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
        {hasActiveFilters && (
          <button
            className="text-xs text-red-500 hover:text-red-600"
            onClick={handleClearFilters}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Search</label>
        <input
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-brand-3/60"
          placeholder="Card name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Mode Toggle */}
      <div className="mb-4">
        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Filter Mode</label>
        <div className="flex gap-2">
          <button
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterMode === "or"
                ? "bg-brand-3 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={() => setFilterMode("or")}
          >
            OR (Any)
          </button>
          <button
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterMode === "and"
                ? "bg-brand-3 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={() => setFilterMode("and")}
          >
            AND (All)
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {filterMode === "or" ? "Match any selected filter" : "Match all selected filters"}
        </p>
      </div>

      {/* Card Types */}
      <div className="mb-4">
        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Card Types</label>
        <div className="space-y-1.5">
          {["God", "Creature", "Weapon", "Armor", "Enchanted Item", "Spell"].map((cardType) => (
            <label key={cardType} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-3 focus:ring-brand-3"
                checked={selectedCardTypes.includes(cardType)}
                onChange={() => toggleCardType(cardType)}
              />
              <span className="text-xs text-slate-700">{cardType}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Spell Speeds (only show if Spell is selected) */}
      {selectedCardTypes.includes("Spell") && (
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">Spell Speed</label>
          <div className="space-y-1.5">
            {["Fast", "Slow", "Instant"].map((speed) => (
              <label key={speed} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand-3 focus:ring-brand-3"
                  checked={selectedSpellSpeeds.includes(speed)}
                  onChange={() => toggleSpellSpeed(speed)}
                />
                <span className="text-xs text-slate-700">{speed}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Pantheons */}
      <div className="mb-4">
        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Pantheons</label>
        <div className="space-y-1.5">
          {pantheons.map((pantheon) => (
            <label key={pantheon} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-3 focus:ring-brand-3"
                checked={selectedPantheons.includes(pantheon)}
                onChange={() => togglePantheon(pantheon)}
              />
              <span className="text-xs text-slate-700">{pantheon}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Archetypes */}
      <div className="mb-4">
        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Archetypes</label>
        <div className="space-y-1.5">
          {archetypes.map((archetype) => (
            <label key={archetype} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-3 focus:ring-brand-3"
                checked={selectedArchetypes.includes(archetype)}
                onChange={() => toggleArchetype(archetype)}
              />
              <span className="text-xs text-slate-700">{archetype}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">Tags</label>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand-3 focus:ring-brand-3"
                  checked={selectedTags.includes(tag.name)}
                  onChange={() => toggleTag(tag.name)}
                />
                <span className="text-xs text-slate-700">{tag.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Stats Toggle */}
      <button
        className="w-full mb-3 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? "Hide" : "Show"} Stat Filters
      </button>

      {/* Advanced Stat Filters */}
      {showAdvanced && (
        <div className="space-y-3 mb-4">
          <RangeSlider label="Cost" min={0} max={10} value={costRange} onChange={setCostRange} />
          <RangeSlider label="FI" min={0} max={40} value={fiRange} onChange={setFiRange} />
          <RangeSlider label="HP" min={0} max={40} value={hpRange} onChange={setHpRange} />
          <RangeSlider label="God Dmg" min={0} max={40} value={godDmgRange} onChange={setGodDmgRange} />
          <RangeSlider label="Creature Dmg" min={0} max={40} value={creatureDmgRange} onChange={setCreatureDmgRange} />
        </div>
      )}

      {/* Apply Button */}
      <button
        className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition"
        onClick={handleApplyFilters}
      >
        Apply Filters
      </button>
    </aside>
  );
}

function RangeSlider({ label, min, max, value, onChange }) {
  const handleMinChange = (e) => {
    const newMin = parseInt(e.target.value);
    if (newMin <= value[1]) {
      onChange([newMin, value[1]]);
    }
  };

  const handleMaxChange = (e) => {
    const newMax = parseInt(e.target.value);
    if (newMax >= value[0]) {
      onChange([value[0], newMax]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        <span className="text-xs text-slate-500">
          {value[0]} - {value[1]}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={handleMinChange}
          className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-3"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={handleMaxChange}
          className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-3"
        />
      </div>
    </div>
  );
}