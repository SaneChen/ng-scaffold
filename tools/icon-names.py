#!/usr/bin/env python3
"""Lists the icon names of the self-hosted Material Symbols font for the icons demo page.

How this file was built: written by hand. It reads the ligature table (GSUB) of the installed
@fontsource/material-symbols-outlined font with fontTools (`pip install fonttools brotli`) and
writes the sorted names to public/data/demo/icon-names.json.

Why: the icons page should list exactly the ligatures the bundled font renders; ng-matero kept a
hand-made list of about 1,000 names that drifted from the font. Run it again after upgrading the
font package: `python3 tools/icon-names.py`.
"""
import json
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / 'node_modules/@fontsource/material-symbols-outlined/files'
OUT = ROOT / 'public/data/demo/icon-names.json'

font = TTFont(FONT / 'material-symbols-outlined-latin-400-normal.woff2')
chars = {glyph: chr(code) for code, glyph in font.getBestCmap().items()}
names = set()
for lookup in font['GSUB'].table.LookupList.Lookup:
    for table in lookup.SubTable:
        table = table.ExtSubTable if lookup.LookupType == 7 else table
        for first, ligatures in getattr(table, 'ligatures', {}).items():
            for ligature in ligatures:
                glyphs = [first, *ligature.Component]
                if all(glyph in chars for glyph in glyphs):
                    names.add(''.join(chars[glyph] for glyph in glyphs))

OUT.write_text(json.dumps(sorted(names), indent=2) + '\n')
print(f'{len(names)} icon names written to {OUT.relative_to(ROOT)}')
