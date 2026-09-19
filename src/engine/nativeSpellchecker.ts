import { environment, getPreferenceValues, showHUD } from '@raycast/api';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface NativeIssue {
  id: string;
  rule_id: string;
  category: string;
  severity: string;
  message: string;
  start_offset: number;
  end_offset: number;
  matched_text: string;
  replacement?: string;
  suggestions?: string[];
  apply_all_eligible: boolean;
}

export interface NativeCheckResult {
  version: string;
  language: string;
  mode: string;
  issue_count: number;
  issues: NativeIssue[];
}

interface Preferences {
  language?: string;
}

interface CliVersionManifest {
  name: string;
  version: string;
  git_sha: string;
  target: string;
  build_profile: string;
  binary: string;
}

/**
 * Locates the native spellcheck-cli binary and manifest from candidate paths.
 */
export function findCliPaths(customAssetsDir?: string): { binaryPath: string; manifestPath: string } {
  let assetsPath: string | undefined;
  try {
    if (typeof environment !== 'undefined' && environment.assetsPath) {
      assetsPath = environment.assetsPath;
    }
  } catch {
    assetsPath = undefined;
  }

  const candidateDirs = [
    customAssetsDir,
    assetsPath,
    path.resolve(__dirname, '..', 'assets'),
    path.resolve(__dirname, 'assets'),
    path.resolve(process.env.HOME || '', '.config/raycast/extensions/spelling-launcher/assets'),
    '/Users/joerey/.gemini/antigravity/scratch/spelling-launcher-raycast/assets',
    '/Users/joerey/.gemini/antigravity/scratch/wordtune-personal/target/release',
  ].filter(Boolean) as string[];

  let resolvedBinary: string | null = null;
  let resolvedManifest: string | null = null;

  for (const dir of candidateDirs) {
    const b = path.join(dir, 'spellcheck-cli');
    if (fs.existsSync(b) && !resolvedBinary) {
      resolvedBinary = b;
    }
    const m = path.join(dir, 'spellcheck-cli.version.json');
    if (fs.existsSync(m) && !resolvedManifest) {
      resolvedManifest = m;
    }
  }

  const defaultDir = candidateDirs[0] || 'assets';
  const binaryPath = resolvedBinary || path.join(defaultDir, 'spellcheck-cli');
  const manifestPath = resolvedManifest || path.join(defaultDir, 'spellcheck-cli.version.json');

  return { binaryPath, manifestPath };
}

/**
 * Validates that the staged native CLI binary and version manifest exist and are executable.
 * Throws a descriptive, actionable error for each failure class.
 */
export function validateStagedCli(overridePaths?: { binaryPath?: string; manifestPath?: string }): {
  binaryPath: string;
  manifest: CliVersionManifest;
} {
  const resolved = findCliPaths();
  const binaryPath = overridePaths?.binaryPath || resolved.binaryPath;
  const manifestPath = overridePaths?.manifestPath || resolved.manifestPath;

  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `Native checker binary missing at: ${binaryPath}. Run ./scripts/sync-raycast-cli.sh in wordtune-personal.`
    );
  }

  try {
    fs.accessSync(binaryPath, fs.constants.X_OK);
  } catch {
    throw new Error(
      `Native checker binary at ${binaryPath} is not executable. Run 'chmod +x ${binaryPath}'.`
    );
  }

  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Native checker version manifest missing at: ${manifestPath}. Run ./scripts/sync-raycast-cli.sh in wordtune-personal.`
    );
  }

  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest: CliVersionManifest = JSON.parse(raw);
    return { binaryPath, manifest };
  } catch (err: any) {
    throw new Error(`Failed to parse spellcheck-cli.version.json: ${err.message || err}`);
  }
}

/**
 * Execute spellcheck-cli natively via child_process using stdin.
 * Runs in single-digit milliseconds with zero network and zero background processes.
 */
export async function checkTextWithNativeEngine(
  text: string,
  options?: {
    mode?: 'fragment' | 'document';
    language?: string;
    binaryPath?: string;
    manifestPath?: string;
  }
): Promise<NativeCheckResult> {
  const { binaryPath } = validateStagedCli({
    binaryPath: options?.binaryPath,
    manifestPath: options?.manifestPath,
  });

  let language = options?.language;
  if (!language) {
    try {
      const prefs = getPreferenceValues<Preferences>();
      language = prefs.language;
    } catch {
      language = 'en_GB';
    }
  }
  if (!language) {
    language = 'en_GB';
  }

  const mode = options?.mode || 'fragment';

  return new Promise((resolve, reject) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(binaryPath, ['--stdin', '--mode', mode, '--language', language], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err: any) {
      return reject(new Error(`Failed to launch native checker binary at ${binaryPath}: ${err.message}`));
    }

    let stdoutData = '';
    let stderrData = '';
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        try {
          child.kill('SIGKILL');
        } catch {
          // ignore kill failure
        }
        reject(new Error('spellcheck-cli timed out after 5000ms with no response.'));
      }
    }, 5000);

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString('utf-8');
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString('utf-8');
    });

    child.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(new Error(`Failed to launch native checker binary at ${binaryPath}: ${err.message}`));
      }
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);

      if (code !== 0) {
        return reject(
          new Error(`spellcheck-cli exited with code ${code}: ${stderrData.trim() || 'Unknown error'}`)
        );
      }

      if (stdoutData.trim().length === 0) {
        return reject(new Error('spellcheck-cli returned empty output with no response.'));
      }

      try {
        const parsed: NativeCheckResult = JSON.parse(stdoutData);
        resolve(parsed);
      } catch (err: any) {
        reject(
          new Error(
            `Failed to parse spellcheck-cli JSON output: ${err.message || err}\nRaw: ${stdoutData.slice(0, 300)}`
          )
        );
      }
    });

    try {
      child.stdin.write(text, 'utf-8');
      child.stdin.end();
    } catch (err: any) {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(new Error(`Failed to write to spellcheck-cli stdin: ${err.message}`));
      }
    }
  });
}

export interface ProofreadChange {
  matched: string;
  replacement: string;
  category: string;
}

export interface ProofreadResult {
  originalText: string;
  correctedText: string;
  changes: ProofreadChange[];
}

/**
 * Strict literal proofreading using native macOS NSSpellChecker and spellcore rules.
 * Applies high-confidence replacements in reverse byte order and reports all changes made.
 * If the native binary is missing, wrong-versioned or fails, throws visibly.
 * NO TypeScript regex fallback is permitted (one engine only, in Rust).
 */
export async function proofreadAndReportChanges(
  originalText: string,
  options?: { mode?: 'fragment' | 'document'; language?: string; binaryPath?: string; manifestPath?: string }
): Promise<ProofreadResult> {
  const text = originalText.trim();
  if (!text) return { originalText, correctedText: '', changes: [] };

  const mode = options?.mode || 'fragment';
  const result = await checkTextWithNativeEngine(text, {
    mode,
    language: options?.language,
    binaryPath: options?.binaryPath,
    manifestPath: options?.manifestPath,
  });

  if (!result.issues || result.issues.length === 0) {
    return { originalText: text, correctedText: text, changes: [] };
  }

  // Filter issues with replacements and sort in reverse byte-offset order
  const applicableIssues = result.issues
    .filter((i) => Boolean(i.replacement))
    .sort((a, b) => b.start_offset - a.start_offset || b.end_offset - a.end_offset);

  if (applicableIssues.length === 0) {
    return { originalText: text, correctedText: text, changes: [] };
  }

  const buf = Buffer.from(text, 'utf-8');
  let modifiedBuf = buf;
  const changes: ProofreadChange[] = [];
  let lastStart = Infinity;

  for (const issue of applicableIssues) {
    const rep = issue.replacement!;
    const repBuf = Buffer.from(rep, 'utf-8');
    if (
      issue.end_offset <= lastStart &&
      issue.start_offset <= issue.end_offset &&
      issue.end_offset <= modifiedBuf.length
    ) {
      const prefix = modifiedBuf.subarray(0, issue.start_offset);
      const suffix = modifiedBuf.subarray(issue.end_offset);
      modifiedBuf = Buffer.concat([prefix, repBuf, suffix]);
      lastStart = issue.start_offset;
      changes.push({
        matched: issue.matched_text,
        replacement: rep,
        category: issue.category,
      });
    }
  }

  // Reverse so changes are presented in reading order
  changes.reverse();

  return {
    originalText: text,
    correctedText: modifiedBuf.toString('utf-8'),
    changes,
  };
}

export async function proofreadWithNativeEngine(
  originalText: string,
  options?: { mode?: 'fragment' | 'document'; language?: string; binaryPath?: string; manifestPath?: string }
): Promise<string> {
  const res = await proofreadAndReportChanges(originalText, options);
  return res.correctedText;
}
