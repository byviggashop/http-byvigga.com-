function sharedSecret(env) { return env.GMAIL_SHARED_SECRET || env.BYVIGGA_SHARED_SECRET; }
export function gmailConfigured(env) {
 const secret=sharedSecret(env);
 return typeof secret==='string' && secret.length>=32 && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(env.GMAIL_SCRIPT_URL||'');
}
export async function sendGmail(env, message, send=fetch) {
 const timestamp=Date.now().toString(), payload=JSON.stringify(message);
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(sharedSecret(env)),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=[...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+payload)))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const response=await send(env.GMAIL_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({timestamp,payload,signature}),signal:AbortSignal.timeout(20000)});
 const result=await response.json();
 if(!response.ok||result.ok!==true||result.orderId!==message.orderId||(message.customerText&&result.customerAccepted!==true))throw Error('gmail_not_confirmed');
 return 'gmail:'+result.orderId;
}
