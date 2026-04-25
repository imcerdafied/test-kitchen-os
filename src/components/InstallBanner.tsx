"use client";

import { useEffect, useState } from "react";

export function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      ("standalone" in navigator && (navigator as any).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("pwa-banner-dismissed");

    if (isIOS && !isStandalone && !dismissed) {
      const timer = setTimeout(() => setShow(true), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 p-4 pb-[env(safe-area-inset-bottom,16px)]"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="mx-auto max-w-md rounded-xl bg-cream-100 border border-cream-300 px-4 py-3 shadow-lg flex items-center gap-3"
        style={{ pointerEvents: "auto" }}
      >
        <span className="text-sm text-terra-700 flex-1">
          Install Test Kitchen — tap{" "}
          <svg
            className="inline w-4 h-4 -mt-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6M12 3v12m0 0l-4-4m4 4l4-4" />
          </svg>{" "}
          then <strong>Add to Home Screen</strong>
        </span>
        <button
          onClick={() => {
            setShow(false);
            localStorage.setItem("pwa-banner-dismissed", "1");
          }}
          className="text-terra-500 hover:text-terra-700 font-medium text-lg leading-none p-1"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
