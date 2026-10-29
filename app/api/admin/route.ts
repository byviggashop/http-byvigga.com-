import {deleteOrder} from '../../../lib/order-deletion.mjs';
import {env} from 'cloudflare:workers';
import fallback from '../../../data/smykker.json';
import {getProducts,ensureProductCatalog} from '../../../lib/products.mjs';
import {adminAllowed,adminJson as json,validateProduct,workflowUpdate} from '../../../lib/admin-service.mjs';
import {changeProductDeletion} from '../../../lib/product-deletion.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(!adminAllowed(request,env))return json({error:'Adgang kræver ejerlogin.'},403);
 try{await ensureProductCatalog(env.DB,fallback);const products=await getProducts(env.DB,fallback,true,true);const orders=await env.DB!.prepare('SELECT o.*, w.payment_mail_at, w.paid_at, w.fulfilled_at, w.notes AS workflow_notes, w.version AS workflow_version FROM orders o LEFT JOIN order_workflow w ON o.id = w.order_id WHERE NOT EXISTS(SELECT 1 FROM shop_settings WHERE key=\'deleted_order:\' || o.id) ORDER BY o.created_at DESC LIMIT 500').all();const history=await env.DB!.prepare('SELECT * FROM admin_history ORDER BY created_at DESC LIMIT 300').all();return json({products,orders:orders.results.map((o:any)=>({...o,payload:JSON.parse(o.payload)})),history:history.results})}catch{return json({error:'Overblikket kunne ikke hentes.'},503)}
}
export async function POST(request:Request){
 if(!adminAllowed(request,env))return json({error:'Adgang kræver ejerlogin.'},403);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Ugyldig oprindelse.'},403);
 let data:any;try{const raw=await request.text();if(raw.length>16000)return json({error:'For stor forespørgsel.'},413);data=JSON.parse(raw)}catch{return json({error:'Ugyldigt format.'},400)}
 const db=env.DB!,now=Date.now(),actor=request.headers.get('oai-authenticated-user-email')!;
 try{
  await ensureProductCatalog(db,fallback);
  const history=(id:string,action:string,details:unknown)=>db.prepare('INSERT INTO admin_history (id,entity_id,action,actor,details,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),id,action,actor,JSON.stringify(details),now);
  if(data.action==='delete_order'){const ok=await deleteOrder(db,data,actor,now);return ok?json({ok:true}):json({error:'Bestillingen er ændret eller allerede slettet. Genindlæs og prøv igen.'},409);}
  if(data.action==='import'){
   const statements=fallback.map(p=>db.prepare('INSERT INTO products (id,name,category,price,quantity,image,description,measurements,active,version,updated_at) VALUES (?,?,?,?,?,?,?,?,1,1,?) ON CONFLICT(id) DO NOTHING').bind(p.id,p.navn,p.kategori,Math.round(p.pris*100),null,p.billede.startsWith('assets/products/')?p.billede:'assets/brand/icon-'+({'Halskæder':'necklace','Øreringe':'earrings'} as any)[p.kategori]+'.svg',p.beskrivelse,p.maal,now));
   await db.batch([...statements,db.prepare("INSERT INTO shop_settings (key,value) VALUES ('catalog_ready','1') ON CONFLICT(key) DO NOTHING"),history('catalog','import',{})]);return json({ok:true});
  }
  if(data.action==='delete_product'||data.action==='restore_product'){
   const ok=await changeProductDeletion(db,data,data.action==='delete_product',actor,now);
   return ok?json({ok:true}):json({error:'Produktet er ændret eller allerede slettet/gendannet. Genindlæs og prøv igen.'},409);
  }
  if(data.action==='product'){
   const p=validateProduct(data.product);const ready=await db.prepare("SELECT value FROM shop_settings WHERE key='catalog_ready'").first();if(!ready)return json({error:'Produktkartoteket er ikke klar. Genindlæs administrationen.'},409);
   if(p.version===0){await db.batch([db.prepare('INSERT INTO products (id,name,category,price,quantity,image,images_json,description,measurements,active,version,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,?)').bind(p.id,p.navn.trim(),p.kategori,Math.round(p.pris*100),p.antal,p.billede,JSON.stringify(p.billeder),p.beskrivelse,p.maal,p.aktiv?1:0,now),history(p.id,'product_created',p)]);}
   else{const result=await db.prepare('UPDATE products SET name=?,category=?,price=?,quantity=?,image=?,images_json=?,description=?,measurements=?,active=?,version=version+1,updated_at=? WHERE id=? AND version=? AND NOT EXISTS(SELECT 1 FROM shop_settings WHERE key=\'deleted_product:\' || products.id) RETURNING id').bind(p.navn.trim(),p.kategori,Math.round(p.pris*100),p.antal,p.billede,JSON.stringify(p.billeder),p.beskrivelse,p.maal,p.aktiv?1:0,now,p.id,p.version).first();if(!result)return json({error:'Produktet er ændret andetsteds. Genindlæs og prøv igen.'},409);await history(p.id,'product_updated',p).run();}return json({ok:true});
  }
  if(data.action==='workflow'||data.action==='notes'){
   const order=await db.prepare('SELECT id FROM orders WHERE id=? AND NOT EXISTS(SELECT 1 FROM shop_settings WHERE key=\'deleted_order:\' || orders.id)').bind(data.id).first();if(!order)return json({error:'Ordren findes ikke.'},404);
   await db.prepare("INSERT INTO order_workflow (order_id,notes,version) VALUES (?,'',0) ON CONFLICT(order_id) DO NOTHING").bind(data.id).run();
   const current:any=await db.prepare('SELECT * FROM order_workflow WHERE order_id=?').bind(data.id).first();if(current.version!==data.version)return json({error:'Ordren er ændret. Genindlæs.'},409);
   const next=data.action==='workflow'?workflowUpdate(current,data.step,now):current;
   const notes=data.action==='notes'?data.notes:current.notes;if(typeof notes!=='string'||notes.length>5000)throw Error('Noten er for lang.');
   const updated=await db.prepare('UPDATE order_workflow SET payment_mail_at=?,paid_at=?,fulfilled_at=?,notes=?,version=version+1 WHERE order_id=? AND version=? RETURNING order_id').bind(next.payment_mail_at??null,next.paid_at??null,next.fulfilled_at??null,notes,data.id,current.version).first();if(!updated)return json({error:'Ordren er ændret. Genindlæs.'},409);
   await history(data.id,data.action==='notes'?'notes_updated':data.step,{notes,at:now}).run();return json({ok:true});
  }
  return json({error:'Ukendt handling.'},400);
 }catch(error:any){return json({error:error.message?.includes('UNIQUE')?'Produkt-ID findes allerede.':error.message?.startsWith('D1')?'Ændringen kunne ikke gemmes.':error.message||'Ændringen kunne ikke gemmes.'},400)}
}
