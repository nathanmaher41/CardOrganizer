import { useMemo, useState } from "react";
import PantheonArchetypeModal from "./PantheonArchetypeModal";

export default function PantheonArchetypeManager({
  pantheons,
  archetypes,
  onCreatePantheon,
  onUpdatePantheon,
  onDeletePantheon,
  onCreateArchetype,
  onUpdateArchetype,
  onDeleteArchetype,
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pantheons"); // "pantheons" or "archetypes"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const items = activeTab === "pantheons" ? pantheons : archetypes;

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      const name = item.name?.toLowerCase() ?? "";
      const description = item.description?.toLowerCase() ?? "";
      return name.includes(term) || description.includes(term);
    });
  }, [items, search]);

  const handleCreateClick = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleItemClick = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (data) => {
    if (activeTab === "pantheons") {
      if (editingItem) {
        await onUpdatePantheon(editingItem.id, data);
      } else {
        await onCreatePantheon(data);
      }
    } else {
      if (editingItem) {
        await onUpdateArchetype(editingItem.id, data);
      } else {
        await onCreateArchetype(data);
      }
    }
    handleCloseModal();
  };

  const handleDelete = async (item) => {
    if (!item?.id) return;
    if (activeTab === "pantheons") {
      await onDeletePantheon(item.id);
    } else {
      await onDeleteArchetype(item.id);
    }
    handleCloseModal();
  };

  const typeLabel = activeTab === "pantheons" ? "Pantheon" : "Archetype";

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 min-h-[400px] flex flex-col w-full">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Pantheons & Archetypes</h2>
          <p className="text-xs text-slate-500">
            {filteredItems.length} {activeTab} shown · {items.length} total
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition"
          onClick={handleCreateClick}
        >
          + Create {typeLabel}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "pantheons"
              ? "bg-brand-3 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          onClick={() => {
            setActiveTab("pantheons");
            setSearch("");
          }}
        >
          Pantheons ({pantheons.length})
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "archetypes"
              ? "bg-brand-3 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          onClick={() => {
            setActiveTab("archetypes");
            setSearch("");
          }}
        >
          Archetypes ({archetypes.length})
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-brand-3/60"
          placeholder={`Search ${activeTab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <p className="text-slate-500 text-sm font-medium">No {activeTab} found.</p>
            <p className="text-slate-400 text-xs mt-1">Try changing your search or create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                className="text-left p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-3 hover:bg-brand-3/5 hover:shadow-md hover:-translate-y-0.5 transition flex flex-col gap-2"
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">{item.name}</h3>
                  <span className="text-[11px] text-slate-400 shrink-0">Edit →</span>
                </div>
                {item.description ? (
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{item.description}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No description</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <PantheonArchetypeModal
          type={activeTab === "pantheons" ? "pantheon" : "archetype"}
          initialItem={editingItem}
          onSave={handleSave}
          onDelete={editingItem ? () => handleDelete(editingItem) : null}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}