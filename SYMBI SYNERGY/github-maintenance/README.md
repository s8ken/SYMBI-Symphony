# GitHub Maintenance Scripts

This folder contains a single script to audit and clean up your GitHub account using GitHub CLI (`gh`). It is safe-by-default and only performs destructive actions when you explicitly enable them via environment variables.

## Prerequisites
- Install GitHub CLI: https://cli.github.com/
- Authenticate once using your PAT:

```
export GH_TOKEN="<YOUR_PAT>"
# or: gh auth login --with-token  (then paste your PAT)
# verify
gh auth status
```

## What the script can do
- Audit repos and active items (CSV/TSV reports)
- Apply branch protection rules to `main`
- Archive duplicate repositories (opt-in)
- Delete merged PR branches (opt-in)
- Add Dependabot config to a repo via a PR (optional)
- Enable default CodeQL code scanning (optional)

## Quick start (defaults)
```
cd "$(dirname "$0")"
chmod +x cleanup.sh
# Audit only (no changes)
./cleanup.sh audit

# Apply branch protections to main for YCQ-Website
./cleanup.sh protect

# Dry-run archive of duplicates (prints what would happen)
./cleanup.sh archive

# Actually archive duplicates
RUN_ARCHIVE=1 ./cleanup.sh archive

# Delete merged PR branches in YCQ-Website (dry-run)
./cleanup.sh delete-merged

# Actually delete merged PR branches
RUN_DELETE=1 ./cleanup.sh delete-merged

# Add Dependabot to YCQ-Website via PR
./cleanup.sh dependabot

# Enable default CodeQL code scanning on YCQ-Website
./cleanup.sh codescan
```

## Customize
- Set `ORG_USER` to your username/org (defaults to `s8ken`).
- Adjust `REPOS` and `ARCHIVE_CANDIDATES` arrays inside `cleanup.sh` as needed.

## Notes
- Archiving is reversible in GitHub settings, but still treated as a change — review candidates first.
- Deleting branches only targets branches with merged PRs into `main`.
- The script avoids touching private or critical repos not in the provided lists.

