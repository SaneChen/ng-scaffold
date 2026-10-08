#!/usr/bin/env python3
"""Writes the sample repositories of the remote-data table demo and their owners' avatars.

How this file was built: written by hand. A seeded random generator combines invented owners,
names and descriptions into 60 repositories shaped like GitHub's search results (only the fields
the page shows), written to public/data/demo/repos.json, and draws one SVG avatar (initials on a
colour) per owner into public/images/demo/avatars/.

Why: ng-matero's page searched api.github.com, which the demo must not depend on (offline,
rate limits, foreign hosts). The names and numbers are invented, and the links use the reserved
example.com domain. The output never changes unless this script does:
`python3 tools/demo-repos.py`.
"""
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/data/demo/repos.json'
AVATARS = ROOT / 'public/images/demo/avatars'

OWNERS = {
    'aurora-labs': '#5c6bc0',
    'nimbus-dev': '#00897b',
    'tidepool': '#0277bd',
    'ember-works': '#d84315',
    'quartz-io': '#6d4c41',
    'pinecone-studio': '#2e7d32',
}
NAMES = ['ui', 'charts', 'forms', 'router', 'icons', 'grid', 'themes', 'cli', 'docs', 'utils']
THINGS = {
    'ui': 'component library',
    'charts': 'charting toolkit',
    'forms': 'form builder',
    'router': 'routing helper',
    'icons': 'icon set',
    'grid': 'data grid',
    'themes': 'theme collection',
    'cli': 'command-line tool',
    'docs': 'documentation site generator',
    'utils': 'set of small utilities',
}
ADJECTIVES = ['A lightweight', 'An accessible', 'A fast', 'A typed', 'A modular', 'A tiny']
TARGETS = ['for Angular', 'for web apps', 'for dashboards', 'for design systems', 'for the browser']
LANGUAGES = ['TypeScript', 'TypeScript', 'TypeScript', 'JavaScript', 'SCSS', 'HTML', 'Go', 'Rust']
LICENSES = ['MIT License', 'MIT License', 'Apache License 2.0', 'BSD 3-Clause License', None]
START = datetime(2016, 1, 1, tzinfo=timezone.utc)
END = datetime(2026, 9, 30, tzinfo=timezone.utc)


def iso(moment: datetime) -> str:
    return moment.strftime('%Y-%m-%dT%H:%M:%SZ')


def avatar(owner: str, colour: str) -> str:
    initials = ''.join(part[0] for part in owner.split('-')).upper()
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        f'<rect width="64" height="64" fill="{colour}"/>'
        '<text x="32" y="41" fill="#fff" font-family="sans-serif" font-size="26" '
        f'font-weight="600" text-anchor="middle">{initials}</text></svg>\n'
    )


def main() -> None:
    rng = random.Random(2026)
    repos = []
    for owner in OWNERS:
        for name in rng.sample(NAMES, 10):
            prefix = owner.split('-')[0]
            created = START + timedelta(days=rng.randrange((END - START).days - 60))
            updated = created + timedelta(days=rng.randrange(30, (END - created).days))
            stars = int(rng.paretovariate(1.1) * 40)
            repos.append({
                'id': len(repos) + 1,
                'name': f'{prefix}-{name}',
                'owner': {'login': owner, 'avatar_url': f'images/demo/avatars/{owner}.svg'},
                'description': f'{rng.choice(ADJECTIVES)} {THINGS[name]} {rng.choice(TARGETS)}.',
                'stargazers_count': stars,
                'forks_count': stars // rng.randrange(4, 12),
                'open_issues': rng.randrange(0, 60),
                'language': rng.choice(LANGUAGES),
                'license': (lambda name: {'name': name} if name else None)(rng.choice(LICENSES)),
                'homepage': f'https://example.com/{prefix}-{name}' if rng.random() < 0.6 else None,
                'fork': rng.random() < 0.15,
                'archived': rng.random() < 0.1,
                'created_at': iso(created),
                'updated_at': iso(updated),
            })
    OUT.write_text(json.dumps(repos, indent=2) + '\n')
    AVATARS.mkdir(parents=True, exist_ok=True)
    for owner, colour in OWNERS.items():
        (AVATARS / f'{owner}.svg').write_text(avatar(owner, colour))
    print(f'{len(repos)} repositories, {len(OWNERS)} avatars')


main()
