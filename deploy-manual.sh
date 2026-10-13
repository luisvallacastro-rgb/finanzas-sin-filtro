#!/usr/bin/env bash
set -euo pipefail

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Hay cambios sin guardar. Haz commit antes de publicar." >&2
  exit 1
fi

: "${RENDER_DEPLOY_HOOK_URL:?Configura RENDER_DEPLOY_HOOK_URL con el Deploy Hook secreto de Render}"

git push origin main
commit_sha="$(git rev-parse HEAD)"

if [[ "$RENDER_DEPLOY_HOOK_URL" == *"?"* ]]; then
  deploy_url="${RENDER_DEPLOY_HOOK_URL}&ref=${commit_sha}"
else
  deploy_url="${RENDER_DEPLOY_HOOK_URL}?ref=${commit_sha}"
fi

echo "Publicando el commit aprobado ${commit_sha}..."
curl --fail --show-error --silent "$deploy_url"
echo
echo "Render recibió el despliegue manual."
