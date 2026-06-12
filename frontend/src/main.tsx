import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully intercept benign development WebSocket or HMR connection failures 
// in the sandboxed preview container to keep the interface pristine and uninterrupted.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const errorMsg = event.reason?.message || event.reason?.toString() || "";
    if (
      errorMsg.includes("WebSocket") || 
      errorMsg.includes("websocket") || 
      errorMsg.includes("vite") || 
      errorMsg.includes("HMR")
    ) {
      console.warn("Caught and suppressed benign container WebSocket rejection:", errorMsg);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener("error", (event) => {
    const errorMsg = event.message || "";
    if (
      errorMsg.includes("WebSocket") || 
      errorMsg.includes("websocket") || 
      errorMsg.includes("vite") || 
      errorMsg.includes("HMR")
    ) {
      console.warn("Caught and suppressed benign container WebSocket error:", errorMsg);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
