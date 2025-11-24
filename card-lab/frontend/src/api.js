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

/**
 * Fetch cards, optionally filtered.
 * filters = { pantheon, archetype, type, search, tag }
 */
export async function fetchCards(filters = {}) {
  const params = new URLSearchParams();

  if (filters.pantheon) params.set("pantheon", filters.pantheon);
  if (filters.archetype) params.set("archetype", filters.archetype);
  if (filters.type) params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  if (filters.tag) params.set("tag", filters.tag);

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
 * ====================== */

export async function fetchCardVersions(cardId) {
  return request(`/cards/${cardId}/versions`);
}

export async function getCardVersion(cardId, version) {
  return request(`/cards/${cardId}/versions/${version}`);
}

/**
 * Restore a previous version: the backend will
 * - update the Card row to match that version
 * - create a new latest version entry
 */
export async function restoreCardVersion(cardId, version) {
  return request(`/cards/${cardId}/versions/${version}/restore`, {
    method: "POST",
  });
}

/* ========================
 * Pantheons
 * ====================== */

export async function fetchPantheons() {
  return request("/pantheons");
}

/**
 * data = { name, description? }
 */
export async function createPantheon(data) {
  return request("/pantheons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ========================
 * Archetypes
 * ====================== */

export async function fetchArchetypes() {
  return request("/archetypes");
}

/**
 * data = { name, description? }
 */
export async function createArchetype(data) {
  return request("/archetypes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ========================
 * Passive definitions
 * ====================== */

/**
 * filters = { pantheon, archetype }
 */
export async function fetchPassives(filters = {}) {
  const params = new URLSearchParams();
  if (filters.pantheon) params.set("pantheon", filters.pantheon);
  if (filters.archetype) params.set("archetype", filters.archetype);

  const qs = params.toString();
  const path = qs ? `/passives?${qs}` : "/passives";

  return request(path);
}

/**
 * data = {
 *   group_name,
 *   name,
 *   text,
 *   pantheon?,
 *   archetype?
 * }
 */
export async function createPassiveDefinition(data) {
  return request("/passives", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
