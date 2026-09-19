#!/usr/bin/env bash
set -euo pipefail
export GIT_CONFIG_GLOBAL="${GIT_CONFIG_GLOBAL:-/dev/null}"

# scripts/check-drift.sh
# Verifies that assets/spellcheck-cli and assets/spellcheck-cli.version.json
# match the current spellcheck-cli build and git commit from the desktop repo.

RAYCAST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESKTOP_DIR="${SPELLING_LAUNCHER_DESKTOP_DIR:-}"

if [[ -z "${DESKTOP_DIR}" ]]; then
  if [[ -d "${RAYCAST_DIR}/../spelling-launcher" ]]; then
    DESKTOP_DIR="$(cd "${RAYCAST_DIR}/../spelling-launcher" && pwd)"
  elif [[ -d "${RAYCAST_DIR}/../wordtune-personal" ]]; then
    DESKTOP_DIR="$(cd "${RAYCAST_DIR}/../wordtune-personal" && pwd)"
  fi
fi

DEST_BIN="${CLI_BIN_PATH:-${RAYCAST_DIR}/assets/spellcheck-cli}"
DEST_JSON="${MANIFEST_PATH:-${RAYCAST_DIR}/assets/spellcheck-cli.version.json}"

echo "=== Checking Raycast Binary Drift ==="

if [[ ! -f "${DEST_BIN}" ]]; then
  echo "Error: Raycast staged binary not found at ${DEST_BIN}" >&2
  echo "Run ./scripts/sync-raycast-cli.sh to build and stage the binary." >&2
  exit 1
fi

if [[ ! -x "${DEST_BIN}" ]]; then
  echo "Error: Raycast staged binary is not executable (${DEST_BIN})" >&2
  exit 1
fi

if [[ ! -f "${DEST_JSON}" ]]; then
  echo "Error: Raycast staged version manifest not found at ${DEST_JSON}" >&2
  echo "Run ./scripts/sync-raycast-cli.sh to generate the manifest." >&2
  exit 1
fi

CURRENT_SPELLCORE_SHA=""
if [[ -n "${DESKTOP_DIR}" && -d "${DESKTOP_DIR}" ]]; then
  if command -v git >/dev/null 2>&1; then
    CURRENT_SPELLCORE_SHA="$(git -C "${DESKTOP_DIR}" rev-parse --short HEAD 2>/dev/null || echo "")"
  fi
  if [[ -z "${CURRENT_SPELLCORE_SHA}" && -f "${DESKTOP_DIR}/.git/HEAD" ]]; then
    HEAD_REF="$(cat "${DESKTOP_DIR}/.git/HEAD" 2>/dev/null || echo "")"
    if [[ "${HEAD_REF}" =~ ^ref:\ (.*) ]]; then
      TARGET_REF="${DESKTOP_DIR}/.git/${BASH_REMATCH[1]}"
      if [[ -f "${TARGET_REF}" ]]; then
        CURRENT_SPELLCORE_SHA="$(cut -c1-7 "${TARGET_REF}")"
      fi
    elif [[ -n "${HEAD_REF}" ]]; then
      CURRENT_SPELLCORE_SHA="$(echo "${HEAD_REF}" | cut -c1-7)"
    fi
  fi
fi

JSON_SHA="$(grep '"git_sha"' "${DEST_JSON}" | cut -d '"' -f 4)"
JSON_VER="$(grep '"version"' "${DEST_JSON}" | cut -d '"' -f 4)"
TARGET="aarch64-apple-darwin"
BUILD_PROFILE="release"
ACTUAL_VERSION="$("${DEST_BIN}" --version)"

if [[ -n "${CURRENT_SPELLCORE_SHA}" && "${JSON_SHA}" != "${CURRENT_SPELLCORE_SHA}" ]]; then
  echo "DRIFT DETECTED: Staged Raycast binary was built from a different commit than desktop source!" >&2
  echo "  Staged binary SHA:      ${JSON_SHA}" >&2
  echo "  Current spellcore SHA:  ${CURRENT_SPELLCORE_SHA}" >&2
  echo "Fix: Run ./scripts/sync-raycast-cli.sh" >&2
  exit 1
fi

EXPECTED_VERSION="spellcheck-cli ${JSON_VER} (${BUILD_PROFILE}, ${JSON_SHA}, ${TARGET})"
if [[ "${ACTUAL_VERSION}" != "${EXPECTED_VERSION}" ]]; then
  echo "DRIFT DETECTED: Staged binary --version does not match manifest:" >&2
  echo "  Expected: ${EXPECTED_VERSION}" >&2
  echo "  Actual:   ${ACTUAL_VERSION}" >&2
  exit 1
fi

echo "No drift detected:"
echo "  Staged binary SHA:     ${JSON_SHA}"
echo "  Staged binary version: ${ACTUAL_VERSION}"
echo "=== Drift Check Passed ==="
