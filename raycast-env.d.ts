/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Proofreading Language - Native macOS NSSpellChecker proofreading language */
  "language": "en_GB" | "en_US",
  /** Ollama Host URL (Optional Rewriter) - Local Ollama server URL (defaults to http://localhost:11434, used only for multi-version tone rewrites) */
  "ollamaHost": string,
  /** Ollama Model (Optional Rewriter) - Local model name to use for rewriting */
  "ollamaModel": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `rewrite-selection` command */
  export type RewriteSelection = ExtensionPreferences & {}
  /** Preferences accessible in the `quick-fix` command */
  export type QuickFix = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `rewrite-selection` command */
  export type RewriteSelection = {}
  /** Arguments passed to the `quick-fix` command */
  export type QuickFix = {}
}

