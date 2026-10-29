// Retain the product and its images so order snapshots and restoration remain intact.
export async function changeProductDeletion(db,input,deleted,actor,now=Date.now()) {
 if(!input||typeof input.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(input.id)||!Number.isInteger(input.version)||input.version<1)throw Error('Genindlæs produktet før du sletter eller gendanner det.');
 const key='deleted_product:'+input.id;
 const result=await db.batch([
  db.prepare("UPDATE products SET active=0,version=version+1,updated_at=? WHERE id=? AND version=? AND "+(deleted?'NOT ':'')+"EXISTS(SELECT 1 FROM shop_settings WHERE key=?) RETURNING id").bind(now,input.id,input.version,key),
  deleted?db.prepare('INSERT INTO shop_settings (key,value) SELECT ?,? WHERE changes()=1').bind(key,String(now)):db.prepare('DELETE FROM shop_settings WHERE key=? AND changes()=1').bind(key),
  db.prepare('INSERT INTO admin_history (id,entity_id,action,actor,details,created_at) SELECT ?,?,?,?,?,? WHERE changes()=1').bind(crypto.randomUUID(),input.id,deleted?'product_deleted':'product_restored',actor,JSON.stringify({version:input.version,restoredAsDraft:!deleted}),now)
 ]);
 return !!result[0].results?.length;
}
