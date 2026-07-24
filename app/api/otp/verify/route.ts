import {ensureMarketTables} from "../../../../db/market-store";
import {otpHash,randomHex,sha256} from "../../../../db/otp-utils";

type Runtime={OTP_SECRET?:string};
export async function POST(request:Request){
  const body=await request.json() as {challengeId?:string;mobile?:string;otp?:string;name?:string};const mobile=body.mobile?.replace(/\D/g,"").slice(-10)||"";const otp=body.otp?.trim()||"";
  if(!body.challengeId||!/^\d{6}$/.test(otp)||!/^\d{10}$/.test(mobile))return Response.json({error:"OTP details valid nahi hain"},{status:400});
  const {env}=await import("cloudflare:workers");const runtime=env as unknown as Runtime;if(!runtime.OTP_SECRET)return Response.json({error:"OTP service unavailable"},{status:503});
  const db=await ensureMarketTables();const challenge=await db.prepare("SELECT * FROM otp_challenges WHERE id=? AND mobile=?").bind(body.challengeId,mobile).first<{otp_hash:string;attempts:number;expires_at:string;consumed_at:string|null}>();
  if(!challenge||challenge.consumed_at||challenge.attempts>=5||new Date(challenge.expires_at).getTime()<Date.now())return Response.json({error:"OTP expired ya invalid hai"},{status:400});
  const candidate=await otpHash(body.challengeId,mobile,otp,runtime.OTP_SECRET);if(candidate!==challenge.otp_hash){await db.prepare("UPDATE otp_challenges SET attempts=attempts+1 WHERE id=?").bind(body.challengeId).run();return Response.json({error:"OTP incorrect hai"},{status:400});}
  await db.prepare("UPDATE otp_challenges SET consumed_at=CURRENT_TIMESTAMP WHERE id=?").bind(body.challengeId).run();await db.prepare("INSERT INTO market_users (mobile,name) VALUES (?,?) ON CONFLICT(mobile) DO UPDATE SET name=COALESCE(excluded.name,market_users.name)").bind(mobile,body.name?.trim()||null).run();const user=await db.prepare("SELECT id,mobile,name FROM market_users WHERE mobile=?").bind(mobile).first<{id:number;mobile:string;name:string|null}>();
  const token=randomHex(32);const tokenHash=await sha256(token);await db.prepare("INSERT INTO market_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)").bind(tokenHash,user!.id,new Date(Date.now()+30*86400000).toISOString()).run();
  const headers=new Headers();
  headers.append("Set-Cookie",`sabka_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`);
  headers.append("Set-Cookie","apna_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
  return Response.json({user},{headers});
}
