#!/usr/bin/env bash
set -euo pipefail

# scripts/sync-raycast-cli.sh
# Synchronises native spellcheck-cli binary and version manifest from the
# Spelling Launcher desktop repository into spelling-launcher-raycast/assets.

RAYCAST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1. Resolve Desktop repository
DESKTOP_DIR="${SPELLING_LAUNCHER_DESKTOP_DIR:-}"

if [[ -z "${DESKTOP_DIR}" ]]; then
  if [[ -d "${RAYCAST_DIR}/../spelling-launcher" ]]; then
    DESKTOP_DIR="$(cd "${RAYCAST_DIR}/../spelling-launcher" && pwd)"
  elif [[ -d "${RAYCAST_DIR}/../wordtune-personal" ]]; then
    DESKTOP_DIR="$(cd "${RAYCAST_DIR}/../wordtune-personal" && pwd)"
  fi
fi

if [[ -z "${DESKTOP_DIR}" || ! -f "${DESKTOP_DIR}/Cargo.toml" ]]; then
  echo "Error: Could not locate desktop repository." >&2
  echo "Please set SPELLING_LAUNCHER_DESKTOP_DIR to the path of the spelling-launcher desktop repository." >&2
  exit 1
fi

echo "=== Synchronising spellcheck-cli to Raycast Extension ==="
echo "Raycast repository: ${RAYCAST_DIR}"
echo "Desktop repository: ${DESKTOP_DIR}"

# 2. Enforce Apple Silicon architecture
ARCH="$(uname -m)"
if [[ "${ARCH}" != "arm64" ]]; then
  echo "Error: Target architecture must be Apple Silicon (arm64 / aarch64). Detected: ${ARCH}" >&2
  exit 1
fi

# 3. Resolve git SHA from desktop repository
export GIT_CONFIG_GLOBAL="${GIT_CONFIG_GLOBAL:-/dev/null}"
GIT_SHA=""
if command -v git >/dev/null 2>&1; then
  GIT_SHA="$(git -C "${DESKTOP_DIR}" rev-parse --short HEAD 2>/dev/null || echo "")"
fi

if [[ -z "${GIT_SHA}" && -f "${DESKTOP_DIR}/.git/HEAD" ]]; then
  HEAD_REF="$(cat "${DESKTOP_DIR}/.git/HEAD" 2>/dev/null || echo "")"
  if [[ "${HEAD_REF}" =~ ^ref:\ (.*) ]]; then
    TARGET_REF="${DESKTOP_DIR}/.git/${BASH_REMATCH[1]}"
    if [[ -f "${TARGET_REF}" ]]; then
      GIT_SHA="$(cut -c1-7 "${TARGET_REF}")"
    elif [[ -f "${DESKTOP_DIR}/.git/packed-refs" ]]; then
      GIT_SHA="$(grep "${BASH_REMATCH[1]}" "${DESKTOP_DIR}/.git/packed-refs" | head -n 1 | awk '{print substr($1, 1, 7)}')"
    fi
  elif [[ -n "${HEAD_REF}" ]]; then
    GIT_SHA="$(echo "${HEAD_REF}" | cut -c1-7)"
  fi
fi

GIT_SHA="${GIT_SHA:-unknown}"
VERSION="$(grep '^version' "${DESKTOP_DIR}/crates/spellcheck-cli/Cargo.toml" | head -n 1 | cut -d '"' -f 2)"
TARGET="aarch64-apple-darwin"
BUILD_PROFILE="release"

echo "Building spellcheck-cli v${VERSION} (${GIT_SHA}, ${TARGET})..."
cargo build --release -p spellcheck-cli --manifest-path "${DESKTOP_DIR}/Cargo.toml"

SRC_BIN="${DESKTOP_DIR}/target/release/spellcheck-cli"
DEST_ASSETS="${RAYCAST_DIR}/assets"
DEST_BIN="${DEST_ASSETS}/spellcheck-cli"
DEST_JSON="${DEST_ASSETS}/spellcheck-cli.version.json"

mkdir -p "${DEST_ASSETS}"

# 4. Copy binary and set executable permission
cp "${SRC_BIN}" "${DEST_BIN}"
chmod +x "${DEST_BIN}"

# 5. Verify version output
ACTUAL_VERSION="$("${DEST_BIN}" --version)"
EXPECTED_VERSION="spellcheck-cli ${VERSION} (${BUILD_PROFILE}, ${GIT_SHA}, ${TARGET})"

if [[ "${ACTUAL_VERSION}" != "${EXPECTED_VERSION}" ]]; then
  echo "Error: Binary version mismatch!" >&2
  echo "  Expected: ${EXPECTED_VERSION}" >&2
  echo "  Actual:   ${ACTUAL_VERSION}" >&2
  exit 1
fi

# 6. Generate version manifest
printf '{\n  "name": "spellcheck-cli",\n  "version": "%s",\n  "git_sha": "%s",\n  "target": "%s",\n  "build_profile": "%s",\n  "binary": "spellcheck-cli"\n}\n' \
  "${VERSION}" "${GIT_SHA}" "${TARGET}" "${BUILD_PROFILE}" > "${DEST_JSON}"

echo "Verified staged binary: ${ACTUAL_VERSION}"
echo "Generated manifest: ${DEST_JSON}"

# 7. Run drift check to guarantee zero-drift
if [[ -f "${RAYCAST_DIR}/scripts/check-drift.sh" ]]; then
  echo "Running local drift check..."
  SPELLING_LAUNCHER_DESKTOP_DIR="${DESKTOP_DIR}" bash "${RAYCAST_DIR}/scripts/check-drift.sh"
elif [[ -f "${DESKTOP_DIR}/scripts/check-drift.sh" ]]; then
  echo "Running desktop drift check..."
  RAYCAST_DIR="${RAYCAST_DIR}" bash "${DESKTOP_DIR}/scripts/check-drift.sh"
fi

echo "=== Sync Complete ==="

