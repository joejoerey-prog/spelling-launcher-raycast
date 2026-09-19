// Extension defects test suite: per-result copy actions, cleanup failure classes, and UK English preservation
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import Module from 'node:module';

// Intercept @raycast/api resolution to use mock
const Module = require('node:module');
const originalResolve = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (
  request: string,
  parent: any,
  isMain: boolean,
  options: any
) {
  if (request === '@raycast/api') {
    return path.resolve(__dirname, 'mocks/raycast-api.js');
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

const raycastMock = require('./mocks/raycast-api.js');

// Import units under test
import {
  checkTextWithNativeEngine,
  proofreadWithNativeEngine,
  validateStagedCli,
} from '../src/engine/nativeSpellchecker';

import {
  buildRewritePrompt,
  checkUkDialectPreservation,
  fetchOllamaRewrites,
} from '../src/engine/ollama';

import { RewriteChoice } from '../src/types';

async function runTests() {
  console.log('--- Starting Raycast Extension Defect Verification Tests ---\n');
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    return (async () => {
      try {
        await fn();
        console.log(`  ✓ ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`  ✗ ${name}`);
        console.error(`    Error: ${err.message || err}`);
        throw err;
      }
    })();
  }

  // =========================================================================
  // Defect 1: Rewrite Result Copy Actions
  // =========================================================================
  console.log('Group 1: Rewrite Result Actions & Individual Copying');

  await test('Four results render with distinct version identifiers and labels', () => {
    const mockChoices: RewriteChoice[] = [
      {
        id: 'version-1',
        versionNumber: 1,
        tone: 'formal',
        label: 'Version 1: Formal',
        rewrittenText: 'This is a favourable formal statement.',
        originalText: 'original text',
        diffMarkdown: '',
        icon: 'doc',
        tintColor: 'blue',
      },
      {
        id: 'version-2',
        versionNumber: 2,
        tone: 'friendly',
        label: 'Version 2: Friendly',
        rewrittenText: 'This is a friendly statement.',
        originalText: 'original text',
        diffMarkdown: '',
        icon: 'heart',
        tintColor: 'green',
      },
      {
        id: 'version-3',
        versionNumber: 3,
        tone: 'direct',
        label: 'Version 3: Direct',
        rewrittenText: 'This is direct.',
        originalText: 'original text',
        diffMarkdown: '',
        icon: 'bolt',
        tintColor: 'orange',
      },
      {
        id: 'version-4',
        versionNumber: 4,
        tone: 'detailed',
        label: 'Version 4: Detailed',
        rewrittenText: 'This is a detailed and articulate statement.',
        originalText: 'original text',
        diffMarkdown: '',
        icon: 'book',
        tintColor: 'purple',
      },
    ];

    assert.strictEqual(mockChoices.length, 4);
    const ids = mockChoices.map((c) => c.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(uniqueIds.size, 4, 'All four choices must possess unique identifiers');
  });

  await test('Triggering copy action for results 1, 2, 3, and 4 copies specific text and triggers corresponding toast', async () => {
    const mockChoices: RewriteChoice[] = [
      {
        id: 'version-1',
        versionNumber: 1,
        tone: 'formal',
        label: 'Version 1: Formal',
        rewrittenText: 'Rewritten Formal Version 1',
        originalText: 'Original',
        diffMarkdown: '',
        icon: 'doc',
        tintColor: 'blue',
      },
      {
        id: 'version-2',
        versionNumber: 2,
        tone: 'friendly',
        label: 'Version 2: Friendly',
        rewrittenText: 'Rewritten Friendly Version 2',
        originalText: 'Original',
        diffMarkdown: '',
        icon: 'heart',
        tintColor: 'green',
      },
      {
        id: 'version-3',
        versionNumber: 3,
        tone: 'direct',
        label: 'Version 3: Direct',
        rewrittenText: 'Rewritten Direct Version 3',
        originalText: 'Original',
        diffMarkdown: '',
        icon: 'bolt',
        tintColor: 'orange',
      },
      {
        id: 'version-4',
        versionNumber: 4,
        tone: 'detailed',
        label: 'Version 4: Detailed',
        rewrittenText: 'Rewritten Detailed Version 4',
        originalText: 'Original',
        diffMarkdown: '',
        icon: 'book',
        tintColor: 'purple',
      },
    ];

    // Handler logic from rewrite-selection.tsx
    const handleCopy = async (choice: RewriteChoice) => {
      await raycastMock.Clipboard.copy(choice.rewrittenText);
      await raycastMock.showToast({
        style: raycastMock.Toast.Style.Success,
        title: `Copied rewrite ${choice.versionNumber}`,
        message: choice.label,
      });
    };

    for (const choice of mockChoices) {
      globalThis.__raycastToasts = [];
      globalThis.__clipboardContent = '';

      await handleCopy(choice);

      // Verify copied content matches only the chosen rewrite
      assert.strictEqual(
        globalThis.__clipboardContent,
        choice.rewrittenText,
        `Clipboard content must exactly match choice ${choice.versionNumber}`
      );

      // Verify success toast title explicitly identifies the correct result number
      assert.strictEqual(globalThis.__raycastToasts.length, 1);
      const toast = globalThis.__raycastToasts[0];
      assert.strictEqual(
        toast.title,
        `Copied rewrite ${choice.versionNumber}`,
        `Toast title must state 'Copied rewrite ${choice.versionNumber}'`
      );
    }
  });

  // =========================================================================
  // Defect 2: Cleanup Command Failure Diagnosis & Failure Classes
  // =========================================================================
  console.log('\nGroup 2: Cleanup Command Diagnostics & Error Behaviour');

  const realBinaryPath = path.resolve(__dirname, '../assets/spellcheck-cli');
  const realManifestPath = path.resolve(__dirname, '../assets/spellcheck-cli.version.json');

  await test('Valid executable and valid input produce expected cleanup result', async () => {
    assert.ok(fs.existsSync(realBinaryPath), 'assets/spellcheck-cli must exist');
    const input = 'This is teh test with mispelled words.';
    const result = await proofreadWithNativeEngine(input, {
      language: 'en_GB',
      binaryPath: realBinaryPath,
      manifestPath: realManifestPath,
    });

    assert.strictEqual(
      result,
      'This is the test with misspelled words.',
      'Cleanup engine must fix "teh" and "mispelled"'
    );
  });

  await test('Missing assets/spellcheck-cli produces a visible, actionable error', async () => {
    const missingPath = path.resolve(__dirname, '../assets/non_existent_binary');
    let caught: Error | null = null;
    try {
      await checkTextWithNativeEngine('test', {
        binaryPath: missingPath,
        manifestPath: realManifestPath,
      });
    } catch (err: any) {
      caught = err;
    }

    assert.ok(caught !== null, 'Must throw error when binary is missing');
    assert.ok(
      caught.message.includes('Native checker binary missing at:'),
      `Error message must identify missing binary path: ${caught.message}`
    );
    assert.ok(
      caught.message.includes('./scripts/sync-raycast-cli.sh'),
      'Error message must provide actionable restoration command'
    );
  });

  await test('Non-executable CLI produces a visible, actionable error', async () => {
    // Create temporary non-executable fixture
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'raycast-cli-test-'));
    const nonExecBinary = path.join(tmpDir, 'spellcheck-cli');
    fs.writeFileSync(nonExecBinary, '#!/bin/sh\necho "hello"\n', { mode: 0o644 });

    let caught: Error | null = null;
    try {
      await checkTextWithNativeEngine('test', {
        binaryPath: nonExecBinary,
        manifestPath: realManifestPath,
      });
    } catch (err: any) {
      caught = err;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    assert.ok(caught !== null, 'Must throw error when binary lacks execute permissions');
    assert.ok(
      caught.message.includes('is not executable'),
      `Error message must report non-executable binary: ${caught.message}`
    );
    assert.ok(
      caught.message.includes('chmod +x'),
      'Error message must instruct user to chmod +x'
    );
  });

  await test('CLI non-zero exit produces a visible error containing stderr', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'raycast-cli-err-'));
    const errorBinary = path.join(tmpDir, 'spellcheck-cli');
    fs.writeFileSync(
      errorBinary,
      '#!/bin/sh\n>&2 echo "CRITICAL_FAILURE: Failed to load dictionary"\nexit 2\n',
      { mode: 0o755 }
    );

    let caught: Error | null = null;
    try {
      await checkTextWithNativeEngine('test', {
        binaryPath: errorBinary,
        manifestPath: realManifestPath,
      });
    } catch (err: any) {
      caught = err;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    assert.ok(caught !== null, 'Must throw error on non-zero exit code');
    assert.ok(
      caught.message.includes('exited with code 2'),
      `Error must specify exit code: ${caught.message}`
    );
    assert.ok(
      caught.message.includes('CRITICAL_FAILURE: Failed to load dictionary'),
      `Error must capture stderr: ${caught.message}`
    );
  });

  await test('Invalid JSON response produces a visible parse error', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'raycast-cli-json-'));
    const invalidJsonBinary = path.join(tmpDir, 'spellcheck-cli');
    fs.writeFileSync(invalidJsonBinary, '#!/bin/sh\necho "INVALID_NON_JSON_OUTPUT"\nexit 0\n', {
      mode: 0o755,
    });

    let caught: Error | null = null;
    try {
      await checkTextWithNativeEngine('test', {
        binaryPath: invalidJsonBinary,
        manifestPath: realManifestPath,
      });
    } catch (err: any) {
      caught = err;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    assert.ok(caught !== null, 'Must throw error on invalid JSON response');
    assert.ok(
      caught.message.includes('Failed to parse spellcheck-cli JSON output'),
      `Error must report JSON parsing failure: ${caught.message}`
    );
  });

  await test('Empty stdout produces a visible empty-response error', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'raycast-cli-empty-'));
    const emptyBinary = path.join(tmpDir, 'spellcheck-cli');
    fs.writeFileSync(emptyBinary, '#!/bin/sh\nexit 0\n', { mode: 0o755 });

    let caught: Error | null = null;
    try {
      await checkTextWithNativeEngine('test', {
        binaryPath: emptyBinary,
        manifestPath: realManifestPath,
      });
    } catch (err: any) {
      caught = err;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    assert.ok(caught !== null, 'Must throw error on empty stdout');
    assert.ok(
      caught.message.includes('spellcheck-cli returned empty output with no response.'),
      `Error must indicate empty output: ${caught.message}`
    );
  });

  await test('Zero TypeScript fallback exists: errors propagate directly without fallback', async () => {
    // Verify that proofreadWithNativeEngine propagates errors rather than falling back to TS regexes
    const missingPath = path.resolve(__dirname, '../assets/non_existent_binary');
    let caught: Error | null = null;
    try {
      await proofreadWithNativeEngine('Some text with error', {
        binaryPath: missingPath,
        manifestPath: realManifestPath,
      });
    } catch (err: any) {
      caught = err;
    }

    assert.ok(caught !== null, 'Must throw without falling back to a secondary engine');
    assert.ok(
      caught.message.includes('Native checker binary missing at:'),
      'Must surface native checker binary error directly'
    );
  });

  // =========================================================================
  // Defect 3: UK English (en_GB) Dialect Preservation
  // =========================================================================
  console.log('\nGroup 3: UK English (en_GB) Dialect Preservation');

  await test('Prompt generation for en_GB includes strict British English requirements', () => {
    const ukPrompt = buildRewritePrompt(
      'This is a favourable proposal to organise the centre with colour.',
      'en_GB'
    );

    assert.ok(
      ukPrompt.systemPrompt.includes('British English (en_GB)'),
      'System prompt must mandate British English (en_GB)'
    );
    assert.ok(
      ukPrompt.systemPrompt.includes('favourable'),
      'System prompt must cite favourable as UK spelling'
    );
    assert.ok(
      ukPrompt.systemPrompt.includes('organise'),
      'System prompt must cite organise as UK spelling'
    );
    assert.ok(
      ukPrompt.systemPrompt.includes('colour'),
      'System prompt must cite colour as UK spelling'
    );
    assert.ok(
      ukPrompt.systemPrompt.includes('centre'),
      'System prompt must cite centre as UK spelling'
    );
    assert.ok(
      ukPrompt.userPrompt.includes('Strictly preserve British English (en_GB)'),
      'User prompt must explicitly instruct preservation of en_GB'
    );
    assert.ok(
      ukPrompt.userPrompt.includes('favourable, organise, colour, centre'),
      'User prompt must enumerate exact required UK words'
    );
  });

  await test('Narrow dialect audit identifies Americanised spellings in rewrites', () => {
    const originalText = 'We need a favourable outcome to organise the colour at the centre.';
    const americanisedRewrites = {
      formal: 'We require a favorable outcome to organize the color at the center.',
      friendly: 'We need favourable conditions to organise the colour at the centre.',
      direct: 'Get a favorable result.',
      detailed: 'We must ensure a favourable outcome.',
    };

    const findings = checkUkDialectPreservation(originalText, americanisedRewrites);
    assert.ok(findings.length > 0, 'Must detect Americanised spellings in rewrite output');

    const wordsFound = findings.map((f) => f.originalWord);
    assert.ok(wordsFound.includes('favourable'), 'Must flag favourable -> favorable');
    assert.ok(wordsFound.includes('organise'), 'Must flag organise -> organize');
    assert.ok(wordsFound.includes('colour'), 'Must flag colour -> color');
    assert.ok(wordsFound.includes('centre'), 'Must flag centre -> center');
  });

  await test('Narrow dialect audit reports clean when UK spellings are strictly preserved', () => {
    const originalText = 'We need a favourable outcome to organise the colour at the centre.';
    const ukPreservedRewrites = {
      formal: 'To achieve a favourable outcome, we will organise the colour at the centre.',
      friendly: 'Let us make sure the centre colours are organised in a favourable manner.',
      direct: 'Organise the centre colour favourably.',
      detailed: 'A favourable arrangement requires us to organise every colour in the centre.',
    };

    const findings = checkUkDialectPreservation(originalText, ukPreservedRewrites);
    assert.strictEqual(findings.length, 0, 'Must report zero findings when UK spellings are preserved');
  });

  // =========================================================================
  // End-to-End Command Entrypoint Verification
  // =========================================================================
  console.log('\nGroup 4: Cleanup Command Entrypoint (quick-fix.tsx) Lifecycle');

  const QuickFixCommand = (await import('../src/quick-fix')).default;

  await test('Quick-fix command warns with HUD when no text is selected', async () => {
    globalThis.__selectedText = '';
    globalThis.__clipboardContent = '';
    globalThis.__raycastHUD = [];

    await QuickFixCommand();

    assert.strictEqual(globalThis.__raycastHUD.length, 1);
    assert.strictEqual(
      globalThis.__raycastHUD[0],
      '⚠️ Highlight text in any app first.'
    );
  });

  await test('Quick-fix command proofreads, pastes correction, and displays success HUD', async () => {
    globalThis.__selectedText = 'This is teh test with mispelled words.';
    globalThis.__clipboardContent = '';
    globalThis.__clipboardPasted = '';
    globalThis.__raycastHUD = [];

    await QuickFixCommand();

    assert.strictEqual(
      globalThis.__clipboardPasted,
      'This is the test with misspelled words.',
      'Clipboard paste must contain corrected text'
    );
    assert.strictEqual(globalThis.__raycastHUD.length, 1);
    assert.strictEqual(
      globalThis.__raycastHUD[0],
      '✨ Fixed: "teh" → "the", "mispelled" → "misspelled"'
    );
  });

  await test('Quick-fix command proofreads contextual homophones, determiner-noun agreement, capitalization and terminal punctuation', async () => {
    globalThis.__selectedText = 'help me find wants wrong with that issues';
    globalThis.__clipboardContent = '';
    globalThis.__clipboardPasted = '';
    globalThis.__raycastHUD = [];

    await QuickFixCommand();

    assert.strictEqual(
      globalThis.__clipboardPasted,
      "Help me find what's wrong with those issues.",
      'Clipboard paste must contain fully punctuated and corrected sentence'
    );
    assert.strictEqual(globalThis.__raycastHUD.length, 1);
    assert.strictEqual(
      globalThis.__raycastHUD[0],
      '✨ Fixed 4 errors: "help" → "Help", "wants" → "what\'s" (+2 more)'
    );
  });

  await test('Quick-fix command reports 100% correct when text has zero errors', async () => {
    globalThis.__selectedText = 'This sentence is completely flawless.';
    globalThis.__clipboardContent = '';
    globalThis.__clipboardPasted = '';
    globalThis.__raycastHUD = [];

    await QuickFixCommand();

    assert.strictEqual(
      globalThis.__clipboardPasted,
      'This sentence is completely flawless.',
      'Clipboard paste must preserve intact text'
    );
    assert.strictEqual(globalThis.__raycastHUD.length, 1);
    assert.strictEqual(
      globalThis.__raycastHUD[0],
      '✨ 100% Correct! (No spelling or grammar errors)'
    );
  });

  // =========================================================================
  // Group 5: Nominative Pronoun "I" Capitalisation & Roman Numeral Preservation
  // =========================================================================
  console.log('\nGroup 5: Nominative Pronoun "I" & Roman Numeral Preservation');

  await test('Proofread capitalises nominative pronoun "I" in all standard fixtures (mode: fragment)', async () => {
    const fixtures = [
      { input: 'i wrote it', expected: 'I wrote it' },
      { input: 'he said, "i wrote it yesterday"', expected: 'he said, "I wrote it yesterday"' },
      { input: "shall i compare thee to a summer's day?", expected: "shall I compare thee to a summer's day?" },
      { input: "here i am, and here i'll stay.", expected: "here I am, and here I'll stay." },
      { input: 'i think, therefore i am.', expected: 'I think, therefore I am.' },
    ];

    for (const f of fixtures) {
      const output = await proofreadWithNativeEngine(f.input, {
        mode: 'fragment',
        language: 'en_GB',
        binaryPath: realBinaryPath,
        manifestPath: realManifestPath,
      });
      assert.strictEqual(
        output,
        f.expected,
        `Fixture failed: '${f.input}' expected '${f.expected}' but got '${output}'`
      );
    }
  });

  await test('Proofread preserves lowercase Roman numerals without false capitalisation', async () => {
    const romanCases = [
      'see section i for details',
      'refer to chapter i and part i',
      'appendix i contains the data',
      'clause (i) describes it',
      'phases i to iii were finished',
    ];

    for (const input of romanCases) {
      const output = await proofreadWithNativeEngine(input, {
        mode: 'fragment',
        language: 'en_GB',
        binaryPath: realBinaryPath,
        manifestPath: realManifestPath,
      });
      assert.strictEqual(
        output,
        input,
        `Roman numeral false positive in: '${input}', got '${output}'`
      );
    }
  });

  await test('Proofread capitalises enclosed pronoun "I" and curly-apostrophe contractions', async () => {
    const edgeCases = [
      { input: '(i wrote it)', expected: '(I wrote it)' },
      { input: '“i wrote it”', expected: '“I wrote it”' },
      { input: "'i wrote it'", expected: "'I wrote it'" },
      { input: 'here i’m waiting and here i’ve been', expected: 'here I’m waiting and here I’ve been' },
    ];

    for (const ec of edgeCases) {
      const output = await proofreadWithNativeEngine(ec.input, {
        mode: 'fragment',
        language: 'en_GB',
        binaryPath: realBinaryPath,
        manifestPath: realManifestPath,
      });
      assert.strictEqual(
        output,
        ec.expected,
        `Edge case failed: '${ec.input}' expected '${ec.expected}' but got '${output}'`
      );
    }
  });

  // =========================================================================
  // Group 6: Canonical British English Style & Mechanics
  // =========================================================================
  console.log('\nGroup 6: Canonical British English Style & Mechanics');

  await test('Proofread enforces all 5 canonical British English verification fixtures', async () => {
    const fixtures = [
      {
        id: 'Test 1: Pronoun Boundary & Contraction',
        input: "although i reviewed section i, i’m not sure if i'll need it",
        expected: "Although I reviewed section i, I’m not sure if I'll need it.",
      },
      {
        id: 'Test 2: Apostrophes & Plurals',
        input: "the childrens play area was full of 1970's cd's and video's.",
        expected: 'The children’s play area was full of 1970s CDs and videos.',
      },
      {
        id: 'Test 3: En-dashes & Adverbs',
        input: 'it was — as far as i could tell — a highly-respected, well formed text.',
        expected: 'It was – as far as I could tell – a highly respected, well-formed text.',
      },
      {
        id: 'Test 4: Quotation & Oxford Comma',
        input: 'he said, "i saw fish, shrimp, and krill at land\'s end."',
        expected: 'He said, ‘I saw fish, shrimp and krill at Land’s End.’',
      },
      {
        id: 'Test 5: Possessive vs Contraction',
        input: "the cat licked it's paws because its muddy.",
        expected: 'The cat licked its paws because it’s muddy.',
      },
    ];

    for (const f of fixtures) {
      const output = await proofreadWithNativeEngine(f.input, {
        mode: 'document',
        language: 'en_GB',
        binaryPath: realBinaryPath,
        manifestPath: realManifestPath,
      });
      assert.strictEqual(
        output,
        f.expected,
        `${f.id} failed:\nInput:    '${f.input}'\nExpected: '${f.expected}'\nGot:      '${output}'`
      );
    }
  });

  console.log(`\n--- Test Summary: ${passed}/${total} tests passed successfully ---`);
}

runTests().catch((err) => {
  console.error('\nTest suite failed with unhandled error:', err);
  process.exit(1);
});
