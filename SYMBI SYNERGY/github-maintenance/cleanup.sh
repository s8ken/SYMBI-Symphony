#!/usr/bin/env bash
set -euo pipefail

# Defaults
ORG_USER="s8ken"
REPOS=("YCQ-Website")
ARCHIVE_CANDIDATES=(
  "trust-protocol-1"
  "trust-protocol-2"
  "project0"
  "Symbi-Synergy-Rebuilt"
  "SYMBI-Resonance"
  "SYMBI-Synergy-V2"
)

here() { cd "$(dirname "$0")"; pwd; }

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }
}

ensure_auth() {
  if ! gh auth status >/dev/null 2>&1; then
    echo "GitHub CLI not authenticated. Export GH_TOKEN or run: gh auth login --with-token" >&2
    exit 1
  fi
}

task_audit() {
  ensure_auth
  need jq
  mkdir -p reports
  echo "Writing reports/repositories.csv"
  gh repo list "$ORG_USER" --limit 200 \
    --json name,isPrivate,isArchived,visibility,isFork,defaultBranchRef,pushedAt,updatedAt,description \
    | jq -r '.[] | [.name,.visibility,.isPrivate,.isArchived,.isFork,.defaultBranchRef.name,.pushedAt,.updatedAt,(.description//"" )] | @csv' \
    > reports/repositories.csv

  echo "Writing reports/open_prs.tsv"
  gh pr list -a @me -s open --json number,title,url,updatedAt \
    | jq -r '.[] | [.number,.title,.url,.updatedAt] | @tsv' > reports/open_prs.tsv

  echo "Writing reports/open_issues.tsv"
  gh issue list -a @me -s open --json number,title,url,updatedAt \
    | jq -r '.[] | [.number,.title,.url,.updatedAt] | @tsv' > reports/open_issues.tsv

  echo "Writing reports/unread_notifications.txt"
  gh api /notifications | jq -r '.[].subject.title' > reports/unread_notifications.txt || true

  echo "Audit complete: $(here)/reports"
}

task_protect() {
  ensure_auth
  for r in "${REPOS[@]}"; do
    echo "Protecting $r/main"
    cat <<JSON | gh api -X PUT -H "Accept: application/vnd.github+json" \
      "repos/$ORG_USER/$r/branches/main/protection" --input -
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null
}
JSON
  done
  echo "Branch protections applied."
}

task_archive() {
  ensure_auth
  if [[ "${RUN_ARCHIVE:-}" != "1" ]]; then
    echo "Dry-run: set RUN_ARCHIVE=1 to actually archive. Candidates:"
    for r in "${ARCHIVE_CANDIDATES[@]}"; do
      gh repo view "$ORG_USER/$r" >/dev/null 2>&1 && echo "  - $r" || true
    done
    exit 0
  fi
  for r in "${ARCHIVE_CANDIDATES[@]}"; do
    if gh repo view "$ORG_USER/$r" >/dev/null 2>&1; then
      echo "Archiving $r"
      gh repo archive "$ORG_USER/$r" || true
    fi
  done
  echo "Archiving complete."
}

task_delete_merged() {
  ensure_auth
  if [[ "${RUN_DELETE:-}" != "1" ]]; then
    echo "Dry-run: set RUN_DELETE=1 to actually delete merged PR branches. Repos: ${REPOS[*]}"
  fi
  for r in "${REPOS[@]}"; do
    echo "Checking merged PR branches in $r"
    gh pr list -R "$ORG_USER/$r" --state merged --json headRefName -q '.[].headRefName' | grep -v '^main$' | while IFS= read -r b; do
      [[ -z "$b" ]] && continue
      if [[ "${RUN_DELETE:-}" == "1" ]]; then
        echo "Deleting remote branch: $b"
        git push "https://github.com/$ORG_USER/$r.git" ":$b" || true
      else
        echo "Would delete: $b"
      fi
    done || true
  done
}

task_dependabot() {
  ensure_auth
  tmpdir=$(mktemp -d)
  trap 'rm -rf "$tmpdir"' EXIT
  local repo="${REPOS[0]}"
  echo "Adding Dependabot to $repo via PR"
  gh repo clone "$ORG_USER/$repo" "$tmpdir/$repo"
  pushd "$tmpdir/$repo" >/dev/null
  git checkout -b chore/dependabot || true
  mkdir -p .github
  cat > .github/dependabot.yml <<'YAML'
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
YAML
  git add .github/dependabot.yml
  git commit -m "chore: add Dependabot" || true
  git push -u origin chore/dependabot || true
  gh pr create -t "chore: add Dependabot" -b "Enable weekly updates for npm and GitHub Actions." -B main || true
  popd >/dev/null
  echo "Dependabot PR created (if not existing)."
}

task_codescan() {
  ensure_auth
  local repo="${REPOS[0]}"
  echo "Enabling default CodeQL on $repo (requires GitHub Advanced Security)."
  gh api -X PATCH "repos/$ORG_USER/$repo/code-scanning/default-setup" -f state=enabled || true
}

usage() {
  cat <<USAGE
Usage: $0 <audit|protect|archive|delete-merged|dependabot|codescan>

ENV:
  ORG_USER           GitHub org/user (default: $ORG_USER)
  REPOS              Space-separated repo list (default: ${REPOS[*]})
  RUN_ARCHIVE=1      Actually archive candidates (otherwise dry-run)
  RUN_DELETE=1       Actually delete merged branches (otherwise dry-run)
USAGE
}

main() {
  need gh
  cmd="${1:-}"
  case "$cmd" in
    audit) task_audit ;;
    protect) task_protect ;;
    archive) task_archive ;;
    delete-merged) task_delete_merged ;;
    dependabot) task_dependabot ;;
    codescan) task_codescan ;;
    ""|-h|--help) usage ;;
    *) echo "Unknown command: $cmd"; usage; exit 1 ;;
  esac
}

main "$@"
