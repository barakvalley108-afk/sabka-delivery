"use client";

import { useEffect } from "react";

type StoreInfo = { id: number; vertical: string };

export default function GroceryExpiryField() {
  useEffect(() => {
    let disposed = false;
    let stores = new Map<number, string>();
    const originalFetch = window.fetch.bind(window);

    function refreshRecoveryButton() {
      if (disposed) return;
      const loading = document.querySelector<HTMLElement>("main.panel-loading");
      if (!loading || loading.querySelector("[data-admin-retry]")) return;

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.adminRetry = "true";
      button.textContent = "↻ Retry";
      button.onclick = () => {
        button.disabled = true;
        button.textContent = "Retrying…";
        window.location.reload();
      };
      loading.appendChild(button);
    }

    function refreshField() {
      if (disposed) return;
      refreshRecoveryButton();

      const form = document.querySelector<HTMLFormElement>("form.catalog-create");
      if (!form) return;

      let label = form.querySelector<HTMLLabelElement>("[data-grocery-expiry-field]");
      if (!label) {
        label = document.createElement("label");
        label.dataset.groceryExpiryField = "true";
        label.className = "grocery-expiry-field";
        label.innerHTML = '<span>Expiry date</span><input name="expiryDate" type="date" /><small>Sirf grocery item ke liye</small>';
        const imagePicker = form.querySelector(".image-picker");
        form.insertBefore(label, imagePicker || form.lastElementChild);
      }

      const storeSelect = form.querySelector<HTMLSelectElement>('select[name="storeId"]');
      const input = label.querySelector<HTMLInputElement>('input[name="expiryDate"]');
      if (!storeSelect || !input) return;

      const isGrocery = stores.get(Number(storeSelect.value))?.toUpperCase() === "GROCERY";
      label.hidden = !isGrocery;
      input.disabled = !isGrocery;
      if (!isGrocery) input.value = "";

      if (!storeSelect.dataset.expiryBound) {
        storeSelect.dataset.expiryBound = "true";
        storeSelect.addEventListener("change", refreshField);
      }
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = String(init?.method || "GET").toUpperCase();
      let itemPayload: Record<string, unknown> | null = null;
      let expiryDate = "";

      if (url.includes("/api/admin/control") && method === "POST" && typeof init?.body === "string") {
        try {
          const parsed = JSON.parse(init.body) as Record<string, unknown>;
          if (parsed.action === "item") {
            itemPayload = parsed;
            expiryDate = document.querySelector<HTMLInputElement>('form.catalog-create input[name="expiryDate"]')?.value || "";
          }
        } catch {
          // Leave unrelated requests unchanged.
        }
      }

      const response = await originalFetch(input, init);

      // Reuse the admin panel's own GET response. Do not send a second heavy
      // /api/admin/control request during startup.
      if (url.includes("/api/admin/control") && method === "GET" && response.ok) {
        void response
          .clone()
          .json()
          .then((data: { stores?: StoreInfo[] }) => {
            if (disposed) return;
            stores = new Map(
              (data.stores || []).map((store) => [Number(store.id), String(store.vertical || "")]),
            );
            refreshField();
          })
          .catch(() => undefined);
      }

      if (itemPayload && expiryDate && response.ok) {
        try {
          const result = (await response.clone().json()) as { itemId?: number };
          if (result.itemId) {
            const expiryResponse = await originalFetch("/api/admin/item-expiry", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemId: result.itemId, expiryDate }),
            });
            if (!expiryResponse.ok) {
              const error = await expiryResponse.json().catch(() => ({ error: "Expiry date save nahi hui" }));
              window.alert(error.error || "Item add hua, lekin expiry date save nahi hui");
            }
          }
        } catch {
          window.alert("Item add hua, lekin expiry date save nahi hui");
        }
      }
      return response;
    };

    const observer = new MutationObserver(refreshField);
    observer.observe(document.body, { childList: true, subtree: true });
    refreshField();

    return () => {
      disposed = true;
      observer.disconnect();
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <style jsx global>{`
      .grocery-expiry-field {
        display: grid;
        gap: 5px;
        min-width: 170px;
        font-size: 12px;
        font-weight: 800;
      }
      .grocery-expiry-field input {
        min-height: 42px;
        border: 1px solid #dfd2ca;
        border-radius: 11px;
        padding: 8px 10px;
        background: #fff;
        color: #2b1c18;
        font: inherit;
      }
      .grocery-expiry-field small {
        color: #80675f;
        font-size: 10px;
        font-weight: 600;
      }
      .grocery-expiry-field[hidden] {
        display: none !important;
      }
      .panel-loading [data-admin-retry] {
        min-width: 130px;
        margin-top: 14px;
        padding: 12px 20px;
        border: 0;
        border-radius: 12px;
        background: #c7181b;
        color: #fff;
        font-weight: 900;
        box-shadow: 0 8px 22px #c7181b33;
      }
      .panel-loading [data-admin-retry]:disabled {
        cursor: wait;
        opacity: 0.7;
      }
    `}</style>
  );
}
