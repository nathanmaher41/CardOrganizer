import { useState } from "react";

export default function PantheonArchetypeModal({
  type, // "pantheon" or "archetype"
  initialItem = null,
  onSave,
  onDelete,
  onClose,
}) {
  const [name, setName] = useState(initialItem?.name ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? "");

  // Delete confirmation
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const typeLabel = type === "pantheon" ? "Pantheon" : "Archetype";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || null,
    });
  };

  const deleteNameMatches =
    initialItem &&
    deleteInput.trim().toLowerCase() === initialItem.name.trim().toLowerCase();

  const handleConfirmDelete = () => {
    if (!initialItem || !onDelete || !deleteNameMatches) return;
    onDelete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 md:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {initialItem ? `Edit ${typeLabel}` : `Create ${typeLabel}`}
          </h2>
          <button className="text-slate-400 hover:text-red-500 text-xl leading-none" onClick={onClose}>×</button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Name<span className="text-brand-3">*</span>
            </label>
            <input
              className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60"
              placeholder={type === "pantheon" ? "Greek, Norse, Egyptian..." : "Underworld, Sky, Sea..."}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Description (optional)</label>
            <textarea
              className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-brand-3/60"
              placeholder={`Describe this ${type}...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Delete section with type-to-confirm */}
          {initialItem && onDelete && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              {!isConfirmingDelete ? (
                <button
                  type="button"
                  className="text-xs text-red-500 hover:text-red-600"
                  onClick={() => setIsConfirmingDelete(true)}
                >
                  Delete {type}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    Type <span className="font-semibold text-slate-700">{initialItem.name}</span> to confirm:
                  </p>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-2 focus:ring-red-400"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={`Type ${type} name...`}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      disabled={!deleteNameMatches}
                      className={`px-3 py-1.5 rounded-lg text-xs text-white ${
                        deleteNameMatches
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-red-300 cursor-not-allowed"
                      }`}
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700"
                      onClick={() => {
                        setIsConfirmingDelete(false);
                        setDeleteInput("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3">
            <button type="button" className="px-3 py-1.5 rounded-full text-xs text-slate-400 hover:text-red-500" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-full bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition">
              {initialItem ? "Save Changes" : `Create ${typeLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}