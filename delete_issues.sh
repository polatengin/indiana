source .env

gh issue list --repo "${INDIANA_ORGANIZATION}/${INDIANA_PROJECT}" --json "number" | jq -r '.[].number' | xargs -I {} gh issue delete {} --repo "${INDIANA_ORGANIZATION}/${INDIANA_PROJECT}" --yes
