# Minus Store

A modern, Play Store-inspired project showcase built with Flask, Waitress and Jinja2.

## Features

- Modern responsive storefront UI
- Project cards with icons, tags, tech stack and status
- Search and category filtering
- Individual project detail pages
- JSON-only content management: projects, about and links live in `static/data/`
- No database required
- Production-ready Waitress entry point
- Dark glassmorphism-inspired visual system

## Run locally

```bash
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

For Waitress:

```bash
waitress-serve --listen=0.0.0.0:8000 app:app
```

Open `http://127.0.0.1:8000`.

## Content editing

Edit these files without touching the Flask code:

- `static/data/about.json` — store identity, bio and stats
- `static/data/projects.json` — all project cards and project detail data
- `static/data/links.json` — social/contact links

Each project can define `id`, `slug`, `title` (or `name`), `tagline`, `description`, `long_description`, `icon_image` (icon on project's own page), `demo_image` (demo image on general card), `icon`, `accent`, `status`, `featured`, `version`, `updated`, `techStack` (or `technologies`), `tags`, `links` (`github`, `demo`, `gitdiagram`), and `features`. Each project page automatically embeds an interactive codebase architecture map powered by GitDiagram.
