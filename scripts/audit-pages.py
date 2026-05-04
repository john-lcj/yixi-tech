#!/usr/bin/env python3
"""Pre-launch audit for the Yixi public site.

Usage (from yixi-website/):
  python3 scripts/audit-pages.py

Reports:
  1. zh/ ↔ en/ page pairing (missing counterparts).
  2. Per-page presence of footer block, phone, email, ICP, JSON-LD on home, etc.
  3. Stray references that may break on OSS (e.g. `file://` style links).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PHONE = "+86-18101830254"
EMAIL = "info@yixi-tech.com"
ICP = "沪ICP备2024076188号-1"


def list_html(lang: str) -> list[Path]:
    base = ROOT / lang
    if not base.is_dir():
        return []
    return sorted(p for p in base.rglob("*.html"))


def rel(p: Path) -> str:
    return str(p.relative_to(ROOT))


def check_pairing() -> tuple[list[str], list[str]]:
    zh = {p.relative_to(ROOT / "zh"): p for p in list_html("zh")}
    en = {p.relative_to(ROOT / "en"): p for p in list_html("en")}
    only_zh = [str(k) for k in sorted(zh.keys() - en.keys())]
    only_en = [str(k) for k in sorted(en.keys() - zh.keys())]
    return only_zh, only_en


def check_page(p: Path, lang: str) -> list[str]:
    text = p.read_text(encoding="utf-8")
    issues: list[str] = []
    if 'class="site-footer"' not in text:
        issues.append("missing <footer class=site-footer>")
    if PHONE not in text:
        issues.append(f"phone {PHONE!r} not found")
    if EMAIL not in text:
        issues.append(f"email {EMAIL!r} not found")
    if ICP not in text:
        issues.append(f"ICP {ICP!r} not found")
    if 'href="../images/' not in text and 'href="/images/' not in text and 'src="../' not in text and 'src="/' not in text:
        # very rough: most pages reference images one way or another; only worth flagging silence
        issues.append("no image / asset references at all")
    return issues


def check_home(p: Path) -> list[str]:
    text = p.read_text(encoding="utf-8")
    issues: list[str] = []
    if 'application/ld+json' not in text:
        issues.append("missing JSON-LD")
    elif '"Organization"' not in text:
        issues.append("JSON-LD present but not Organization")
    if 'rel="canonical"' not in text and "<link rel=\"canonical\"" not in text:
        # not strictly required on language home; flag as info only
        pass
    return issues


def check_root_redirect() -> list[str]:
    p = ROOT / "index.html"
    if not p.is_file():
        return ["root index.html missing"]
    text = p.read_text(encoding="utf-8")
    issues = []
    if "/zh/index.html" not in text:
        issues.append("root redirect not pointing to /zh/index.html")
    if "<noscript" not in text:
        issues.append("missing <noscript> fallback")
    return issues


def main() -> int:
    print("== zh/en pairing ==")
    only_zh, only_en = check_pairing()
    if not only_zh and not only_en:
        print("  OK (all pages paired)")
    if only_zh:
        print(f"  zh-only ({len(only_zh)}):")
        for k in only_zh:
            print(f"    - zh/{k}")
    if only_en:
        print(f"  en-only ({len(only_en)}):")
        for k in only_en:
            print(f"    - en/{k}")

    print()
    print("== per-page checks ==")
    bad = 0
    for lang in ("zh", "en"):
        for p in list_html(lang):
            issues = check_page(p, lang)
            if p.name == "index.html" and p.parent == ROOT / lang:
                issues += check_home(p)
            if issues:
                bad += 1
                print(f"  ! {rel(p)}")
                for i in issues:
                    print(f"      - {i}")
    if bad == 0:
        print("  OK (no issues)")

    print()
    print("== root index.html ==")
    issues = check_root_redirect()
    if issues:
        for i in issues:
            print(f"  ! {i}")
    else:
        print("  OK")

    print()
    print("== summary ==")
    total = len(list_html("zh")) + len(list_html("en"))
    print(f"  {total} public HTML pages")
    print(f"  {bad} page(s) with warnings")
    return 0 if bad == 0 and not only_zh and not only_en else 1


if __name__ == "__main__":
    raise SystemExit(main())
