"use client";

import {
  useEffect,
  useState,
  type MouseEventHandler,
} from "react";
import {
  DotLottieReact,
  type DotLottie,
} from "@lottiefiles/dotlottie-react";

type Props = {
  orderCode: string;
  estimatedDelivery: string;
  rewardApplied?: string;
  onTrackOrder: MouseEventHandler<HTMLButtonElement>;
  onContinueShopping: MouseEventHandler<HTMLButtonElement>;
};

export default function OrderSuccess({
  orderCode,
  estimatedDelivery,
  rewardApplied,
  onTrackOrder,
  onContinueShopping,
}: Props) {
  const [player, setPlayer] = useState<DotLottie | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!player) return;
    const markLoaded = () => setLoaded(true);
    const markFailed = () => setFailed(true);
    player.addEventListener("load", markLoaded);
    player.addEventListener("loadError", markFailed);
    player.addEventListener("renderError", markFailed);
    if (player.isLoaded) markLoaded();
    return () => {
      player.removeEventListener("load", markLoaded);
      player.removeEventListener("loadError", markFailed);
      player.removeEventListener("renderError", markFailed);
    };
  }, [player]);

  const showAnimation = !reducedMotion && !failed;

  return (
    <section className="success order-success" aria-live="polite">
      <div className="success-animation" aria-hidden="true">
        {!loaded || !showAnimation ? (
          <span className="success-static-icon">✓</span>
        ) : null}
        {showAnimation ? (
          <DotLottieReact
            src="/animations/success.lottie"
            autoplay
            loop={false}
            dotLottieRefCallback={setPlayer}
            className={loaded ? "success-lottie loaded" : "success-lottie"}
          />
        ) : null}
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
