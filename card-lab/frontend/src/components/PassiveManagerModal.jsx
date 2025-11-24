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
  const [editingPassive, setEditingPassive] = useState(null); // null = create mode

  const filteredPassives = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return passives;

    return passives.filter((p) => {
      const name = p.name?.toLowerCase() ?? "";
      const group = p.group_name?.toLowerCase() ?? "";
      const pantheon = p.pantheon?.toLowerCase() ?? "";
      const archetype = p.archetype?.toLowerCase() ?? "";
      return (
        name.includes(term) ||
        group.includes(term) ||
        pantheon.includes(term) ||
        archetype.includes(term)
      );
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
    // data shape: { group_name, name, text, pantheon, archetype }
    if (editingPassive) {
      await onUpdate(editingPassive.id, data);
    } else {
      await onCreate(data);
    }
    handleCloseModal();
  };

  const handleDelete = async (passive) => {
    if (!passive?.id) return;

    const ok = window.confirm(
      `Delete passive "${passive.name}"? This cannot be undone.`
    );
    if (!ok) return;

    await onDelete(passive.id);
    handleCloseModal();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 min-h-[260px] flex flex-col">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Passives
          </h2>
          <p className="text-xs text-slate-500">
            {filteredPassives.length} shown · {passives.length} total
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center px-4 py-2 rounded-full 
                     bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm 
                     font-medium shadow-md hover:shadow-lg transition"
          onClick={handleCreateClick}
        >
          + Create Passive
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm 
                     focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3 text-black"
          placeholder="Search by name, group, pantheon, archetype..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredPassives.length === 0 ? (
          <div className="text-xs text-slate-400 italic">
            No passives found. Try changing your search or create one.
          </div>
        ) : (
          filteredPassives.map((p) => (
            <button
              key={p.id}
              className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-200 
                         hover:border-brand-3 hover:bg-brand-3/5 transition flex flex-col gap-1"
              onClick={() => handlePassiveClick(p)}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {p.group_name}
                    {p.pantheon ? ` · ${p.pantheon}` : ""}
                    {p.archetype ? ` · ${p.archetype}` : ""}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Edit →</span>
              </div>
              {p.text && (
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {p.text}
                </p>
              )}
            </button>
          ))
        )}
      </div>

      {/* Modal */}
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
