import { useState, useMemo } from "react";

export default function TagManager({ tags, onDeleteTag }) {
  const [search, setSearch] = useState("");

  const filteredTags = useMemo(() => {
    if (!search) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()));
  }, [tags, search]);

  const handleDelete = async (tag) => {
    if (!confirm(`Delete tag "${tag.name}"? This will remove it from all cards.`)) return;
    await onDeleteTag(tag.id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 min-h-[400px] flex flex-col w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Tag Manager</h2>
          <p className="text-xs text-slate-500">
            {filteredTags.length} shown · {tags.length} total
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-brand-3/60"
          placeholder="Search tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredTags.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <p className="text-slate-500 text-sm font-medium">No tags found.</p>
            <p className="text-slate-400 text-xs mt-1">Tags are created automatically when added to cards.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-red-300 hover:bg-red-50 transition group"
              >
                <span className="text-sm text-slate-800 truncate">{tag.name}</span>
                <button
                  className="text-slate-400 group-hover:text-red-500 text-lg leading-none ml-2"
                  onClick={() => handleDelete(tag)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}