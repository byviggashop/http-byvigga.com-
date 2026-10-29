// Keep the original request and audit trail; hide mistakes from operations and revenue.
export async function deleteOrder(db,input,actor,now=Date.now()){
 if(typeof input?.id!=='string'||!/^BV-[A-Z0-9-]{1,80}$/i.test(input.id)||!Number.isInteger(input.version)||input.version<0)throw Error('Genindlæs bestillingen før du sletter.');
 const key='deleted_order:'+input.id;
 await db.prepare("INSERT INTO order_workflow (order_id,notes,version) SELECT id,'',0 FROM orders WHERE id=? ON CONFLICT(order_id) DO NOTHING").bind(input.id).run();
 const result=await db.batch([
 db.prepare('UPDATE order_workflow SET version=version+1 WHERE order_id=? AND version=? AND NOT EXISTS(SELECT 1 FROM shop_settings WHERE key=?) RETURNING order_id').bind(input.id,input.version,key),
 db.prepare('INSERT INTO shop_settings (key,value) SELECT ?,? WHERE changes()=1').bind(key,String(now)),
 db.prepare('INSERT INTO admin_history (id,entity_id,action,actor,details,created_at) SELECT ?,?,?,?,?,? WHERE changes()=1').bind(crypto.randomUUID(),input.id,'order_deleted',actor,JSON.stringify({version:input.version}),now)
 ]);return !!result[0].results?.length;
}
