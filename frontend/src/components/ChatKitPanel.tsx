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

const startScreenGreeting =
  "Share an article or document. I’ll summarize it and extract keywords.";
const startScreenSubline = "Supports news links, PDFs, and Word documents";

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
    placeholder:
      "Paste a link or attach a document using the + on the left",
    attachments: {
      enabled: true,
      accept: {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
          ".docx",
        ],
        "application/msword": [".doc"],
      },
      maxCount: 5,
      maxSize: 26214400,
    },
  },
  startScreen: {
    greeting: startScreenGreeting,
    prompts: [],
  },
  history: {
    enabled: true,
    showDelete: true,
    showRename: true,
  },
  header: {
    title: {
      enabled: false,
    },
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

  useEffect(() => {
    const container = panelRef.current;
    if (!container) {
      return;
    }

    const updateTooltip = () => {
      const addFilesButton = container.querySelector<HTMLButtonElement>(
        'button[aria-label*="Add files"], button[aria-label*="add files"]',
      );

      if (addFilesButton) {
        addFilesButton.setAttribute("data-tooltip", "Add files");
        addFilesButton.setAttribute("title", "Add files");
      }
    };

    const updateStartScreen = () => {
      const candidates = Array.from(
        container.querySelectorAll<HTMLElement>("p, h1, h2, h3, div, span"),
      );
      const greetingElement = candidates.find(
        (element) => element.textContent?.trim() === startScreenGreeting,
      );

      if (greetingElement && greetingElement.dataset.sublineInjected !== "true") {
        greetingElement.dataset.sublineInjected = "true";
        greetingElement.innerHTML =
          `<span class="chatkit-greeting-line">${startScreenGreeting}</span>` +
          `<span class="chatkit-greeting-subline">${startScreenSubline}</span>`;
      }
    };

    const updateUi = () => {
      updateTooltip();
      updateStartScreen();
    };

    updateUi();
    const observer = new MutationObserver(updateUi);
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={panelRef}
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#212121] transition-colors"
    >
      <div className="flex items-center gap-2 border-b border-[#303030] bg-[#303030] px-6 py-4 text-[#dcdcdc]">
        <div className="flex flex-col">
          <div className="text-[2.5rem] font-semibold">tidbit</div>
          <div className="text-base font-normal">bite-sized news summaries</div>
        </div>
      </div>
      <ChatKit control={chatkit.control} className="block h-full w-full" />
    </div>
  );
}
