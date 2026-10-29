/* Orders are validated, stored and emailed by the same-origin server endpoint. */
(() => {
 const key='byvigga-cart-v1'; let items=[]; let products=[]; let returnFocus; let submitting=false;
 try { const saved=JSON.parse(localStorage.getItem(key)||'[]'); if(Array.isArray(saved))items=saved.filter(x=>typeof x.id==='string'&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=99); } catch{}
 const custom={id:'personligt-smykke',navn:'Personligt smykke',pris:null,pricePending:true};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dialog=document.createElement('dialog');dialog.className='cart-dialog';dialog.setAttribute('aria-labelledby','cart-title');
 dialog.innerHTML=`<button class="cart-close" aria-label="Luk kurv" type="button">×</button><h2 id="cart-title">Dine smykker</h2><div id="cart-lines"></div><p class="cart-total"></p><p class="cart-note"> Fragt tillægges ved forsendelse. Jeg bekræfter den samlede pris, før du betaler med MobilePay.</p><form class="cart-form"><label>Navn<input name="name" autocomplete="name" required maxlength="120"></label><label>Mail<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>Telefon (valgfrit)<input name="phone" type="tel" autocomplete="tel" maxlength="30"></label><label>Levering<select name="delivery"><option value="shipping">Forsendelse — fragt tillægges</option><option value="pickup">Gratis afhentning — Støvring, Himmerland</option></select></label><label data-address>Leveringsadresse<textarea name="address" autocomplete="street-address" required maxlength="500" placeholder="Adresse, postnummer og by"></textarea></label><label>Farver, mål og andre ønsker<textarea name="notes" maxlength="1500"></textarea></label><p class="cart-note" data-pickup hidden>Gratis afhentning i Støvring, Himmerland. Præcis adresse fås efter betaling. Tidspunkt aftales. Du behøver ikke oplyse leveringsadresse.</p><button class="button button-primary" type="submit">Send bestilling</button><p class="cart-note">Bestillingen sendes direkte til By Vigga. Jeg bekræfter samlet pris og levering og sender MobilePay-oplysninger. Du betaler først efter aftale.</p><label class="order-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label></form><p role="status" id="cart-status" aria-live="polite"></p>`;
 document.body.append(dialog);
 const form=dialog.querySelector('form');
 const status=dialog.querySelector('#cart-status');
 function clearStatus(){status.replaceChildren();status.className='';dialog.classList.remove('order-complete');}
 function showConfirmation(orderId){
  status.className='cart-confirmation';dialog.classList.add('order-complete');
  status.innerHTML=`<h3 tabindex="-1">Tak for din bestilling!</h3><p>Din bestilling er sendt til By Vigga.</p><p class="confirmation-number">Bestillingsnummer<strong>${esc(orderId)}</strong></p><p>Jeg vender tilbage på mail med samlet pris, levering og MobilePay-oplysninger.</p><p class="confirmation-payment">Du har ikke betalt endnu. Du betaler først, når vi har aftalt detaljerne.</p>`;
  status.querySelector('h3').focus();status.scrollIntoView({block:'nearest'});
 }
 function save(){try{localStorage.setItem(key,JSON.stringify(items));}catch{} render();}
 function render(){
  const count=items.reduce((n,x)=>n+x.qty,0);document.querySelectorAll('[data-cart-count]').forEach(x=>x.textContent=count);
  dialog.querySelector('#cart-lines').innerHTML=items.length?items.map(x=>{const p=products.find(p=>p.id===x.id);if(!p)return '';return `<div class="cart-line"><img class="cart-product-photo" src="${esc(p.billeder?.[0]||p.billede||'assets/brand/ornament-heart.svg')}" alt="${esc(p.navn)}" width="64" height="72"><div class="cart-product-info"><strong>${esc(p.navn)}</strong><p class="cart-note">${p.pricePending?'Pris afventer aftale':p.pris+' kr. pr. stk.'}</p></div><div class="cart-product-controls"><button type="button" data-change="${esc(p.id)}" data-delta="-1" aria-label="Fjern én ${esc(p.navn)}">−</button> <span>${x.qty}</span> <button type="button" data-change="${esc(p.id)}" data-delta="1" aria-label="Tilføj én ${esc(p.navn)}">+</button> <button type="button" data-remove="${esc(p.id)}" aria-label="Fjern ${esc(p.navn)}">×</button></div></div>`}).join(''):'<p>Din kurv er tom. Find et smykke i udvalget.</p>';
  const subtotal=items.reduce((sum,x)=>sum+(products.find(p=>p.id===x.id)?.pris||0)*x.qty,0);
  const pending=items.some(x=>x.id===custom.id);form.elements.notes.required=pending;form.elements.notes.placeholder=pending?'Beskriv smykketype, farver, mål og din idé. Prisen aftales, før du betaler.':'';
  dialog.querySelector('.cart-total').textContent=pending?(subtotal?`Varer i alt ${subtotal} kr. + personligt smykke (pris aftales) + eventuel fragt`:'Personligt smykke: pris afventer aftale · eventuel fragt tillægges'):`Varer i alt ${subtotal} kr.${form.elements.delivery.value === 'pickup' ? ' · Afhentning: 0 kr.' : ' + fragt (bekræftes)'}`;
  form.hidden=!items.length;
 }
 function open(){returnFocus=document.activeElement;clearStatus();render();dialog.showModal();}
 dialog.querySelector('.cart-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>returnFocus?.focus());
 dialog.addEventListener('click',e=>{if(submitting)return;const b=e.target.closest('button');if(!b)return;if(b.dataset.change){const x=items.find(x=>x.id===b.dataset.change);x.qty=Math.min(x.id===custom.id?1:99,x.qty+Number(b.dataset.delta));items=items.filter(x=>x.qty>0);save();}if(b.dataset.remove){items=items.filter(x=>x.id!==b.dataset.remove);save();}});
 document.addEventListener('click',e=>{if(submitting)return;const openButton=e.target.closest('[data-open-cart]');if(openButton)open();const add=e.target.closest('[data-add-cart]');if(add){const p=products.find(x=>x.id===add.dataset.addCart);if(!p)return;const existing=items.find(x=>x.id===p.id);if(existing)existing.qty=Math.min(p.pricePending?1:99,existing.qty+1);else items.push({id:p.id,qty:1});save();open();if(p.pricePending)form.elements.notes.focus();}});
 form.elements.delivery.onchange=()=>{const pickup=form.elements.delivery.value==='pickup';dialog.querySelector('[data-address]').hidden=pickup;form.elements.address.required=!pickup;dialog.querySelector('[data-pickup]').hidden=!pickup;render();};
 form.onsubmit=async e=>{
  e.preventDefault();if(submitting||!items.length||!form.reportValidity())return;
  const d=new FormData(form);
  const payload={name:d.get('name'),email:d.get('email'),phone:d.get('phone'),delivery:d.get('delivery'),address:d.get('delivery')==='pickup'?'':d.get('address'),notes:d.get('notes'),website:d.get('website'),items:items.map(x=>({id:x.id,qty:x.qty}))};
  submitting=true;const submit=form.querySelector('[type=submit]');for(const control of form.elements)control.disabled=true;submit.textContent='Sender bestilling…';status.textContent='';
  try {
   const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload))))).map(x=>x.toString(16).padStart(2,'0')).join('');
   let attempt;try{attempt=JSON.parse(sessionStorage.getItem('byvigga-order-attempt')||'null')}catch{}
   if(attempt?.fingerprint!==fingerprint)attempt={fingerprint,id:crypto.randomUUID()};
   try{sessionStorage.setItem('byvigga-order-attempt',JSON.stringify(attempt))}catch{}
   const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,requestId:attempt.id}),signal:AbortSignal.timeout(25000)});
   let result;try{result=await response.json()}catch{throw Error('Bestillingen kunne ikke bekræftes sendt. Din kurv er bevaret. Prøv igen senere.')}
   if(!response.ok||!result.ok)throw Error(result.error||'Bestillingen kunne ikke sendes. Din kurv er bevaret.');
   items=[];save();form.reset();form.elements.delivery.onchange();try{sessionStorage.removeItem('byvigga-order-attempt')}catch{}
   showConfirmation(result.orderId);
  }catch(error){status.textContent=error.name==='TimeoutError'?'Vi kunne ikke bekræfte afsendelsen endnu. Din kurv er bevaret. Prøv igen med samme oplysninger.':error.message;}
  finally{submitting=false;for(const control of form.elements)control.disabled=false;submit.textContent='Send bestilling';}
 };

 fetch('/api/products').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{products=[...data,custom];items=items.filter(x=>products.some(p=>p.id===x.id));save();}).catch(()=>{dialog.querySelector('#cart-lines').textContent='Varerne kunne ikke indlæses. Prøv igen eller skriv til byviggashop@gmail.com.';form.hidden=true;});
})();
