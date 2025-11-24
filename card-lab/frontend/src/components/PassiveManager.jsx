import { useState } from "react";

export default function PassiveModal({
  initialPassive = null,
  pantheons,
  archetypes,
  onSave,
  onDelete,
  onClose,
}) {
  const [groupName, setGroupName] = useState(initialPassive?.group_name ?? "");
  const [name, setName] = useState(initialPassive?.name ?? "");
  const [text, setText] = useState(initialPassive?.text ?? "");
  const [pantheon, setPantheon] = useState(initialPassive?.pantheon ?? "");
  const [archetype, setArchetype] = useState(initialPassive?.archetype ?? "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      group_name: groupName.trim() || "Ungrouped passive",
      name: name.trim(),
      text: text.trim(),
      pantheon: pantheon || null,
      archetype: archetype || null,
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 md:p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {initialPassive ? "Edit Passive" : "Create Passive"}
          </h2>
          <button
            className="text-slate-400 hover:text-red-500 text-xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Group name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Group name
            </label>
            <input
              className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm 
                         focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
              placeholder="Norse passive, Underworld passive..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <p className="text-[10px] text-slate-400">
              This is the label you select on cards (e.g. &quot;Norse passive&quot;).
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Passive name<span className="text-brand-3">*</span>
            </label>
            <input
              className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm 
                         focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
              placeholder="Rage after Death"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Pantheon + Archetype */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pantheon */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Pantheon (optional)
              </label>
              <select
                className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm 
                           focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                value={pantheon ?? ""}
                onChange={(e) => setPantheon(e.target.value || "")}
              >
                <option value="">None</option>
                {pantheons.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Archetype */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Archetype / Typing (optional)
              </label>
              <select
                className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm 
                           focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                value={archetype ?? ""}
                onChange={(e) => setArchetype(e.target.value || "")}
              >
                <option value="">None</option>
                {archetypes.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Passive text
            </label>
            <textarea
              className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm min-h-[80px] 
                         focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
              placeholder="Describe what this passive does..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Version placeholder */}
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-200 pt-2">
            <span>Version: 1 / N</span>
            <button
              type="button"
              className="px-2 py-1 rounded-full border border-slate-300 bg-slate-50 text-[11px] text-slate-500 cursor-default"
            >
              Restore this version
            </button>
          </div>

          {/* Delete (if editing) */}
          {initialPassive && onDelete && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <button
                type="button"
                className="text-xs text-red-500 hover:text-red-600"
                onClick={onDelete}
              >
                Delete passive
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-xs text-slate-400 hover:text-red-500"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition"
            >
              {initialPassive ? "Save Changes" : "Save Passive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
