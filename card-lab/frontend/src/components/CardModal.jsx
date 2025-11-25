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
  allKeywordAbilities = [],
  initialCard = null,
}) {
  // Card type selector
  const [cardType, setCardType] = useState(initialCard?.type ?? "God");
  
  const [name, setName] = useState(initialCard?.name ?? "");
  const [cost, setCost] = useState(initialCard?.cost ?? 1);
  
  // God stats
  const [fi, setFi] = useState(initialCard?.fi ?? 1);
  const [hp, setHp] = useState(initialCard?.hp ?? 1);
  const [godDmg, setGodDmg] = useState(initialCard?.godDmg ?? 1);
  const [creatureDmg, setCreatureDmg] = useState(initialCard?.creatureDmg ?? 1);
  
  // Creature stats
  const [dmg, setDmg] = useState(initialCard?.dmg ?? 1);
  
  // Spell specific
  const [speed, setSpeed] = useState(initialCard?.speed ?? "Fast");
  
  // Card text (for unique card text)
  const [cardText, setCardText] = useState(initialCard?.cardText ?? "");

  const [pantheon, setPantheon] = useState(initialCard?.pantheon ?? "");
  const [newPantheon, setNewPantheon] = useState("");

  const [archetype, setArchetype] = useState(initialCard?.archetype ?? "");
  const [newArchetype, setNewArchetype] = useState("");


  const CARD_TYPES = ["God", "Creature", "Weapon", "Armor", "Enchanted Item", "Spell"];
  const SPELL_SPEEDS = ["Fast", "Slow", "Instant"];

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

  const [keywordAbilities, setKeywordAbilities] = useState(
    initialCard?.cardAbilities ?? []
  );
  const [showKeywordPicker, setShowKeywordPicker] = useState(false);

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
    if (!name.trim()) return;
    if (isSaving) return;

    setIsSaving(true);

    try {
      const nCost = Number(cost) || 0;
      
      // Build card data based on type
      const cardData = {
        name: name.trim(),
        cost: nCost,
        type: cardType,
        pantheon: pantheon || null,
        archetype: archetype || null,
        tags,
        cardText: cardText.trim() || null,
      };
      
      // Type-specific fields
      if (cardType === "God") {
        const nFi = Number(fi) || 0;
        const nHp = Number(hp) || 0;
        const nGod = Number(godDmg) || 0;
        const nCreature = Number(creatureDmg) || 0;
        const total = nFi + nHp + nGod + nCreature;
        
        cardData.fi = nFi;
        cardData.hp = nHp;
        cardData.godDmg = nGod;
        cardData.creatureDmg = nCreature;
        cardData.statTotal = total;
        
        // God abilities (unique text abilities)
        const cleanedAbilities = abilities
          .map((a) => ({
            name: a.name.trim(),
            timing: a.timing || null,
            text: a.text.trim(),
          }))
          .filter((a) => a.name || a.timing || a.text);
        cardData.abilities = cleanedAbilities;
        
        // Process passives for gods
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
              
              if (onPassiveCreated) {
                onPassiveCreated(savedPassive);
              }

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
        cardData.passives = cleanedPassives;
        
      } else if (cardType === "Creature") {
        const nHp = Number(hp) || 0;
        const nDmg = Number(dmg) || 0;
        const nFi = Number(fi) || 0;
        const total = nHp + nDmg + nFi;
        
        cardData.hp = nHp;
        cardData.dmg = nDmg;
        cardData.fi = nFi;
        cardData.statTotal = total;
        cardData.cardText = cardText.trim() || null;
        cardData.cardAbilities = keywordAbilities;
        
        // Explicitly null out God-specific fields
        cardData.godDmg = null;
        cardData.creatureDmg = null;
        cardData.abilities = [];
        cardData.passives = [];
        
      } else if (cardType === "Spell") {
        cardData.speed = speed;
        
      } else if (["Weapon", "Armor", "Enchanted Item"].includes(cardType)) {
        // These types only have cost, pantheon, archetype, tags, and cardText
        // No additional fields needed
      }

      await onSave(cardData);
    } catch (err) {
      console.error("Error saving card:", err);
      alert("Error saving card: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleKeywordAbility = (ability) => {
    const exists = keywordAbilities.find(ka => ka.ability_id === ability.id);
    if (exists) {
      setKeywordAbilities(prev => prev.filter(ka => ka.ability_id !== ability.id));
    } else {
      setKeywordAbilities(prev => [...prev, {
        ability_id: ability.id,
        name: ability.name,
        text: ability.text,
      }]);
    }
  };
  
  const isKeywordAbilitySelected = (abilityId) => {
    return keywordAbilities.some(ka => ka.ability_id === abilityId);
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
            {initialCard ? `Edit ${cardType} Card` : "Create New Card"}
          </h2>
          <button
            className="text-slate-400 hover:text-red-500 text-xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Card Type Selector (only when creating new) */}
          {!initialCard && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Card Type<span className="text-brand-3">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CARD_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      cardType === type
                        ? "bg-brand-3 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    onClick={() => setCardType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Name<span className="text-brand-3">*</span>
            </label>
            <input
              className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
              placeholder={cardType === "God" ? "Hel" : cardType === "Creature" ? "Medusa" : "Item name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Stats - conditional based on card type */}
          {cardType === "God" && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-black">
                <StatField label="Cost" value={cost} onChange={setCost} />
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
                <span className="font-semibold text-brand-3">{statTotal}</span>
              </p>
            </div>
          )}
          
          {cardType === "Creature" && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-black">
                <StatField label="Cost" value={cost} onChange={setCost} />
                <StatField label="HP" value={hp} onChange={setHp} />
                <StatField label="Damage" value={dmg} onChange={setDmg} />
                <StatField label="FI" value={fi} onChange={setFi} />
              </div>
              <p className="mt-2 text-xs text-slate-500 text-right">
                Stat total:{" "}
                <span className="font-semibold text-brand-3">{statTotal}</span>
              </p>
            </div>
          )}
          
          {["Weapon", "Armor", "Enchanted Item"].includes(cardType) && (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 text-black">
              <StatField label="Cost" value={cost} onChange={setCost} />
            </div>
          )}
          
          {cardType === "Spell" && (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <StatField label="Cost" value={cost} onChange={setCost} />
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Speed</label>
                <select
                  className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                >
                  {SPELL_SPEEDS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

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

          {/* Card Text (unique text for this specific card) - all types except God */}
          {cardType !== "God" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Card Text
              </label>
              <textarea
                className="w-full rounded-lg text-black border border-slate-300 bg-slate-50 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                placeholder="Unique card text (e.g., 'This card cannot be attacked until the end of next turn')..."
                value={cardText}
                onChange={(e) => setCardText(e.target.value)}
              />
              <p className="text-[10px] text-slate-400">
                This is for unique card-specific text. {cardType === "Creature" && "Use keyword abilities below for reusable mechanics."}
              </p>
            </div>
          )}
          
          {/* Keyword Abilities (for creatures only) */}
          {cardType === "Creature" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                Keyword Abilities
              </label>
              
              {keywordAbilities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {keywordAbilities.map((ka) => (
                    <span
                      key={ka.ability_id}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-700 text-[11px] px-2 py-0.5"
                    >
                      {ka.name}
                      <button
                        type="button"
                        className="text-[11px] hover:text-red-500"
                        onClick={() => toggleKeywordAbility({ id: ka.ability_id, name: ka.name, text: ka.text })}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <button
                type="button"
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-brand-3 border border-slate-300"
                onClick={() => setShowKeywordPicker(!showKeywordPicker)}
              >
                {showKeywordPicker ? "Hide" : "Add"} Keyword Abilities
              </button>
              
              {showKeywordPicker && (
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 max-h-48 overflow-y-auto">
                  {allKeywordAbilities.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No keyword abilities yet. Create them in the Abilities tab first.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {allKeywordAbilities.map((ability) => (
                        <button
                          key={ability.id}
                          type="button"
                          className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition ${
                            isKeywordAbilitySelected(ability.id)
                              ? "bg-purple-100 text-brand-3"
                              : "hover:bg-slate-100 text-brand-3"
                          }`}
                          onClick={() => toggleKeywordAbility(ability)}
                        >
                          <span className="font-medium">{ability.name}</span>
                          {ability.text && (
                            <span className="text-slate-400 ml-1">
                              – {ability.text}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* God Abilities (unique abilities only for gods) */}
          {cardType === "God" && (
            <div className="space-y-2">
              <label className="text-xs text-black font-medium text-slate-600">
                God Abilities (Unique to this God)
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
                          handleAbilityChange(
                            ability.id,
                            "name",
                            e.target.value
                          )
                        }
                      />

                      {/* Timing */}
                      <select
                        className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                        value={ability.timing}
                        onChange={(e) =>
                          handleAbilityChange(
                            ability.id,
                            "timing",
                            e.target.value
                          )
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
                        className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs min-h-[60px] focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                        placeholder="Describe this ability..."
                        value={ability.text}
                        onChange={(e) =>
                          handleAbilityChange(
                            ability.id,
                            "text",
                            e.target.value
                          )
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
          )}

          {/* Passives (only for Gods) */}
          {cardType === "God" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                Passives
              </label>

              <div className="space-y-3">
                {passives.map((passive, index) => (
                  <div
                    key={passive.localId}
                    className="flex flex-col gap-2 text-black rounded-lg border border-slate-200 bg-slate-50/60 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-500">
                          Passive {index + 1}
                        </span>
                        {passive.passive_id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                            Linked to DB
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-[11px] text-brand-3 hover:text-brand-2"
                          onClick={() => setShowPassivePicker(
                            showPassivePicker === passive.localId ? null : passive.localId
                          )}
                        >
                          {showPassivePicker === passive.localId ? "Hide" : "Pick existing"}
                        </button>
                        {passives.length > 1 && (
                          <button
                            type="button"
                            className="text-[11px] text-slate-400 hover:text-red-500"
                            onClick={() => handleRemovePassiveRow(passive.localId)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Passive picker dropdown */}
                    {showPassivePicker === passive.localId && (
                      <div className="border border-slate-200 rounded-lg p-2 bg-white max-h-48 overflow-y-auto">
                        {allPassives.length === 0 ? (
                          <p className="text-xs text-slate-400">
                            No passives in library yet. Create them in the Passives tab first.
                          </p>
                        ) : (
                          Object.entries(passivesByGroup).map(([groupName, groupPassives]) => (
                            <div key={groupName} className="mb-2">
                              <div className="text-[10px] font-medium text-slate-500 mb-1 px-1">
                                {groupName}
                              </div>
                              {groupPassives.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 text-[11px] text-slate-700"
                                  onClick={() => handleSelectExistingPassive(passive.localId, p)}
                                >
                                  <span className="font-medium">{p.name}</span>
                                  {p.text && (
                                    <span className="text-slate-400 ml-1">
                                      – {p.text.substring(0, 50)}...
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-[160px,1fr] gap-2">
                      {/* Group selector */}
                      <select
                        className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                        value={passive.group}
                        onChange={(e) =>
                          handlePassiveChange(passive.localId, "group", e.target.value)
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
                            handlePassiveChange(
                              passive.localId,
                              "name",
                              e.target.value
                            )
                          }
                        />
                        <textarea
                          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs min-h-[50px] focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
                          placeholder="Describe this passive..."
                          value={passive.text}
                          onChange={(e) =>
                            handlePassiveChange(
                              passive.localId,
                              "text",
                              e.target.value
                            )
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
          )}

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

          {/* Actions + Delete */}
          <div className="flex items-start justify-between gap-4 pt-3 border-t border-slate-200">
            {/* Delete area (only when editing and onDelete exists) */}
            {initialCard && onDelete && (
              <div className="flex flex-col gap-1 text-xs">
                {!isConfirmingDelete ? (
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setIsConfirmingDelete(true)}
                  >
                    Delete card
                  </button>
                ) : (
                  <div className="space-y-1">
                    <p className="text-slate-500">
                      Type{" "}
                      <span className="font-semibold">
                        {initialCard.name}
                      </span>{" "}
                      to confirm:
                    </p>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-black focus:outline-none focus:ring-2 focus:ring-red-400"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                    />
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
                  </div>
                )}
              </div>
            )}

            {/* Save / Cancel */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-xs text-slate-300 hover:text-red-500"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-4 py-2 rounded-full bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition ${
                  isSaving ? "opacity-50 cursor-not-allowed" : "hover:text-pink-300"
                }`}
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
        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-2 focus:ring-brand-3/60 focus:border-brand-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}