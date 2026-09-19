# Contributing to Spelling Launcher for Raycast

Thank you for contributing to **Spelling Launcher for Raycast**. This extension provides instant, system-wide proofreading and generative tone rewrites across macOS, backed by Apple Silicon proofreading services (`NSSpellChecker`) and our shared pure-Rust deterministic engine (`spellcore`).

Please review the following guidelines before submitting issues or pull requests.

---

## 1. Architectural Tenets

1. **Single Authoritative Engine**: The Raycast extension does **not** implement regexes or heuristic grammar rules in TypeScript. All linguistic checks and deterministic text transformations are delegated strictly to the native CLI binary (`assets/spellcheck-cli`) powered by `spellcore`.
2. **Zero Cloud Telemetry**: Proofreading operations must remain 100% local and offline. The extension never contacts remote servers for spellchecking.
3. **Target Platform**: This extension targets **macOS on Apple Silicon (`aarch64-apple-darwin`)**.

---

## 2. Development Setup

### Prerequisites
- **Node.js**: v20+ and `npm` v10+
- **Raycast CLI**:
  ```bash
  npm install -g @raycast/cli
  # or use via npx
  ```
- **Local Ollama (Optional)**: If developing or testing generative rewrites:
  ```bash
  ollama run llama3.2:3b
  ```

### Getting Started
```bash
git clone https://github.com/<owner>/spelling-launcher-raycast.git
cd spelling-launcher-raycast
npm install
```

---

## 3. Running Tests and Development

### Running the Test Suite
The extension uses an automated defect verification runner simulating Raycast runtime APIs:
```bash
npm test
```
This verifies:
- Individual rewrite action handling and clipboard copying.
- Error handling for missing, non-executable, or malformed CLI responses.
- Strict British English (`en_GB`) dialect preservation.
- Quick-fix entry point lifecycle and notification toasts.
- Nominative pronoun (`I`) capitalisation and Roman numeral protection.

### Running in Raycast Development Mode
```bash
npm run dev
```
This compiles the commands and enables hot-reloading within Raycast.

---

## 4. Building for Production

```bash
npm run build
```
This validates TypeScript types and packages the production distribution bundle using the Raycast compiler.

---

## 5. Synchronising the Native Engine Binary

The native proofreading CLI binary (`assets/spellcheck-cli`) and its version manifest (`assets/spellcheck-cli.version.json`) are compiled native artefacts and are ignored by Git. They are built from the desktop repository (`crates/spellcheck-cli`) and staged into `assets/`.

- **Compatible Desktop Revision**: Tag [`v1.0.0-beta`](https://github.com/joejoerey-prog/spelling-launcher/tree/v1.0.0-beta) (commit `5ea13cd`).
- **Synchronisation Command**:
  ```bash
  # Automatically resolves ../spelling-launcher or ../wordtune-personal:
  ./scripts/sync-raycast-cli.sh

  # Or specify the desktop repository path explicitly:
  SPELLING_LAUNCHER_DESKTOP_DIR=/path/to/spelling-launcher ./scripts/sync-raycast-cli.sh
  ```
- **Verification**:
  After synchronisation, verify the binary and run tests:
  ```bash
  # Check binary drift against the desktop repository:
  ./scripts/check-drift.sh

  # Run the full test suite:
  npm test
  ```

---

## 6. Code Style & Commit Conventions

- **TypeScript**: Strict typing without `any`.
- **Language**: Use **UK English** spelling for comments, documentation, and commit messages (e.g. *capitalisation*, *behaviour*, *initialise*, *licence*).
- **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: add toast notifications for multi-version copy`
  - `fix: improve HUD display on quick polish`
  - `docs: update setup steps in README`

---

## 7. Reporting Bugs & Requesting Features

- Open an issue on GitHub describing the unexpected behaviour.
- Include your macOS version, Raycast version, active proofreading language (`en_GB` or `en_US`), and input text.
- Note that requests introducing cloud logging or client-side TypeScript grammar regexes fall outside the design goals of this project.

---

## 8. Licence

Contributions are licenced under the [MIT Licence](LICENSE).
