function requireAuth() {
  if (!NW.isAuthed()) {
    window.location.href = 'index.html';
  }
}

function renderNav(active) {
  const navHost = document.getElementById('nav');
  if (!navHost) return;
  const authed = NW.isAuthed();
  const user = NW.getUser();

  const links = authed ? [
    ['browse.html', 'Browse', 'browse'],
    ['recommendations.html', 'For You', 'recommendations'],
    ['my-reviews.html', 'My Ratings', 'my-reviews'],
  ] : [];

  navHost.innerHTML = `
    <div class="marquee-bulbs" aria-hidden="true"></div>
    <nav class="topnav">
      <a class="brand" href="${authed ? 'browse.html' : 'index.html'}">Next<span>Watch</span></a>
      <div class="nav-links">
        ${links.map(([href, label, key]) =>
          `<a href="${href}" class="${active === key ? 'active' : ''}">${label}</a>`
        ).join('')}
      </div>
      <div class="nav-right">
        ${authed
          ? `<span class="nav-user">${escapeHtml(user || '')}</span><button class="btn ghost small" id="navLogout">Log out</button>`
          : `<a class="btn ghost small" href="index.html">Log in</a><a class="btn small" href="register.html">Sign up</a>`
        }
      </div>
    </nav>
  `;

  const bulbs = navHost.querySelector('.marquee-bulbs');
  const count = window.innerWidth < 720 ? 22 : 42;
  for (let i = 0; i < count; i++) bulbs.appendChild(document.createElement('span'));

  const logoutBtn = document.getElementById('navLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      NW.clearSession();
      window.location.href = 'index.html';
    });
  }
}
