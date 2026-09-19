// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  List,
  ActionPanel,
  Action,
  getSelectedText,
  Clipboard,
  showHUD,
  showToast,
  Toast,
  popToRoot,
  Icon,
  getPreferenceValues,
  openExtensionPreferences,
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

      // Verify configured Ollama model preference before calling Ollama
      const prefs = getPreferenceValues<{ ollamaModel?: string }>();
      const currentModel = prefs.ollamaModel || 'llama3.2:3b';

      if (currentModel !== 'llama3.2:3b') {
        await showToast({
          style: Toast.Style.Failure,
          title: 'Outdated Ollama model configured',
          message: `The configured model '${currentModel}' is a vision-language model that loads ~12.6 GB. Change it to 'llama3.2:3b' to reclaim memory. Recommended: llama3.2:3b`,
          primaryAction: {
            title: 'Open Preferences',
            shortcut: { modifiers: ['cmd'], key: ',' },
            onAction: () => {
              openExtensionPreferences();
            },
          },
        });
        if (isMounted) {
          setStatusMessage(`Error: Outdated Ollama model '${currentModel}'. Change to 'llama3.2:3b' in Preferences.`);
          setIsLoading(false);
        }
        return;
      }

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

  const handleCopy = async (choice: RewriteChoice) => {
    await Clipboard.copy(choice.rewrittenText);
    await showToast({
      style: Toast.Style.Success,
      title: `Copied rewrite ${choice.versionNumber}`,
      message: choice.label,
    });
  };

  const handlePaste = async (text: string) => {
    await Clipboard.paste(text);
    await showHUD('🚀 Pasted back into active app!');
    await popToRoot();
  };

  return (
    <RList
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder="Select a version and press Enter to copy..."
    >
      {choices.length === 0 && !isLoading ? (
        <RList.EmptyView
          icon={Icon.Warning}
          title={statusMessage.startsWith('Error:') ? 'Outdated Ollama Model' : 'No text selected'}
          description={
            statusMessage.startsWith('Error:')
              ? `${statusMessage} Press Enter or Cmd+, to Open Preferences.`
              : 'Highlight a sentence in any app (Chrome, Slack, Notes, etc.) and run Spelling Launcher.'
          }
          actions={
            <RActionPanel>
              <RAction
                title="Open Extension Preferences"
                icon={Icon.Gear}
                shortcut={{ modifiers: ['cmd'], key: ',' }}
                onAction={openExtensionPreferences}
              />
            </RActionPanel>
          }
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
                  text: 'Copy Result',
                  icon: Icon.Clipboard,
                  tooltip: `Press Enter to copy rewrite ${choice.versionNumber}`,
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
*💡 Press **Enter** to Copy Result, or **Cmd+Shift+Enter** to Paste directly into active app.*
`}
                />
              }
              actions={
                <RActionPanel>
                  {/* Primary Action on Enter: Copy this specific rewrite result */}
                  <RAction
                    title="Copy Result"
                    icon={Icon.Clipboard}
                    onAction={() => handleCopy(choice)}
                  />

                  {/* Secondary Action: Paste into active application */}
                  <RAction
                    title="Paste into Active App"
                    icon={Icon.Check}
                    shortcut={{ modifiers: ['cmd', 'shift'], key: 'enter' }}
                    onAction={() => handlePaste(choice.rewrittenText)}
                  />

                  {/* Copy Original Text */}
                  <RAction
                    title="Copy Original Text"
                    icon={Icon.Document}
                    shortcut={{ modifiers: ['cmd', 'shift'], key: 'c' }}
                    onAction={async () => {
                      await Clipboard.copy(choice.originalText);
                      await showToast({
                        style: Toast.Style.Success,
                        title: 'Copied original text',
                      });
                    }}
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
