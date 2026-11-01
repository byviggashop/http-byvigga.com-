import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {stockInfo} from '../lib/stock.mjs';
import {normalizeOrder} from '../lib/order-service.mjs';
import {Worker} from 'node:worker_threads';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
function setup(type='unique',quantity=1,file=':memory:'){
 const db=new DatabaseSync(file);
 for(const f of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));
 db.prepare("INSERT INTO products(id,name,category,price,quantity,image,description,measurements,active,version,updated_at,product_type) VALUES ('p','Smykke','Ringe',100,?,'assets/p.jpg','','',1,1,1,?)").run(quantity,type);
 const order=(id,qty=1)=>{db.prepare("INSERT INTO orders VALUES (?,'hash',?,'accepted','awaiting_confirmation','unpaid',1,NULL,NULL)").run(id,JSON.stringify({items:[{id:'p',qty}]}));db.prepare("INSERT INTO order_workflow(order_id,notes,version) VALUES (?,'',0)").run(id)};
 const step=(id,column,at=10)=>db.prepare(`UPDATE order_workflow SET ${column}=?,version=version+1 WHERE order_id=?`).run(at,id);
 const stock=()=>{const p=db.prepare('SELECT * FROM products').get();const reserved=db.prepare("SELECT COALESCE(SUM(physical),0) AS n FROM order_inventory WHERE product_id='p' AND state='reserved'").get().n;return {antal:p.quantity,produkttype:p.product_type,reserveret:reserved}};
 return {db,order,step,stock};
}
test('A: unique reservation makes last physical item unavailable; server rejects stale basket',()=>{const {db,order,step,stock}=setup();order('a');step('a','confirmed_at');assert.equal(stock().antal,1);assert.equal(stock().reserveret,1);assert.equal(stockInfo(stock()).soldout,true);assert.throws(()=>normalizeOrder({requestId:crypto.randomUUID(),name:'A',email:'a@example.com',delivery:'pickup',items:[{id:'p',qty:1}]},[{id:'p',navn:'Smykke',pris:1,aktiv:true,...stock()}]));assert.equal(db.prepare('SELECT COUNT(*) AS n FROM inventory_movements').get().n,1)});
test('B: made-to-order allocates only physical stock and never drives it negative',()=>{const {db,order,step,stock}=setup('made_to_order');order('a');order('b',2);step('a','confirmed_at');assert.equal(stockInfo(stock()).label,'Laves på bestilling');step('b','confirmed_at');assert.equal(db.prepare("SELECT physical FROM order_inventory WHERE order_id='b'").get().physical,0);step('b','fulfilled_at');assert.equal(stock().antal,1);step('a','fulfilled_at');assert.equal(stock().antal,0);assert.equal(stock().reserveret,0)});
for(const delivery of ['afhentet','afsendt'])test('C/D: '+delivery+' consumes reservation exactly once',()=>{const {db,order,step,stock}=setup();order('a');step('a','confirmed_at');step('a','fulfilled_at');step('a','fulfilled_at',20);assert.equal(stock().antal,0);assert.equal(stock().reserveret,0);assert.equal(db.prepare("SELECT COUNT(*) AS n FROM inventory_movements WHERE action='fulfilled'").get().n,1);assert.throws(()=>step('a','cancelled_at'));});
test('E: cancellation releases physical stock once, without stock decrement',()=>{const {order,step,stock}=setup();order('a');step('a','confirmed_at');step('a','cancelled_at');step('a','cancelled_at',20);assert.equal(stock().antal,1);assert.equal(stock().reserveret,0);assert.equal(stockInfo(stock()).label,'På lager')});
test('F: two independent confirmation attempts cannot reserve the last item; failure rolls back whole order',()=>{const {db,order,step,stock}=setup();order('a');order('b');step('a','confirmed_at');assert.throws(()=>step('b','confirmed_at'),/ikke nok/);assert.equal(stock().reserveret,1);assert.equal(db.prepare("SELECT confirmed_at FROM order_workflow WHERE order_id='b'").get().confirmed_at,null);assert.equal(db.prepare("SELECT COUNT(*) AS n FROM order_inventory WHERE order_id='b'").get().n,0)});
test('G: existing fulfilled order is not backfilled and cannot be confirmed again',()=>{const {db,order,step,stock}=setup();order('old');step('old','fulfilled_at');assert.equal(stock().antal,1);assert.throws(()=>step('old','confirmed_at'),/Historisk/);assert.equal(stock().antal,1);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM order_inventory').get().n,0)});
test('manual reduction below reserved quantity is rejected, reservations retain physical allocation after restocking',()=>{const {db,order,step,stock}=setup('made_to_order');order('a',2);step('a','confirmed_at');assert.throws(()=>db.exec('UPDATE products SET quantity=0'));db.exec('UPDATE products SET quantity=2');step('a','fulfilled_at');assert.equal(stock().antal,1);assert.equal(stock().reserveret,0)});
test('a shortage on one item rolls back reservations for every item',()=>{const {db,order,step}=setup();order('a');db.exec("UPDATE orders SET payload='{"+'"items":[{"id":"p","qty":2}]'+"}'");assert.throws(()=>step('a','confirmed_at'));assert.equal(db.prepare('SELECT COUNT(*) AS n FROM inventory_movements').get().n,0)});
test('F concurrency: separate SQLite connections released simultaneously reserve exactly one last item',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'byvigga-stock-')),file=join(directory,'test.sqlite');
 try{
  const {db,order}=setup('unique',1,file);order('a');order('b');db.close();
  const gate=new SharedArrayBuffer(4);
  const workers=['a','b'].map(id=>new Worker(`const {parentPort,workerData}=require('node:worker_threads');const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(workerData.file);db.exec('PRAGMA busy_timeout=5000');parentPort.postMessage('ready');Atomics.wait(new Int32Array(workerData.gate),0,0);try{db.prepare('UPDATE order_workflow SET confirmed_at=10 WHERE order_id=?').run(workerData.id);parentPort.postMessage('reserved')}catch(e){parentPort.postMessage(e.message.includes('ikke nok')?'shortage':e.message)}finally{db.close()}`,{eval:true,workerData:{file,id,gate}}));
  const results=workers.map(w=>new Promise((resolve,reject)=>{w.on('message',m=>{if(m!=='ready')resolve(m)});w.on('error',reject)}));
  await Promise.all(workers.map(w=>new Promise(resolve=>w.once('message',resolve))));
  Atomics.store(new Int32Array(gate),0,1);Atomics.notify(new Int32Array(gate),0,2);
  assert.deepEqual((await Promise.all(results)).sort(),['reserved','shortage']);
  await Promise.all(workers.map(w=>w.terminate()));
 }finally{rmSync(directory,{recursive:true,force:true})}
});
