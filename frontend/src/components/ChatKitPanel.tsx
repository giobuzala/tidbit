import type { ChatKitOptions } from "@openai/chatkit";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { useEffect, useRef } from "react";
import {
  CHATKIT_API_DOMAIN_KEY,
  CHATKIT_API_UPLOAD_URL,
  CHATKIT_API_URL,
} from "../lib/config";
import {
  getOrCreateSessionId,
  getStoredThreadId,
  setStoredThreadId,
} from "../lib/session";

const GREETING =
  "Share an article or document. Get a concise summary and key topics instantly.";
const SUBLINE = "Supports news links, PDFs, and Word documents";

const baseOptions: ChatKitOptions = {
  api: {
    url: CHATKIT_API_URL,
    domainKey: CHATKIT_API_DOMAIN_KEY,
    uploadStrategy: {
      type: "direct",
      uploadUrl: CHATKIT_API_UPLOAD_URL,
    },
  },
  theme: {
    colorScheme: "dark",
    radius: "pill",
    density: "normal",
    typography: {
      baseSize: 18,
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
      ],
    },
  },
  composer: {
    placeholder: "Paste a link or attach a document using the + on the left",
    attachments: {
      enabled: true,
      accept: {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
        "application/msword": [".doc"],
      },
      maxCount: 5,
      maxSize: 26214400,
    },
  },
  startScreen: {
    greeting: GREETING,
    prompts: [],
  },
  history: {
    enabled: true,
    showDelete: true,
    showRename: true,
  },
  header: {
    title: { enabled: false },
  },
};

export function ChatKitPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const sessionId = getOrCreateSessionId();
  const initialThread = getStoredThreadId();

  const chatkit = useChatKit({
    ...baseOptions,
    initialThread,
    api: {
      ...baseOptions.api,
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("x-tidbit-session", sessionId);
        return fetch(input, { ...init, headers });
      },
    },
    onThreadChange: ({ threadId }) => {
      setStoredThreadId(threadId ?? null);
    },
  });

  // Inject subline below the greeting text
  useEffect(() => {
    const container = panelRef.current;
    if (!container) return;

    const injectSubline = () => {
      const elements = container.querySelectorAll<HTMLElement>(
        "p, h1, h2, h3, div, span",
      );
      for (const el of elements) {
        if (
          el.textContent?.trim() === GREETING &&
          el.dataset.sublineInjected !== "true"
        ) {
          el.dataset.sublineInjected = "true";
          el.innerHTML =
            `<span class="chatkit-greeting-line">${GREETING}</span>` +
            `<span class="chatkit-greeting-subline">${SUBLINE}</span>`;
          break;
        }
      }
    };

    injectSubline();
    const observer = new MutationObserver(injectSubline);
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={panelRef}
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#212121]"
    >
      <header className="flex flex-col border-b border-[#303030] bg-[#303030] px-6 py-4 text-[#dcdcdc]">
        <h1 className="text-[2.5rem] font-semibold leading-none">tidbit</h1>
        <p className="mt-1 text-base font-normal">bite-sized news summaries</p>
      </header>
      <ChatKit control={chatkit.control} className="block h-full w-full" />
    </div>
  );
}
