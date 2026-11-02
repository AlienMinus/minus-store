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


ARCADE_GAMES = [
    {
        'id': 'snake',
        'cartridge': 'CARTRIDGE #01',
        'genre': 'CLASSIC',
        'icon': '🐍',
        'title': 'Retro Snake',
        'tagline': 'Navigate the pixel snake through the grid to eat apples. Accelerates as you grow!',
        'tags': ['GRID: 32x17', 'ARROWS / WASD', 'SPEED ACCEL'],
        'color': '#008744',
        'hi_default': '250',
        'controls': 'Arrows or WASD to turn direction'
    },
    {
        'id': 'breaker',
        'cartridge': 'CARTRIDGE #02',
        'genre': 'ACTION',
        'icon': '🧱',
        'title': 'Brick Breaker',
        'tagline': 'Deflect the pixel ball with your bottom paddle to demolish colored brick formations.',
        'tags': ['PADDLE: ARROWS', 'SPACE: LAUNCH', '4 TIER BRICKS'],
        'color': '#f59e0b',
        'hi_default': '400',
        'controls': 'Arrows to move paddle, Space to launch'
    },
    {
        'id': 'defender',
        'cartridge': 'CARTRIDGE #03',
        'genre': 'SHOOTER',
        'icon': '👾',
        'title': 'Space Defender',
        'tagline': 'Intercept waves of descending alien invaders with your plasma cannon before they touch down.',
        'tags': ['ARROWS: STRAFE', 'SPACE: LASER', '3 ALIEN WAVES'],
        'color': '#c90057',
        'hi_default': '600',
        'controls': 'Left/Right to move, Space to fire lasers'
    },
    {
        'id': 'dino',
        'cartridge': 'CARTRIDGE #04',
        'genre': 'RUNNER',
        'icon': '🦖',
        'title': 'Dino Runner',
        'tagline': 'Endless desert runner dodging prehistoric cacti with dynamic jumping and cloud scenery.',
        'tags': ['SPACE / UP: JUMP', 'RAMPING SPEED', 'DAY SCENERY'],
        'color': '#007769',
        'hi_default': '500',
        'controls': 'Space or Up Arrow to jump over cacti'
    },
    {
        'id': 'pong',
        'cartridge': 'CARTRIDGE #05',
        'genre': 'SPORTS',
        'icon': '🏓',
        'title': 'Pixel Pong',
        'tagline': '1-on-1 retro table tennis showdown against an AI CPU opponent with dynamic rally deflectors.',
        'tags': ['1P VS CPU', 'UP/DOWN: PADDLE', 'FIRST TO 7'],
        'color': '#f59e0b',
        'hi_default': '700',
        'controls': 'Up/Down arrows to control paddle'
    },
    {
        'id': 'racer',
        'cartridge': 'CARTRIDGE #06',
        'genre': 'RACING',
        'icon': '🏎',
        'title': 'Pixel Racer',
        'tagline': 'High-octane 3-lane highway dodge runner. Weave through traffic, grab fuel canisters and nitro boost.',
        'tags': ['3-LANE HIGHWAY', 'UP: NITRO', 'TRAFFIC DODGE'],
        'color': '#ea580c',
        'hi_default': '850',
        'controls': 'Left/Right to switch lanes, Up for Nitro'
    },
    {
        'id': 'tetris',
        'cartridge': 'CARTRIDGE #07',
        'genre': 'PUZZLE',
        'icon': '🧩',
        'title': 'Block Stacker',
        'tagline': 'The legendary falling block puzzle. Rotate, position and clear rows with 7 classic tetromino shapes.',
        'tags': ['7 TETROMINOES', 'UP: ROTATE', 'NEXT PREVIEW'],
        'color': '#7c3aed',
        'hi_default': '1200',
        'controls': 'Left/Right to move, Up to rotate, Down to drop'
    }
]


@app.route('/arcade')
def arcade():
    return render_template('arcade.html', games=ARCADE_GAMES)


@app.errorhandler(404)
def not_found(_):
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True)
