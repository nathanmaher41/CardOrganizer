// src/api.js

const API_BASE = "http://127.0.0.1:8000";

/**
 * Small helper to handle fetch + JSON + errors.
 */
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) {
        message = Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg || d).join(", ")
          : data.detail;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ========================
 * Cards
 * ====================== */

export async function fetchCards(filters = {}) {
  const params = new URLSearchParams();

  // Legacy single filters
  if (filters.pantheon) params.set("pantheon", filters.pantheon);
  if (filters.archetype) params.set("archetype", filters.archetype);
  if (filters.type) params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  if (filters.tag) params.set("tag", filters.tag);

  // New multi-filters
  if (filters.pantheons?.length) params.set("pantheons", filters.pantheons.join(","));
  if (filters.archetypes?.length) params.set("archetypes", filters.archetypes.join(","));
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.filterMode) params.set("filter_mode", filters.filterMode);

  // Stat range filters
  if (filters.minCost !== undefined) params.set("min_cost", filters.minCost);
  if (filters.maxCost !== undefined) params.set("max_cost", filters.maxCost);
  if (filters.minFi !== undefined) params.set("min_fi", filters.minFi);
  if (filters.maxFi !== undefined) params.set("max_fi", filters.maxFi);
  if (filters.minHp !== undefined) params.set("min_hp", filters.minHp);
  if (filters.maxHp !== undefined) params.set("max_hp", filters.maxHp);
  if (filters.minGodDmg !== undefined) params.set("min_god_dmg", filters.minGodDmg);
  if (filters.maxGodDmg !== undefined) params.set("max_god_dmg", filters.maxGodDmg);
  if (filters.minCreatureDmg !== undefined) params.set("min_creature_dmg", filters.minCreatureDmg);
  if (filters.maxCreatureDmg !== undefined) params.set("max_creature_dmg", filters.maxCreatureDmg);
  if (filters.cardTypes?.length) params.set("card_types", filters.cardTypes.join(","));
  if (filters.spellSpeeds?.length) params.set("spell_speeds", filters.spellSpeeds.join(","));

  const qs = params.toString();
  const path = qs ? `/cards?${qs}` : "/cards";

  return request(path);
}

export async function getCard(cardId) {
  return request(`/cards/${cardId}`);
}

export async function createCard(cardPayload) {
  return request("/cards", {
    method: "POST",
    body: JSON.stringify(cardPayload),
  });
}

export async function updateCard(cardId, cardPayload) {
  return request(`/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify(cardPayload),
  });
}

export async function deleteCard(cardId) {
  return request(`/cards/${cardId}`, {
    method: "DELETE",
  });
}

/* ========================
 * Card versions
 * ====================== *

/* ========================
 * Pantheons
 * ====================== */

export async function fetchPantheons() {
  return request("/pantheons");
}

export async function createPantheon(data) {
  return request("/pantheons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePantheon(id, data) {
  return request(`/pantheons/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePantheon(id) {
  return request(`/pantheons/${id}`, {
    method: "DELETE",
  });
}

/* ========================
 * Archetypes
 * ====================== */

export async function fetchArchetypes() {
  return request("/archetypes");
}

export async function createArchetype(data) {
  return request("/archetypes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateArchetype(id, data) {
  return request(`/archetypes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteArchetype(id) {
  return request(`/archetypes/${id}`, {
    method: "DELETE",
  });
}

/* ========================
 * Passive definitions
 * ====================== */

export async function fetchPassives() {
  return request("/passives");
}

export async function createPassive(data) {
  return request("/passives", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePassive(id, data) {
  return request(`/passives/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePassiveApi(id) {
  return request(`/passives/${id}`, {
    method: "DELETE",
  });
}

export async function findPassiveByGroupAndName(groupName, name) {
  const allPassives = await fetchPassives();
  return allPassives.find(
    (p) =>
      p.group_name?.toLowerCase() === groupName?.toLowerCase() &&
      p.name?.toLowerCase() === name?.toLowerCase()
  ) || null;
}

export async function getOrCreatePassive(data) {
  const existing = await findPassiveByGroupAndName(data.group_name, data.name);
  if (existing) {
    return existing;
  }
  return createPassive(data);
}

/* ========================
 * Ability timings
 * ====================== */

export async function fetchAbilityTimings() {
  return request("/ability-timings");
}

export async function createAbilityTiming(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  return request("/ability-timings", {
    method: "POST",
    body: JSON.stringify({ name: trimmed }),
  });
}
/* ========================
 * Card versions
 * ====================== */

export async function fetchCardVersions(cardId) {
  return request(`/cards/${cardId}/versions`);
}

export async function getCardVersion(cardId, version) {
  return request(`/cards/${cardId}/versions/${version}`);
}

export async function restoreCardVersion(cardId, version) {
  return request(`/cards/${cardId}/versions/${version}/restore`, {
    method: "POST",
  });
}


// Passive versions
export async function fetchPassiveVersions(passiveId) {
  return request(`/passives/${passiveId}/versions`);
}

export async function getPassiveVersion(passiveId, version) {
  return request(`/passives/${passiveId}/versions/${version}`);
}

export async function restorePassiveVersion(passiveId, version) {
  return request(`/passives/${passiveId}/versions/${version}/restore`, {
    method: "POST",
  });
}

export async function fetchTags() {
  return request("/tags");
}

export async function deleteTag(tagId) {
  return request(`/tags/${tagId}`, {
    method: "DELETE",
  });
}

export async function fetchKeywordAbilities() {
  return request("/keyword-abilities");
}

export async function createKeywordAbility(data) {
  return request("/keyword-abilities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateKeywordAbility(id, data) {
  return request(`/keyword-abilities/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteKeywordAbility(id) {
  return request(`/keyword-abilities/${id}`, {
    method: "DELETE",
  });
}

export async function fetchKeywordAbilityVersions(abilityId) {
  return request(`/keyword-abilities/${abilityId}/versions`);
}

export async function getKeywordAbilityVersion(abilityId, version) {
  return request(`/keyword-abilities/${abilityId}/versions/${version}`);
}

export async function restoreKeywordAbilityVersion(abilityId, version) {
  return request(`/keyword-abilities/${abilityId}/versions/${version}/restore`, {
    method: "POST",
  });
}

export async function findKeywordAbilityByName(name) {
  const allAbilities = await fetchKeywordAbilities();
  return allAbilities.find(
    (a) => a.name?.toLowerCase() === name?.toLowerCase()
  ) || null;
}

export async function getOrCreateKeywordAbility(data) {
  const existing = await findKeywordAbilityByName(data.name);
  if (existing) {
    return existing;
  }
  return createKeywordAbility(data);
}

export async function fetchLocations(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.search) params.set("search", filters.search);
  if (filters.pantheons?.length) params.set("pantheons", filters.pantheons.join(","));
  if (filters.archetypes?.length) params.set("archetypes", filters.archetypes.join(","));
  
  const queryString = params.toString();
  const url = queryString ? `${API_BASE}/locations?${queryString}` : `${API_BASE}/locations`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch locations");
  return response.json();
}

export async function createLocation(locationData) {
  const response = await fetch(`${API_BASE}/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(locationData),
  });
  if (!response.ok) throw new Error("Failed to create location");
  return response.json();
}

export async function updateLocation(id, locationData) {
  const response = await fetch(`${API_BASE}/locations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(locationData),
  });
  if (!response.ok) throw new Error("Failed to update location");
  return response.json();
}

export async function deleteLocation(id) {
  const response = await fetch(`${API_BASE}/locations/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete location");
  return response.json();
}

export async function fetchLocationsMetadata() {
  const response = await fetch(`${API_BASE}/locations/metadata/summary`);
  if (!response.ok) throw new Error("Failed to fetch locations metadata");
  return response.json();
}