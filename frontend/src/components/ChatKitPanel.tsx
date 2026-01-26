import type { ChatKitOptions } from "@openai/chatkit";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { CHATKIT_API_DOMAIN_KEY, CHATKIT_API_URL } from "../lib/config";

const options: ChatKitOptions = {
  api: {
    url: CHATKIT_API_URL,
    domainKey: CHATKIT_API_DOMAIN_KEY,
  },
  theme: {
    colorScheme: "dark",
    radius: "pill",
    density: "normal",
    typography: {
      baseSize: 16,
      fontFamily:
        '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      fontFamilyMono:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
      fontSources: [
        {
          family: "OpenAI Sans",
          src: "https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Regular.woff2",
          weight: 400,
          style: "normal",
          display: "swap",
        },
        // ...and 7 more font sources
      ],
    },
  },
  composer: {
    attachments: {
      // Enable only when api.uploadStrategy is configured.
      enabled: false,
      maxCount: 5,
      maxSize: 10485760,
    },
    tools: [
      {
        id: "search_docs",
        label: "Search docs",
        shortLabel: "Docs",
        placeholderOverride: "Search documentation",
        icon: "book-open",
        pinned: false,
      },
      // ...and 1 more tool
    ],
    models: [
      {
        id: "gpt-5",
        label: "gpt-5",
        description: "Balanced intelligence",
        default: true,
      },
      // ...and 3 more models
    ],
  },
  startScreen: {
    greeting: "",
    prompts: [],
  },
  // Optional fields not shown: locale, initialThread, threadItemActions, header, onClientTool, entities, widgets
};

export function ChatKitPanel() {
  const chatkit = useChatKit(options);

  return (
    <div className="relative pb-8 flex h-[90vh] w-full rounded-2xl flex-col overflow-hidden bg-white shadow-sm transition-colors dark:bg-slate-900">
      <ChatKit control={chatkit.control} className="block h-full w-full" />
    </div>
  );
}
