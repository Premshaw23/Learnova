"""
Fetches all contributors from the GitHub API (paginated),
filters out bots and non-User accounts, then writes:
  - data/contributors.json
  - README.md  (between <!-- CONTRIBUTORS:START --> and <!-- CONTRIBUTORS:END -->)
"""

import json
import os
import re
import sys
import urllib.request

TOKEN = os.environ.get("GH_TOKEN", "")
REPO  = "Premshaw23/Learnova"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "learnova-contributor-sync",
}


def gh_get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    # GitHub returns a dict with "message" on errors (rate-limit, bad token, etc.)
    if isinstance(data, dict) and "message" in data:
        raise RuntimeError(f"GitHub API error: {data['message']}  url={url}")
    return data


def is_human(login):
    """True only for real User accounts — skips Bots, Apps, Organizations."""
    try:
        t = gh_get(f"https://api.github.com/users/{login}").get("type", "User")
        if t != "User":
            print(f"  skip {login!r} (type={t})")
            return False
        return True
    except Exception as e:
        # On any API failure include the user — safer than silently dropping them
        print(f"  type-check failed for {login!r}: {e} — including anyway")
        return True


# ---------------------------------------------------------------------------
# 1. Paginate through every contributor page
# ---------------------------------------------------------------------------
# GitHub's hard max is 100 per page. We loop until a page returns fewer than
# 100 entries, which signals the last page.
#
# Edge case — exactly 100 contributors:
#   page 1 returns 100 (full) -> fetch page 2 -> page 2 returns 0 (<100) -> stop
#   All 100 included. ✓

print("Fetching contributors (paginated)...")
raw  = []
page = 1
while True:
    url = (
        f"https://api.github.com/repos/{REPO}/contributors"
        f"?per_page=100&page={page}&anon=false"
    )
    page_data = gh_get(url)
    raw.extend(page_data)
    print(f"  page {page}: {len(page_data)} entries  (running total: {len(raw)})")
    if len(page_data) < 100:
        break   # reached the last page
    page += 1

print(f"API total: {len(raw)} entries across {page} page(s)")

# ---------------------------------------------------------------------------
# 2. Filter and build the result list
# ---------------------------------------------------------------------------
admin_contributions = 0
others = []

for c in raw:
    login = c.get("login", "")
    count = c.get("contributions", 0)

    if "[bot]" in login.lower():        # vercel[bot], github-actions[bot] …
        print(f"  skip {login!r} ([bot] suffix)")
        continue

    if not is_human(login):             # Copilot, apps, org accounts …
        continue

    if login.lower() == "premshaw23":
        admin_contributions = count
    else:
        others.append({"username": login, "contributions": count})

# Admin is always first; contributions = 0 if they haven't committed yet
result = [
    {
        "username": "Premshaw23",
        "name":     "Prem Shaw",
        "admin":    True,
        "contributions": admin_contributions,
    }
] + others   # API already returns sorted desc by contributions

print(f"Result: {len(result)} human contributors ({len(others)} + 1 admin)")

# ---------------------------------------------------------------------------
# 3. Write data/contributors.json
# ---------------------------------------------------------------------------
with open("data/contributors.json", "w") as f:
    json.dump(result, f, indent=2)
    f.write("\n")
print("Wrote data/contributors.json")

# ---------------------------------------------------------------------------
# 4. Rebuild README contributors table (5 columns)
# ---------------------------------------------------------------------------
START = "<!-- CONTRIBUTORS:START -->"
END   = "<!-- CONTRIBUTORS:END -->"
COLS  = 5
GH    = "https://github.com"

with open("README.md", "r", encoding="utf-8") as f:
    readme = f.read()

if START not in readme or END not in readme:
    print("WARNING: README.md markers not found — skipping README update")
    sys.exit(0)


def make_cell(c):
    u     = c["username"]
    label = f'**{c["name"]}**' if c.get("admin") else f"@{u}"
    img   = (
        f'<a href="{GH}/{u}">'
        f'<img src="{GH}/{u}.png?size=60" width="52" height="52" alt="{u}"/>'
        f'</a>'
    )
    return f"{img}<br>{label}"


chunks = [result[i : i + COLS] for i in range(0, len(result), COLS)]
rows   = []
for idx, chunk in enumerate(chunks):
    cells  = [make_cell(c) for c in chunk]
    cells += [""] * (COLS - len(cells))   # pad last row to full width
    rows.append("| " + " | ".join(cells) + " |")
    if idx == 0:
        rows.append("| " + " | ".join([":---:"] * COLS) + " |")

block   = f"{START}\n" + "\n".join(rows) + f"\n{END}"
pattern = re.escape(START) + r".*?" + re.escape(END)

# Use a lambda so backslashes in `block` are never treated as regex escapes
updated = re.sub(pattern, lambda _: block, readme, flags=re.DOTALL)

with open("README.md", "w", encoding="utf-8") as f:
    f.write(updated)
print("Updated README.md contributors section")
