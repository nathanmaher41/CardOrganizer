import { useEffect, useState } from "react";
import { fetchCardVersions, restoreCardVersion } from "../api";

export default function CardVersionHistory({ cardId, currentVersion, onClose, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState(null);

  useEffect(() => {
    loadVersions();
  }, [cardId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await fetchCardVersions(cardId);
      setVersions(data);
    } catch (err) {
      console.error("Error loading versions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version) => {
    if (!confirm(`Restore version ${version}? This will create a new current version with updated passive references.`)) return;
    
    try {
      await restoreCardVersion(cardId, version);
      if (onRestore) onRestore();
      onClose();
    } catch (err) {
      console.error("Error restoring version:", err);
      alert("Error restoring version: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6">
          <p className="text-center text-slate-500">Loading versions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-5 md:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Version History</h2>
            <p className="text-xs text-slate-500">{versions.length} version(s) total</p>
          </div>
          <button className="text-slate-400 hover:text-red-500 text-xl leading-none" onClick={onClose}>×</button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> When restoring a version, passive references will automatically update to use their current names and text.
          </p>
        </div>

        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`border rounded-lg p-4 ${
                version.is_current
                  ? "border-brand-3 bg-brand-3/5"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Version {version.version}
                    </h3>
                    {version.is_current && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-3 text-white font-medium">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(version.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs text-brand-3 hover:text-brand-2"
                    onClick={() => setExpandedVersion(expandedVersion === version.version ? null : version.version)}
                  >
                    {expandedVersion === version.version ? "Hide details" : "Show details"}
                  </button>
                  {!version.is_current && (
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                      onClick={() => handleRestore(version.version)}
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>

              {expandedVersion === version.version && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-slate-600">Name:</span>
                      <span className="ml-2 text-slate-800">{version.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Cost:</span>
                      <span className="ml-2 text-slate-800">{version.cost}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">HP:</span>
                      <span className="ml-2 text-slate-800">{version.hp}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">FI:</span>
                      <span className="ml-2 text-slate-800">{version.fi}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">God Dmg:</span>
                      <span className="ml-2 text-slate-800">{version.godDmg}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Creature Dmg:</span>
                      <span className="ml-2 text-slate-800">{version.creatureDmg}</span>
                    </div>
                    {version.pantheon && (
                      <div>
                        <span className="font-medium text-slate-600">Pantheon:</span>
                        <span className="ml-2 text-slate-800">{version.pantheon}</span>
                      </div>
                    )}
                    {version.archetype && (
                      <div>
                        <span className="font-medium text-slate-600">Archetype:</span>
                        <span className="ml-2 text-slate-800">{version.archetype}</span>
                      </div>
                    )}
                  </div>

                  {version.abilities?.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-slate-600 mb-1">Abilities:</p>
                      {version.abilities.map((ability, idx) => (
                        <div key={idx} className="pl-2 py-1 border-l-2 border-slate-300">
                          <p className="font-medium">{ability.name || "Unnamed"} {ability.timing && `(${ability.timing})`}</p>
                          <p className="text-slate-600">{ability.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {version.passives?.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-slate-600 mb-1">Passives:</p>
                      {version.passives.map((passive, idx) => (
                        <div key={idx} className="pl-2 py-1 border-l-2 border-slate-300">
                          <p className="font-medium">{passive.group && `[${passive.group}] `}{passive.name}</p>
                          <p className="text-slate-600">{passive.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}