// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  List,
  ActionPanel,
  Action,
  getSelectedText,
  Clipboard,
  showHUD,
  popToRoot,
  Icon,
} from '@raycast/api';
import { RewriteChoice } from './types';
import { fetchFourVersionRewrites } from './engine/ollama';

const RList: any = List;
const RActionPanel: any = ActionPanel;
const RAction: any = Action;

export default function Command() {
  const [sourceText, setSourceText] = useState<string>('');
  const [choices, setChoices] = useState<RewriteChoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('Reading selected text...');

  // Read selected text or clipboard ONCE on initial mount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsLoading(true);
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

      if (!isMounted) return;

      if (!text) {
        setSourceText('Highlight text in any app before opening Spelling Launcher.');
        setIsLoading(false);
        return;
      }

      setSourceText(text);
      setStatusMessage('Rewriting into 4 versions with local Ollama...');

      try {
        const results = await fetchFourVersionRewrites(text);
        if (isMounted) {
          setChoices(results);
        }
      } catch (e: any) {
        if (isMounted) {
          setStatusMessage(`Error: ${e.message || e}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePaste = async (text: string) => {
    await Clipboard.paste(text);
    await showHUD('🚀 Pasted back into active app!');
    await popToRoot();
  };

  return (
    <RList
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder="Select a version and press Enter to Copy..."
    >
      {choices.length === 0 && !isLoading ? (
        <RList.EmptyView
          icon={Icon.Warning}
          title="No text selected"
          description="Highlight a sentence in any app (Chrome, Slack, Notes, etc.) and run Spelling Launcher."
        />
      ) : (
        choices.map((choice) => (
          <RList.Section key={choice.id} title={choice.label}>
            <RList.Item
              key={choice.id}
              title={choice.rewrittenText}
              icon={{ source: choice.icon, tintColor: choice.tintColor }}
              accessories={[
                {
                  text: 'Copy',
                  icon: Icon.Clipboard,
                  tooltip: 'Press Enter to copy to clipboard',
                },
              ]}
              detail={
                <RList.Item.Detail
                  markdown={`# ${choice.label}

> **${choice.rewrittenText}**

---

### 📋 Original Sentence
> ${choice.originalText}

---

${choice.diffMarkdown}

---
*💡 Press **Enter** to Copy to Clipboard, or **Cmd+Enter** to Paste directly into active app.*
`}
                />
              }
              actions={
                <RActionPanel>
                  {/* Primary Action on Enter: Copy to Clipboard */}
                  <RAction.CopyToClipboard
                    title="Copy to Clipboard"
                    content={choice.rewrittenText}
                    icon={Icon.Clipboard}
                  />

                  {/* Secondary Action: Paste into active application */}
                  <RAction
                    title="Paste into Active App"
                    icon={Icon.Check}
                    shortcut={{ modifiers: ['cmd'], key: 'enter' }}
                    onAction={() => handlePaste(choice.rewrittenText)}
                  />

                  {/* Copy Original Text */}
                  <RAction.CopyToClipboard
                    title="Copy Original Text"
                    content={choice.originalText}
                    shortcut={{ modifiers: ['cmd', 'shift'], key: 'c' }}
                    icon={Icon.Document}
                  />
                </RActionPanel>
              }
            />
          </RList.Section>
        ))
      )}
    </RList>
  );
}
