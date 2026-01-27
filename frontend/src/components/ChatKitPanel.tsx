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

function Logo() {
  return (
    <div className="logo-container">
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <path d="M9 12h6" />
        <path d="M9 16h6" />
      </svg>
    </div>
  );
}

function FormatBadges() {
  return (
    <div className="format-badges">
      <span className="format-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
        URL
      </span>
      <span className="format-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
        </svg>
        PDF
      </span>
      <span className="format-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
        DOC
      </span>
    </div>
  );
}

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

  // Inject format badges below the greeting text
  useEffect(() => {
    const container = panelRef.current;
    if (!container) return;

    const injectBadges = () => {
      const elements = container.querySelectorAll<HTMLElement>(
        "p, h1, h2, h3, div, span",
      );
      for (const el of elements) {
        if (
          el.textContent?.trim() === GREETING &&
          el.dataset.badgesInjected !== "true"
        ) {
          el.dataset.badgesInjected = "true";
          el.classList.add("chatkit-greeting-enhanced");
          el.innerHTML = `
            <span class="chatkit-greeting-line">${GREETING}</span>
            <span class="chatkit-greeting-badges">
              <span class="greeting-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                News Links
              </span>
              <span class="greeting-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                </svg>
                PDFs
              </span>
              <span class="greeting-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
                Word Docs
              </span>
            </span>
          `;
          break;
        }
      }
    };

    injectBadges();
    const observer = new MutationObserver(injectBadges);
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={panelRef}
      className="tidbit-container relative flex h-full w-full flex-col overflow-hidden"
    >
      <header className="tidbit-header">
        <div className="header-content">
          <Logo />
          <div className="header-text">
            <h1 className="header-title">tidbit</h1>
            <p className="header-tagline">bite-sized news summaries</p>
          </div>
        </div>
        <FormatBadges />
      </header>
      <div className="tidbit-chat-area">
        <ChatKit control={chatkit.control} className="block h-full w-full" />
      </div>
    </div>
  );
}
