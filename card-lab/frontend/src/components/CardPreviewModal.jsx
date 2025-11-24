export default function CardPreviewModal({ card, onClose, onEdit }) {
  if (!card) return null;

  const {
    name,
    type,
    cost,
    pantheon,
    archetype,
    fi,
    hp,
    godDmg,
    creatureDmg,
    statTotal,
    tags,
    abilities,
    passives,
  } = card;

  const hasAbilities = Array.isArray(abilities) && abilities.length > 0;
  const hasTags = Array.isArray(tags) && tags.length > 0;
  const hasPassives = Array.isArray(passives) && passives.length > 0;

  const computedStatTotal =
    statTotal ??
    (Number(fi) || 0) +
      (Number(hp) || 0) +
      (Number(godDmg) || 0) +
      (Number(creatureDmg) || 0);

  const displayPantheon = pantheon || "No pantheon";
  const displayArchetype = archetype ? ` · ${archetype}` : "";
  const displayType = type || "God";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      {/* max-h + overflow to allow scrolling */}
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-5 md:p-6">
        {/* Header: title + close */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {name}
            </h2>
            <p className="text-xs text-slate-500">
              {displayPantheon}
              {displayArchetype}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Card type:{" "}
              <span className="font-medium text-slate-700">
                {displayType}
              </span>
            </p>
            {/* NEW: Cost under card type */}
            <p className="mt-0.5 text-[11px] text-slate-500">
              Cost:{" "}
              <span className="font-medium text-slate-700">
                {cost}
              </span>
            </p>
          </div>

          <button
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Version + Edit row (placeholders) */}
        <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <span className="font-medium">Version:</span>
            <button
              type="button"
              className="h-6 w-6 flex items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600 hover:border-brand-3 hover:text-brand-3"
            >
              ‹
            </button>
            <span className="px-1">1 / N</span>
            <button
              type="button"
              className="h-6 w-6 flex items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600 hover:border-brand-3 hover:text-brand-3"
            >
              ›
            </button>
          </div>

          {onEdit && (
            <button
              type="button"
              className="px-3 py-1 rounded-full border border-slate-300 bg-slate-50 text-[11px] text-slate-600 hover:border-brand-3 hover:text-brand-3"
              onClick={onEdit}
            >
              Edit card
            </button>
          )}
        </div>

        {/* Tags - now above stats */}
        {hasTags && (
          <div className="mb-2 text-[11px] text-slate-600">
            <span className="font-medium mr-1">Tags:</span>
            <span className="inline-flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-3/10 text-brand-3 text-[10px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-700 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/60">
          <div>Cost: {cost}</div>
          <div>FI: {fi}</div>
          <div>HP: {hp}</div>
          <div>God dmg: {godDmg}</div>
          <div>Creature dmg: {creatureDmg}</div>
        </div>

        {/* Stat total */}
        <p className="mt-2 text-[11px] text-slate-500 text-right">
          Stat total:{" "}
          <span className="font-semibold text-brand-3">
            {computedStatTotal}
          </span>
        </p>

        {/* Abilities */}
        <div className="mt-4 mb-3 space-y-2">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Abilities
          </h3>

          {hasAbilities ? (
            <div className="space-y-2">
              {abilities.map((ability, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    {/* Ability name */}
                    <span className="text-sm font-semibold text-slate-800">
                      {ability.name?.trim() || `Ability ${idx + 1}`}
                    </span>

                    {/* Timing pill */}
                    {ability.timing && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-medium">
                        {ability.timing}
                      </span>
                    )}
                  </div>

                  {/* Ability text */}
                  {ability.text && (
                    <p className="text-[11px] text-slate-700 leading-snug">
                      {ability.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              No abilities set.
            </p>
          )}
        </div>

        {/* Passives */}
        <div className="mt-2 space-y-2">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Passives
          </h3>

          {hasPassives ? (
            <div className="space-y-2">
              {passives.map((passive, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-800">
                      {passive.name?.trim() || `Passive ${idx + 1}`}
                    </span>
                    {passive.group && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-3 text-white text-[10px] font-medium">
                        {passive.group}
                      </span>
                    )}
                  </div>
                  {passive.text && (
                    <p className="text-[11px] text-slate-700 leading-snug">
                      {passive.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              No passives set.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
