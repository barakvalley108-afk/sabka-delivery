"use client";

import PwaRegister from "./pwa-register";
import CustomerUiFixes from "./customer-ui-fixes";
import CheckoutEnhancer from "./checkout-enhancer";
import GroceryModern from "./grocery-modern";
import CustomerGuestMode from "./customer-guest-mode";
import SilentStoreSwitch from "./silent-store-switch";

export default function CustomerEnhancers() {
  return (
    <>
      <PwaRegister />
      <CustomerUiFixes />
      <CheckoutEnhancer />
      <GroceryModern />
      <CustomerGuestMode />
      <SilentStoreSwitch />
    </>
  );
}
