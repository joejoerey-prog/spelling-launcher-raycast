const path = require('path');

const mockApi = {
  environment: {
    assetsPath: path.resolve(__dirname, '../../assets'),
  },
  getPreferenceValues: () => ({
    language: 'en_GB',
    ollamaHost: 'http://localhost:11434',
    ollamaModel: 'llama3.2:3b',
  }),
  showHUD: async (msg) => {
    if (globalThis.__raycastHUD) globalThis.__raycastHUD.push(msg);
    return msg;
  },
  showToast: async (opts) => {
    if (globalThis.__raycastToasts) globalThis.__raycastToasts.push(opts);
    return opts;
  },
  Toast: {
    Style: {
      Success: 'SUCCESS',
      Failure: 'FAILURE',
    },
  },
  Clipboard: {
    copy: async (text) => {
      globalThis.__clipboardContent = text;
    },
    paste: async (text) => {
      globalThis.__clipboardPasted = text;
    },
    readText: async () => globalThis.__clipboardContent || '',
  },
  getSelectedText: async () => globalThis.__selectedText || '',
  popToRoot: async () => {},
  openExtensionPreferences: () => {},
  Icon: {
    Clipboard: 'clipboard',
    Document: 'document',
    Check: 'check',
    Heart: 'heart',
    Bolt: 'bolt',
    Book: 'book',
    Warning: 'warning',
    Gear: 'gear',
  },
  Color: {
    Blue: 'blue',
    Green: 'green',
    Orange: 'orange',
    Purple: 'purple',
  },
  List: () => null,
  ActionPanel: () => null,
  Action: Object.assign(() => null, {
    CopyToClipboard: () => null,
  }),
};

module.exports = mockApi;
