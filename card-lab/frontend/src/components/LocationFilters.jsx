import { useState } from "react";

export default function LocationFilters({
  searchTerm,
  onSearchChange,
  pantheons,
  archetypes,
  onApplyFilters,
}) {
  const [selectedPantheons, setSelectedPantheons] = useState([]);
  const [selectedArchetypes, setSelectedArchetypes] = useState([]);

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

  const handleApplyFilters = () => {
    onApplyFilters({
      search: searchTerm,
      pantheons: selectedPantheons,
      archetypes: selectedArchetypes,
    });
  };

  const handleClearFilters = () => {
    setSelectedPantheons([]);
    setSelectedArchetypes([]);
    onSearchChange("");
    onApplyFilters({
      search: "",
      pantheons: [],
      archetypes: [],
    });
  };

  const hasActiveFilters =
    selectedPantheons.length > 0 ||
    selectedArchetypes.length > 0 ||
    searchTerm;

  return (
    <aside className="bg-white rounded-xl shadow-sm p-3 md:p-4 h-fit lg:sticky lg:top-4 w-full">
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
          placeholder="Location name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Pantheons */}
      {pantheons.length > 0 && (
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
      )}

      {/* Archetypes */}
      {archetypes.length > 0 && (
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