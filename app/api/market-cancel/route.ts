import {ensureControlTables} from "../../../db/control-store";
import {cancelPendingPaymentOrder} from "../../../db/payment-orders";

export async function POST(request:Request){
  try{
    const body=await request.json() as {orderCode?:string;mobile?:string};
    const orderCode=body.orderCode?.trim().toUpperCase()||"";
    const mobile=body.mobile?.trim()||"";
    if(!orderCode||!/^\d{10}$/.test(mobile))return Response.json({error:"Valid Order ID aur mobile number daalo"},{status:400});
    const db=await ensureControlTables();
    const order=await db.prepare("SELECT status,created_at createdAt,payment_method paymentMethod,total FROM market_orders WHERE order_code=? AND mobile=?").bind(orderCode,mobile).first<{status:string;createdAt:string;paymentMethod:string;total:number}>();
    if(!order)return Response.json({error:"Order nahi mila"},{status:404});
    if(order.status==="CANCELLED")return Response.json({order:{orderCode,status:"CANCELLED"}});
    if(order.status==="PAYMENT_PENDING"){
      const cancelled=await cancelPendingPaymentOrder(db,orderCode,"Customer cancelled pending online payment");
      return cancelled
        ? Response.json({order:{orderCode,status:"CANCELLED"}})
        : Response.json({error:"Payment status change ho chuka hai"},{status:409});
    }
    if(!["PLACED","ACCEPTED"].includes(order.status))return Response.json({error:"Order confirm ho chuka hai, ab cancel nahi ho sakta"},{status:409});
    const setting=await db.prepare("SELECT value FROM market_settings WHERE key='cancellation_minutes'").first<{value:string}>();if(Date.now()-new Date(order.createdAt).getTime()>Number(setting?.value||5)*60000)return Response.json({error:`Order sirf ${setting?.value||5} minute ke andar cancel ho sakta hai`},{status:409});
    const items=await db.prepare("SELECT variant_id variantId,quantity FROM market_order_items WHERE order_code=?").bind(orderCode).all<{variantId:number;quantity:number}>();
    const updated=await db.prepare("UPDATE market_orders SET status='CANCELLED' WHERE order_code=? AND mobile=? AND status IN ('PLACED','ACCEPTED')").bind(orderCode,mobile).run();
    if(!updated.meta.changes)return Response.json({error:"Order confirm ho chuka hai, ab cancel nahi ho sakta"},{status:409});
    await db.batch([
      ...items.results.map(item=>db.prepare("UPDATE market_variants SET stock_quantity=stock_quantity+? WHERE id=?").bind(item.quantity,item.variantId)),
      db.prepare("UPDATE market_promotions SET uses=max(uses-1,0) WHERE upper(code) IN (SELECT upper(coupon_code) FROM market_coupon_claims WHERE order_code=?)").bind(orderCode),
      db.prepare("UPDATE market_promotions SET is_active=1 WHERE upper(code) IN (SELECT upper(coupon_code) FROM market_single_coupon_claims WHERE order_code=?) AND EXISTS (SELECT 1 FROM market_promotion_rules rules WHERE upper(rules.code)=upper(market_promotions.code) AND rules.auto_pause_after_use=1)").bind(orderCode),
      db.prepare("DELETE FROM market_single_coupon_claims WHERE order_code=?").bind(orderCode),
      db.prepare("DELETE FROM market_coupon_claims WHERE order_code=?").bind(orderCode),
      db.prepare("UPDATE market_reward_offers SET uses=max(uses-1,0) WHERE id IN (SELECT offer_id FROM market_reward_claims WHERE order_code=?)").bind(orderCode),
      db.prepare("DELETE FROM market_reward_claims WHERE order_code=?").bind(orderCode),
      db.prepare("UPDATE market_transactions SET status='REFUNDED' WHERE order_code=? AND type='PAYMENT'").bind(orderCode),
      db.prepare("INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,'CANCELLED','CUSTOMER',?,'Customer cancelled before confirmation')").bind(orderCode,mobile),
      ...(order.paymentMethod==="UPI"?[db.prepare("INSERT INTO market_transactions (order_code,type,method,amount,status,reference) VALUES (?,'REFUND','UPI',?,'PENDING','CUSTOMER-CANCEL')").bind(orderCode,order.total)]:[])
    ]);
    return Response.json({order:{orderCode,status:"CANCELLED"}});
  }catch(error){console.error(error);return Response.json({error:"Order cancel nahi hua. Dobara try karo."},{status:500});}
}
