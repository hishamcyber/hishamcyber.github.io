# hishamcyber.github.io

Personal portfolio website showcasing my projects, skills, and experience.

**Live site:** [hishamcyber.github.io](https://hishamcyber.github.io)

## About

Built as a personal API — the site frames itself as a set of endpoints (`GET /about`, `GET /projects`, `POST /contact`) rather than a standard scrolling page, tying into my backend/Django REST work and day-to-day terminal habits (Arch Linux + Hyprland).

## Stack

Plain HTML, CSS, and JavaScript — no build step, no framework. Deployed directly via GitHub Pages.

- `index.html` — page structure and content
- `style.css` — design system (CSS custom properties for theming, dark/light mode)
- `script.js` — mobile nav toggle, theme toggle, footer year

## Features

- Dark mode by default, with a light mode toggle (persisted via `localStorage`)
- Fully responsive layout
- No external JS dependencies

## Running locally

No build tools required — just serve the folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

Pushes to `main` deploy automatically via GitHub Pages.

## Contact

- Email: [hishamodel@gmail.com](mailto:hishamodel@gmail.com)
- GitHub: [@hishamcyber](https://github.com/hishamcyber)
