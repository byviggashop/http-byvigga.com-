export function productImages(value,cover){try{const images=typeof value==='string'?JSON.parse(value):value;if(Array.isArray(images)&&images.length&&images.every(x=>typeof x==='string'))return [...new Set(images)];}catch{}return cover?[cover]:[];}
export function productRow(row){return {id:row.id,slettet:!!row.deleted,navn:row.name,kategori:row.category,pris:row.price/100,antal:row.quantity,billede:productImages(row.images_json,row.image)[0]||row.image,billeder:productImages(row.images_json,row.image),beskrivelse:row.description,maal:row.measurements,aktiv:!!row.active,version:row.version,oprettet:row.created_at==null?null:new Date(row.created_at).toISOString(),dato:new Date(row.updated_at).toISOString()};}
export async function getProducts(db, fallback, includeInactive=false,includeDeleted=false){
 const ready=await db.prepare("SELECT value FROM shop_settings WHERE key = 'catalog_ready'").first();
 if(!ready)return fallback.map(p=>({...p,billeder:productImages(p.billeder,p.billede),antal:null,aktiv:true,version:0}));
 const result=await db.prepare("SELECT products.*, (SELECT MIN(created_at) FROM admin_history WHERE entity_id=products.id AND action='product_created') AS created_at, EXISTS(SELECT 1 FROM shop_settings WHERE key='deleted_product:' || products.id) AS deleted FROM products WHERE 1=1"+(includeInactive?'':' AND active = 1')+(includeDeleted?'':" AND NOT EXISTS(SELECT 1 FROM shop_settings WHERE key='deleted_product:' || products.id)")+' ORDER BY updated_at DESC').all();
 return result.results.map(productRow);
}

// Initialize the preserved starter catalog once, before the owner edits it.
export async function ensureProductCatalog(db,fallback,now=Date.now()){
 const ready=await db.prepare("SELECT value FROM shop_settings WHERE key = 'catalog_ready'").first();if(ready)return;
 const statements=fallback.map(p=>{const images=productImages(p.billeder,p.billede);return db.prepare('INSERT INTO products (id,name,category,price,quantity,image,images_json,description,measurements,active,version,updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,1,?) ON CONFLICT(id) DO NOTHING').bind(p.id,p.navn,p.kategori,Math.round(p.pris*100),null,images[0],JSON.stringify(images),p.beskrivelse,p.maal,now)});
 await db.batch([...statements,db.prepare("INSERT INTO shop_settings (key,value) VALUES ('catalog_ready','1') ON CONFLICT(key) DO NOTHING")]);
}
