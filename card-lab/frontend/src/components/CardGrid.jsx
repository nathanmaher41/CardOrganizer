export default function CardGrid({ cards, onCardClick }) {
  if (cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-8">
        <p className="text-slate-500 text-sm font-medium">
          No cards match your filters.
        </p>
        <p className="text-slate-400 text-xs mt-1">
          Try clearing filters or creating a new card.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <button
          key={card.id}
          className="relative group text-left rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition p-3"
          onClick={() => onCardClick(card)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {card.type || "God"}
            </span>
            <span className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white text-xs font-semibold px-2 py-0.5">
              {card.cost ?? 0}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-slate-900 truncate mb-1">
            {card.name}
          </h3>

          <p className="text-[11px] text-slate-500 mb-2 line-clamp-2">
            {card.text || "No card text yet."}
          </p>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
            <span>
              {card.pantheon || "No pantheon"}
              {card.archetype ? ` · ${card.archetype}` : ""}
            </span>
            {card.abilityTiming && (
              <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px]">
                {card.abilityTiming}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-700">
            <span>FI: {card.fi ?? 0}</span>
            <span>HP: {card.hp ?? 0}</span>
            <span>God dmg: {card.godDmg ?? 0}</span>
            <span>Creature dmg: {card.creatureDmg ?? 0}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
