export const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
export function randomHex(size=16){const bytes=new Uint8Array(size);crypto.getRandomValues(bytes);return hex(bytes);}
export async function sha256(value:string){return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))));}
export async function otpHash(challengeId:string,mobile:string,otp:string,secret:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return hex(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(`${challengeId}:${mobile}:${otp}`))));}
