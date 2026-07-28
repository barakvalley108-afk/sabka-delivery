"use client";

import {
  createElement,
  useEffect,
  useState,
  type MouseEventHandler,
} from "react";

type Props = {
  reason: string;
  onTryAgain: MouseEventHandler<HTMLButtonElement>;
  onContinueShopping: MouseEventHandler<HTMLButtonElement>;
};

const PLAYER_SCRIPT_ID = "dotlottie-web-component-script";

export default function OrderFailed({
  reason,
  onTryAgain,
  onContinueShopping,
}: Props) {
  const [playerReady, setPlayerReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

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

  return (
    <section className="failed order-failed" aria-live="assertive">
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

      <h3>Order Place Nahi Hua</h3>
      <p className="failed-reason">
        {reason || "Order place nahi hua. Dobara try karo."}
      </p>

      <div className="failed-actions">
        <button type="button" onClick={onTryAgain}>
          Try Again
        </button>

        <button type="button" onClick={onContinueShopping}>
          Continue Shopping
        </button>
      </div>
    </section>
  );
}
