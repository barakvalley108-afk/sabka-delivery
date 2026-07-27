"use client";

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
} from "react";

type Props = {
  title?: string;
  reason: string;
  onClose: MouseEventHandler<HTMLButtonElement>;
  onRetry?: MouseEventHandler<HTMLButtonElement>;
  retryText?: string;
};

const PLAYER_SCRIPT_ID = "dotlottie-web-component-script";

export default function OrderFailed({
  title = "Action Failed",
  reason,
  onClose,
  onRetry,
  retryText = "Try Again",
}: Props) {
  const [playerReady, setPlayerReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotionPreference = () => {
      setReducedMotion(media.matches);
    };

    updateMotionPreference();
    media.addEventListener?.("change", updateMotionPreference);

    return () => {
      media.removeEventListener?.("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setPlayerReady(false);
      return;
    }

    if (window.customElements.get("dotlottie-wc")) {
      setPlayerReady(true);
      return;
    }

    const markReady = () => {
      window.customElements
        .whenDefined("dotlottie-wc")
        .then(() => setPlayerReady(true))
        .catch(() => setPlayerReady(false));
    };

    let script = document.getElementById(
      PLAYER_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = PLAYER_SCRIPT_ID;
      script.type = "module";
      script.src =
        "https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-wc@latest/dist/dotlottie-wc.js";

      script.addEventListener("load", markReady, { once: true });
      script.addEventListener(
        "error",
        () => setPlayerReady(false),
        { once: true },
      );

      document.head.appendChild(script);
    } else {
      markReady();
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (soundPlayedRef.current) {
      return;
    }

    soundPlayedRef.current = true;

    const failedSound = new Audio("/order-failed.mp3");
    failedSound.volume = 0.7;
    failedSound.currentTime = 0;

    failedSound.play().catch(() => {
      // Browser autoplay block hone par popup phir bhi kaam karega.
    });

    return () => {
      failedSound.pause();
      failedSound.currentTime = 0;
    };
  }, []);

  return (
    <section
      className="failed order-failed"
      role="alertdialog"
      aria-live="assertive"
      aria-modal="true"
      aria-labelledby="order-failed-title"
      aria-describedby="order-failed-reason"
    >
      <div className="failed-animation" aria-hidden="true">
        {!reducedMotion && playerReady
          ? createElement("dotlottie-wc", {
              src: "/animations/Failed.lottie",
              autoplay: true,
              style: {
                display: "block",
                width: "180px",
                height: "180px",
                margin: "0 auto",
              },
            })
          : <span className="failed-static-icon">!</span>}
      </div>

      <h3 id="order-failed-title">{title}</h3>

      <p id="order-failed-reason" className="failed-reason">
        {reason}
      </p>

      <div className="failed-actions">
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            {retryText}
          </button>
        ) : null}

        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </section>
  );
}
