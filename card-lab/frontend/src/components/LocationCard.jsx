export default function LocationCard({ location, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-3 md:p-4 border border-slate-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 truncate">{location.name}</h3>
          <div className="flex gap-1 md:gap-2 ml-2 flex-shrink-0">
            {location.pantheon && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                {location.pantheon}
              </span>
            )}
            {location.archetype && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {location.archetype}
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(location)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition"
            title="Edit location"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(location.id)}
            className="p-1.5 hover:bg-red-50 rounded-lg transition"
            title="Delete location"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card Text */}
      <div className="bg-slate-50 rounded-lg p-2 md:p-3 mb-3">
        <p className="text-xs md:text-sm text-slate-700 whitespace-pre-wrap break-words">{location.text}</p>
      </div>

      {/* Image if present */}
      {location.image_url && (
        <img
          src={location.image_url}
          alt={location.name}
          className="w-full h-40 md:h-48 object-cover rounded-lg"
        />
      )}
    </div>
  );
}