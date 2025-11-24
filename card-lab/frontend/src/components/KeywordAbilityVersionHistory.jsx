import { useEffect, useState } from "react";
import { fetchKeywordAbilityVersions, restoreKeywordAbilityVersion } from "../api";

export default function KeywordAbilityVersionHistory({ abilityId, onClose, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [abilityId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await fetchKeywordAbilityVersions(abilityId);
      setVersions(data);
    } catch (err) {
      console.error("Error loading versions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version) => {
    if (!confirm(`Restore version ${version}? This will create a new current version and update all cards using this ability.`)) return;
    
    try {
      await restoreKeywordAbilityVersion(abilityId, version);
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
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-5 md:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Keyword Ability Version History</h2>
            <p className="text-xs text-slate-500">{versions.length} version(s) total</p>
          </div>
          <button className="text-slate-400 hover:text-red-500 text-xl leading-none" onClick={onClose}>×</button>
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Version {version.version}
                    </h3>
                    {version.is_current && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-3 text-white font-medium">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    {new Date(version.updated_at).toLocaleString()}
                  </p>
                  
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="font-medium text-slate-600">Name:</span>
                      <span className="ml-2 text-slate-800">{version.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Text:</span>
                      <p className="ml-2 text-slate-800 mt-1">{version.text}</p>
                    </div>
                  </div>
                </div>

                {!version.is_current && (
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 ml-3 shrink-0"
                    onClick={() => handleRestore(version.version)}
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> Restoring a keyword ability version will also create new versions of all cards that use this ability.
          </p>
        </div>
      </div>
    </div>
  );
}