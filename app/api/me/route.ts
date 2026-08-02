import {ensureMarketTables} from "../../../db/market-store";
import {sha256} from "../../../db/otp-utils";

export async function GET(request:Request){
  const cookie=request.headers.get("cookie")||"";
  const token=cookie.match(/(?:^|; )sabka_session=([^;]+)/)?.[1]||cookie.match(/(?:^|; )apna_session=([^;]+)/)?.[1];
  if(!token)return Response.json({user:null,sessionInvalid:false});
  const db=await ensureMarketTables();
  const hash=await sha256(token);
  const user=await db.prepare("SELECT u.id,u.mobile,u.name FROM market_sessions s JOIN market_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP").bind(hash).first();
  if(user)return Response.json({user,sessionInvalid:false});
  const headers=new Headers();
  headers.append("Set-Cookie","sabka_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
  headers.append("Set-Cookie","apna_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
  return Response.json({user:null,sessionInvalid:true,reason:"ANOTHER_DEVICE"},{headers});
}
