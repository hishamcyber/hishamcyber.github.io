/* Direct client-side TMDB client — used only for browsing/discovery.
   Rating still goes through your own backend, which owns the local title ids. */
const TMDB = (() => {
  // api here — paste your TMDB v3 API key between the quotes below.
  const API_KEY = 'a999f0c557995578f4d5efb77da2abf1';

  const API_BASE = 'https://api.themoviedb.org/3';
  const IMG_BASE = 'https://image.tmdb.org/t/p/w342';
  const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

  function hasKey() { return !!API_KEY; }

  async function request(path, params = {}) {
    if (!hasKey()) {
      const err = new Error('No TMDB API key configured. Add one in js/tmdb.js.');
      err.noKey = true;
      throw err;
    }
    const usp = new URLSearchParams({ api_key: API_KEY, ...params });
    let res;
    try {
      res = await fetch(`${API_BASE}${path}?${usp.toString()}`);
    } catch (e) {
      throw new Error('Could not reach TMDB. Check your connection.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data && data.status_message) || 'TMDB request failed (' + res.status + ')');
    }
    return data;
  }

  // media: 'movie' | 'tv'
  const CATEGORIES = {
    movie: [
      { key: 'trending', label: 'Trending', path: '/trending/movie/week' },
      { key: 'popular', label: 'Popular', path: '/movie/popular' },
      { key: 'now_playing', label: 'In Theaters', path: '/movie/now_playing' },
      { key: 'top_rated', label: 'Top Rated', path: '/movie/top_rated' },
      { key: 'upcoming', label: 'Upcoming', path: '/movie/upcoming' },
    ],
    tv: [
      { key: 'trending', label: 'Trending', path: '/trending/tv/week' },
      { key: 'popular', label: 'Popular', path: '/tv/popular' },
      { key: 'on_the_air', label: 'On Air', path: '/tv/on_the_air' },
      { key: 'top_rated', label: 'Top Rated', path: '/tv/top_rated' },
      { key: 'airing_today', label: 'Airing Today', path: '/tv/airing_today' },
    ],
  };

  function categoriesFor(media) { return CATEGORIES[media] || CATEGORIES.movie; }

  async function getCategoryPage(media, key, page = 1) {
    const cat = categoriesFor(media).find(c => c.key === key) || categoriesFor(media)[0];
    return request(cat.path, { page });
  }

  async function getGenres(media) {
    const data = await request(`/genre/${media}/list`);
    return data.genres || [];
  }

  async function discoverByGenrePage(media, genreId, page = 1) {
    return request(`/discover/${media}`, { with_genres: genreId, sort_by: 'popularity.desc', page });
  }

  async function getDetails(media, id) {
    return request(`/${media}/${id}`);
  }

  function posterUrl(path) { return path ? IMG_BASE + path : null; }
  function backdropUrl(path) { return path ? BACKDROP_BASE + path : null; }

  // Normalizes a TMDB result (movie or tv, list item or full details) into
  // the same shape the rest of the site's rendering helpers expect.
  function normalize(item, mediaHint) {
    const media = item.media_type || mediaHint || (item.title ? 'movie' : 'tv');
    return {
      tmdb_id: item.id,
      media_type: media,
      title: item.title || item.name || 'Untitled',
      overview: item.overview || '',
      poster_path: item.poster_path || null,
      release_date: item.release_date || item.first_air_date || '',
      vote_average: item.vote_average,
    };
  }

  return { hasKey, categoriesFor, getCategoryPage, getGenres, discoverByGenrePage, getDetails, posterUrl, backdropUrl, normalize };
})();
