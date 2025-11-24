import { useState } from "react";
import CardVersionHistory from "./CardVersionHistory";

export default function CardPreviewModal({ card, onClose, onEdit }) {
  const [showVersions, setShowVersions] = useState(false);

  const handleVersionRestore = () => {
    setShowVersions(false);
    window.location.reload(); // Simple way to refresh all data
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 md:p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{card.name}</h2>
            <button className="text-slate-400 hover:text-red-500 text-xl leading-none" onClick={onClose}>×</button>
          </div>

          {/* Version info */}
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>Version {card.version}</span>
            <button
              className="text-brand-3 hover:text-brand-2 font-medium"
              onClick={() => setShowVersions(true)}
            >
              View history →
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatDisplay label="Cost" value={card.cost} />
            <StatDisplay label="FI" value={card.fi} />
            <StatDisplay label="HP" value={card.hp} />
            <StatDisplay label="God dmg" value={card.godDmg} />
            <StatDisplay label="Creature dmg" value={card.creatureDmg} />
            <StatDisplay label="Total" value={card.statTotal} highlight />
          </div>

          {/* Pantheon & Archetype */}
          {(card.pantheon || card.archetype) && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {card.pantheon && (
                <div className="text-xs">
                  <span className="font-medium text-slate-600">Pantheon:</span>
                  <p className="text-slate-800 mt-0.5">{card.pantheon}</p>
                </div>
              )}
              {card.archetype && (
                <div className="text-xs">
                  <span className="font-medium text-slate-600">Archetype:</span>
                  <p className="text-slate-800 mt-0.5">{card.archetype}</p>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {card.tags?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-600 mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {card.tags.map((tag) => (
                  <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-3/10 text-brand-3">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Abilities */}
          {card.abilities?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-600 mb-2">Abilities</p>
              <div className="space-y-2">
                {card.abilities.map((ability, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-800">{ability.name || "Unnamed ability"}</p>
                      {ability.timing && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 ml-2">
                          {ability.timing}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{ability.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passives */}
          {card.passives?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-600 mb-2">Passives</p>
              <div className="space-y-2">
                {card.passives.map((passive, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      {passive.group && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {passive.group}
                        </span>
                      )}
                      <p className="text-xs font-semibold text-slate-800">{passive.name}</p>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{passive.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button className="px-3 py-1.5 rounded-full text-xs text-slate-400 hover:text-slate-600" onClick={onClose}>
              Close
            </button>
            <button
              className="px-4 py-2 rounded-full bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition"
              onClick={onEdit}
            >
              Edit Card
            </button>
          </div>
        </div>
      </div>

      {showVersions && (
        <CardVersionHistory
          cardId={card.id}
          currentVersion={card.version}
          onClose={() => setShowVersions(false)}
          onRestore={handleVersionRestore}
        />
      )}
    </>
  );
}

function StatDisplay({ label, value, highlight = false }) {
  return (
    <div className={`p-2 rounded-lg text-center ${highlight ? "bg-brand-3/10" : "bg-slate-50"}`}>
      <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-brand-3" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}