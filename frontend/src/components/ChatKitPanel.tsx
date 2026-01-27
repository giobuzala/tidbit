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

    const tooltip = document.createElement("div");
    tooltip.className = "chatkit-tooltip";
    tooltip.textContent = "Add files";
    tooltip.dataset.show = "false";
    document.body.appendChild(tooltip);

    let activeTarget: HTMLElement | null = null;

    const isAddFilesTarget = (element: HTMLElement) => {
      const label =
        element.getAttribute("aria-label") ?? element.getAttribute("title") ?? "";
      return label.toLowerCase().includes("add files");
    };

    const findTargetFromEvent = (event: Event) => {
      const path = event.composedPath ? event.composedPath() : [];
      for (const node of path) {
        if (node instanceof HTMLElement && isAddFilesTarget(node)) {
          return node;
        }
      }
      return null;
    };

    const showTooltip = (target: HTMLElement) => {
      activeTarget = target;
      const rect = target.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top}px`;
      tooltip.dataset.show = "true";
    };

    const hideTooltip = () => {
      activeTarget = null;
      tooltip.dataset.show = "false";
    };

    const updateTooltip = () => {
      if (!activeTarget) {
        return;
      }
      showTooltip(activeTarget);
    };

    const handlePointerOver = (event: PointerEvent) => {
      const target = findTargetFromEvent(event);
      if (!target) {
        return;
      }
      target.setAttribute("title", "Add files");
      target.setAttribute("aria-label", "Add files");
      showTooltip(target);
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (!activeTarget) {
        return;
      }
      const related = event.relatedTarget as Node | null;
      if (related && activeTarget.contains(related)) {
        return;
      }
      hideTooltip();
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
      updateStartScreen();
      updateTooltip();
    };

    updateUi();
    const observer = new MutationObserver(updateUi);
    observer.observe(container, { childList: true, subtree: true });
    document.addEventListener("pointerover", handlePointerOver, true);
    document.addEventListener("pointerout", handlePointerOut, true);
    window.addEventListener("scroll", updateTooltip, true);
    window.addEventListener("resize", updateTooltip);

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerover", handlePointerOver, true);
      document.removeEventListener("pointerout", handlePointerOut, true);
      window.removeEventListener("scroll", updateTooltip, true);
      window.removeEventListener("resize", updateTooltip);
      tooltip.remove();
    };
  }, []);

  return (
    <div
      ref={panelRef}
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#212121] transition-colors"
    >
      <div className="flex items-center gap-2 border-b border-[#303030] bg-[#303030] px-6 py-4 text-[#dcdcdc]">
        <div className="flex flex-col">
          <div className="text-[2.5rem] font-semibold leading-none">tidbit</div>
          <div className="mt-1 text-base font-normal">
            bite-sized news summaries
          </div>
        </div>
      </div>
      <ChatKit control={chatkit.control} className="block h-full w-full" />
    </div>
  );
}
