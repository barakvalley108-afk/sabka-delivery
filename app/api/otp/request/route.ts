import {ensureMarketTables} from "../../../../db/market-store";
import {otpHash,randomHex} from "../../../../db/otp-utils";

type Runtime={DB:D1Database;OTP_SECRET?:string;SMS_WEBHOOK_URL?:string;SMS_TOKEN?:string};
export async function POST(request:Request){
  const body=await request.json() as {mobile?:string};const mobile=body.mobile?.replace(/\D/g,"").slice(-10)||"";
  if(!/^[6-9]\d{9}$/.test(mobile))return Response.json({error:"Valid 10-digit mobile number daalo"},{status:400});
  const {env}=await import("cloudflare:workers");const runtime=env as unknown as Runtime;
  if(!runtime.SMS_WEBHOOK_URL||!runtime.OTP_SECRET)return Response.json({error:"OTP SMS service abhi connect nahi hai"},{status:503});
  const db=await ensureMarketTables();const recent=await db.prepare("SELECT COUNT(*) count FROM otp_challenges WHERE mobile=? AND created_at>datetime('now','-10 minutes')").bind(mobile).first<{count:number}>();if((recent?.count||0)>=3)return Response.json({error:"Bahut OTP request hue. 10 minute baad try karo."},{status:429});
  const challengeId=randomHex(12);const otp=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,"0");const hash=await otpHash(challengeId,mobile,otp,runtime.OTP_SECRET);const expires=new Date(Date.now()+5*60000).toISOString();
  await db.prepare("INSERT INTO otp_challenges (id,mobile,otp_hash,expires_at) VALUES (?,?,?,?)").bind(challengeId,mobile,hash,expires).run();
  const sms=await fetch(runtime.SMS_WEBHOOK_URL,{method:"POST",headers:{"Content-Type":"application/json",...(runtime.SMS_TOKEN?{Authorization:`Bearer ${runtime.SMS_TOKEN}`}:{})},body:JSON.stringify({mobile:`+91${mobile}`,message:`Your SABKA DELIVERY login OTP is ${otp}. Valid for 5 minutes.`})});
  if(!sms.ok)return Response.json({error:"OTP send nahi hua"},{status:502});
  return Response.json({challengeId,expiresIn:300});
}
