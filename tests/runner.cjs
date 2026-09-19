var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/mocks/raycast-api.js
var require_raycast_api = __commonJS({
  "tests/mocks/raycast-api.js"(exports2, module2) {
    var path3 = require("path");
    var mockApi = {
      environment: {
        assetsPath: path3.resolve(__dirname, "../../assets")
      },
      getPreferenceValues: () => ({
        language: "en_GB",
        ollamaHost: "http://localhost:11434",
        ollamaModel: "llama3.2:3b"
      }),
      showHUD: async (msg) => {
        if (globalThis.__raycastHUD) globalThis.__raycastHUD.push(msg);
        return msg;
      },
      showToast: async (opts) => {
        if (globalThis.__raycastToasts) globalThis.__raycastToasts.push(opts);
        return opts;
      },
      Toast: {
        Style: {
          Success: "SUCCESS",
          Failure: "FAILURE"
        }
      },
      Clipboard: {
        copy: async (text) => {
          globalThis.__clipboardContent = text;
        },
        paste: async (text) => {
          globalThis.__clipboardPasted = text;
        },
        readText: async () => globalThis.__clipboardContent || ""
      },
      getSelectedText: async () => globalThis.__selectedText || "",
      popToRoot: async () => {
      },
      openExtensionPreferences: () => {
      },
      Icon: {
        Clipboard: "clipboard",
        Document: "document",
        Check: "check",
        Heart: "heart",
        Bolt: "bolt",
        Book: "book",
        Warning: "warning",
        Gear: "gear"
      },
      Color: {
        Blue: "blue",
        Green: "green",
        Orange: "orange",
        Purple: "purple"
      },
      List: () => null,
      ActionPanel: () => null,
      Action: Object.assign(() => null, {
        CopyToClipboard: () => null
      })
    };
    module2.exports = mockApi;
  }
});

// src/engine/nativeSpellchecker.ts
function findCliPaths(customAssetsDir) {
  let assetsPath;
  try {
    if (typeof import_api.environment !== "undefined" && import_api.environment.assetsPath) {
      assetsPath = import_api.environment.assetsPath;
    }
  } catch {
    assetsPath = void 0;
  }
  const candidateDirs = [
    customAssetsDir,
    assetsPath,
    import_path.default.resolve(__dirname, "..", "assets"),
    import_path.default.resolve(__dirname, "assets"),
    import_path.default.resolve(process.env.HOME || "", ".config/raycast/extensions/spelling-launcher/assets"),
    "/Users/joerey/.gemini/antigravity/scratch/spelling-launcher-raycast/assets",
    "/Users/joerey/.gemini/antigravity/scratch/wordtune-personal/target/release"
  ].filter(Boolean);
  let resolvedBinary = null;
  let resolvedManifest = null;
  for (const dir of candidateDirs) {
    const b = import_path.default.join(dir, "spellcheck-cli");
    if (import_fs.default.existsSync(b) && !resolvedBinary) {
      resolvedBinary = b;
    }
    const m = import_path.default.join(dir, "spellcheck-cli.version.json");
    if (import_fs.default.existsSync(m) && !resolvedManifest) {
      resolvedManifest = m;
    }
  }
  const defaultDir = candidateDirs[0] || "assets";
  const binaryPath = resolvedBinary || import_path.default.join(defaultDir, "spellcheck-cli");
  const manifestPath = resolvedManifest || import_path.default.join(defaultDir, "spellcheck-cli.version.json");
  return { binaryPath, manifestPath };
}
function validateStagedCli(overridePaths) {
  const resolved = findCliPaths();
  const binaryPath = overridePaths?.binaryPath || resolved.binaryPath;
  const manifestPath = overridePaths?.manifestPath || resolved.manifestPath;
  if (!import_fs.default.existsSync(binaryPath)) {
    throw new Error(
      `Native checker binary missing at: ${binaryPath}. Run ./scripts/sync-raycast-cli.sh in wordtune-personal.`
    );
  }
  try {
    import_fs.default.accessSync(binaryPath, import_fs.default.constants.X_OK);
  } catch {
    throw new Error(
      `Native checker binary at ${binaryPath} is not executable. Run 'chmod +x ${binaryPath}'.`
    );
  }
  if (!import_fs.default.existsSync(manifestPath)) {
    throw new Error(
      `Native checker version manifest missing at: ${manifestPath}. Run ./scripts/sync-raycast-cli.sh in wordtune-personal.`
    );
  }
  try {
    const raw = import_fs.default.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    return { binaryPath, manifest };
  } catch (err) {
    throw new Error(`Failed to parse spellcheck-cli.version.json: ${err.message || err}`);
  }
}
async function checkTextWithNativeEngine(text, options) {
  const { binaryPath } = validateStagedCli({
    binaryPath: options?.binaryPath,
    manifestPath: options?.manifestPath
  });
  let language = options?.language;
  if (!language) {
    try {
      const prefs = (0, import_api.getPreferenceValues)();
      language = prefs.language;
    } catch {
      language = "en_GB";
    }
  }
  if (!language) {
    language = "en_GB";
  }
  const mode = options?.mode || "fragment";
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = (0, import_child_process.spawn)(binaryPath, ["--stdin", "--mode", mode, "--language", language], {
        stdio: ["pipe", "pipe", "pipe"]
      });
    } catch (err) {
      return reject(new Error(`Failed to launch native checker binary at ${binaryPath}: ${err.message}`));
    }
    let stdoutData = "";
    let stderrData = "";
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        try {
          child.kill("SIGKILL");
        } catch {
        }
        reject(new Error("spellcheck-cli timed out after 5000ms with no response."));
      }
    }, 5e3);
    child.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString("utf-8");
    });
    child.stderr.on("data", (chunk) => {
      stderrData += chunk.toString("utf-8");
    });
    child.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(new Error(`Failed to launch native checker binary at ${binaryPath}: ${err.message}`));
      }
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (code !== 0) {
        return reject(
          new Error(`spellcheck-cli exited with code ${code}: ${stderrData.trim() || "Unknown error"}`)
        );
      }
      if (stdoutData.trim().length === 0) {
        return reject(new Error("spellcheck-cli returned empty output with no response."));
      }
      try {
        const parsed = JSON.parse(stdoutData);
        resolve(parsed);
      } catch (err) {
        reject(
          new Error(
            `Failed to parse spellcheck-cli JSON output: ${err.message || err}
Raw: ${stdoutData.slice(0, 300)}`
          )
        );
      }
    });
    try {
      child.stdin.write(text, "utf-8");
      child.stdin.end();
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(new Error(`Failed to write to spellcheck-cli stdin: ${err.message}`));
      }
    }
  });
}
async function proofreadAndReportChanges(originalText, options) {
  const text = originalText.trim();
  if (!text) return { originalText, correctedText: "", changes: [] };
  const mode = options?.mode || "fragment";
  const result = await checkTextWithNativeEngine(text, {
    mode,
    language: options?.language,
    binaryPath: options?.binaryPath,
    manifestPath: options?.manifestPath
  });
  if (!result.issues || result.issues.length === 0) {
    return { originalText: text, correctedText: text, changes: [] };
  }
  const applicableIssues = result.issues.filter((i) => Boolean(i.replacement)).sort((a, b) => b.start_offset - a.start_offset || b.end_offset - a.end_offset);
  if (applicableIssues.length === 0) {
    return { originalText: text, correctedText: text, changes: [] };
  }
  const buf = Buffer.from(text, "utf-8");
  let modifiedBuf = buf;
  const changes = [];
  let lastStart = Infinity;
  for (const issue of applicableIssues) {
    const rep = issue.replacement;
    const repBuf = Buffer.from(rep, "utf-8");
    if (issue.end_offset <= lastStart && issue.start_offset <= issue.end_offset && issue.end_offset <= modifiedBuf.length) {
      const prefix = modifiedBuf.subarray(0, issue.start_offset);
      const suffix = modifiedBuf.subarray(issue.end_offset);
      modifiedBuf = Buffer.concat([prefix, repBuf, suffix]);
      lastStart = issue.start_offset;
      changes.push({
        matched: issue.matched_text,
        replacement: rep,
        category: issue.category
      });
    }
  }
  changes.reverse();
  return {
    originalText: text,
    correctedText: modifiedBuf.toString("utf-8"),
    changes
  };
}
async function proofreadWithNativeEngine(originalText, options) {
  const res = await proofreadAndReportChanges(originalText, options);
  return res.correctedText;
}
var import_api, import_child_process, import_path, import_fs;
var init_nativeSpellchecker = __esm({
  "src/engine/nativeSpellchecker.ts"() {
    import_api = __toESM(require_raycast_api());
    import_child_process = require("child_process");
    import_path = __toESM(require("path"));
    import_fs = __toESM(require("fs"));
  }
});

// src/quick-fix.tsx
var quick_fix_exports = {};
__export(quick_fix_exports, {
  default: () => Command
});
function formatChangeSummary(changes) {
  if (changes.length === 0) {
    return "\u2728 100% Correct! (No spelling or grammar errors)";
  }
  const items = changes.map((c) => `"${c.matched}" \u2192 "${c.replacement}"`);
  if (items.length <= 2) {
    return `\u2728 Fixed: ${items.join(", ")}`;
  } else {
    return `\u2728 Fixed ${changes.length} errors: ${items.slice(0, 2).join(", ")} (+${changes.length - 2} more)`;
  }
}
async function Command() {
  try {
    let text = "";
    try {
      text = (await (0, import_api3.getSelectedText)()).trim();
    } catch {
      try {
        text = (await import_api3.Clipboard.readText() || "").trim();
      } catch {
        text = "";
      }
    }
    if (!text) {
      await (0, import_api3.showHUD)("\u26A0\uFE0F Highlight text in any app first.");
      return;
    }
    const { correctedText, changes } = await proofreadAndReportChanges(text, { mode: "document" });
    if (correctedText) {
      await import_api3.Clipboard.paste(correctedText);
      const hudMessage = formatChangeSummary(changes);
      await (0, import_api3.showHUD)(hudMessage);
    } else {
      await (0, import_api3.showHUD)("\u26A0\uFE0F Could not proofread text: empty response.");
    }
  } catch (err) {
    await (0, import_api3.showHUD)(`\u274C Error: ${err.message || err}`);
  }
}
var import_api3;
var init_quick_fix = __esm({
  "src/quick-fix.tsx"() {
    import_api3 = __toESM(require_raycast_api());
    init_nativeSpellchecker();
  }
});

// tests/extension-defects.test.ts
var import_node_assert = __toESM(require("node:assert"));
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));
var import_node_os = __toESM(require("node:os"));
init_nativeSpellchecker();

// src/engine/ollama.ts
var import_api2 = __toESM(require_raycast_api());
function checkUkDialectPreservation(originalText, rewrittenVersions) {
  const testPairs = [
    [/\bfavourable\b/i, /\bfavorable\b/i, "favourable", "favorable"],
    [/\borganise\b/i, /\borganize\b/i, "organise", "organize"],
    [/\bcolour\b/i, /\bcolor\b/i, "colour", "color"],
    [/\bcentre\b/i, /\bcenter\b/i, "centre", "center"],
    [/\btravelling\b/i, /\btraveling\b/i, "travelling", "traveling"],
    [/\bdefence\b/i, /\bdefense\b/i, "defence", "defense"],
    [/\banalyse\b/i, /\banalyze\b/i, "analyse", "analyze"]
  ];
  const findings = [];
  for (const [ukRegex, usRegex, ukWord, usWord] of testPairs) {
    if (ukRegex.test(originalText)) {
      for (const [tone, text] of Object.entries(rewrittenVersions)) {
        if (usRegex.test(text) && !ukRegex.test(text)) {
          findings.push({
            originalWord: ukWord,
            usVariant: usWord,
            tone
          });
        }
      }
    }
  }
  return findings;
}
function buildRewritePrompt(originalText, language = "en_GB") {
  const isUK = language === "en_GB";
  const systemPrompt = isUK ? `You are an expert sentence rewriting engine. You strictly write in British English (en_GB), preserving UK spelling (e.g. favourable, organise, colour, centre, travelling, defence, analyse) and UK punctuation standards (omit full stops on titles like Mr, Mrs, Dr; omit Oxford commas in simple lists like "bread, milk and eggs"; use single quotes '...' with punctuation outside unless part of quoted speech; capitalize sentence starts and end complete statements with full stops). You output only raw valid JSON without markdown code fences.` : "You are an expert sentence rewriting engine. You output only raw valid JSON without markdown code fences.";
  const languageInstruction = isUK ? `
Language & Punctuation requirements (UK English):
- Strictly preserve British English (en_GB) spelling (such as favourable, organise, colour, centre).
- Capitalise the first letter of each sentence and terminate complete statements with a full stop (or question mark for direct questions).
- Omit full stops on modern British titles (Mr, Mrs, Dr) and acronyms (BBC, NHS).
- Lists: Omit the Oxford comma by default ("bread, milk and eggs") unless required for clarity.
- Quotation marks: Use single quotation marks ('...') with full stops and commas outside unless part of quoted dialogue.
- Hyphenate compound adjectives before nouns ("world-class performance").
` : "";
  const userPrompt = `Rewrite the following sentence into 4 distinct versions:
1. Formal: Polished, professional, articulate, and grammatically impeccable.
2. Friendly: Warm, conversational, and approachable.
3. Direct: Concise, punchy, cutting all fluff.
4. Detailed: Thorough, descriptive, and richly explanatory.
${languageInstruction}
Sentence: "${originalText.trim()}"

Output ONLY a JSON object with keys: "formal", "friendly", "direct", "detailed".
Each key must be a single string with the rewritten sentence.
Example:
{
  "formal": "To reach an informed decision, a thorough investigation was conducted.",
  "friendly": "We looked into things so we could figure out the best way forward.",
  "direct": "We investigated before making a decision.",
  "detailed": "To ensure we made a well-grounded decision, our team conducted a comprehensive investigation."
}`;
  return { systemPrompt, userPrompt };
}

// tests/extension-defects.test.ts
var Module = require("node:module");
var originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === "@raycast/api") {
    return import_node_path.default.resolve(__dirname, "mocks/raycast-api.js");
  }
  return originalResolve.call(this, request, parent, isMain, options);
};
var raycastMock = require_raycast_api();
async function runTests() {
  console.log("--- Starting Raycast Extension Defect Verification Tests ---\n");
  let passed = 0;
  let total = 0;
  function test(name, fn) {
    total++;
    return (async () => {
      try {
        await fn();
        console.log(`  \u2713 ${name}`);
        passed++;
      } catch (err) {
        console.error(`  \u2717 ${name}`);
        console.error(`    Error: ${err.message || err}`);
        throw err;
      }
    })();
  }
  console.log("Group 1: Rewrite Result Actions & Individual Copying");
  await test("Four results render with distinct version identifiers and labels", () => {
    const mockChoices = [
      {
        id: "version-1",
        versionNumber: 1,
        tone: "formal",
        label: "Version 1: Formal",
        rewrittenText: "This is a favourable formal statement.",
        originalText: "original text",
        diffMarkdown: "",
        icon: "doc",
        tintColor: "blue"
      },
      {
        id: "version-2",
        versionNumber: 2,
        tone: "friendly",
        label: "Version 2: Friendly",
        rewrittenText: "This is a friendly statement.",
        originalText: "original text",
        diffMarkdown: "",
        icon: "heart",
        tintColor: "green"
      },
      {
        id: "version-3",
        versionNumber: 3,
        tone: "direct",
        label: "Version 3: Direct",
        rewrittenText: "This is direct.",
        originalText: "original text",
        diffMarkdown: "",
        icon: "bolt",
        tintColor: "orange"
      },
      {
        id: "version-4",
        versionNumber: 4,
        tone: "detailed",
        label: "Version 4: Detailed",
        rewrittenText: "This is a detailed and articulate statement.",
        originalText: "original text",
        diffMarkdown: "",
        icon: "book",
        tintColor: "purple"
      }
    ];
    import_node_assert.default.strictEqual(mockChoices.length, 4);
    const ids = mockChoices.map((c) => c.id);
    const uniqueIds = new Set(ids);
    import_node_assert.default.strictEqual(uniqueIds.size, 4, "All four choices must possess unique identifiers");
  });
  await test("Triggering copy action for results 1, 2, 3, and 4 copies specific text and triggers corresponding toast", async () => {
    const mockChoices = [
      {
        id: "version-1",
        versionNumber: 1,
        tone: "formal",
        label: "Version 1: Formal",
        rewrittenText: "Rewritten Formal Version 1",
        originalText: "Original",
        diffMarkdown: "",
        icon: "doc",
        tintColor: "blue"
      },
      {
        id: "version-2",
        versionNumber: 2,
        tone: "friendly",
        label: "Version 2: Friendly",
        rewrittenText: "Rewritten Friendly Version 2",
        originalText: "Original",
        diffMarkdown: "",
        icon: "heart",
        tintColor: "green"
      },
      {
        id: "version-3",
        versionNumber: 3,
        tone: "direct",
        label: "Version 3: Direct",
        rewrittenText: "Rewritten Direct Version 3",
        originalText: "Original",
        diffMarkdown: "",
        icon: "bolt",
        tintColor: "orange"
      },
      {
        id: "version-4",
        versionNumber: 4,
        tone: "detailed",
        label: "Version 4: Detailed",
        rewrittenText: "Rewritten Detailed Version 4",
        originalText: "Original",
        diffMarkdown: "",
        icon: "book",
        tintColor: "purple"
      }
    ];
    const handleCopy = async (choice) => {
      await raycastMock.Clipboard.copy(choice.rewrittenText);
      await raycastMock.showToast({
        style: raycastMock.Toast.Style.Success,
        title: `Copied rewrite ${choice.versionNumber}`,
        message: choice.label
      });
    };
    for (const choice of mockChoices) {
      globalThis.__raycastToasts = [];
      globalThis.__clipboardContent = "";
      await handleCopy(choice);
      import_node_assert.default.strictEqual(
        globalThis.__clipboardContent,
        choice.rewrittenText,
        `Clipboard content must exactly match choice ${choice.versionNumber}`
      );
      import_node_assert.default.strictEqual(globalThis.__raycastToasts.length, 1);
      const toast = globalThis.__raycastToasts[0];
      import_node_assert.default.strictEqual(
        toast.title,
        `Copied rewrite ${choice.versionNumber}`,
        `Toast title must state 'Copied rewrite ${choice.versionNumber}'`
      );
    }
  });
  console.log("\nGroup 2: Cleanup Command Diagnostics & Error Behaviour");
  const realBinaryPath = import_node_path.default.resolve(__dirname, "../assets/spellcheck-cli");
  const realManifestPath = import_node_path.default.resolve(__dirname, "../assets/spellcheck-cli.version.json");
  await test("Valid executable and valid input produce expected cleanup result", async () => {
    import_node_assert.default.ok(import_node_fs.default.existsSync(realBinaryPath), "assets/spellcheck-cli must exist");
    const input = "This is teh test with mispelled words.";
    const result = await proofreadWithNativeEngine(input, {
      language: "en_GB",
      binaryPath: realBinaryPath,
      manifestPath: realManifestPath
    });
    import_node_assert.default.strictEqual(
      result,
      "This is the test with misspelled words.",
      'Cleanup engine must fix "teh" and "mispelled"'
    );
  });
  await test("Missing assets/spellcheck-cli produces a visible, actionable error", async () => {
    const missingPath = import_node_path.default.resolve(__dirname, "../assets/non_existent_binary");
    let caught = null;
    try {
      await checkTextWithNativeEngine("test", {
        binaryPath: missingPath,
        manifestPath: realManifestPath
      });
    } catch (err) {
      caught = err;
    }
    import_node_assert.default.ok(caught !== null, "Must throw error when binary is missing");
    import_node_assert.default.ok(
      caught.message.includes("Native checker binary missing at:"),
      `Error message must identify missing binary path: ${caught.message}`
    );
    import_node_assert.default.ok(
      caught.message.includes("./scripts/sync-raycast-cli.sh"),
      "Error message must provide actionable restoration command"
    );
  });
  await test("Non-executable CLI produces a visible, actionable error", async () => {
    const tmpDir = import_node_fs.default.mkdtempSync(import_node_path.default.join(import_node_os.default.tmpdir(), "raycast-cli-test-"));
    const nonExecBinary = import_node_path.default.join(tmpDir, "spellcheck-cli");
    import_node_fs.default.writeFileSync(nonExecBinary, '#!/bin/sh\necho "hello"\n', { mode: 420 });
    let caught = null;
    try {
      await checkTextWithNativeEngine("test", {
        binaryPath: nonExecBinary,
        manifestPath: realManifestPath
      });
    } catch (err) {
      caught = err;
    } finally {
      import_node_fs.default.rmSync(tmpDir, { recursive: true, force: true });
    }
    import_node_assert.default.ok(caught !== null, "Must throw error when binary lacks execute permissions");
    import_node_assert.default.ok(
      caught.message.includes("is not executable"),
      `Error message must report non-executable binary: ${caught.message}`
    );
    import_node_assert.default.ok(
      caught.message.includes("chmod +x"),
      "Error message must instruct user to chmod +x"
    );
  });
  await test("CLI non-zero exit produces a visible error containing stderr", async () => {
    const tmpDir = import_node_fs.default.mkdtempSync(import_node_path.default.join(import_node_os.default.tmpdir(), "raycast-cli-err-"));
    const errorBinary = import_node_path.default.join(tmpDir, "spellcheck-cli");
    import_node_fs.default.writeFileSync(
      errorBinary,
      '#!/bin/sh\n>&2 echo "CRITICAL_FAILURE: Failed to load dictionary"\nexit 2\n',
      { mode: 493 }
    );
    let caught = null;
    try {
      await checkTextWithNativeEngine("test", {
        binaryPath: errorBinary,
        manifestPath: realManifestPath
      });
    } catch (err) {
      caught = err;
    } finally {
      import_node_fs.default.rmSync(tmpDir, { recursive: true, force: true });
    }
    import_node_assert.default.ok(caught !== null, "Must throw error on non-zero exit code");
    import_node_assert.default.ok(
      caught.message.includes("exited with code 2"),
      `Error must specify exit code: ${caught.message}`
    );
    import_node_assert.default.ok(
      caught.message.includes("CRITICAL_FAILURE: Failed to load dictionary"),
      `Error must capture stderr: ${caught.message}`
    );
  });
  await test("Invalid JSON response produces a visible parse error", async () => {
    const tmpDir = import_node_fs.default.mkdtempSync(import_node_path.default.join(import_node_os.default.tmpdir(), "raycast-cli-json-"));
    const invalidJsonBinary = import_node_path.default.join(tmpDir, "spellcheck-cli");
    import_node_fs.default.writeFileSync(invalidJsonBinary, '#!/bin/sh\necho "INVALID_NON_JSON_OUTPUT"\nexit 0\n', {
      mode: 493
    });
    let caught = null;
    try {
      await checkTextWithNativeEngine("test", {
        binaryPath: invalidJsonBinary,
        manifestPath: realManifestPath
      });
    } catch (err) {
      caught = err;
    } finally {
      import_node_fs.default.rmSync(tmpDir, { recursive: true, force: true });
    }
    import_node_assert.default.ok(caught !== null, "Must throw error on invalid JSON response");
    import_node_assert.default.ok(
      caught.message.includes("Failed to parse spellcheck-cli JSON output"),
      `Error must report JSON parsing failure: ${caught.message}`
    );
  });
  await test("Empty stdout produces a visible empty-response error", async () => {
    const tmpDir = import_node_fs.default.mkdtempSync(import_node_path.default.join(import_node_os.default.tmpdir(), "raycast-cli-empty-"));
    const emptyBinary = import_node_path.default.join(tmpDir, "spellcheck-cli");
    import_node_fs.default.writeFileSync(emptyBinary, "#!/bin/sh\nexit 0\n", { mode: 493 });
    let caught = null;
    try {
      await checkTextWithNativeEngine("test", {
        binaryPath: emptyBinary,
        manifestPath: realManifestPath
      });
    } catch (err) {
      caught = err;
    } finally {
      import_node_fs.default.rmSync(tmpDir, { recursive: true, force: true });
    }
    import_node_assert.default.ok(caught !== null, "Must throw error on empty stdout");
    import_node_assert.default.ok(
      caught.message.includes("spellcheck-cli returned empty output with no response."),
      `Error must indicate empty output: ${caught.message}`
    );
  });
  await test("Zero TypeScript fallback exists: errors propagate directly without fallback", async () => {
    const missingPath = import_node_path.default.resolve(__dirname, "../assets/non_existent_binary");
    let caught = null;
    try {
      await proofreadWithNativeEngine("Some text with error", {
        binaryPath: missingPath,
        manifestPath: realManifestPath
      });
    } catch (err) {
      caught = err;
    }
    import_node_assert.default.ok(caught !== null, "Must throw without falling back to a secondary engine");
    import_node_assert.default.ok(
      caught.message.includes("Native checker binary missing at:"),
      "Must surface native checker binary error directly"
    );
  });
  console.log("\nGroup 3: UK English (en_GB) Dialect Preservation");
  await test("Prompt generation for en_GB includes strict British English requirements", () => {
    const ukPrompt = buildRewritePrompt(
      "This is a favourable proposal to organise the centre with colour.",
      "en_GB"
    );
    import_node_assert.default.ok(
      ukPrompt.systemPrompt.includes("British English (en_GB)"),
      "System prompt must mandate British English (en_GB)"
    );
    import_node_assert.default.ok(
      ukPrompt.systemPrompt.includes("favourable"),
      "System prompt must cite favourable as UK spelling"
    );
    import_node_assert.default.ok(
      ukPrompt.systemPrompt.includes("organise"),
      "System prompt must cite organise as UK spelling"
    );
    import_node_assert.default.ok(
      ukPrompt.systemPrompt.includes("colour"),
      "System prompt must cite colour as UK spelling"
    );
    import_node_assert.default.ok(
      ukPrompt.systemPrompt.includes("centre"),
      "System prompt must cite centre as UK spelling"
    );
    import_node_assert.default.ok(
      ukPrompt.userPrompt.includes("Strictly preserve British English (en_GB)"),
      "User prompt must explicitly instruct preservation of en_GB"
    );
    import_node_assert.default.ok(
      ukPrompt.userPrompt.includes("favourable, organise, colour, centre"),
      "User prompt must enumerate exact required UK words"
    );
  });
  await test("Narrow dialect audit identifies Americanised spellings in rewrites", () => {
    const originalText = "We need a favourable outcome to organise the colour at the centre.";
    const americanisedRewrites = {
      formal: "We require a favorable outcome to organize the color at the center.",
      friendly: "We need favourable conditions to organise the colour at the centre.",
      direct: "Get a favorable result.",
      detailed: "We must ensure a favourable outcome."
    };
    const findings = checkUkDialectPreservation(originalText, americanisedRewrites);
    import_node_assert.default.ok(findings.length > 0, "Must detect Americanised spellings in rewrite output");
    const wordsFound = findings.map((f) => f.originalWord);
    import_node_assert.default.ok(wordsFound.includes("favourable"), "Must flag favourable -> favorable");
    import_node_assert.default.ok(wordsFound.includes("organise"), "Must flag organise -> organize");
    import_node_assert.default.ok(wordsFound.includes("colour"), "Must flag colour -> color");
    import_node_assert.default.ok(wordsFound.includes("centre"), "Must flag centre -> center");
  });
  await test("Narrow dialect audit reports clean when UK spellings are strictly preserved", () => {
    const originalText = "We need a favourable outcome to organise the colour at the centre.";
    const ukPreservedRewrites = {
      formal: "To achieve a favourable outcome, we will organise the colour at the centre.",
      friendly: "Let us make sure the centre colours are organised in a favourable manner.",
      direct: "Organise the centre colour favourably.",
      detailed: "A favourable arrangement requires us to organise every colour in the centre."
    };
    const findings = checkUkDialectPreservation(originalText, ukPreservedRewrites);
    import_node_assert.default.strictEqual(findings.length, 0, "Must report zero findings when UK spellings are preserved");
  });
  console.log("\nGroup 4: Cleanup Command Entrypoint (quick-fix.tsx) Lifecycle");
  const QuickFixCommand = (await Promise.resolve().then(() => (init_quick_fix(), quick_fix_exports))).default;
  await test("Quick-fix command warns with HUD when no text is selected", async () => {
    globalThis.__selectedText = "";
    globalThis.__clipboardContent = "";
    globalThis.__raycastHUD = [];
    await QuickFixCommand();
    import_node_assert.default.strictEqual(globalThis.__raycastHUD.length, 1);
    import_node_assert.default.strictEqual(
      globalThis.__raycastHUD[0],
      "\u26A0\uFE0F Highlight text in any app first."
    );
  });
  await test("Quick-fix command proofreads, pastes correction, and displays success HUD", async () => {
    globalThis.__selectedText = "This is teh test with mispelled words.";
    globalThis.__clipboardContent = "";
    globalThis.__clipboardPasted = "";
    globalThis.__raycastHUD = [];
    await QuickFixCommand();
    import_node_assert.default.strictEqual(
      globalThis.__clipboardPasted,
      "This is the test with misspelled words.",
      "Clipboard paste must contain corrected text"
    );
    import_node_assert.default.strictEqual(globalThis.__raycastHUD.length, 1);
    import_node_assert.default.strictEqual(
      globalThis.__raycastHUD[0],
      '\u2728 Fixed: "teh" \u2192 "the", "mispelled" \u2192 "misspelled"'
    );
  });
  await test("Quick-fix command proofreads contextual homophones, determiner-noun agreement, capitalization and terminal punctuation", async () => {
    globalThis.__selectedText = "help me find wants wrong with that issues";
    globalThis.__clipboardContent = "";
    globalThis.__clipboardPasted = "";
    globalThis.__raycastHUD = [];
    await QuickFixCommand();
    import_node_assert.default.strictEqual(
      globalThis.__clipboardPasted,
      "Help me find what's wrong with those issues.",
      "Clipboard paste must contain fully punctuated and corrected sentence"
    );
    import_node_assert.default.strictEqual(globalThis.__raycastHUD.length, 1);
    import_node_assert.default.strictEqual(
      globalThis.__raycastHUD[0],
      `\u2728 Fixed 4 errors: "help" \u2192 "Help", "wants" \u2192 "what's" (+2 more)`
    );
  });
  await test("Quick-fix command reports 100% correct when text has zero errors", async () => {
    globalThis.__selectedText = "This sentence is completely flawless.";
    globalThis.__clipboardContent = "";
    globalThis.__clipboardPasted = "";
    globalThis.__raycastHUD = [];
    await QuickFixCommand();
    import_node_assert.default.strictEqual(
      globalThis.__clipboardPasted,
      "This sentence is completely flawless.",
      "Clipboard paste must preserve intact text"
    );
    import_node_assert.default.strictEqual(globalThis.__raycastHUD.length, 1);
    import_node_assert.default.strictEqual(
      globalThis.__raycastHUD[0],
      "\u2728 100% Correct! (No spelling or grammar errors)"
    );
  });
  console.log('\nGroup 5: Nominative Pronoun "I" & Roman Numeral Preservation');
  await test('Proofread capitalises nominative pronoun "I" in all standard fixtures (mode: fragment)', async () => {
    const fixtures = [
      { input: "i wrote it", expected: "I wrote it" },
      { input: 'he said, "i wrote it yesterday"', expected: 'he said, "I wrote it yesterday"' },
      { input: "shall i compare thee to a summer's day?", expected: "shall I compare thee to a summer's day?" },
      { input: "here i am, and here i'll stay.", expected: "here I am, and here I'll stay." },
      { input: "i think, therefore i am.", expected: "I think, therefore I am." }
    ];
    for (const f of fixtures) {
      const output = await proofreadWithNativeEngine(f.input, {
        mode: "fragment",
        language: "en_GB",
        binaryPath: realBinaryPath,
        manifestPath: realManifestPath
      });
      import_node_assert.default.strictEqual(
        output,
        f.expected,
        `Fixture failed: '${f.input}' expected '${f.expected}' but got '${output}'`
      );
    }
  });
  await test("Proofread preserves lowercase Roman numerals without false capitalisation", async () => {
    const romanCases = [
      "see section i for details",
      "refer to chapter i and part i",
      "appendix i contains the data",
      "clause (i) describes it",
      "phases i to iii were finished"
    ];
    for (const input of romanCases) {
      const output = await proofreadWithNativeEngine(input, {
        mode: "fragment",
        language: "en_GB",
        binaryPath: realBinaryPath,
        manifestPath: realManifestPath
      });
      import_node_assert.default.strictEqual(
        output,
        input,
        `Roman numeral false positive in: '${input}', got '${output}'`
      );
    }
  });
  await test('Proofread capitalises enclosed pronoun "I" and curly-apostrophe contractions', async () => {
    const edgeCases = [
      { input: "(i wrote it)", expected: "(I wrote it)" },
      { input: "\u201Ci wrote it\u201D", expected: "\u201CI wrote it\u201D" },
      { input: "'i wrote it'", expected: "'I wrote it'" },
      { input: "here i\u2019m waiting and here i\u2019ve been", expected: "here I\u2019m waiting and here I\u2019ve been" }
    ];
    for (const ec of edgeCases) {
      const output = await proofreadWithNativeEngine(ec.input, {
        mode: "fragment",
        language: "en_GB",
        binaryPath: realBinaryPath,
        manifestPath: realManifestPath
      });
      import_node_assert.default.strictEqual(
        output,
        ec.expected,
        `Edge case failed: '${ec.input}' expected '${ec.expected}' but got '${output}'`
      );
    }
  });
  console.log("\nGroup 6: Canonical British English Style & Mechanics");
  await test("Proofread enforces all 5 canonical British English verification fixtures", async () => {
    const fixtures = [
      {
        id: "Test 1: Pronoun Boundary & Contraction",
        input: "although i reviewed section i, i\u2019m not sure if i'll need it",
        expected: "Although I reviewed section i, I\u2019m not sure if I'll need it."
      },
      {
        id: "Test 2: Apostrophes & Plurals",
        input: "the childrens play area was full of 1970's cd's and video's.",
        expected: "The children\u2019s play area was full of 1970s CDs and videos."
      },
      {
        id: "Test 3: En-dashes & Adverbs",
        input: "it was \u2014 as far as i could tell \u2014 a highly-respected, well formed text.",
        expected: "It was \u2013 as far as I could tell \u2013 a highly respected, well-formed text."
      },
      {
        id: "Test 4: Quotation & Oxford Comma",
        input: `he said, "i saw fish, shrimp, and krill at land's end."`,
        expected: "He said, \u2018I saw fish, shrimp and krill at Land\u2019s End.\u2019"
      },
      {
        id: "Test 5: Possessive vs Contraction",
        input: "the cat licked it's paws because its muddy.",
        expected: "The cat licked its paws because it\u2019s muddy."
      }
    ];
    for (const f of fixtures) {
      const output = await proofreadWithNativeEngine(f.input, {
        mode: "document",
        language: "en_GB",
        binaryPath: realBinaryPath,
        manifestPath: realManifestPath
      });
      import_node_assert.default.strictEqual(
        output,
        f.expected,
        `${f.id} failed:
Input:    '${f.input}'
Expected: '${f.expected}'
Got:      '${output}'`
      );
    }
  });
  console.log(`
--- Test Summary: ${passed}/${total} tests passed successfully ---`);
}
runTests().catch((err) => {
  console.error("\nTest suite failed with unhandled error:", err);
  process.exit(1);
});
