/**
 * Fast deterministic linguistic and LanguageTool rules for Raycast
 */
export function applyFastFixes(text: string): string {
  let res = text;

  // 1. Remove repeated consecutive duplicate words (e.g. "the the")
  res = res.replace(/\b([a-zA-Z]{2,})\s+\1\b/gi, '$1');

  // 2. LanguageTool Confusion Sets
  res = res.replace(/\b(have|has|had|an|the|no|any|major|significant|direct|positive|negative|side)\s+affect\b/gi, '$1 effect');
  res = res.replace(/\btheir\s+(is|are|was|were|has|have|will|can|could|should|would)\b/gi, 'there $1');
  res = res.replace(/\bthey're\s+(car|house|dog|opinion|decision|work|report|team|job|friend|family|ideas|plan|project|data|letter)\b/gi, 'their $1');
  res = res.replace(/\bthere\s+(car|house|dog|opinion|decision|work|report|team|job|friend|family|ideas|plan|project|data|letter)\b/gi, 'their $1');
  res = res.replace(/\bits\s+(a|an|the|not|very|going|been|clear|obvious|time|important|evident)\b/gi, "it's $1");
  res = res.replace(/\bit's\s+(color|tail|name|surface|speed|price|size|purpose|features|quality|location|contents|meaning)\b/gi, 'its $1');
  res = res.replace(/\b(to|will|don't|can't|might|did|does|do)\s+loose\b/gi, '$1 lose');
  res = res.replace(/\bloose\s+(weight|money|control|hope|faith|game|match|time)\b/gi, 'lose $1');
  res = res.replace(/\b(has|have|had|was|were)\s+lead\s+to\b/gi, '$1 led to');
  res = res.replace(/\b(better|worse|more|less|greater|smaller|faster|slower|earlier|later|rather|other)\s+then\b/gi, '$1 than');
  res = res.replace(/\b(should|could|would|must|might)\s+of\b/gi, '$1 have');
  res = res.replace(/\balot\b/gi, 'a lot');
  res = res.replace(/\b(as a matter of|in)\s+principal\b/gi, '$1 principle');

  // 3. LanguageTool Wordiness & Redundancies
  res = res.replace(/\bclose\s+proximity\b/gi, 'proximity');
  res = res.replace(/\bend\s+result\b/gi, 'result');
  res = res.replace(/\bfuture\s+plans\b/gi, 'plans');
  res = res.replace(/\bjoin\s+together\b/gi, 'join');
  res = res.replace(/\bbasic\s+fundamentals\b/gi, 'fundamentals');
  res = res.replace(/\bpast\s+history\b/gi, 'history');
  res = res.replace(/\bcompletely\s+eliminate\b/gi, 'eliminate');
  res = res.replace(/\bpersonal\s+opinion\b/gi, 'opinion');
  res = res.replace(/\bunexpected\s+surprise\b/gi, 'surprise');
  res = res.replace(/\bdue\s+to\s+the\s+fact\s+that\b/gi, 'because');
  res = res.replace(/\bat\s+this\s+point\s+in\s+time\b/gi, 'now');
  res = res.replace(/\bin\s+order\s+to\b/gi, 'to');
  res = res.replace(/\bfor\s+the\s+purpose\s+of\b/gi, 'to');
  res = res.replace(/\bin\s+the\s+event\s+that\b/gi, 'if');
  res = res.replace(/\buntil\s+such\s+time\s+as\b/gi, 'until');
  res = res.replace(/\bprior\s+to\b/gi, 'before');
  res = res.replace(/\bsubsequent\s+to\b/gi, 'after');

  // 4. Punctuation spacing & Smart typography
  res = res.replace(/\b\s+([,.:;?!])/g, '$1');
  res = res.replace(/([,;])([a-zA-Z])/g, '$1 $2');
  res = res.replace(/--/g, '—');
  res = res.replace(/\.{3}/g, '…');
  res = res.replace(/(^|[\s])"([a-zA-Z0-9])/g, '$1“$2');
  res = res.replace(/([a-zA-Z0-9.,!?;:])"/g, '$1”');
  res = res.replace(/[ \t]{2,}/g, ' ');

  return res.trim();
}
