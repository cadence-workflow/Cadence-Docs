#!/bin/bash

set -euo pipefail

# Run from the repository root regardless of the caller's working directory.
repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

# Define repositories and corresponding output paths using parallel arrays
repos=("cadence" "cadence-go-client" "cadence-java-client")
files=("static/data/releases/cadence.json" "static/data/releases/cadence-go-client.json" "static/data/releases/cadence-java-client.json")

# Fetch complete release histories and keep only fields used by the release pages.
for i in "${!repos[@]}"; do
  gh api --paginate --slurp \
         -H "Accept: application/vnd.github+json" \
         -H "X-GitHub-Api-Version: 2022-11-28" \
         "/repos/cadence-workflow/${repos[$i]}/releases?per_page=100" |
    jq '
      add
      | sort_by(.published_at)
      | reverse
      | map({
          id,
          tag_name,
          name,
          html_url,
          draft,
          prerelease,
          published_at,
          body,
          author: {
            login: .author.login,
            html_url: .author.html_url
          }
        })
    ' > "${files[$i]}"
done

# Validate JSON files
for file in "${files[@]}"; do
  jq '
    type == "array"
    and all(.[];
      has("id")
      and has("tag_name")
      and has("name")
      and has("html_url")
      and has("draft")
      and has("prerelease")
      and has("published_at")
      and has("body")
      and (.author | has("login") and has("html_url"))
    )
  ' -e "$file" > /dev/null
done
