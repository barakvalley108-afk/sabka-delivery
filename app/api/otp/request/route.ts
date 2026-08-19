import {ensureMarketTables} from "../../../../db/market-store";
import {otpHash,randomHex} from "../../../../db/otp-utils";

type Runtime={
  DB:D1Database;
  OTP_SECRET?:string;
  SMS_BITS_API_ID?:string;
  SMS_BITS_SENDER_ID?:string;
  SMS_BITS_DLT_ID?:string;
  SMS_BITS_TEMPLATE_ID?:string;
  SMS_BITS_API_URL?:string;
};

function buildSmsBitsUrl(runtime:Runtime,mobile:string,message:string){
  if(!runtime.SMS_BITS_API_ID||!runtime.SMS_BITS_SENDER_ID||!runtime.SMS_BITS_DLT_ID||!runtime.SMS_BITS_TEMPLATE_ID)return null;
  const params=new URLSearchParams({
    id:runtime.SMS_BITS_API_ID,
    senderid:runtime.SMS_BITS_SENDER_ID,
    to:mobile,
    msg:message,
    port:"TA",
    dltid:runtime.SMS_BITS_DLT_ID,
    tempid:runtime.SMS_BITS_TEMPLATE_ID,
  });
  return `${runtime.SMS_BITS_API_URL||"https://app.smsbits.in/api/web"}?${params.toString()}`;
}

export async function POST(request:Request){
  const body=await request.json() as {mobile?:string};
  const mobile=body.mobile?.replace(/\D/g,"").slice(-10)||"";
  if(!/^[6-9]\d{9}$/.test(mobile))return Response.json({error:"Valid 10-digit mobile number daalo"},{status:400});

  const {env}=await import("cloudflare:workers");
  const runtime=env as unknown as Runtime;
  if(!runtime.OTP_SECRET)return Response.json({error:"OTP service abhi connect nahi hai"},{status:503});

  const db=await ensureMarketTables();
  const recent=await db.prepare("SELECT COUNT(*) count FROM otp_challenges WHERE mobile=? AND created_at>datetime('now','-10 minutes')").bind(mobile).first<{count:number}>();
  if((recent?.count||0)>=3)return Response.json({error:"Bahut OTP request hue. 10 minute baad try karo."},{status:429});

  const challengeId=randomHex(12);
  const otp=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,"0");
  const hash=await otpHash(challengeId,mobile,otp,runtime.OTP_SECRET);
  const expires=new Date(Date.now()+5*60000).toISOString();
  await db.prepare("INSERT INTO otp_challenges (id,mobile,otp_hash,expires_at) VALUES (?,?,?,?)").bind(challengeId,mobile,hash,expires).run();

  const message=`Your SABKA DELIVERY login OTP is ${otp}. Valid for 5 minutes.`;
  const smsUrl=buildSmsBitsUrl(runtime,mobile,message);
  if(!smsUrl)return Response.json({error:"SMS BITS configuration incomplete hai"},{status:503});

  const sms=await fetch(smsUrl,{method:"GET"});
  if(!sms.ok){
    await db.prepare("DELETE FROM otp_challenges WHERE id=?").bind(challengeId).run();
    return Response.json({error:"OTP send nahi hua"},{status:502});
  }

  return Response.json({challengeId,expiresIn:300});
}
