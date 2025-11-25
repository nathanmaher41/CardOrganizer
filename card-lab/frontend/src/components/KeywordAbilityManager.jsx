import { useMemo, useState } from "react";
import KeywordAbilityModal from "./KeywordAbilityModal";

export default function KeywordAbilityManager({
  abilities,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAbility, setEditingAbility] = useState(null);

  const filteredAbilities = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return abilities;

    return abilities.filter((a) => {
      const name = a.name?.toLowerCase() ?? "";
      const text = a.text?.toLowerCase() ?? "";
      return name.includes(term) || text.includes(term);
    });
  }, [abilities, search]);

  const handleCreateClick = () => {
    setEditingAbility(null);
    setIsModalOpen(true);
  };

  const handleAbilityClick = (ability) => {
    setEditingAbility(ability);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAbility(null);
  };

  const handleSave = async (data) => {
    if (editingAbility) {
      await onUpdate(editingAbility.id, data);
    } else {
      await onCreate(data);
    }
    handleCloseModal();
  };

  const handleDelete = async (ability) => {
    if (!ability?.id) return;
    await onDelete(ability.id);
    handleCloseModal();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 min-h-[400px] flex flex-col w-full">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Keyword Abilities</h2>
          <p className="text-xs text-slate-500">{filteredAbilities.length} shown · {abilities.length} total</p>
        </div>
        <button
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition"
          onClick={handleCreateClick}
        >
          + Create Keyword Ability
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-brand-3/60"
          placeholder="Search by name or text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Abilities grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredAbilities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <p className="text-slate-500 text-sm font-medium">No keyword abilities found.</p>
            <p className="text-slate-400 text-xs mt-1">Create abilities like "Reach", "Guardian", etc.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAbilities.map((ability) => (
              <button
                key={ability.id}
                className="text-left p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-3 hover:bg-brand-3/5 hover:shadow-md hover:-translate-y-0.5 transition flex flex-col gap-2"
                onClick={() => handleAbilityClick(ability)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">{ability.name}</h3>
                  <span className="text-[11px] text-slate-400 shrink-0">Edit →</span>
                </div>
                {ability.text && (
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">{ability.text}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <KeywordAbilityModal
          initialAbility={editingAbility}
          onSave={handleSave}
          onDelete={editingAbility ? () => handleDelete(editingAbility) : null}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}