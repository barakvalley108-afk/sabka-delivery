"use client";

import { useEffect } from "react";

const TIP_KEY = "sabka_delivery_tip";

export default function CheckoutEnhancer() {
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    let selectedTip = Number(sessionStorage.getItem(TIP_KEY) || 0);
    const originalFetch = window.fetch.bind(window);
    let tipBoxMountedFor: HTMLFormElement | null = null;
    let frame = 0;

    const updateTotals = () => {
      const form = document.querySelector<HTMLFormElement>(".checkout-form");
      if (!form) return;

      const payment =
        form.querySelector<HTMLInputElement>('input[name="payment"]:checked')
          ?.value || "COD";

      if (payment === "UPI" && selectedTip !== 0) {
        selectedTip = 0;
        sessionStorage.setItem(TIP_KEY, "0");
      }

      form
        .querySelectorAll<HTMLButtonElement>(".rider-tip-option")
        .forEach((button) => {
          button.classList.toggle(
            "active",
            Number(button.dataset.tip || 0) === selectedTip,
          );
          button.disabled = payment === "UPI";
        });

      const custom = form.querySelector<HTMLInputElement>(".rider-tip-custom");
      if (custom) {
        custom.disabled = payment === "UPI";
        if (selectedTip > 30) custom.value = String(selectedTip);
        else if (document.activeElement !== custom) custom.value = "";
      }

      const note = form.querySelector<HTMLElement>(".rider-tip-note");
      if (note) {
        note.textContent =
          payment === "UPI"
            ? "UPI payment par tip abhi available nahi hai."
            : selectedTip > 0
              ? `₹${selectedTip} poora delivery partner ko milega.`
              : "Tip optional hai aur poora delivery partner ko milega.";
      }

      const totalValue = form.querySelector<HTMLElement>(".checkout-total b");
      if (totalValue) {
        const renderedTotal = Number(
          totalValue.textContent?.replace(/[^0-9.]/g, "") || 0,
        );
        const previousTip = Number(totalValue.dataset.appliedTip || 0);
        const base = Math.max(0, renderedTotal - previousTip);
        totalValue.dataset.appliedTip = String(selectedTip);
        totalValue.textContent = `₹${base + selectedTip}`;
      }

      const placeButton = form.querySelector<HTMLButtonElement>(".place-order");
      if (placeButton && !placeButton.textContent?.includes("Placing")) {
        const match = placeButton.textContent?.match(/₹\s*(\d+(?:\.\d+)?)/);
        const renderedTotal = Number(match?.[1] || 0);
        const previousTip = Number(placeButton.dataset.appliedTip || 0);
        const base = Math.max(0, renderedTotal - previousTip);
        placeButton.dataset.appliedTip = String(selectedTip);
        placeButton.textContent = `Place order · ₹${base + selectedTip}`;
      }
    };

    const buildTipBox = () => {
      const form = document.querySelector<HTMLFormElement>(".checkout-form");
      if (!form) {
        tipBoxMountedFor = null;
        return;
      }

      if (tipBoxMountedFor === form || form.querySelector(".rider-tip-box")) {
        return;
      }

      const payment = form.querySelector("fieldset");
      if (!payment) return;

      const box = document.createElement("section");
      box.className = "rider-tip-box";
      box.innerHTML = `
        <div class="rider-tip-head">
          <span class="rider-tip-icon">🛵</span>
          <div><strong>Delivery partner ko tip</strong><small>Thank you bolne ka ek chhota sa tareeka</small></div>
        </div>
        <div class="rider-tip-options">
          <button type="button" class="rider-tip-option" data-tip="0">No tip</button>
          <button type="button" class="rider-tip-option" data-tip="10">₹10</button>
          <button type="button" class="rider-tip-option" data-tip="20">₹20</button>
          <button type="button" class="rider-tip-option" data-tip="30">₹30</button>
        </div>
        <label class="rider-tip-custom-wrap">Custom tip<input class="rider-tip-custom" inputmode="numeric" maxlength="3" placeholder="₹ amount" /></label>
        <p class="rider-tip-note"></p>`;

      payment.before(box);
      tipBoxMountedFor = form;

      box
        .querySelectorAll<HTMLButtonElement>(".rider-tip-option")
        .forEach((button) => {
          button.addEventListener("click", () => {
            selectedTip = Number(button.dataset.tip || 0);
            sessionStorage.setItem(TIP_KEY, String(selectedTip));
            updateTotals();
          });
        });

      const custom = box.querySelector<HTMLInputElement>(".rider-tip-custom");
      custom?.addEventListener("input", () => {
        const value = Math.min(
          500,
          Math.max(0, Number(custom.value.replace(/\D/g, "")) || 0),
        );
        custom.value = value ? String(value) : "";
        selectedTip = value;
        sessionStorage.setItem(TIP_KEY, String(selectedTip));
        updateTotals();
      });

      form
        .querySelectorAll<HTMLInputElement>('input[name="payment"]')
        .forEach((radio) => radio.addEventListener("change", updateTotals));

      updateTotals();
    };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (
        url.includes("/api/market-orders") &&
        init?.method === "POST" &&
        response.ok &&
        selectedTip > 0
      ) {
        try {
          const requestBody =
            typeof init.body === "string" ? JSON.parse(init.body) : {};
          const responseBody = await response.clone().json();
          const orderCode = responseBody?.order?.orderCode;

          if (orderCode && requestBody.mobile) {
            await originalFetch("/api/order-tip", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderCode,
                mobile: requestBody.mobile,
                tip: selectedTip,
              }),
            });
            selectedTip = 0;
            sessionStorage.removeItem(TIP_KEY);
          }
        } catch {
          // Optional tip update fail hone par original order successful rahega.
        }
      }

      return response;
    };

    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(buildTipBox);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    buildTipBox();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
