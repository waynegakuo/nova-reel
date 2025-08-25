export interface MediaBase {
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  id: number;
  original_language: string;
  overview: string;
  popularity: number;
  poster_path: string;
  vote_average: number;
  vote_count: number;
  mediaType?: 'movie' | 'tvshow';
}

export interface Movie extends MediaBase {
  original_title: string;
  release_date: string;
  title: string;
  video: boolean;
}

export interface TvShow extends MediaBase {
  origin_country: string[];
  original_name: string;
  first_air_date: string;
  name: string;
}

export interface MediaResponse {
  page: number;
  results: (Movie | TvShow)[];
  total_pages: number;
  total_results: number;
}
