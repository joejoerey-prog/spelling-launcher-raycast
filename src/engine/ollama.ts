import { getPreferenceValues, showToast, Toast, Icon, Color, openExtensionPreferences } from '@raycast/api';
import { Tone, RewriteChoice } from '../types';
import { generateDiffMarkdown } from './diff';

interface Preferences {
  ollamaHost?: string;
  ollamaModel?: string;
  language?: string;
}

export interface DialectCheckFinding {
  originalWord: string;
  usVariant: string;
  tone: string;
}

/**
 * Narrow diagnostic check to verify whether known UK spellings in originalText
 * were inadvertently Americanised by the LLM.
 */
export function checkUkDialectPreservation(
  originalText: string,
  rewrittenVersions: Record<string, string>
): DialectCheckFinding[] {
  const testPairs: [RegExp, RegExp, string, string][] = [
    [/\bfavourable\b/i, /\bfavorable\b/i, 'favourable', 'favorable'],
    [/\borganise\b/i, /\borganize\b/i, 'organise', 'organize'],
    [/\bcolour\b/i, /\bcolor\b/i, 'colour', 'color'],
    [/\bcentre\b/i, /\bcenter\b/i, 'centre', 'center'],
    [/\btravelling\b/i, /\btraveling\b/i, 'travelling', 'traveling'],
    [/\bdefence\b/i, /\bdefense\b/i, 'defence', 'defense'],
    [/\banalyse\b/i, /\banalyze\b/i, 'analyse', 'analyze'],
  ];

  const findings: DialectCheckFinding[] = [];

  for (const [ukRegex, usRegex, ukWord, usWord] of testPairs) {
    if (ukRegex.test(originalText)) {
      for (const [tone, text] of Object.entries(rewrittenVersions)) {
        if (usRegex.test(text) && !ukRegex.test(text)) {
          findings.push({
            originalWord: ukWord,
            usVariant: usWord,
            tone,
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Constructs system and user prompts incorporating language requirements.
 */
export function buildRewritePrompt(
  originalText: string,
  language: string = 'en_GB'
): { systemPrompt: string; userPrompt: string } {
  const isUK = language === 'en_GB';
  const systemPrompt = isUK
    ? 'You are an expert sentence rewriting engine. You strictly write in British English (en_GB), preserving UK spelling (e.g. favourable, organise, colour, centre, travelling, defence, analyse) and UK punctuation standards (omit full stops on titles like Mr, Mrs, Dr; omit Oxford commas in simple lists like "bread, milk and eggs"; use single quotes \'...\' with punctuation outside unless part of quoted speech; capitalize sentence starts and end complete statements with full stops). You output only raw valid JSON without markdown code fences.'
    : 'You are an expert sentence rewriting engine. You output only raw valid JSON without markdown code fences.';

  const languageInstruction = isUK
    ? '\nLanguage & Punctuation requirements (UK English):\n- Strictly preserve British English (en_GB) spelling (such as favourable, organise, colour, centre).\n- Capitalise the first letter of each sentence and terminate complete statements with a full stop (or question mark for direct questions).\n- Omit full stops on modern British titles (Mr, Mrs, Dr) and acronyms (BBC, NHS).\n- Lists: Omit the Oxford comma by default ("bread, milk and eggs") unless required for clarity.\n- Quotation marks: Use single quotation marks (\'...\') with full stops and commas outside unless part of quoted dialogue.\n- Hyphenate compound adjectives before nouns ("world-class performance").\n'
    : '';

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

export function isVisionModel(model: string): boolean {
  const lower = model.toLowerCase();
  return lower.includes('qwen2.5vl') || lower.includes('vision') || lower.includes('-vl') || lower.includes(':vl') || lower.includes('vl:');
}

/**
 * Multi-version rewrite engine (Formal, Friendly, Direct, Detailed).
 */
export async function fetchFourVersionRewrites(originalText: string): Promise<RewriteChoice[]> {
  let prefs: Preferences = {};
  try {
    prefs = getPreferenceValues<Preferences>();
  } catch {
    // Standard fallback if executed in test runner
  }
  const host = (prefs.ollamaHost || 'http://localhost:11434').replace(/\/v1\/?$/, '');
  const model = prefs.ollamaModel || 'llama3.2:3b';
  const language = prefs.language || 'en_GB';

  if (model !== 'llama3.2:3b') {
    await showToast({
      style: Toast.Style.Failure,
      title: 'Outdated Ollama model configured',
      message: `The configured model '${model}' is a vision-language model that loads ~12.6 GB. Change it to 'llama3.2:3b' to reclaim memory. Recommended: llama3.2:3b`,
      primaryAction: {
        title: 'Open Preferences',
        shortcut: { modifiers: ['cmd'], key: ',' },
        onAction: () => {
          openExtensionPreferences();
        },
      },
    });
    throw new Error(
      `The configured model '${model}' is a vision-language model that loads ~12.6 GB. Change it to 'llama3.2:3b' to reclaim memory. Recommended: llama3.2:3b`
    );
  }

  const { systemPrompt, userPrompt } = buildRewritePrompt(originalText, language);

  try {
    const res = await fetch(`${host}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}`);
    }

    const data: any = await res.json();
    let raw = data.choices?.[0]?.message?.content || '{}';

    // Strip thinking tags or markdown fences
    if (raw.includes('</think>')) {
      raw = raw.split('</think>')[1].trim();
    }
    if (raw.startsWith('```')) {
      const lines = raw.split('\n');
      raw = lines.slice(1, -1).join('\n').trim();
    }

    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end > start) {
        parsed = JSON.parse(raw.substring(start, end + 1));
      }
    }

    const versionDefs: {
      versionNumber: number;
      tone: Tone;
      label: string;
      icon: any;
      tintColor: any;
      description: string;
    }[] = [
      {
        versionNumber: 1,
        tone: 'formal',
        label: 'Version 1: Formal',
        icon: Icon.Document,
        tintColor: Color.Blue,
        description: 'Polished, professional, and articulate',
      },
      {
        versionNumber: 2,
        tone: 'friendly',
        label: 'Version 2: Friendly',
        icon: Icon.Heart,
        tintColor: Color.Green,
        description: 'Warm, conversational, and approachable',
      },
      {
        versionNumber: 3,
        tone: 'direct',
        label: 'Version 3: Direct',
        icon: Icon.Bolt,
        tintColor: Color.Orange,
        description: 'Concise, punchy, and to the point',
      },
      {
        versionNumber: 4,
        tone: 'detailed',
        label: 'Version 4: Detailed',
        icon: Icon.Book,
        tintColor: Color.Purple,
        description: 'Thorough, descriptive, and explanatory',
      },
    ];

    const choices: RewriteChoice[] = [];

    for (const v of versionDefs) {
      let val = parsed[v.tone];
      if (val === undefined) {
        if (v.tone === 'detailed') {
          val = parsed['detailled'] || parsed['details'] || parsed['elaborate'];
        } else if (v.tone === 'formal') {
          val = parsed['professional'] || parsed['polished'];
        } else if (v.tone === 'friendly') {
          val = parsed['casual'] || parsed['warm'];
        } else if (v.tone === 'direct') {
          val = parsed['concise'] || parsed['punchy'];
        }
      }
      let rewrittenText = '';
      if (typeof val === 'string') {
        rewrittenText = val.trim();
      } else if (Array.isArray(val) && val.length > 0) {
        rewrittenText = String(val[0]).trim();
      }

      if (!rewrittenText) {
        rewrittenText = originalText.trim();
      }

      const diff = generateDiffMarkdown(originalText.trim(), rewrittenText, v.label);

      choices.push({
        id: `version-${v.versionNumber}`,
        versionNumber: v.versionNumber,
        tone: v.tone,
        label: v.label,
        rewrittenText,
        originalText: originalText.trim(),
        diffMarkdown: diff,
        icon: v.icon,
        tintColor: v.tintColor,
      });
    }

    if (language === 'en_GB') {
      const versionsMap: Record<string, string> = {};
      for (const c of choices) {
        versionsMap[c.tone] = c.rewrittenText;
      }
      const findings = checkUkDialectPreservation(originalText, versionsMap);
      if (findings.length > 0) {
        console.warn(
          `[SpellingLauncher] Dialect warning: Model converted UK English spellings to US variants: ` +
            findings.map((f) => `${f.originalWord} -> ${f.usVariant} in ${f.tone}`).join(', ')
        );
      }
    }

    return choices;
  } catch (err: any) {
    throw new Error(`Ollama rewrite failed: ${err.message || err}. Please ensure Ollama is running at ${host}.`);
  }
}

export async function fetchOllamaRewrites(originalText: string, _tone?: string): Promise<RewriteChoice[]> {
  return await fetchFourVersionRewrites(originalText);
}
