import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {deleteOrder} from '../lib/order-deletion.mjs';
import {readOverview} from '../lib/shop-overview.mjs';
function setup(){const sql=new DatabaseSync(':memory:');for(const f of ['0000_lumpy_alice.sql','0001_','0002_']){const name=f.endsWith('.sql')?f:requireFile(f);sql.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));}sql.prepare("INSERT INTO shop_settings VALUES ('catalog_ready','1')").run();sql.prepare("INSERT INTO products(id,name,category,price,quantity,image,description,measurements,active,version,updated_at) VALUES ('bv-test','Test','Ringe',2900,2,'assets/test.jpg','','',1,1,1)").run();const wrap=(s,args=[])=>({bind(...a){return wrap(s,a)},async first(){return sql.prepare(s).get(...args)||null},async all(){return {results:sql.prepare(s).all(...args)}},async run(){return sql.prepare(s).run(...args)},s,args});const db={prepare:s=>wrap(s),async batch(statements){sql.exec('BEGIN');try{const result=statements.map(x=>({results:sql.prepare(x.s).all(...x.args)}));sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}}};return {sql,db};}
import {readdirSync} from 'node:fs';
function requireFile(prefix){return readdirSync(new URL('../drizzle/',import.meta.url)).find(x=>x.startsWith(prefix)&&x.endsWith('.sql'));}

test('delete mistake once, preserve snapshot and audit, exclude it from revenue',async()=>{
 const {sql,db}=setup();sql.exec(readFileSync(new URL('../drizzle/0003_amazing_logan.sql',import.meta.url),'utf8'));
 const now=Date.now(),id='BV-AAAA-BBBB-CCCC',payload=JSON.stringify({items:[{unitPrice:29,qty:1}]});
 sql.prepare("INSERT INTO orders(id,payload_hash,payload,mail_status,status,payment_status,created_at) VALUES (?, 'hash',?,'accepted','new','unpaid',?)").run(id,payload,now);
 sql.prepare("INSERT INTO order_workflow(order_id,notes,version,paid_at) VALUES (?,'',2,?)").run(id,now);
 assert.equal((await readOverview(db,30,now)).revenueOre,2900);
 assert.equal(await deleteOrder(db,{id,version:1},'owner',now),false);
 assert.equal(await deleteOrder(db,{id,version:2},'owner',now),true);
 assert.equal(await deleteOrder(db,{id,version:3},'owner',now),false);
 assert.equal(sql.prepare('SELECT payload FROM orders WHERE id=?').get(id).payload,payload);
 assert.equal(sql.prepare("SELECT count(*) AS n FROM admin_history WHERE action='order_deleted'").get().n,1);
 assert.equal((await readOverview(db,30,now)).revenueOre,0);
 await assert.rejects(deleteOrder(db,{id:'../invalid',version:0},'owner'));
});
test('new orders without workflow can be deleted, missing orders cannot',async()=>{
 const {sql,db}=setup();const id='BV-1111-2222-3333';
 sql.prepare("INSERT INTO orders(id,payload_hash,payload,mail_status,status,payment_status,created_at) VALUES (?,'hash','{}','accepted','new','unpaid',1)").run(id);
 assert.equal(await deleteOrder(db,{id,version:0},'owner'),true);
 assert.equal(await deleteOrder(db,{id:'BV-MISSING',version:0},'owner'),false);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM admin_history').get().n,1);
});
