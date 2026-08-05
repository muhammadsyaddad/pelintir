"""The documentation is a build input, not decoration.

Flag thresholds and user-facing copy live in red-flag spec frontmatter and are read
from there by code (ADR-0007). That only holds if something checks it, so these
tests are the enforcement:

  * every spec parses and carries the required keys
  * no banned word reaches a user-facing string
  * every spec claiming to be implemented has an implementation
  * no internal documentation link is broken, and no page is orphaned

Prose that only a reviewer checks eventually stops being checked.
"""

import re
from pathlib import Path

import pytest
import yaml

REPO_ROOT = Path(__file__).resolve().parents[3]
DOCS = REPO_ROOT / "docs"
FLAG_DIR = DOCS / "methodology" / "red-flags"
EDITORIAL_POLICY = DOCS / "editorial-policy.md"
FLAG_IMPL_DIR = REPO_ROOT / "packages" / "pipeline" / "src" / "pipeline" / "flags"

REQUIRED_KEYS = {
    "id",
    "status",
    "severity",
    "direction",
    "inputs",
    "min_peer_n",
    "thresholds",
    "question_id",
    "question_en",
    "ocp_reference",
    "last_reviewed",
}

VALID_STATUS = {"planned", "implemented", "retired"}
VALID_SEVERITY = {"low", "medium", "high"}

FRONTMATTER = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)
# [text](target) — skip images and anything with a scheme or anchor-only target.
MD_LINK = re.compile(r"(?<!\!)\[[^\]]*\]\(([^)]+)\)")


def _flag_specs() -> list[Path]:
    return sorted(p for p in FLAG_DIR.glob("*.md") if p.name != "README.md")


def _frontmatter(path: Path) -> dict:
    match = FRONTMATTER.match(path.read_text(encoding="utf-8"))
    assert match, f"{path.name}: no YAML frontmatter"
    return yaml.safe_load(match.group(1))


def _banned_words() -> set[str]:
    """Parse the banned list out of editorial-policy.md.

    The policy file is the single source of truth; duplicating the list here would
    guarantee the two drift.
    """
    text = EDITORIAL_POLICY.read_text(encoding="utf-8")
    start = text.index("## Banned words")
    block = re.search(r"```\n(.*?)```", text[start:], re.DOTALL)
    assert block, "editorial-policy.md: banned word list code block not found"
    return {line.strip().lower() for line in block.group(1).splitlines() if line.strip()}


def _markdown_files() -> list[Path]:
    files = sorted(DOCS.rglob("*.md"))
    files += [
        REPO_ROOT / name
        for name in ("README.md", "AGENTS.md", "CONTRIBUTING.md", "SECURITY.md")
        if (REPO_ROOT / name).exists()
    ]
    return files


SPECS = _flag_specs()


def test_flag_specs_exist():
    assert SPECS, "no red-flag specs found"


@pytest.mark.parametrize("spec", SPECS, ids=lambda p: p.stem)
def test_frontmatter_contract(spec: Path):
    data = _frontmatter(spec)

    missing = REQUIRED_KEYS - data.keys()
    assert not missing, f"{spec.name}: missing frontmatter keys {sorted(missing)}"

    assert data["id"] == spec.stem, f"{spec.name}: id must equal the filename stem"
    assert data["status"] in VALID_STATUS, f"{spec.name}: bad status {data['status']!r}"
    assert data["severity"] in VALID_SEVERITY, f"{spec.name}: bad severity {data['severity']!r}"
    assert data["inputs"], f"{spec.name}: inputs must be non-empty"
    assert data["thresholds"], f"{spec.name}: thresholds must be non-empty"
    assert data["question_id"], f"{spec.name}: question_id must be non-empty"
    assert data["question_en"], f"{spec.name}: question_en must be non-empty"

    # null is allowed for flags with no peer comparison; a number below the global
    # floor is not. A median over three rows is an anecdote.
    peer_n = data["min_peer_n"]
    if peer_n is not None:
        assert peer_n >= 5, f"{spec.name}: min_peer_n {peer_n} is below the floor of 5"


@pytest.mark.parametrize("spec", SPECS, ids=lambda p: p.stem)
def test_question_copy_has_no_banned_word(spec: Path):
    banned = _banned_words()
    data = _frontmatter(spec)

    for field in ("question_id", "question_en"):
        text = str(data[field]).lower()
        hits = sorted(w for w in banned if re.search(rf"\b{re.escape(w)}\b", text))
        assert not hits, f"{spec.name}: {field} contains banned {hits}"


@pytest.mark.parametrize("spec", SPECS, ids=lambda p: p.stem)
def test_spec_declares_what_it_does_not_claim(spec: Path):
    """The section a lawyer reads first. A spec without it has not been thought about."""
    body = spec.read_text(encoding="utf-8")
    assert "## What this does not claim" in body, f"{spec.name}: missing non-claims section"


@pytest.mark.parametrize("spec", SPECS, ids=lambda p: p.stem)
def test_implemented_flags_have_an_implementation(spec: Path):
    data = _frontmatter(spec)
    if data["status"] != "implemented":
        return
    module = FLAG_IMPL_DIR / f"{spec.stem}.py"
    assert module.exists(), f"{spec.name}: status is implemented but {module} does not exist"


def test_no_orphan_implementations():
    """Every flag module must have a spec — a flag cannot ship undocumented."""
    if not FLAG_IMPL_DIR.exists():
        return
    documented = {s.stem for s in SPECS}
    modules = {p.stem for p in FLAG_IMPL_DIR.glob("*.py") if not p.stem.startswith("_")}
    assert modules <= documented, f"flag modules with no spec: {sorted(modules - documented)}"


def test_internal_links_resolve():
    broken: list[str] = []
    for path in _markdown_files():
        for target in MD_LINK.findall(path.read_text(encoding="utf-8")):
            if "://" in target or target.startswith(("#", "mailto:")):
                continue
            resolved = (path.parent / target.split("#", 1)[0]).resolve()
            if not resolved.exists():
                broken.append(f"{path.relative_to(REPO_ROOT)} -> {target}")
    assert not broken, "broken internal links:\n" + "\n".join(broken)


def test_no_orphan_docs():
    """Every page under docs/ is linked from somewhere. An unreachable page is a dead page."""
    pages = {p.resolve() for p in DOCS.rglob("*.md")}
    linked: set[Path] = set()

    for path in _markdown_files():
        for target in MD_LINK.findall(path.read_text(encoding="utf-8")):
            if "://" in target or target.startswith(("#", "mailto:")):
                continue
            resolved = (path.parent / target.split("#", 1)[0]).resolve()
            if resolved.is_dir():
                resolved = resolved / "README.md"
            linked.add(resolved)

    orphans = sorted(str(p.relative_to(REPO_ROOT)) for p in pages - linked)
    assert not orphans, f"docs not linked from anywhere: {orphans}"
