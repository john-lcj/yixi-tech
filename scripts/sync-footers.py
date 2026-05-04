#!/usr/bin/env python3
"""
Replace <footer class="site-footer">…</footer> in public zh/ and en/ HTML
with the canonical snippets in snippets/footer-zh.html / footer-en.html.

Usage (from repo yixi-website/):
  python3 scripts/sync-footers.py

Requires site to be served with document root = this directory (yixi-website/),
so paths like /zh/index.html and /images/logo.png resolve correctly.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOOTER_RE = re.compile(
    r"\n\s*<footer\s+class=\"site-footer\">.*?</footer>",
    re.DOTALL,
)


def main() -> int:
    zh_snip = "\n" + (ROOT / "snippets" / "footer-zh.html").read_text(encoding="utf-8").rstrip() + "\n"
    en_snip = "\n" + (ROOT / "snippets" / "footer-en.html").read_text(encoding="utf-8").rstrip() + "\n"

    updated = []
    for lang, snip in (("zh", zh_snip), ("en", en_snip)):
        base = ROOT / lang
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*.html")):
            text = path.read_text(encoding="utf-8")
            if 'class="site-footer"' not in text:
                continue
            new_text, n = FOOTER_RE.subn(snip, text, count=1)
            if n != 1:
                print(f"WARN: footer replace count={n}: {path}", file=sys.stderr)
                continue
            if new_text != text:
                path.write_text(new_text, encoding="utf-8")
                updated.append(path)

    for p in updated:
        print("updated", p.relative_to(ROOT))
    print(f"Done. {len(updated)} file(s) updated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
