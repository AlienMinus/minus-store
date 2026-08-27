from flask import Flask, render_template, abort, request
from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'static' / 'data'

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False


def load_json(filename):
    with open(DATA_DIR / filename, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_store_data():
    about = load_json('about.json')
    projects = load_json('projects.json')
    links = load_json('links.json')

    tags = {tag for p in projects for tag in p.get('tags', [])}
    techs = {tech for p in projects for tech in (p.get('technologies', []) or p.get('techStack', []))}
    about.setdefault('stats', {})
    about['stats']['projects'] = len(projects)
    about['stats']['categories'] = len(tags)
    about['stats']['technologies'] = len(techs)

    return {
        'about': about,
        'projects': projects,
        'links': links,
    }


@app.context_processor
def inject_globals():
    data = get_store_data()
    return {'store_about': data['about'], 'store_links': data['links']}


@app.route('/')
def index():
    data = get_store_data()
    query = request.args.get('q', '').strip().lower()
    category = request.args.get('category', '').strip().lower()

    projects = data['projects']
    if query:
        projects = [p for p in projects if query in ' '.join([
            p.get('name', ''), p.get('title', ''), p.get('tagline', ''), p.get('description', ''),
            ' '.join(p.get('technologies', [])), ' '.join(p.get('techStack', [])), ' '.join(p.get('tags', []))
        ]).lower()]
    if category and category != 'all':
        projects = [p for p in projects if category in [t.lower() for t in p.get('tags', [])]]

    categories = sorted({tag for p in data['projects'] for tag in p.get('tags', [])})
    featured = [p for p in projects if p.get('featured')]
    regular = [p for p in projects if not p.get('featured')]
    return render_template('index.html', projects=projects, featured=featured, regular=regular,
                           categories=categories, query=query, active_category=category or 'all')


@app.route('/project/<slug>')
def project_detail(slug):
    projects = load_json('projects.json')
    project = next((p for p in projects if p.get('slug') == slug or p.get('id') == slug), None)
    if not project:
        abort(404)
    project_slug = project.get('slug') or project.get('id')
    related = [p for p in projects if (p.get('slug') or p.get('id')) != project_slug and set(p.get('tags', [])) & set(project.get('tags', []))][:3]
    return render_template('project.html', project=project, related=related)


@app.errorhandler(404)
def not_found(_):
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True)
