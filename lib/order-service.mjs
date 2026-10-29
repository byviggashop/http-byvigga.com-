import { gmailConfigured, sendGmail } from './gmail-mailer.mjs';
const SHOP_EMAIL = 'byviggashop@gmail.com';
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export function normalizeOrder(input, catalog) {
  const clean = (value, max, required = false) => {
    if (typeof value !== 'string' || value.length > max || (required && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw Error('Kontrollér dine oplysninger.');
    return value.trim();
  };
  if (!input || typeof input !== 'object' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId || '')) throw Error('Ugyldig bestilling. Genindlæs siden.');
  if (input.website) throw Error('Bestillingen kunne ikke sendes.');
  const name = clean(input.name, 120, true), email = clean(input.email, 254, true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(name + email)) throw Error('Indtast et gyldigt navn og en gyldig mailadresse.');
  if (!['pickup', 'shipping'].includes(input.delivery)) throw Error('Vælg afhentning eller forsendelse.');
  const address = input.delivery === 'shipping' ? clean(input.address, 500, true) : '';
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 30) throw Error('Kurven skal indeholde mindst én vare.');
  const seen = new Set();
  const items = input.items.map(line => {
    const product = line?.id==='personligt-smykke' ? {id:'personligt-smykke',navn:'Personligt smykke',pris:null,billede:'assets/brand/ornament-heart.svg',aktiv:true,antal:1} : catalog.find(p => p.id === line?.id);
    if (!product || seen.has(product.id) || !Number.isInteger(line.qty) || line.qty < 1 || line.qty > 99) throw Error('Kontrollér varerne i kurven.');
    seen.add(product.id);
    if(product.aktiv===false || (product.antal!=null&&line.qty>product.antal))throw Error('Der er ikke nok på lager af '+product.navn+'.');
    return { id: product.id, name: product.navn, qty: line.qty, unitPrice: product.pris, ...(product.id==='personligt-smykke'?{pricePending:true}:{}), image:product.billede };
  }).sort((a,b) => a.id.localeCompare(b.id));
  const pricePending=items.some(x=>x.pricePending);
  if(pricePending&&!clean(input.notes??'',1500).trim())throw Error('Beskriv dine ønsker til det personlige smykke.');
  return { ...(pricePending?{pricePending:true}:{}), requestId: input.requestId, name, email, phone: clean(input.phone ?? '',30), delivery: input.delivery, address, notes: clean(input.notes ?? '',1500), items, subtotal: items.reduce((sum,x)=>sum+(x.unitPrice??0)*x.qty,0), paymentStatus:'unpaid', status:'awaiting_confirmation' };
}
async function digest(value) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join(''); }
export async function shortOrderId(requestId) { const code=(await digest(requestId.toLowerCase())).slice(0,12).toUpperCase(); return 'BV-'+code.match(/.{4}/g).join('-'); }
export function customerEmail(order,id) {
 return ['Tak for din bestilling!','Din bestilling er sendt til By Vigga.','', 'Bestillingsnummer: '+id,'','Jeg vender tilbage på mail med samlet pris, levering og MobilePay-oplysninger.','Du har ikke betalt endnu. Du betaler først, når vi har aftalt detaljerne.','','Dine smykker:',...order.items.map(x=>x.qty+' × '+x.name+' — '+(x.pricePending?'pris afventer aftale':x.qty*x.unitPrice+' kr.')),order.pricePending?'Samlet pris afventer aftale.':'Varer i alt '+order.subtotal+' kr. + evt. fragt',order.delivery==='pickup'?'Gratis afhentning i Støvring, Himmerland. Præcis adresse fås efter betaling.':'Forsendelse: fragt aftales og tillægges.','','Har du spørgsmål? Svar på denne mail.','By Vigga · Handmade Jewelry','byviggashop@gmail.com'].join('\n');
}
export function orderEmail(order, id, origin='') {
  return [`Bestillingsønske ${id}`,`Åbn ordre (ejerlogin): ${origin}/admin?order=${encodeURIComponent(id)}`, '', ...order.items.flatMap(x=>[`${x.qty} × ${x.name} (${x.id}) — ${x.pricePending?'pris afventer aftale':x.qty*x.unitPrice+' kr.'}`,x.pricePending?`Se ønsker på ordren (ejerlogin): ${origin}/admin?order=${encodeURIComponent(id)}`:`Se smykke (ejerlogin): ${origin}/admin?product=${encodeURIComponent(x.id)}`]), '', order.pricePending?`Kendte varepriser ${order.subtotal} kr. · Personligt smykke: pris afventer. Samlet pris aftales.`:`Varer i alt ${order.subtotal} kr.`,order.delivery==='pickup'?'Afhentning: 0 kr. — Støvring, Himmerland. Præcis adresse fås efter betaling. Tidspunkt aftales.':'Forsendelse: fragt tillægges og bekræftes manuelt.', '',`Navn: ${order.name}`,`Mail: ${order.email}`,`Telefon: ${order.phone}`,order.address?`Leveringsadresse: ${order.address}`:'',`Ønsker: ${order.notes}`,'','Afventer din bekræftelse af varer, samlet pris og levering. Send herefter MobilePay-oplysninger. Ingen betaling er foretaget.'].filter(x=>x!==undefined).join('\n');
}
export async function submitOrder(request, env, catalog, send = fetch) {
  if (request.method !== 'POST') return json({error:'Metoden understøttes ikke.'},405);
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({error:'Bestillingen skal sendes fra hjemmesiden.'},403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error:'Ugyldigt format.'},415);
  if (!gmailConfigured(env) || !env.DB) return json({error:'Bestilling via hjemmesiden er ikke klar endnu. Skriv til byviggashop@gmail.com. Din kurv er bevaret.'},503);
  let input;
  try { const raw=await request.text(); if(new TextEncoder().encode(raw).length>12000)return json({error:'Bestillingen er for stor.'},413); input=normalizeOrder(JSON.parse(raw),catalog); } catch(e) {return json({error:e instanceof SyntaxError?'Ugyldigt format.':e.message},400);}
  const payload=JSON.stringify(input), hash=await digest(payload);
  let id=await shortOrderId(input.requestId);
  try {
    // Preserve existing full-length IDs and in-flight retries from before this change.
    const legacyId='BV-'+input.requestId.toUpperCase();
    const legacy=await env.DB.prepare('SELECT payload_hash, mail_status, created_at FROM orders WHERE id = ?').bind(legacyId).first();
    if(legacy)id=legacyId;
    const existing = legacy || await env.DB.prepare('SELECT payload_hash, mail_status, created_at FROM orders WHERE id = ?').bind(id).first();
    if(existing && existing.payload_hash!==hash)return json({error:'Bestillingen er ændret. Genindlæs siden og prøv igen.'},409);
    if(existing?.mail_status==='accepted')return json({ok:true,orderId:id});
    // Hold unresolved older orders for manual review.
    if(existing && Date.now()-existing.created_at>23*60*60*1000)return json({error:'Denne bestilling skal kontrolleres manuelt. Skriv til byviggashop@gmail.com med nummeret '+id+'.'},409);
    const ip = request.headers.get('cf-connecting-ip') || 'local';
    const bucket = (await digest(ip)).slice(0,32)+'-'+Math.floor(Date.now()/3600000);
    const rate = await env.DB.prepare('INSERT INTO order_rate_limits (bucket, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = attempts + 1 RETURNING attempts').bind(bucket,Date.now()+7200000).first();
    if(rate.attempts>10)return json({error:'Du har forsøgt for mange gange. Prøv igen senere eller skriv til shoppen.'},429);
    await env.DB.prepare('DELETE FROM order_rate_limits WHERE expires_at < ?').bind(Date.now()).run();
    await env.DB.prepare('INSERT INTO orders (id, payload_hash, payload, mail_status, status, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING').bind(id,hash,payload,'pending','awaiting_confirmation','unpaid',Date.now()).run();
    // Claim atomically so parallel requests cannot create parallel sends.
    const claim=await env.DB.prepare("UPDATE orders SET locked_until = ? WHERE id = ? AND mail_status != 'accepted' AND (locked_until IS NULL OR locked_until < ?) AND payload_hash = ? RETURNING id").bind(Date.now()+60000,id,Date.now(),hash).first();
    if(!claim)return json({error:'Bestillingen behandles allerede. Vent et øjeblik og prøv igen.'},409);

    try {
      const providerId=await sendGmail(env,{orderId:id,replyTo:input.email,text:orderEmail(input,id,new URL(request.url).origin),customerText:customerEmail(input,id)},send);
      await env.DB.prepare("UPDATE orders SET mail_status = 'accepted', provider_id = ?, locked_until = NULL WHERE id = ?").bind(providerId,id).run();
      return json({ok:true,orderId:id});
    } catch {
      await env.DB.prepare("UPDATE orders SET mail_status = 'retry', locked_until = NULL WHERE id = ?").bind(id).run();
      return json({error:'Bestillingen kunne ikke bekræftes sendt. Din kurv er bevaret. Prøv igen med samme bestilling eller skriv til byviggashop@gmail.com.',orderId:id},502);
    }
  } catch { return json({error:'Bestillingen kunne ikke behandles. Din kurv er bevaret. Prøv igen senere.'},503); }
}
