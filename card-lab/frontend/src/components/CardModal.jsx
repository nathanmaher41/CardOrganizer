import { useState, useMemo } from "react";
import { getOrCreatePassive, createPantheon, createArchetype } from "../api";

export default function CardModal({
  pantheons,
  archetypes,
  abilityTimings,
  passiveGroups,
  allPassives = [],
  onAddPantheon,
  onAddArchetype,
  onAddAbilityTiming,
  onAddPassiveGroup,
  onPassiveCreated,
  onPantheonCreated,
  onArchetypeCreated,
  onClose,
  onSave,
  onDelete,
  initialCard = null,
}) {
  const [name, setName] = useState(initialCard?.name ?? "");
  const [cost, setCost] = useState(initialCard?.cost ?? 1);
  const [fi, setFi] = useState(initialCard?.fi ?? 1);
  const [hp, setHp] = useState(initialCard?.hp ?? 1);
  const [godDmg, setGodDmg] = useState(initialCard?.godDmg ?? 1);
  const [creatureDmg, setCreatureDmg] = useState(initialCard?.creatureDmg ?? 1);
  const [pantheon, setPantheon] = useState(initialCard?.pantheon ?? "");
  const [newPantheon, setNewPantheon] = useState("");
  const [archetype, setArchetype] = useState(initialCard?.archetype ?? "");
  const [newArchetype, setNewArchetype] = useState("");

  const [abilities, setAbilities] = useState(
    initialCard?.abilities?.length
      ? initialCard.abilities.map((a, idx) => ({
          id: idx + 1,
          name: a.name ?? "",
          timing: a.timing ?? "",
          text: a.text ?? "",
        }))
      : [{ id: 1, name: "", timing: "", text: "" }]
  );
  const [newAbilityTiming, setNewAbilityTiming] = useState("");

  const [passives, setPassives] = useState(
    initialCard?.passives?.length
      ? initialCard.passives.map((p, idx) => ({
          localId: idx + 1,
          passive_id: p.passive_id ?? null,
          group: p.group ?? "",
          name: p.name ?? "",
          text: p.text ?? "",
        }))
      : [{ localId: 1, passive_id: null, group: "", name: "", text: "" }]
  );
  const [newPassiveGroup, setNewPassiveGroup] = useState("");
  const [showPassivePicker, setShowPassivePicker] = useState(null);

  const [tags, setTags] = useState(initialCard?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const statTotal = useMemo(() => {
    return (Number(fi) || 0) + (Number(hp) || 0) + (Number(godDmg) || 0) + (Number(creatureDmg) || 0);
  }, [fi, hp, godDmg, creatureDmg]);

  const passivesByGroup = useMemo(() => {
    const grouped = {};
    for (const p of allPassives) {
      const group = p.group_name || "Ungrouped";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(p);
    }
    return grouped;
  }, [allPassives]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);

    try {
      const nCost = Number(cost) || 0;
      const nFi = Number(fi) || 0;
      const nHp = Number(hp) || 0;
      const nGod = Number(godDmg) || 0;
      const nCreature = Number(creatureDmg) || 0;

      const cleanedAbilities = abilities
        .map((a) => ({ name: a.name.trim(), timing: a.timing || null, text: a.text.trim() }))
        .filter((a) => a.name || a.timing || a.text);

      const cleanedPassives = [];
      for (const p of passives) {
        const hasContent = p.group || p.name.trim() || p.text.trim();
        if (!hasContent) continue;

        if (!p.passive_id && p.name.trim()) {
          try {
            const passiveData = {
              group_name: p.group || "Ungrouped passive",
              name: p.name.trim(),
              text: p.text.trim(),
              pantheon: pantheon || null,
              archetype: archetype || null,
            };
            
            const savedPassive = await getOrCreatePassive(passiveData);
            if (onPassiveCreated) onPassiveCreated(savedPassive);

            cleanedPassives.push({
              passive_id: savedPassive.id,
              group: savedPassive.group_name,
              name: savedPassive.name,
              text: savedPassive.text,
            });
          } catch (err) {
            console.error("Error saving passive:", err);
            cleanedPassives.push({
              passive_id: null,
              group: p.group || null,
              name: p.name.trim(),
              text: p.text.trim(),
            });
          }
        } else {
          cleanedPassives.push({
            passive_id: p.passive_id,
            group: p.group || null,
            name: p.name.trim(),
            text: p.text.trim(),
          });
        }
      }

      await onSave({
        name: name.trim(),
        cost: nCost,
        fi: nFi,
        hp: nHp,
        godDmg: nGod,
        creatureDmg: nCreature,
        statTotal: nFi + nHp + nGod + nCreature,
        type: initialCard?.type ?? "God",
        pantheon: pantheon || null,
        archetype: archetype || null,
        tags,
        abilities: cleanedAbilities,
        passives: cleanedPassives,
      });
    } catch (err) {
      console.error("Error saving card:", err);
      alert("Error saving card: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPantheonClick = async () => {
    const trimmed = newPantheon.trim();
    if (!trimmed) return;

    try {
      const created = await createPantheon({ name: trimmed, description: null });
      if (onPantheonCreated) onPantheonCreated(created);
      setPantheon(created.name);
      setNewPantheon("");
    } catch (err) {
      console.error("Error creating pantheon:", err);
      // Fallback to local-only
      onAddPantheon(trimmed);
      setPantheon(trimmed);
      setNewPantheon("");
    }
  };

  const handleAddArchetypeClick = async () => {
    const trimmed = newArchetype.trim();
    if (!trimmed) return;

    try {
      const created = await createArchetype({ name: trimmed, description: null });
      if (onArchetypeCreated) onArchetypeCreated(created);
      setArchetype(created.name);
      setNewArchetype("");
    } catch (err) {
      console.error("Error creating archetype:", err);
      // Fallback to local-only
      onAddArchetype(trimmed);
      setArchetype(trimmed);
      setNewArchetype("");
    }
  };

  const handleAddAbilityTimingClick = () => {
    const created = onAddAbilityTiming(newAbilityTiming);
    if (created) setNewAbilityTiming("");
  };

  const handleAbilityChange = (id, field, value) => {
    setAbilities((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const handleAddAbilityRow = () => {
    setAbilities((prev) => [...prev, { id: Date.now(), name: "", timing: "", text: "" }]);
  };

  const handleRemoveAbilityRow = (id) => {
    setAbilities((prev) => (prev.length === 1 ? prev : prev.filter((a) => a.id !== id)));
  };

  const handlePassiveChange = (localId, field, value) => {
    setPassives((prev) =>
      prev.map((p) => {
        if (p.localId !== localId) return p;
        if (field === "name" || field === "text") {
          return { ...p, [field]: value, passive_id: null };
        }
        return { ...p, [field]: value };
      })
    );
  };

  const handleSelectExistingPassive = (localId, passive) => {
    setPassives((prev) =>
      prev.map((p) =>
        p.localId === localId
          ? { ...p, passive_id: passive.id, group: passive.group_name, name: passive.name, text: passive.text }
          : p
      )
    );
    setShowPassivePicker(null);
  };

  const handleAddPassiveRow = () => {
    setPassives((prev) => [...prev, { localId: Date.now(), passive_id: null, group: "", name: "", text: "" }]);
  };

  const handleRemovePassiveRow = (localId) => {
    setPassives((prev) => (prev.length === 1 ? prev : prev.filter((p) => p.localId !== localId)));
  };

  const handleAddPassiveGroupClick = () => {
    const created = onAddPassiveGroup(newPassiveGroup);
    if (created) setNewPassiveGroup("");
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (!tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
  };

  const removeTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag));

  const deleteNameMatches = initialCard && deleteInput.trim().toLowerCase() === initialCard.name.trim().toLowerCase();

  const handleConfirmDelete = () => {
    if (!initialCard || !onDelete || !deleteNameMatches) return;
    onDelete(initialCard);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-5 md:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {initialCard ? "Edit God Card" : "Create New God Card"}
          </h2>
          <button className="text-slate-400 hover:text-red-500 text-xl leading-none" onClick={onClose}>×</button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Name<span className="text-brand-3">*</span></label>
            <input
              className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60"
              placeholder="Hel"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Stats */}
          <div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-black">
              <StatField label="Cost" value={cost} onChange={setCost} />
              <StatField label="FI" value={fi} onChange={setFi} />
              <StatField label="HP" value={hp} onChange={setHp} />
              <StatField label="God dmg" value={godDmg} onChange={setGodDmg} />
              <StatField label="Creature dmg" value={creatureDmg} onChange={setCreatureDmg} />
            </div>
            <p className="mt-2 text-xs text-slate-500 text-right">
              Stat total: <span className="font-semibold text-brand-3">{statTotal}</span>
            </p>
          </div>

          {/* Pantheon + Archetype */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Pantheon</label>
              <select
                className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={pantheon}
                onChange={(e) => setPantheon(e.target.value)}
              >
                <option value="">None</option>
                {pantheons.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border text-black border-slate-300 bg-slate-50 px-3 py-1.5 text-xs"
                  placeholder="Add new pantheon..."
                  value={newPantheon}
                  onChange={(e) => setNewPantheon(e.target.value)}
                />
                <button type="button" className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 text-white hover:bg-slate-800" onClick={handleAddPantheonClick}>Add</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Archetype / Typing</label>
              <select
                className="w-full rounded-lg border text-black border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
              >
                <option value="">None</option>
                {archetypes.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border text-black border-slate-300 bg-slate-50 px-3 py-1.5 text-xs"
                  placeholder="Add new archetype..."
                  value={newArchetype}
                  onChange={(e) => setNewArchetype(e.target.value)}
                />
                <button type="button" className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 text-white hover:bg-slate-800" onClick={handleAddArchetypeClick}>Add</button>
              </div>
            </div>
          </div>

          {/* Abilities */}
          <div className="space-y-2">
            <label className="text-xs text-black font-medium text-slate-600">Abilities</label>
            <div className="space-y-3">
              {abilities.map((ability, index) => (
                <div key={ability.id} className="flex flex-col text-black gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Ability {index + 1}</span>
                    {abilities.length > 1 && (
                      <button type="button" className="text-[11px] text-slate-400 hover:text-red-500" onClick={() => handleRemoveAbilityRow(ability.id)}>Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[140px,140px,1fr] gap-2">
                    <input
                      className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                      placeholder="Ability name"
                      value={ability.name}
                      onChange={(e) => handleAbilityChange(ability.id, "name", e.target.value)}
                    />
                    <select
                      className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                      value={ability.timing}
                      onChange={(e) => handleAbilityChange(ability.id, "timing", e.target.value)}
                    >
                      <option value="">No timing</option>
                      {abilityTimings.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <textarea
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs min-h-[50px]"
                      placeholder="Describe what this ability does..."
                      value={ability.text}
                      onChange={(e) => handleAbilityChange(ability.id, "text", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button type="button" className="px-3 py-1.5 rounded-full text-[11px] border border-slate-300 text-slate-600 hover:border-brand-3 hover:text-brand-3" onClick={handleAddAbilityRow}>+ Add ability</button>
              <div className="flex items-center gap-2">
                <input
                  className="rounded-lg border border-slate-300 text-black bg-slate-50 px-2 py-1.5 text-[11px]"
                  placeholder="New timing..."
                  value={newAbilityTiming}
                  onChange={(e) => setNewAbilityTiming(e.target.value)}
                />
                <button type="button" className="px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-900 text-white" onClick={handleAddAbilityTimingClick}>Add timing</button>
              </div>
            </div>
          </div>

          {/* Passives */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">Passives</label>
            <div className="space-y-3">
              {passives.map((passive, index) => (
                <div key={passive.localId} className="flex flex-col gap-2 text-black rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-500">Passive {index + 1}</span>
                      {passive.passive_id && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Linked to DB</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-[11px] text-brand-3 hover:text-brand-2"
                        onClick={() => setShowPassivePicker(showPassivePicker === passive.localId ? null : passive.localId)}
                      >
                        {showPassivePicker === passive.localId ? "Cancel" : "Pick existing"}
                      </button>
                      {passives.length > 1 && (
                        <button type="button" className="text-[11px] text-slate-400 hover:text-red-500" onClick={() => handleRemovePassiveRow(passive.localId)}>Remove</button>
                      )}
                    </div>
                  </div>

                  {showPassivePicker === passive.localId && (
                    <div className="border border-slate-300 rounded-lg bg-white p-2 max-h-48 overflow-y-auto">
                      {Object.keys(passivesByGroup).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No passives in database yet.</p>
                      ) : (
                        Object.entries(passivesByGroup).map(([group, groupPassives]) => (
                          <div key={group} className="mb-2">
                            <p className="text-[10px] font-semibold text-slate-500 mb-1">{group}</p>
                            {groupPassives.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                className="w-full text-left px-2 py-1 text-xs rounded hover:bg-brand-3/10 hover:text-brand-3"
                                onClick={() => handleSelectExistingPassive(passive.localId, p)}
                              >
                                <span className="font-medium">{p.name}</span>
                                {p.text && <span className="text-slate-400 ml-1">– {p.text.substring(0, 50)}...</span>}
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-[160px,1fr] gap-2">
                    <select
                      className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                      value={passive.group}
                      onChange={(e) => handlePassiveChange(passive.localId, "group", e.target.value)}
                    >
                      <option value="">No group</option>
                      {passiveGroups.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <div className="space-y-1.5">
                      <input
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                        placeholder="Passive name (e.g. Rage after Death)"
                        value={passive.name}
                        onChange={(e) => handlePassiveChange(passive.localId, "name", e.target.value)}
                      />
                      <textarea
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs min-h-[50px]"
                        placeholder="Describe this passive..."
                        value={passive.text}
                        onChange={(e) => handlePassiveChange(passive.localId, "text", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button type="button" className="px-3 py-1.5 rounded-full text-[11px] border border-slate-300 text-slate-600 hover:border-brand-3 hover:text-brand-3" onClick={handleAddPassiveRow}>+ Add passive</button>
              <div className="flex items-center gap-2">
                <input
                  className="rounded-lg border border-slate-300 text-black bg-slate-50 px-2 py-1.5 text-[11px]"
                  placeholder="New passive group..."
                  value={newPassiveGroup}
                  onChange={(e) => setNewPassiveGroup(e.target.value)}
                />
                <button type="button" className="px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-900 text-white" onClick={handleAddPassiveGroupClick}>Add group</button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">Tags</label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-brand-3/10 text-brand-3 text-[11px] px-2 py-0.5">
                    {tag}
                    <button type="button" className="text-[11px] hover:text-red-500" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs"
                placeholder='Add a tag (e.g. "Destroy")...'
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <button type="button" className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 text-white" onClick={addTag}>Add</button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-start justify-between gap-4 pt-3 border-t border-slate-200">
            {initialCard && onDelete && (
              <div className="flex flex-col gap-1 text-xs">
                {!isConfirmingDelete ? (
                  <button type="button" className="text-red-500 hover:text-red-600" onClick={() => setIsConfirmingDelete(true)}>Delete card</button>
                ) : (
                  <div className="space-y-1">
                    <p className="text-slate-500">Type <span className="font-semibold">{initialCard.name}</span> to confirm:</p>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-black"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      disabled={!deleteNameMatches}
                      className={`px-3 py-1.5 rounded-lg text-xs text-white ${deleteNameMatches ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"}`}
                    >
                      Confirm delete
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button type="button" className="px-3 py-1.5 rounded-full text-xs text-slate-300 hover:text-red-500" onClick={onClose} disabled={isSaving}>Cancel</button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-4 py-2 rounded-full bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md transition ${isSaving ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"}`}
              >
                {isSaving ? "Saving..." : initialCard ? "Save Changes" : "Save Card"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatField({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-slate-600">{label}</label>
      <input
        type="number"
        min="0"
        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}