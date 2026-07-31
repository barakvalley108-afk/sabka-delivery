"use client";

import { useEffect } from "react";

type SavedAddress = {
  recipientName?: string;
  mobile?: string;
  address?: string;
  landmark?: string;
  area?: string;
  pincode?: string;
};

function findCheckoutForm() {
  return document.querySelector<HTMLFormElement>("form.checkout-form");
}

function fieldValue(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  return field?.value?.trim() || "";
}

export default function CheckoutAddressSync() {
  useEffect(() => {
    let saved: SavedAddress | null = null;
    let attachedForm: HTMLFormElement | null = null;

    void fetch("/api/customer-address", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        saved = data?.address || null;
        applySavedAddress();
      })
      .catch(() => undefined);

    function applySavedAddress() {
      const form = findCheckoutForm();
      if (!form || !saved) return;

      const addressField = form.elements.namedItem("address") as HTMLTextAreaElement | null;
      const nameField = form.elements.namedItem("name") as HTMLInputElement | null;
      const mobileField = form.elements.namedItem("mobile") as HTMLInputElement | null;

      if (addressField && !addressField.value && saved.address) {
        addressField.value = saved.address;
        addressField.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (nameField && !nameField.value && saved.recipientName) {
        nameField.value = saved.recipientName;
        nameField.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (mobileField && !mobileField.value && saved.mobile) {
        mobileField.value = saved.mobile;
        mobileField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    function attachSubmitHandler() {
      const form = findCheckoutForm();
      if (!form || form === attachedForm) {
        applySavedAddress();
        return;
      }

      attachedForm = form;
      applySavedAddress();

      form.addEventListener(
        "submit",
        () => {
          const address = fieldValue(form, "address");
          const recipientName = fieldValue(form, "name");
          const area = fieldValue(form, "area") || "Lala Bazar";
          const landmark = fieldValue(form, "landmark");

          if (address.length < 8 || recipientName.length < 2) return;

          void fetch("/api/customer-address", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipientName, address, landmark, area }),
            keepalive: true,
          }).catch(() => undefined);
        },
        { capture: true },
      );
    }

    attachSubmitHandler();
    const observer = new MutationObserver(attachSubmitHandler);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
