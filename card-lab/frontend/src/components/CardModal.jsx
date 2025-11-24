import { useState, useMemo } from "react";

export default function CardModal({
  pantheons,
  archetypes,
  abilityTimings,
  passiveGroups,          // NEW
  onAddPantheon,
  onAddArchetype,
  onAddAbilityTiming,
  onAddPassiveGroup,      // NEW
  onClose,
  onSave,
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

  // Abilities: each has name, timing, text
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

  // Passives: each has group, name, text
  const [passives, setPassives] = useState(
    initialCard?.passives?.length
      ? initialCard.passives.map((p, idx) => ({
        id: idx + 1,
        group: p.group ?? "",
        name: p.name ?? "",
        text: p.text ?? "",
      }))
      : [{ id: 1, group: "", name: "", text: "" }]
  );
  const [newPassiveGroup, setNewPassiveGroup] = useState("");

  // Tags
  const [tags, setTags] = useState(initialCard?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  // Derived stat total
  const statTotal = useMemo(() => {
    const nFi = Number(fi) || 0;
    const nHp = Number(hp) || 0;
    const nGod = Number(godDmg) || 0;
    const nCreature = Number(creatureDmg) || 0;
    return nFi + nHp + nGod + nCreature;
  }, [fi, hp, godDmg, creatureDmg]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const nCost = Number(cost) || 0;
    const nFi = Number(fi) || 0;
    const nHp = Number(hp) || 0;
    const nGod = Number(godDmg) || 0;
    const nCreature = Number(creatureDmg) || 0;
    const total = nFi + nHp + nGod + nCreature;

    const cleanedAbilities = abilities
      .map((a) => ({
        name: a.name.trim(),
        timing: a.timing || null,
        text: a.text.trim(),
      }))
      .filter((a) => a.name || a.timing || a.text);

    const cleanedPassives = passives
      .map((p) => ({
        group: p.group || null,
        name: p.name.trim(),
        text: p.text.trim(),
      }))
      .filter((p) => p.group || p.name || p.text);

    onSave({
      name: name.trim(),
      cost: nCost,
      fi: nFi,
      hp: nHp,
      godDmg: nGod,
      creatureDmg: nCreature,
      statTotal: total,
      type: initialCard?.type ?? "God",
      pantheon: pantheon || null,
      archetype: archetype || null,
      tags,
      abilities: cleanedAbilities,
      passives: cleanedPassives,
    });
  };

  // --- Pantheon / Archetype ---

  const handleAddPantheonClick = () => {
    const created = onAddPantheon(newPantheon);
    if (created) {
      setPantheon(created);
      setNewPantheon("");
    }
  };

  const handleAddArchetypeClick = () => {
    const created = onAddArchetype(newArchetype);
    if (created) {
      setArchetype(created);
      setNewArchetype("");
    }
  };

  // --- Abilities ---

  const handleAddAbilityTimingClick = () => {
    const created = onAddAbilityTiming(newAbilityTiming);
    if (created) {
      setNewAbilityTiming("");
    }
  };

  const handleAbilityChange = (id, field, value) => {
    setAbilities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      )
    );
  };

  const handleAddAbilityRow = () => {
    setAbilities((prev) => [
      ...prev,
      { id: Date.now(), name: "", timing: "", text: "" },
    ]);
  };

  const handleRemoveAbilityRow = (id) => {
    setAbilities((prev) =>
      prev.length === 1 ? prev : prev.filter((a) => a.id !== id)
    );
  };

  // --- Passives ---

  const handlePassiveChange = (id, field, value) => {
    setPassives((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  const handleAddPassiveRow = () => {
    setPassives((prev) => [
      ...prev,
      { id: Date.now(), group: "", name: "", text: "" },
    ]);
  };

  const handleRemovePassiveRow = (id) => {
    setPassives((prev) =>
      prev.length === 1 ? prev : prev.filter((p) => p.id !== id)
    );
  };

  const handleAddPassiveGroupClick = () => {
    const created = onAddPassiveGroup(newPassiveGroup);
    if (created) {
      setNewPassiveGroup("");
    }
  };

  // --- Tags ---

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    const exists = tags.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-5 md:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {initialCard ? "Edit God Card" : "Create New God Card"}
          </h2>
          <button
            className="text-slate-400 hover:text-red-500 text-xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Name<span className="text-brand-3">*</span>
            </label>
            <input
              className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
              placeholder="Hel"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Stats + Stat total */}
          <div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-black">
              <StatField label="Cost" value={cost} onChange={setCost}/>
              <StatField label="FI" value={fi} onChange={setFi} />
              <StatField label="HP" value={hp} onChange={setHp} />
              <StatField label="God dmg" value={godDmg} onChange={setGodDmg} />
              <StatField
                label="Creature dmg"
                value={creatureDmg}
                onChange={setCreatureDmg}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500 text-right">
              Stat total:{" "}
              <span className="font-semibold text-brand-3">
                {statTotal}
              </span>
            </p>
          </div>

          {/* Pantheon + Archetype */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pantheon */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                Pantheon
              </label>
              <select
                className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                value={pantheon}
                onChange={(e) => setPantheon(e.target.value)}
              >
                <option value="">None</option>
                {pantheons.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border text-black border-slate-300 bg-slate-50 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                  placeholder="Add new pantheon..."
                  value={newPantheon}
                  onChange={(e) => setNewPantheon(e.target.value)}
                />
                <button
                  type="button"
                  className="px-2.5 py-1.5 text-xs rounded-lg hover:text-brand-3 bg-slate-900 text-white"
                  onClick={handleAddPantheonClick}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Archetype */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                Archetype / Typing
              </label>
              <select
                className="w-full rounded-lg border text-black border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
              >
                <option value="">None</option>
                {archetypes.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border text-black border-slate-300 bg-slate-50 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                  placeholder="Add new archetype..."
                  value={newArchetype}
                  onChange={(e) => setNewArchetype(e.target.value)}
                />
                <button
                  type="button"
                  className="px-2.5 py-1.5 text-xs rounded-lg hover:text-brand-3 bg-slate-900 text-white"
                  onClick={handleAddArchetypeClick}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Abilities (multiple) */}
          <div className="space-y-2">
            <label className="text-xs text-black font-medium text-slate-600">
              Abilities
            </label>

            <div className="space-y-3">
              {abilities.map((ability, index) => (
                <div
                  key={ability.id}
                  className="flex flex-col text-black gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">
                      Ability {index + 1}
                    </span>
                    {abilities.length > 1 && (
                      <button
                        type="button"
                        className="text-[11px] text-slate-400 hover:text-red-500"
                        onClick={() => handleRemoveAbilityRow(ability.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[140px,140px,1fr] gap-2">
                    {/* Ability name */}
                    <input
                      className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                      placeholder="Ability name (e.g. Welcome to Valhalla)"
                      value={ability.name}
                      onChange={(e) =>
                        handleAbilityChange(ability.id, "name", e.target.value)
                      }
                    />

                    {/* Timing */}
                    <select
                      className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                      value={ability.timing}
                      onChange={(e) =>
                        handleAbilityChange(ability.id, "timing", e.target.value)
                      }
                    >
                      <option value="">No timing</option>
                      {abilityTimings.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>

                    {/* Text */}
                    <textarea
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs min-h-[50px] focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                      placeholder="Describe what this ability does..."
                      value={ability.text}
                      onChange={(e) =>
                        handleAbilityChange(ability.id, "text", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-[11px] border border-slate-300 text-white hover:border-brand-3 hover:text-brand-3"
                onClick={handleAddAbilityRow}
              >
                + Add ability
              </button>

              {/* Add new timing type (On Reveal, End of Game, etc.) */}
              <div className="flex items-center gap-2">
                <input
                  className="rounded-lg border border-slate-300 text-black bg-slate-50 px-2 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                  placeholder="New timing (e.g. End of Game)..."
                  value={newAbilityTiming}
                  onChange={(e) => setNewAbilityTiming(e.target.value)}
                />
                <button
                  type="button"
                  className="px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-900 hover:text-brand-3 text-white"
                  onClick={handleAddAbilityTimingClick}
                >
                  Add timing
                </button>
              </div>
            </div>
          </div>

          {/* Passives */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Passives
            </label>

            <div className="space-y-3">
              {passives.map((passive, index) => (
                <div
                  key={passive.id}
                  className="flex flex-col gap-2 text-black rounded-lg border border-slate-200 bg-slate-50/60 p-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">
                      Passive {index + 1}
                    </span>
                    {passives.length > 1 && (
                      <button
                        type="button"
                        className="text-[11px] text-slate-400 hover:text-red-500"
                        onClick={() => handleRemovePassiveRow(passive.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[160px,1fr] gap-2">
                    {/* Group selector */}
                    <select
                      className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                      value={passive.group}
                      onChange={(e) =>
                        handlePassiveChange(passive.id, "group", e.target.value)
                      }
                    >
                      <option value="">No group</option>
                      {passiveGroups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>

                    {/* Name + text */}
                    <div className="space-y-1.5">
                      <input
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                        placeholder="Passive name (e.g. Rage after Death)"
                        value={passive.name}
                        onChange={(e) =>
                          handlePassiveChange(passive.id, "name", e.target.value)
                        }
                      />
                      <textarea
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs min-h-[50px] focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                        placeholder="Describe this passive..."
                        value={passive.text}
                        onChange={(e) =>
                          handlePassiveChange(passive.id, "text", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-[11px] border border-slate-300 text-white hover:border-brand-3 hover:text-brand-3"
                onClick={handleAddPassiveRow}
              >
                + Add passive
              </button>

              {/* Add new passive group (e.g. Norse passive, Underworld passive) */}
              <div className="flex items-center gap-2">
                <input
                  className="rounded-lg border border-slate-300 text-black bg-slate-50 px-2 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                  placeholder="New passive group (e.g. Norse passive)..."
                  value={newPassiveGroup}
                  onChange={(e) => setNewPassiveGroup(e.target.value)}
                />
                <button
                  type="button"
                  className="px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-900 hover:text-brand-3 text-white"
                  onClick={handleAddPassiveGroupClick}
                >
                  Add group
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Tags (for filtering / implied behavior)
            </label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-3/10 text-brand-3 text-[11px] px-2 py-0.5"
                  >
                    {tag}
                    <button
                      type="button"
                      className="text-[11px] hover:text-red-500"
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                placeholder='Add a tag (e.g. "Destroy", "KO/High DMG")...'
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <button
                type="button"
                className="px-2.5 py-1.5 text-xs rounded-lg hover:text-brand-3 bg-slate-900 text-white"
                onClick={addTag}
              >
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-xs text-slate-300 hover:text-red-500"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full hover:text-pink-300 bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition"
            >
              {initialCard ? "Save Changes" : "Save Card"}
            </button>
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
        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
