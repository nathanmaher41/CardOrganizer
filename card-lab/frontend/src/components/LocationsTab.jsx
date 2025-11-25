import { useState, useEffect } from "react";
import {
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  fetchLocationsMetadata,
} from "../api";
import LocationFilters from "./LocationFilters";
import LocationCard from "./LocationCard";

export default function LocationsTab() {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pantheons, setPantheons] = useState([]);
  const [archetypes, setArchetypes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    text: "",
    pantheon: "",
    archetype: "",
    image_url: "",
  });

  useEffect(() => {
    loadLocations();
    loadMetadata();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await fetchLocations();
      setLocations(data);
      setFilteredLocations(data);
    } catch (error) {
      console.error("Failed to load locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const data = await fetchLocationsMetadata();
      setPantheons(data.pantheons);
      setArchetypes(data.archetypes);
    } catch (error) {
      console.error("Failed to load metadata:", error);
    }
  };

  const handleApplyFilters = async (filters) => {
    try {
      const data = await fetchLocations(filters);
      setFilteredLocations(data);
    } catch (error) {
      console.error("Failed to apply filters:", error);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, formData);
      } else {
        await createLocation(formData);
      }
      await loadLocations();
      await loadMetadata();
      resetForm();
    } catch (error) {
      console.error("Failed to save location:", error);
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      text: location.text,
      pantheon: location.pantheon || "",
      archetype: location.archetype || "",
      image_url: location.image_url || "",
    });
    setIsCreating(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      await deleteLocation(id);
      await loadLocations();
      await loadMetadata();
    } catch (error) {
      console.error("Failed to delete location:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      text: "",
      pantheon: "",
      archetype: "",
      image_url: "",
    });
    setIsCreating(false);
    setEditingLocation(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
      {/* Sidebar Filters */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <LocationFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          pantheons={pantheons}
          archetypes={archetypes}
          onApplyFilters={handleApplyFilters}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header with Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Locations</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition w-full sm:w-auto"
          >
            {isCreating ? "Cancel" : "+ New Location"}
          </button>
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">
              {editingLocation ? "Edit Location" : "Create New Location"}
            </h3>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Card Text *
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pantheon (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60"
                    value={formData.pantheon}
                    onChange={(e) => setFormData({ ...formData, pantheon: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Archetype (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60"
                    value={formData.archetype}
                    onChange={(e) => setFormData({ ...formData, archetype: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-3/60"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-brand-1 to-brand-2 text-white text-sm font-medium shadow-md hover:shadow-lg transition"
                >
                  {editingLocation ? "Update Location" : "Create Location"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Locations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filteredLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {filteredLocations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No locations found</p>
          </div>
        )}
      </div>
    </div>
  );
}