import { getSelectedText, Clipboard, showHUD } from '@raycast/api';
import { proofreadStrictText } from './engine/ollama';

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

    await showHUD('🔍 Proofreading (keeping your words)...');
    const corrected = await proofreadStrictText(text);

    if (corrected) {
      await Clipboard.paste(corrected);
      if (corrected === text) {
        await showHUD('✨ 100% Correct! (No spelling or grammar errors)');
      } else {
        await showHUD('✨ Fixed spelling & grammar (words kept intact)!');
      }
    } else {
      await showHUD('⚠️ Could not proofread text.');
    }
  } catch (err: any) {
    await showHUD(`❌ Error: ${err.message || err}`);
  }
}
