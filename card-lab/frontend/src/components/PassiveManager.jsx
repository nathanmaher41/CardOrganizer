import { useMemo, useState } from "react";
import PassiveModal from "./PassiveModal";

export default function PassiveManager({
  passives,
  pantheons,
  archetypes,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPassive, setEditingPassive] = useState(null);

  const filteredPassives = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return passives;

    return passives.filter((p) => {
      const name = p.name?.toLowerCase() ?? "";
      const group = p.group_name?.toLowerCase() ?? "";
      const pantheon = p.pantheon?.toLowerCase() ?? "";
      const archetype = p.archetype?.toLowerCase() ?? "";
      return name.includes(term) || group.includes(term) || pantheon.includes(term) || archetype.includes(term);
    });
  }, [passives, search]);

  const handleCreateClick = () => {
    setEditingPassive(null);
    setIsModalOpen(true);
  };

  const handlePassiveClick = (passive) => {
    setEditingPassive(passive);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPassive(null);
  };

  const handleSave = async (data) => {
    if (editingPassive) {
      await onUpdate(editingPassive.id, data);
    } else {
      await onCreate(data);
    }
    handleCloseModal();
  };

  const handleDelete = async (passive) => {
    if (!passive?.id) return;
    await onDelete(passive.id);
    handleCloseModal();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 min-h-[400px] flex flex-col w-full">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Passives</h2>
          <p className="text-xs text-slate-500">{filteredPassives.length} shown · {passives.length} total</p>
        </div>
        <button
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition"
          onClick={handleCreateClick}
        >
          + Create Passive
        </button>
      </div>

      {/* Search - full width */}
      <div className="mb-4">
        <input
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-brand-3/60"
          placeholder="Search by name, group, pantheon, archetype..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Passives grid - fills the space */}
      <div className="flex-1 overflow-y-auto">
        {filteredPassives.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <p className="text-slate-500 text-sm font-medium">No passives found.</p>
            <p className="text-slate-400 text-xs mt-1">Try changing your search or create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPassives.map((p) => (
              <button
                key={p.id}
                className="text-left p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-3 hover:bg-brand-3/5 hover:shadow-md hover:-translate-y-0.5 transition flex flex-col gap-2"
                onClick={() => handlePassiveClick(p)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{p.name}</h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      {p.group_name}
                      {p.pantheon ? ` · ${p.pantheon}` : ""}
                      {p.archetype ? ` · ${p.archetype}` : ""}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">Edit →</span>
                </div>
                {p.text && (
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">{p.text}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <PassiveModal
          initialPassive={editingPassive}
          pantheons={pantheons}
          archetypes={archetypes}
          onSave={handleSave}
          onDelete={editingPassive ? () => handleDelete(editingPassive) : null}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}