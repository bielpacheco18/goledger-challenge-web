export interface TvShow {
  "@assetType": "tvShows";
  "@key": string;
  "@lastTouchBy": string;
  "@lastTx": string;
  "@lastUpdated": string;
  name?: string;
  description?: string;
  yearReleased?: number;
  recommendedAge?: number;
}

export interface Season {
  "@assetType": "seasons";
  "@key": string;
  "@lastTouchBy": string;
  "@lastTx": string;
  "@lastUpdated": string;
  seasonNumber: number;
  yearReleased?: number;
  tvShow: { "@assetType": "tvShows"; "@key": string; name?: string };
}

export interface Episode {
  "@assetType": "episodes";
  "@key": string;
  "@lastTouchBy": string;
  "@lastTx": string;
  "@lastUpdated": string;
  name?: string;
  episodeNumber: number;
  season: { "@assetType": "seasons"; "@key": string };
  dateAired?: string;
  description?: string;
}

export interface Playlist {
  "@assetType": "watchlist" | "watchlists" | "favorites" | "favoriteList" | "favoriteLists" | "playlist";
  "@key": string;
  "@lastTouchBy": string;
  "@lastTx": string;
  "@lastUpdated": string;
  name?: string;
  tvShows?: Array<{ "@assetType": "tvShows"; "@key": string; name?: string }>;
}

export interface SearchResponse<T> {
  result: T[];
  metadata?: unknown;
}
