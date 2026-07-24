import {ensureControlTables} from "../../../db/control-store";

export async function POST(request:Request){
  const body=await request.json() as {orderCode?:string;mobile?:string};const orderCode=body.orderCode?.trim().toUpperCase()||"";const mobile=body.mobile?.trim()||"";
  if(!orderCode||!/^\d{10}$/.test(mobile))return Response.json({error:"Valid Order ID aur mobile number daalo"},{status:400});
  const db=await ensureControlTables();const order=await db.prepare(`SELECT o.order_code orderCode,o.status,o.total,o.area,o.created_at createdAt,
    s.name storeName,coalesce(ss.section_key,p.vertical,s.type) storeType,
    a.delivery_otp deliveryOtp,r.name riderName,r.phone riderPhone
    FROM market_orders o JOIN market_stores s ON s.id=o.store_id
    LEFT JOIN market_store_sections ss ON ss.store_id=s.id
    LEFT JOIN market_store_profiles p ON p.store_id=s.id
    LEFT JOIN market_delivery_assignments a ON a.order_code=o.order_code
    LEFT JOIN market_riders r ON r.id=a.rider_id
    WHERE o.order_code=? AND o.mobile=?`).bind(orderCode,mobile).first<{orderCode:string;status:string;total:number;area:string;createdAt:string;storeName:string;storeType:string;deliveryOtp?:string;riderName?:string;riderPhone?:string}>();
  if(order?.status==="PLACED")order.status="ACCEPTED";
  return order?Response.json({order}):Response.json({error:"Order nahi mila"},{status:404});
}
