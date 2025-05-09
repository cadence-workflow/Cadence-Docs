#!/bin/bash

# Define repositories and corresponding output paths using parallel arrays
repos=("cadence" "cadence-go-client" "cadence-java-client")
files=("static/data/releases/cadence.json" "static/data/releases/cadence-go-client.json" "static/data/releases/cadence-java-client.json")

# Fetch latest release data, skip release assets
for i in "${!repos[@]}"; do
  gh api -H "Accept: application/vnd.github+json" \
         -H "X-GitHub-Api-Version: 2022-11-28" \
         "/repos/cadence-workflow/${repos[$i]}/releases" | jq 'del(.[].assets)' > "${files[$i]}"
done

# Validate JSON files
for file in "${files[@]}"; do
  jq '.[] | has("tag_name") and has("body")' -e "$file" > /dev/null
done
