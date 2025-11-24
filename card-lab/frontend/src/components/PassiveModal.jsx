import { useState } from "react";
import PassiveVersionHistory from "./PassiveVersionHistory";

export default function PassiveModal({
  pantheons,
  archetypes,
  initialPassive = null,
  onSave,
  onDelete,
  onClose,
}) {
  const [groupName, setGroupName] = useState(initialPassive?.group_name ?? "");
  const [name, setName] = useState(initialPassive?.name ?? "");
  const [text, setText] = useState(initialPassive?.text ?? "");
  const [pantheon, setPantheon] = useState(initialPassive?.pantheon ?? "");
  const [archetype, setArchetype] = useState(initialPassive?.archetype ?? "");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [showVersions, setShowVersions] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      group_name: groupName.trim() || null,
      name: name.trim(),
      text: text.trim(),
      pantheon: pantheon || null,
      archetype: archetype || null,
    });
  };

  const deleteNameMatches = initialPassive && deleteInput.trim().toLowerCase() === initialPassive.name.trim().toLowerCase();

  const handleConfirmDelete = () => {
    if (!initialPassive || !onDelete || !deleteNameMatches) return;
    onDelete();
  };

  const handleVersionRestore = () => {
    setShowVersions(false);
    window.location.reload();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 md:p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {initialPassive ? "Edit Passive" : "Create Passive"}
            </h2>
            <button className="text-slate-400 hover:text-red-500 text-xl leading-none" onClick={onClose}>×</button>
          </div>

          {initialPassive && (
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>Version {initialPassive.version}</span>
              <button
                className="text-brand-3 hover:text-brand-2 font-medium"
                onClick={() => setShowVersions(true)}
              >
                View history →
              </button>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Group</label>
              <input
                className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60"
                placeholder="Norse passive, Greek passive..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Name<span className="text-brand-3">*</span>
              </label>
              <input
                className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60"
                placeholder="Rage after Death"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Text</label>
              <textarea
                className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-brand-3/60"
                placeholder="Describe what this passive does..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Pantheon</label>
                <select
                  className="w-full rounded-lg border text-black border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                  value={pantheon}
                  onChange={(e) => setPantheon(e.target.value)}
                >
                  <option value="">None</option>
                  {pantheons.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Archetype</label>
                <select
                  className="w-full rounded-lg border text-black border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                  value={archetype}
                  onChange={(e) => setArchetype(e.target.value)}
                >
                  <option value="">None</option>
                  {archetypes.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {initialPassive && onDelete && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                {!isConfirmingDelete ? (
                  <button type="button" className="text-xs text-red-500 hover:text-red-600" onClick={() => setIsConfirmingDelete(true)}>
                    Delete passive
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">
                      Type <span className="font-semibold text-slate-700">{initialPassive.name}</span> to confirm:
                    </p>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-2 focus:ring-red-400"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="Type passive name..."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmDelete}
                        disabled={!deleteNameMatches}
                        className={`px-3 py-1.5 rounded-lg text-xs text-white ${
                          deleteNameMatches ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"
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
                {initialPassive ? "Save Changes" : "Create Passive"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showVersions && initialPassive && (
        <PassiveVersionHistory
          passiveId={initialPassive.id}
          onClose={() => setShowVersions(false)}
          onRestore={handleVersionRestore}
        />
      )}
    </>
  );
}