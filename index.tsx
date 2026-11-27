import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";
import { afterLoadIdle } from "./lib/idle";

// Analytics is never on the critical path: once the page has loaded and the
// main thread is idle, fetch PostHog (~70 KB) and initialise it directly.
// (No React provider: nothing uses PostHog hooks, and swapping a provider in
// around <App /> after mount made React rebuild the whole page mid-use,
// closing any open dialog or preview.)
afterLoadIdle(
  () => {
    const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
    if (!apiKey) return;
    import("posthog-js").then(({ default: posthog }) => {
      posthog.init(apiKey, {
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        defaults: "2025-11-30",
      });
    });
  },
  { delay: 1500 },
);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
