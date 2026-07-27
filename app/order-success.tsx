"use client";

import {
  createElement,
  useEffect,
  useState,
  type MouseEventHandler,
} from "react";

type Props = {
  orderCode: string;
  estimatedDelivery: string;
  rewardApplied?: string;
  onTrackOrder: MouseEventHandler<HTMLButtonElement>;
  onContinueShopping: MouseEventHandler<HTMLButtonElement>;
};

const PLAYER_SCRIPT_ID = "dotlottie-web-component-script";

export default function OrderSuccess({
  orderCode,
  estimatedDelivery,
  rewardApplied,
  onTrackOrder,
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
    <section className="success order-success" aria-live="polite">
      <div className="success-animation" aria-hidden="true">
        {!reducedMotion && playerReady
          ? createElement("dotlottie-wc", {
              src: "/animations/success.lottie",
              autoplay: true,
              style: {
                display: "block",
                width: "180px",
                height: "180px",
                margin: "0 auto",
              },
            })
          : (
              <span className="success-static-icon">✓</span>
            )}
      </div>

      <h3>Order Placed Successfully</h3>

      <p>
        Order ID: <b>{orderCode}</b>
      </p>

      <p>
        Estimated delivery: <b>{estimatedDelivery || "25-35 min"}</b>
      </p>

      {rewardApplied ? (
        <p className="reward-success">★ {rewardApplied} applied</p>
      ) : null}

      <div className="success-actions">
        <button type="button" onClick={onTrackOrder}>
          Track Order
        </button>

        <button type="button" onClick={onContinueShopping}>
          Continue Shopping
        </button>
      </div>
    </section>
  );
}
