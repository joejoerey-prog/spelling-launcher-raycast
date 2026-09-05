# 🚀 Spelling Launcher — Raycast Extension

Rewrite, polish, and check selected text in **any application on macOS** (Chrome, Slack, Mail, Notes, Word, VS Code) using your **local Ollama instance** with zero cloud telemetry.

---

## 🌟 Commands Included

### 1. 🚀 `Rewrite Selected Text` (Interactive Modal)
- Grabs highlighted text from your active window.
- Generates side-by-side rewrites using your local Ollama model (`llama3.2:3b`).
- Allows switching tones on the fly (**Professional**, **Casual**, **Academic**, **Confident**, **Shorten**, **Expand**).
- Shows before/after word diffs in the detail pane.
- **Press `Enter`** to paste the rewritten text directly into your active text box.

### 2. ⚡ `Quick Polish & Paste` (1-Click Background Polish)
- Runs completely in the background without opening a UI list.
- Polishes your selected text and replaces it in-place in your active text box with a quick macOS HUD notification.

---

## 🛠️ How to Add to Raycast

1. Open **Raycast** (`Cmd+Space` or your configured hotkey).
2. Type **"Import Extension"** or open **Raycast Preferences** (`Cmd+,`).
3. Navigate to **Extensions** tab.
4. Click **"+"** (or Add Extension) -> **"Install Extension from Local Directory"**.
5. Select the folder:
   ```
   /Users/joerey/.gemini/antigravity/scratch/spelling-launcher-raycast
   ```
6. (Optional) Set a Global Hotkey (e.g. `Cmd + Shift + R` or `Option + Space`) for instant rewriting anywhere on macOS!
