const SESSION_KEY = "tidbit-session-id";
const THREAD_KEY = "tidbit-thread-id";

const generateSessionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sid_${Math.random().toString(36).slice(2)}`;
};

export const getOrCreateSessionId = () => {
  if (typeof window === "undefined") {
    return "server";
  }
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }
  const fresh = generateSessionId();
  window.sessionStorage.setItem(SESSION_KEY, fresh);
  return fresh;
};

export const getStoredThreadId = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage.getItem(THREAD_KEY);
};

export const setStoredThreadId = (threadId: string | null) => {
  if (typeof window === "undefined") {
    return;
  }
  if (!threadId) {
    window.sessionStorage.removeItem(THREAD_KEY);
    return;
  }
  window.sessionStorage.setItem(THREAD_KEY, threadId);
};
