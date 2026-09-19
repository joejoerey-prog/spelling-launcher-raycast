import { getSelectedText, Clipboard, showHUD } from '@raycast/api';
import { proofreadAndReportChanges, ProofreadChange } from './engine/nativeSpellchecker';

function formatChangeSummary(changes: ProofreadChange[]): string {
  if (changes.length === 0) {
    return '✨ 100% Correct! (No spelling or grammar errors)';
  }

  const items = changes.map((c) => `"${c.matched}" → "${c.replacement}"`);
  if (items.length <= 2) {
    return `✨ Fixed: ${items.join(', ')}`;
  } else {
    return `✨ Fixed ${changes.length} errors: ${items.slice(0, 2).join(', ')} (+${changes.length - 2} more)`;
  }
}

export default async function Command() {
  try {
    let text = '';
    try {
      text = (await getSelectedText()).trim();
    } catch {
      try {
        text = ((await Clipboard.readText()) || '').trim();
      } catch {
        text = '';
      }
    }

    if (!text) {
      await showHUD('⚠️ Highlight text in any app first.');
      return;
    }

    const { correctedText, changes } = await proofreadAndReportChanges(text, { mode: 'document' });

    if (correctedText) {
      await Clipboard.paste(correctedText);
      const hudMessage = formatChangeSummary(changes);
      await showHUD(hudMessage);
    } else {
      await showHUD('⚠️ Could not proofread text: empty response.');
    }
  } catch (err: any) {
    await showHUD(`❌ Error: ${err.message || err}`);
  }
}
