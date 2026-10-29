/** By Vigga: server-to-server order mail. Paste into Google Apps Script as Code.gs. */
const SHOP_EMAIL = 'byviggashop@gmail.com';
function authorizeByVigga() {
  // Run this once to approve sending. This function sends no mail.
  return MailApp.getRemainingDailyQuota();
}
function createByViggaSecret() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('BYVIGGA_SHARED_SECRET')) {
    props.setProperty('BYVIGGA_SHARED_SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
  // View the secret in Project settings > Script properties. Never log it.
}
function doPost(e) {
  const reply = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  let locked = false;
  const lock = LockService.getScriptLock();
  try {
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('BYVIGGA_SHARED_SECRET');
    if (!secret || secret.length < 32 || !e || !e.postData || e.postData.contents.length > 60000) return reply({ok:false});
    const input = JSON.parse(e.postData.contents);
    if (typeof input.timestamp !== 'string' || !/^\d{13}$/.test(input.timestamp) || Math.abs(Date.now()-Number(input.timestamp)) > 300000 || typeof input.payload !== 'string' || input.payload.length > 40000 || typeof input.signature !== 'string' || !/^[a-f0-9]{64}$/.test(input.signature)) return reply({ok:false});
    const expected = Utilities.computeHmacSha256Signature(input.timestamp+'.'+input.payload,secret,Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
    let difference=0;for(let i=0;i<64;i++)difference|=expected.charCodeAt(i)^input.signature.charCodeAt(i);
    if(difference!==0)return reply({ok:false});
    const mail=JSON.parse(input.payload);
    if(typeof mail.orderId!=='string'||!/^BV-(?:[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}|[A-F0-9-]{36})$/.test(mail.orderId)||typeof mail.replyTo!=='string'||mail.replyTo.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.replyTo)||typeof mail.text!=='string'||mail.text.length>12000)return reply({ok:false});
    if(mail.customerText!==undefined&&(typeof mail.customerText!=='string'||mail.customerText.length>16000))return reply({ok:false});
    locked=lock.tryLock(5000);if(!locked)return reply({ok:false});
    // Each recipient has its own durable send state: retries never duplicate a successful send.
    const recipients=[{key:'order:',to:SHOP_EMAIL,replyTo:mail.replyTo,subject:'By Vigga · bestilling '+mail.orderId,body:mail.text}];
    if(mail.customerText)recipients.push({key:'receipt:',to:mail.replyTo,replyTo:SHOP_EMAIL,subject:'By Vigga · din bestilling '+mail.orderId,body:mail.customerText});
    const needed=recipients.filter(r=>{try{return JSON.parse(props.getProperty(r.key+mail.orderId)||'{}').status!=='sent'}catch{return true}});
    if(MailApp.getRemainingDailyQuota()<needed.length)return reply({ok:false,quotaExceeded:true});
    const all=props.getProperties();Object.keys(all).filter(k=>k.startsWith('order:')||k.startsWith('receipt:')).forEach(k=>{try{const value=JSON.parse(all[k]);if(value.status==='sent'&&value.time<Date.now()-7*86400000)props.deleteProperty(k);}catch{}});
    for(const recipient of recipients){
      const property=recipient.key+mail.orderId;
      const previous=props.getProperty(property);
      if(previous){const state=JSON.parse(previous);if(state.status==='sent')continue;return reply({ok:false,manualReview:true});}
      props.setProperty(property,JSON.stringify({status:'sending',time:Date.now()}));
      try{MailApp.sendEmail({to:recipient.to,replyTo:recipient.replyTo,name:'By Vigga',subject:recipient.subject,body:recipient.body});props.setProperty(property,JSON.stringify({status:'sent',time:Date.now()}));}
      catch{return reply({ok:false,manualReview:true});}
    }
    return reply({ok:true,orderId:mail.orderId,customerAccepted:!!mail.customerText});
  } catch { return reply({ok:false}); }
  finally { if(locked)lock.releaseLock(); }
}
