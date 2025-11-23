export default function SidebarFilters({
  searchTerm,
  onSearchChange,
  pantheons,
  archetypes,
  filterPantheon,
  filterArchetype,
  onPantheonFilterChange,
  onArchetypeFilterChange,
}) {
  return (
    <aside className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
      <div className="h-px bg-slate-200" />

      {/* Search */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500">Search</label>
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full rounded-lg border text-black border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        
      </div>

      {/* Pantheon filter */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500">Pantheon</label>
        <select
          className="w-full text-brand-3 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
          value={filterPantheon}
          onChange={(e) => onPantheonFilterChange(e.target.value)}
        >
          <option value="">All pantheons</option>
          {pantheons.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Archetype filter */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500">Archetype</label>
        <select
          className="w-full rounded-lg border text-brand-3 border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
          value={filterArchetype}
          onChange={(e) => onArchetypeFilterChange(e.target.value)}
        >
          <option value="">All archetypes</option>
          {archetypes.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <p className="text-[11px] text-slate-400 italic">
        More filters coming later (cost, FI, HP, tags, etc.).
      </p>
    </aside>
  );
}
