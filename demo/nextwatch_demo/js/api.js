/* NextWatch API client — talks to the Django backend covered by the API tester. */
const NW = (() => {
  const TOKEN_KEY = 'nw_token';
  const USER_KEY = 'nw_user';

  // api here — set this to your backend's real address before publishing.
  const API_BASE = 'https://hishamodel.pythonanywhere.com';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setSession(token, username) {
    localStorage.setItem(TOKEN_KEY, token);
    if (username) localStorage.setItem(USER_KEY, username);
  }
  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  function getUser() { return localStorage.getItem(USER_KEY); }
  function isAuthed() { return !!getToken(); }

  async function request(path, { method = 'GET', body, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && getToken()) headers['Authorization'] = 'Bearer ' + getToken();

    let res;
    try {
      res = await fetch(API_BASE + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      const err = new Error('Could not reach the server. Please try again in a moment.');
      err.network = true;
      throw err;
    }

    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = text; }
    }

    if (!res.ok) {
      let message = 'Request failed (' + res.status + ')';
      if (data) {
        if (typeof data === 'string') message = data;
        else if (data.detail) message = data.detail;
        else {
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            const v = data[firstKey];
            message = firstKey + ': ' + (Array.isArray(v) ? v.join(' ') : v);
          }
        }
      }
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  return {
    getToken, setSession, clearSession, getUser, isAuthed,

    login: (username, password) =>
      request('/api/token/', { method: 'POST', body: { username, password }, auth: false }),

    register: (username, email, password) =>
      request('/api/register/', { method: 'POST', body: { username, email, password }, auth: false }),

    searchTitles: (q) =>
      request('/api/titles/search/?q=' + encodeURIComponent(q)),

    getRecommendations: (limit) =>
      request('/api/recommendations/?limit=' + encodeURIComponent(limit)),

    listReviews: () =>
      request('/api/reviews/'),

    createReview: (title, rating, review_text) =>
      request('/api/reviews/', { method: 'POST', body: { title, rating, review_text } }),

    patchReview: (id, rating) =>
      request('/api/reviews/' + id + '/', { method: 'PATCH', body: { rating } }),

    deleteReview: (id) =>
      request('/api/reviews/' + id + '/', { method: 'DELETE' }),
  };
})();

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* Pulls a human title out of whatever shape the API happens to return —
   raw title objects and nested/summary shapes on reviews both work. */
function extractTitleName(obj) {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  return obj.title_name || obj.name ||
    (obj.title && typeof obj.title === 'object' ? (obj.title.title || obj.title.name) : null) ||
    (typeof obj.title === 'string' ? obj.title : null) ||
    (obj.title_detail && (obj.title_detail.title || obj.title_detail.name)) ||
    null;
}
function extractMediaType(obj) {
  if (!obj) return null;
  return obj.media_type ||
    (obj.title && typeof obj.title === 'object' ? obj.title.media_type : null) ||
    (obj.title_detail && obj.title_detail.media_type) ||
    null;
}
function mediaBadge(mt) {
  if (!mt) return '';
  return mt.toLowerCase() === 'tv' ? 'TV' : 'Movie';
}

/* Poster image, if the API gives us one. Handles a full URL or a bare
   TMDB-style path (e.g. "/abc123.jpg") since titles here are TMDB-synced. */
function extractPoster(obj) {
  if (!obj) return null;
  const raw = obj.poster_path || obj.poster_url || obj.poster || obj.image_url || obj.image ||
    (obj.title && typeof obj.title === 'object' ? (obj.title.poster_path || obj.title.poster_url) : null) ||
    (obj.title_detail && (obj.title_detail.poster_path || obj.title_detail.poster_url)) ||
    null;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return 'https://image.tmdb.org/t/p/w342' + (raw.startsWith('/') ? raw : '/' + raw);
}

function extractOverview(obj) {
  if (!obj) return null;
  return obj.overview || obj.description || obj.synopsis ||
    (obj.title_detail && obj.title_detail.overview) || null;
}

function extractYear(obj) {
  if (!obj) return '';
  const d = obj.release_date || obj.first_air_date ||
    (obj.title_detail && (obj.title_detail.release_date || obj.title_detail.first_air_date));
  return d ? String(d).slice(0, 4) : '';
}

/* Poster thumbnail markup used across cards, with a styled fallback when
   the API has no image for a title. */
function posterHtml(item, cls) {
  const src = extractPoster(item);
  const title = extractTitleName(item) || item.title || item.name || '';
  if (src) {
    return `<img src="${src}" alt="${escapeHtml(title)} poster" class="${cls}" loading="lazy"
      onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'${cls} poster-ph', innerHTML:'&#127909;'}))">`;
  }
  return `<div class="${cls} poster-ph">&#127909;</div>`;
}

/* Cache a title object client-side so its detail page can render without
   a dedicated "get title by id" endpoint. */
function cacheTitle(item) {
  try { sessionStorage.setItem('nw_title_' + item.id, JSON.stringify(item)); } catch (e) {}
}
function readCachedTitle(id) {
  try {
    const raw = sessionStorage.getItem('nw_title_' + id);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function hideMsg(el) {
  el.className = 'msg';
  el.textContent = '';
}
