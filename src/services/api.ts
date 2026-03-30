const rawApiUrl = import.meta.env.VITE_API_URL;
const apiUser = import.meta.env.VITE_API_USER;
const apiPassword = import.meta.env.VITE_API_PASSWORD;

if (!rawApiUrl) {
  throw new Error("Missing VITE_API_URL in environment");
}

if (!apiUser || !apiPassword) {
  throw new Error("Missing VITE_API_USER or VITE_API_PASSWORD in environment");
}

const normalizedApiUrl = rawApiUrl.replace(/\/+$/, "");
const API_BASE = normalizedApiUrl.endsWith("/api")
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;
const AUTH = btoa(`${apiUser}:${apiPassword}`);

const headers = {
  "Content-Type": "application/json",
  Authorization: `Basic ${AUTH}`,
};

const FAVORITES_ASSET_TYPES = [
  "watchlist",
  "watchlists",
  "favorites",
  "favoriteList",
  "favoriteLists",
  "playlist",
] as const;
const FAVORITES_ASSET_TYPE_SET = new Set<string>(FAVORITES_ASSET_TYPES);
const MVCC_RETRY_LIMIT = 2;
const MVCC_RETRY_DELAY_MS = 350;

async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  for (let attempt = 0; attempt <= MVCC_RETRY_LIMIT; attempt += 1) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return res.json();
    }

    const err = await res.text();
    const message = `API Error ${res.status}: ${err}`;
    const isMvccConflict =
      res.status >= 500 && message.includes("MVCC_READ_CONFLICT");

    if (isMvccConflict && attempt < MVCC_RETRY_LIMIT) {
      await new Promise((resolve) =>
        window.setTimeout(resolve, MVCC_RETRY_DELAY_MS * (attempt + 1)),
      );
      continue;
    }

    throw new Error(message);
  }

  throw new Error("API Error: falha inesperada ao concluir a requisição.");
}

function isMissingAssetTypeError(error: unknown, assetType: string) {
  return (
    error instanceof Error &&
    error.message.includes(`assetType named '${assetType}' does not exist`)
  );
}

function isFavoritesAssetType(assetType: unknown): assetType is (typeof FAVORITES_ASSET_TYPES)[number] {
  return typeof assetType === "string" && FAVORITES_ASSET_TYPE_SET.has(assetType);
}

function normalizeSearchResult<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeAssetRecord(item)) as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidate = payload as {
    result?: T[];
    docs?: T[];
    items?: T[];
    data?: T[];
  };

  const collection =
    candidate.result || candidate.docs || candidate.items || candidate.data || [];

  return collection.map((item) => normalizeAssetRecord(item)) as T[];
}

function normalizeAssetRecord(input: unknown) {
  if (!input || typeof input !== "object") {
    return input;
  }

  const item = input as Record<string, unknown>;
  const assetType = item["@assetType"];

  if (assetType === "tvShows") {
    return {
      ...item,
      name: item.name ?? item.title,
      description: item.description ?? item.synopsis,
      yearReleased: item.yearReleased ?? item.releaseYear,
    };
  }

  if (assetType === "seasons") {
    return {
      ...item,
      seasonNumber: item.seasonNumber ?? item.number,
      tvShow:
        item.tvShow ??
        (item.tvShowId
          ? {
              "@assetType": "tvShows",
              "@key": item.tvShowId,
            }
          : undefined),
    };
  }

  if (assetType === "episodes") {
    return {
      ...item,
      name: item.name ?? item.title,
      episodeNumber: item.episodeNumber ?? item.number,
      description: item.description ?? item.synopsis,
      dateAired: item.dateAired ?? item.releaseDate ?? item.airDate,
      season:
        item.season ??
        (item.seasonId
          ? {
              "@assetType": "seasons",
              "@key": item.seasonId,
            }
          : undefined),
    };
  }

  if (isFavoritesAssetType(assetType)) {
    return {
      ...item,
      "@assetType": assetType,
      name: item.name ?? item.title,
      tvShows:
        item.tvShows ??
        (Array.isArray(item.tvShowIds)
          ? item.tvShowIds.map((key) => ({
              "@assetType": "tvShows",
              "@key": key,
            }))
          : []),
    };
  }

  return item;
}

function serializeAssetForWrite(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => serializeAssetForWrite(item));
  }

  if (!input || typeof input !== "object") {
    return input;
  }

  const item = { ...(input as Record<string, unknown>) };
  const assetType = item["@assetType"];

  if (assetType === "tvShows") {
    if (item.name && !item.title) item.title = item.name;
    if (item.yearReleased && !item.releaseYear) item.releaseYear = item.yearReleased;

    delete item.name;
    delete item.genre;
    delete item.yearReleased;
  }

  if (assetType === "seasons") {
    if (item.yearReleased && !item.year) item.year = item.yearReleased;
    if (item.seasonNumber && !item.number) item.number = item.seasonNumber;

    delete item.yearReleased;
    delete item.seasonNumber;
    delete item.description;
    delete item.synopsis;
  }

  if (assetType === "episodes") {
    if (item.name && !item.title) item.title = item.name;
    if (item.number && !item.episodeNumber) item.episodeNumber = item.number;
    if (item.dateAired && !item.releaseDate) item.releaseDate = item.dateAired;
    item.releaseDate = toRfc3339(item.releaseDate);
    if (!item.seasonId && item.season && typeof item.season === "object") {
      item.seasonId = (item.season as { "@key"?: string })["@key"];
    }

    delete item.name;
    delete item.number;
    delete item.dateAired;
    delete item.airDate;
  }

  if (isFavoritesAssetType(assetType)) {
    if (item.name && !item.title) item.title = item.name;

    if (!item.tvShowIds && Array.isArray(item.tvShows)) {
      item.tvShowIds = item.tvShows
        .map((show) =>
          typeof show === "object" && show
            ? (show as { "@key"?: string })["@key"]
            : undefined,
        )
        .filter(Boolean);
    }

    delete item.name;
    delete item.tvShows;
  }

  return item;
}

function escapeRegex(term: string) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchSelector(
  assetType: string,
  term?: string,
  fields: string[] = [],
) {
  const normalizedTerm = term?.trim();

  if (!normalizedTerm || fields.length === 0) {
    return { "@assetType": assetType };
  }

  const regex = `(?i)${escapeRegex(normalizedTerm)}`;

  return {
    "@assetType": assetType,
    $or: fields.map((field) => ({
      [field]: { $regex: regex },
    })),
  };
}

function toRfc3339(value: unknown) {
  if (typeof value !== "string" || !value) {
    return value;
  }

  if (value.includes("T")) {
    return value;
  }

  return `${value}T00:00:00Z`;
}

// Search
export function searchAssets<T>(
  assetType: string,
  options?: { term?: string; fields?: string[] },
) {
  return apiPost<unknown>("/query/search", {
    query: {
      selector: buildSearchSelector(
        assetType,
        options?.term,
        options?.fields,
      ),
    },
  }).then((response) => normalizeSearchResult<T>(response));
}

export async function searchFavoriteLists<T>(options?: {
  term?: string;
  fields?: string[];
}) {
  for (const assetType of FAVORITES_ASSET_TYPES) {
    try {
      return await searchAssets<T>(assetType, options);
    } catch (error) {
      if (!isMissingAssetTypeError(error, assetType)) {
        throw error;
      }
    }
  }

  throw new Error("Nenhum tipo de favoritos compatível foi encontrado na API.");
}

// Read
export function readAsset<T>(key: Record<string, unknown>) {
  return apiPost<T>("/query/readAsset", { key });
}

// Create
export function createAsset<T>(asset: Record<string, unknown>[]) {
  return apiPost<T[]>("/invoke/createAsset", {
    asset: serializeAssetForWrite(asset),
  });
}

export async function createFavoriteList<T>(asset: Record<string, unknown>) {
  for (const assetType of FAVORITES_ASSET_TYPES) {
    try {
      return await createAsset<T>([{ ...asset, "@assetType": assetType }]);
    } catch (error) {
      if (!isMissingAssetTypeError(error, assetType)) {
        throw error;
      }
    }
  }

  throw new Error("Nenhum tipo de favoritos compatível foi encontrado na API.");
}

// Update
export function updateAsset<T>(asset: Record<string, unknown>) {
  const serialized = serializeAssetForWrite(asset) as Record<string, unknown>;

  return apiPost<T>("/invoke/updateAsset", {
    key: {
      "@assetType": serialized["@assetType"],
      "@key": serialized["@key"],
    },
    update: serialized,
  });
}

export async function updateFavoriteList<T>(asset: Record<string, unknown>) {
  for (const assetType of FAVORITES_ASSET_TYPES) {
    try {
      return await updateAsset<T>({ ...asset, "@assetType": assetType });
    } catch (error) {
      if (!isMissingAssetTypeError(error, assetType)) {
        throw error;
      }
    }
  }

  throw new Error("Nenhum tipo de favoritos compatível foi encontrado na API.");
}

// Delete
export function deleteAsset(key: Record<string, unknown>) {
  const serialized = serializeAssetForWrite(key) as Record<string, unknown>;

  return apiPost("/invoke/deleteAsset", {
    key: {
      "@assetType": serialized["@assetType"],
      "@key": serialized["@key"],
    },
  });
}

export async function deleteFavoriteList(key: Record<string, unknown>) {
  for (const assetType of FAVORITES_ASSET_TYPES) {
    try {
      return await deleteAsset({ ...key, "@assetType": assetType });
    } catch (error) {
      if (!isMissingAssetTypeError(error, assetType)) {
        throw error;
      }
    }
  }

  throw new Error("Nenhum tipo de favoritos compatível foi encontrado na API.");
}
