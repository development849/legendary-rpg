import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const SESSION_KEY = "legendaryrpg_sid";
const originalFetch = window.fetch.bind(window);
window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const sid = localStorage.getItem(SESSION_KEY);
    if (sid) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/")) {
        const headers = new Headers(init?.headers);
        if (!headers.has("X-Session-Id")) {
          headers.set("X-Session-Id", sid);
        }
        return originalFetch(input, { ...init, headers });
      }
    }
  } catch {}
  return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
