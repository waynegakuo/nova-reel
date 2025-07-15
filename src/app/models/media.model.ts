interface MediaBase {
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
}


interface Movie extends MediaBase {
  original_title: string;
  release_date: string;
  title: string;
  video: boolean;
}

interface TvShow extends MediaBase {
  origin_country: string[];
  original_name: string;
  first_air_date: string;
  name: string;
}
