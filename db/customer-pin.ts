import { hex, randomHex } from "./otp-utils";

const encoder = new TextEncoder();

export function normalizeCustomerMobile(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}

export function normalizeCustomerPincode(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 6);
}

export function normalizeCustomerPin(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 4);
}

export function normalizeCustomerName(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
}

export function isValidCustomerMobile(mobile: string) {
  return /^[6-9]\d{9}$/.test(mobile);
}

export function isValidCustomerPincode(pincode: string) {
  return /^\d{6}$/.test(pincode);
}

export function isValidCustomerPin(pin: string) {
  return /^\d{4}$/.test(pin);
}

export function isValidCustomerName(name: string) {
  return name.length >= 2;
}

export function createCustomerPinSalt() {
  return randomHex(16);
}

export async function hashCustomerPin(
  mobile: string,
  pin: string,
  salt: string,
  secret: string,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`sabka-customer-pin:v1:${mobile}:${salt}:${pin}`),
  );

  return hex(new Uint8Array(signature));
}

export function secureTextEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

export function getCustomerRequestMeta(request: Request) {
  return {
    ip:
      request.headers.get("cf-connecting-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "",
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || "",
  };
}
