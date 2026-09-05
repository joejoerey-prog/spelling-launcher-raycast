import { getPreferenceValues, Icon, Color } from '@raycast/api';
import { Tone, RewriteChoice } from '../types';
import { generateDiffMarkdown } from './diff';
import { applyFastFixes } from './deterministic';

interface Preferences {
  ollamaHost?: string;
  ollamaModel?: string;
}

/**
 * Strict literal proofreader:
 * Fixes spelling, typos, punctuation, and grammatical mistakes.
 * Strictly NEVER substitutes words, rewrites phrasing, or deletes words.
 */
export async function proofreadStrictText(originalText: string): Promise<string> {
  const text = originalText.trim();
  if (!text) return '';

  const prefs = getPreferenceValues<Preferences>();
  const host = (prefs.ollamaHost || 'http://localhost:11434').replace(/\/v1\/?$/, '');
  const model = prefs.ollamaModel || 'llama3.2:3b';

  const systemPrompt = `You are a strict, literal proofreading engine.
Your sole duty is to fix spelling errors, typos, capitalization, punctuation, and grammatical correctness.
ABSOLUTE RULES:
1. NEVER substitute words with synonyms.
2. NEVER rewrite, rephrase, or reorder sentences.
3. NEVER delete words or add commentary words.
4. Keep the author's exact vocabulary, style, and tone 100% intact.
5. Output ONLY the corrected text directly with no quotes, no conversational filler, and no markdown fences.`;

  try {
    const res = await fetch(`${host}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Correct only spelling, grammar, punctuation, and typos in the following text without altering any other words:\n\n${text}`,
          },
        ],
        temperature: 0.0,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}`);
    }

    const data: any = await res.json();
    let raw = (data.choices?.[0]?.message?.content || '').trim();

    // Strip thinking tags or markdown fences
    if (raw.includes('</think>')) {
      raw = raw.split('</think>')[1].trim();
    }
    if (raw.startsWith('```')) {
      const lines = raw.split('\n');
      raw = lines.slice(1, -1).join('\n').trim();
    }

    // Strip surrounding quotes if model wrapped output in quotes
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith('\'') && raw.endsWith('\''))) {
      raw = raw.slice(1, -1).trim();
    }

    if (raw.length > 0) {
      return raw;
    }
    return applyFastFixes(text);
  } catch {
    return applyFastFixes(text);
  }
}

/**
 * Multi-version rewrite engine (Formal, Friendly, Direct, Detailed).
 */
export async function fetchFourVersionRewrites(originalText: string): Promise<RewriteChoice[]> {
  const prefs = getPreferenceValues<Preferences>();
  const host = (prefs.ollamaHost || 'http://localhost:11434').replace(/\/v1\/?$/, '');
  const model = prefs.ollamaModel || 'llama3.2:3b';

  const prompt = `Rewrite the following sentence into 4 distinct versions:
1. Formal: Polished, professional, articulate, and grammatically impeccable.
2. Friendly: Warm, conversational, and approachable.
3. Direct: Concise, punchy, cutting all fluff.
4. Detailed: Thorough, descriptive, and richly explanatory.

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

  try {
    const res = await fetch(`${host}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an expert sentence rewriting engine. You output only raw valid JSON without markdown code fences.' },
          { role: 'user', content: prompt },
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
      const val = parsed[v.tone];
      let rewrittenText = '';
      if (typeof val === 'string') {
        rewrittenText = val.trim();
      } else if (Array.isArray(val) && val.length > 0) {
        rewrittenText = String(val[0]).trim();
      }

      if (!rewrittenText) {
        rewrittenText = applyFastFixes(originalText);
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

    return choices;
  } catch (err: any) {
    const cleaned = applyFastFixes(originalText);
    return [
      {
        id: 'version-1',
        versionNumber: 1,
        tone: 'formal',
        label: 'Version 1: Formal',
        rewrittenText: cleaned,
        originalText: originalText.trim(),
        diffMarkdown: generateDiffMarkdown(originalText.trim(), cleaned, 'Version 1: Formal (Cleaned)'),
        icon: Icon.Document,
        tintColor: Color.Blue,
      },
      {
        id: 'version-2',
        versionNumber: 2,
        tone: 'friendly',
        label: 'Version 2: Friendly',
        rewrittenText: cleaned,
        originalText: originalText.trim(),
        diffMarkdown: generateDiffMarkdown(originalText.trim(), cleaned, 'Version 2: Friendly (Cleaned)'),
        icon: Icon.Heart,
        tintColor: Color.Green,
      },
      {
        id: 'version-3',
        versionNumber: 3,
        tone: 'direct',
        label: 'Version 3: Direct',
        rewrittenText: cleaned,
        originalText: originalText.trim(),
        diffMarkdown: generateDiffMarkdown(originalText.trim(), cleaned, 'Version 3: Direct (Cleaned)'),
        icon: Icon.Bolt,
        tintColor: Color.Orange,
      },
      {
        id: 'version-4',
        versionNumber: 4,
        tone: 'detailed',
        label: 'Version 4: Detailed',
        rewrittenText: cleaned,
        originalText: originalText.trim(),
        diffMarkdown: generateDiffMarkdown(originalText.trim(), cleaned, 'Version 4: Detailed (Cleaned)'),
        icon: Icon.Book,
        tintColor: Color.Purple,
      },
    ];
  }
}

export async function fetchOllamaRewrites(originalText: string, _tone?: string): Promise<RewriteChoice[]> {
  return await fetchFourVersionRewrites(originalText);
}
