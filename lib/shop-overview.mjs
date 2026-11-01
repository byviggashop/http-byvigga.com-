export const SHOP_TIMEZONE='Europe/Copenhagen';
const dayFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:SHOP_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'});
export function shopDay(timestamp){return dayFormatter.format(new Date(timestamp));}
export function periodDays(days=30,now=Date.now()){
 if(![7,30,90].includes(days))throw Error('Vælg 7, 30 eller 90 dage.');
 const today=shopDay(now),end=Date.parse(today+'T12:00:00Z');
 return Array.from({length:days},(_,i)=>new Date(end-(days-1-i)*86400000).toISOString().slice(0,10));
}
export function orderGoodsOre(payload){
 if(payload?.pricePending||!Array.isArray(payload?.items)||!payload.items.length)return null;
 let sum=0;for(const item of payload.items){if(item.pricePending||!Number.isFinite(item.unitPrice)||item.unitPrice<0||!Number.isInteger(item.qty)||item.qty<1)return null;sum+=Math.round(item.unitPrice*100)*item.qty;}
 return Number.isSafeInteger(sum)?sum:null;
}
export function summarizeRevenue(orders,days=30,now=Date.now()){
 const keys=periodDays(days,now),daily=new Map(keys.map(day=>[day,0]));
 let revenueOre=0,paidOrders=0,pendingOre=0,pendingOrders=0,unpricedPaidOrders=0,unpricedPendingOrders=0;
 for(const order of orders){let payload;try{payload=typeof order.payload==='string'?JSON.parse(order.payload):order.payload}catch{payload=null}
  const amount=orderGoodsOre(payload);
  if(order.paid_at){if(order.paid_at>now||!daily.has(shopDay(order.paid_at)))continue;paidOrders++;if(amount===null){unpricedPaidOrders++;continue;}revenueOre+=amount;const day=shopDay(order.paid_at);daily.set(day,daily.get(day)+amount);}
  else if(!order.cancelled_at&&order.mail_status==='accepted'&&order.created_at<=now&&daily.has(shopDay(order.created_at))){pendingOrders++;if(amount===null)unpricedPendingOrders++;else pendingOre+=amount;}
 }
 return {revenueOre,paidOrders,pendingOre,pendingOrders,unpricedPaidOrders,unpricedPendingOrders,daily:[...daily].map(([day,amountOre])=>({day,amountOre}))};
}
export async function readOverview(db,days=30,now=Date.now()){
 const keys=periodDays(days,now),start=Date.parse(keys[0]+'T00:00:00Z')-86400000;
 const [orders,ranked,first]=await Promise.all([
  db.prepare('SELECT o.payload,o.created_at,o.mail_status,w.paid_at,w.cancelled_at FROM orders o LEFT JOIN order_workflow w ON o.id=w.order_id WHERE NOT EXISTS(SELECT 1 FROM shop_settings WHERE key=\'deleted_order:\' || o.id) AND ((w.paid_at>=? AND w.paid_at<=?) OR (w.paid_at IS NULL AND o.created_at>=? AND o.created_at<=?))').bind(start,now,start,now).all(),
  db.prepare("SELECT v.product_id AS id,p.name,p.image,EXISTS(SELECT 1 FROM shop_settings WHERE key='deleted_product:' || v.product_id) AS deleted,SUM(v.views) AS views FROM product_daily_views v LEFT JOIN products p ON p.id=v.product_id WHERE v.day>=? AND v.day<=? GROUP BY v.product_id ORDER BY views DESC,v.product_id LIMIT 5").bind(keys[0],keys.at(-1)).all(),
  db.prepare('SELECT MIN(day) AS day FROM product_daily_views').first()
 ]);
 return {...summarizeRevenue(orders.results,days,now),days,startDay:keys[0],endDay:keys.at(-1),generatedAt:now,firstViewDay:first?.day||null,topProducts:ranked.results.map(row=>({id:row.id,name:row.name||'Tidligere produkt',image:row.image||null,deleted:!!row.deleted,views:Number(row.views)}))};
}
// Short-lived, in-memory throttling only. No visitor IDs, cookies or IP addresses are stored in D1.
const recent=new Map();
export function allowView(request,now=Date.now()){
 const key=request.headers.get('cf-connecting-ip')||'unknown';let entry=recent.get(key);
 if(!entry||entry.until<=now){entry={until:now+60000,count:0};recent.set(key,entry);}
 if(recent.size>2048){for(const [ip,value]of recent){if(value.until<=now)recent.delete(ip);}if(recent.size>2048)recent.delete(recent.keys().next().value);}
 return ++entry.count<=60;
}
export async function recordProductView(request,env,catalog,now=Date.now(),limit=allowView){
 const reply=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply({error:'Ugyldig metode.'},405);
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Ugyldig oprindelse.'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Ugyldigt format.'},415);
 let data;try{const text=await request.text();if(text.length>200)return reply({error:'For stor forespørgsel.'},413);data=JSON.parse(text)}catch{return reply({error:'Ugyldigt format.'},400)}
 if(typeof data?.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(data.id))return reply({error:'Ugyldigt produkt.'},400);
 if(!catalog.some(product=>product.id===data.id&&product.aktiv!==false))return reply({error:'Produktet findes ikke.'},404);
 if(!limit(request,now))return reply({error:'Prøv igen senere.'},429);
 const day=shopDay(now);
 await env.DB.prepare('INSERT INTO product_daily_views (key,product_id,day,views) VALUES (?,?,?,1) ON CONFLICT(key) DO UPDATE SET views=views+1').bind(day+':'+data.id,data.id,day).run();
 return reply({ok:true});
}
