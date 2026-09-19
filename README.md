# 🚀 Spelling Launcher for Raycast

[![CI](https://github.com/joerey/spelling-launcher-raycast/actions/workflows/ci.yml/badge.svg)](https://github.com/joerey/spelling-launcher-raycast/actions/workflows/ci.yml)
[![Licence: MIT](https://img.shields.io/badge/Licence-MIT-blue.svg)](LICENSE)
[![Platform: macOS Apple Silicon](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon)-black.svg)](https://apple.com)

**Spelling Launcher for Raycast** provides lightning-fast, system-wide proofreading and generative tone rewriting for highlighted text across **any application on macOS** (Chrome, Slack, Mail, Notes, Word, VS Code, and more).

Operating with **zero cloud telemetry, zero accounts, and zero tracking**, it executes proofreading in **sub-30ms** using Apple Silicon text-checking services (`NSSpellChecker`) paired with our authoritative pure-Rust deterministic rule engine (`spellcore`).

---

## ⚡ Architecture & Relationship to the Desktop Application

Spelling Launcher employs a unified multi-surface architecture (**Strategy H**):
- **Desktop Application (`spelling-launcher`)**: A full three-pane workbench for long-form drafting, document analysis, and custom rule management.
- **Raycast Extension (`spelling-launcher-raycast`)**: The global keyboard-driven companion providing instant HUD polish and multi-tone rewrites anywhere in macOS.
- **Shared Rust Core (`crates/spellcore`)**: Both applications share the exact same deterministic rules, tokenizer, AST masking, and native macOS AppKit proofreading bridge through the packaged binary `assets/spellcheck-cli`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Spelling Launcher Ecosystem                     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│   Spelling Launcher Desktop   │               │   Spelling Launcher Raycast   │
│       (Tauri 2 + React)       │               │      (Raycast Extension)      │
├───────────────────────────────┤               ├───────────────────────────────┤
│ • Full Document Studio        │               │ • Global Hotkey In Any App    │
│ • Custom SQLite Rules         │               │ • 1-Click Quick Polish HUD    │
│ • Document Readability Stats  │               │ • Side-by-Side Tone Rewrites  │
└───────────────┬───────────────┘               └───────────────┬───────────────┘
                │ (IPC / Rust FFI)                              │ (Subprocess CLI)
                ▼                                               ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                    Shared Rust Core (crates/spellcore)                        │
│       • NSSpellChecker Bridge (en_GB & en_US)  • Oxford -ize Support          │
│       • Deterministic Pronoun Casing (I)       • Compound Cardinals (21-99)   │
│       • British Dot Time (9.30 am)             • Commercial Genitives         │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Commands

### 1. ⚡ Quick Polish & Paste (`quick-fix`)
- **Mode**: Silent / Background (`no-view`).
- **Function**: Automatically inspects highlighted text in your active application, fixes spelling, punctuation spacing, homophone confusions, and mechanics, and pastes the corrected text back into your cursor location.
- **Feedback**: Displays a transient Raycast HUD notification summarising what was corrected.
- **Latency**: Sub-30ms execution (measured: ~2–5ms native check).

### 2. 🚀 Rewrite Selected Text (`rewrite-selection`)
- **Mode**: Interactive View (`view`).
- **Function**: Grabs selected text and presents four distinct stylistic variations (**Formal, Friendly, Direct, Detailed**) powered by a local Ollama instance (`llama3.2:3b`).
- **Diff Inspection**: Shows inline word-level additions (green) and deletions (red) in the detail pane.
- **Paste Back**: Press `Enter` to paste the chosen variation back into your active window.

---

## 💻 System Requirements

- **Operating System**: macOS 13 (Ventura) or later.
- **Raycast**: Raycast for Mac (v1.83+ recommended).
- **Hardware**: **macOS on Apple Silicon (`aarch64-apple-darwin`)**.
  > [!IMPORTANT]
  > Intel (`x86_64`) architecture and Windows/Linux systems are unsupported due to the native Apple Silicon AppKit proofreading integration.

---

## 📦 Installation

### Option 1: Import as Local Extension (Recommended)
1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/joerey/spelling-launcher-raycast.git
   cd spelling-launcher-raycast
   npm install
   npm run build
   ```
2. Open **Raycast** (`Cmd+Space`).
3. Type **"Import Extension"** or navigate to **Raycast Preferences (`Cmd+,`) $\rightarrow$ Extensions**.
4. Click **"+" $\rightarrow$ "Install Extension from Local Directory"**.
5. Select the `spelling-launcher-raycast` folder.
6. (Recommended) Assign global hotkeys (e.g. `Cmd + Shift + ;` for Quick Polish, or `Option + Space` for Rewrite Selection).

### Option 2: Build from Source
```bash
npm install
./scripts/sync-raycast-cli.sh  # Synchronises native spellcheck-cli from desktop repository
npm run build
npm run dev                    # Launches local Raycast extension development watcher
```

> [!NOTE]
> The native proofreading CLI binary (`assets/spellcheck-cli`) is compiled from the [Spelling Launcher desktop repository](https://github.com/joejoerey-prog/spelling-launcher) and excluded from Git. Run `./scripts/sync-raycast-cli.sh` to stage the binary for development and testing.

---

## ⚙️ Configuration & Preferences

Open **Raycast Preferences (`Cmd+,`) $\rightarrow$ Extensions $\rightarrow$ Spelling Launcher**:

| Preference | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Proofreading Language** | Dropdown | `British English (en_GB)` | Native macOS `NSSpellChecker` language (`en_GB` includes Oxford *-ize* acceptance; `en_US` also available). |
| **Ollama Host URL** | Text Field | `http://localhost:11434` | URL of your local Ollama instance (used only for generative tone rewrites). |
| **Ollama Model** | Text Field | `llama3.2:3b` | Local model name for multi-version rewrites. |

### Setting Up Local Ollama (Optional)
To use the interactive **Rewrite Selected Text** command:
1. Install [Ollama](https://ollama.ai).
2. Download the recommended model:
   ```bash
   ollama run llama3.2:3b
   ```
3. *Zero Overhead*: Ollama is **never contacted** during quick-fix checking. It is invoked strictly when the rewrite command is opened.

---

## ⚠️ Known Limitations

1. **Local Ollama Requirement**: Stylistic rewriting requires a local Ollama server running `llama3.2:3b`. Multimodal/vision models (e.g. `*vl*` or `*vision*`) are blocked by security guardrails to avoid resource exhaustion.
2. **Platform Specifics**: The bundled proofreading CLI binary requires macOS on Apple Silicon.

---

## 🧪 Testing

Run the automated extension defect test suite:
```bash
npm test
```
This runs simulated Raycast API tests verifying CLI error resilience, UK dialect handling, quick-fix lifecycles, and nominative pronoun preservation.

---

## 🤝 Contributing

Contributions are welcomed. Please read our [Contributing Guidelines](CONTRIBUTING.md) for code style, development setup, and pull request conventions.

---

## 📄 Licence

This project is licenced under the [MIT Licence](LICENSE).
