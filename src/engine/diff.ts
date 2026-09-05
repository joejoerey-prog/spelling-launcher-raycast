export function generateDiffMarkdown(original: string, rewritten: string, tone: string): string {
  const origWords = original.split(/\s+/).filter(Boolean).length;
  const newWords = rewritten.split(/\s+/).filter(Boolean).length;
  const diffWordCount = newWords - origWords;
  const diffSign = diffWordCount > 0 ? `+${diffWordCount}` : `${diffWordCount}`;

  return `## 🚀 ${tone.toUpperCase()} Variation

> **"${rewritten}"**

---

### 📝 Original Passage (${origWords} words)
> "${original}"

### 📊 Change Stats
- **Length**: ${newWords} words (${diffSign} words)
- **Style**: ${tone}
- **Engine**: Local Ollama (100% Private, Zero Cloud Sync)

---
*💡 Press **Enter** to paste directly into your active text box.*`;
}
