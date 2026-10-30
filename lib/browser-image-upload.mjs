export const IMAGE_SIZES={thumb:160,card:640,large:1600};
export const MAX_ORIGINAL_BYTES=20_000_000;
export const HEIC_HELP='Browseren kan ikke åbne dette HEIC/HEIF-billede. Eksportér billedet som JPEG fra Fotos, eller vælg et JPG- eller PNG-billede.';
export function validateUploadFile(file){
 if(!file?.size)throw Error('Billedfilen er tom. Vælg billedet igen.');
 if(file.size>MAX_ORIGINAL_BYTES)throw Error('Billedet er over 20 MB. Eksportér det i en mindre størrelse, og prøv igen.');
 const heic=/^image\/hei[cf](?:-sequence)?$/i.test(file.type)||/\.hei[cf]$/i.test(file.name);
 if(!heic&&!['image/jpeg','image/png','image/webp'].includes(file.type)&&!(!file.type&&/\.(jpe?g|png|webp)$/i.test(file.name)))throw Error('Vælg et JPEG-, PNG-, WebP- eller HEIC/HEIF-billede.');
 return {heic};
}
export function bounded(promise,ms,message,signal){return new Promise((resolve,reject)=>{
 let settled=false;const done=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);fn(value)},cancel=()=>done(reject,new DOMException('Upload annulleret.','AbortError'));
 const timer=setTimeout(()=>done(reject,Error(message)),ms);signal?.addEventListener('abort',cancel,{once:true});
 if(signal?.aborted)cancel();Promise.resolve(promise).then(v=>done(resolve,v),e=>done(reject,e));
});}
async function decodePhoto(file,signal){
 const url=URL.createObjectURL(file),image=new Image();image.decoding='async';
 try{await bounded(new Promise((resolve,reject)=>{image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Billedet kunne ikke åbnes. Vælg et andet billede, eller eksportér det som JPEG.'));image.src=url}),30_000,'Billedet tog for lang tid at åbne. Prøv et mindre JPEG-billede.',signal);
  return {image,width:image.naturalWidth,height:image.naturalHeight,close(){image.src='';URL.revokeObjectURL(url)}};
 }catch(error){image.src='';URL.revokeObjectURL(url);throw error;}
}
function contextFor(canvas){let ctx;try{ctx=canvas.getContext('2d',{colorSpace:'srgb'})}catch{ctx=canvas.getContext('2d')}if(!ctx)ctx=canvas.getContext('2d');if(!ctx)throw Error('Browseren kunne ikke behandle billedet. Prøv at genindlæse siden.');return ctx;}
async function encode(canvas,type,quality,signal){return bounded(new Promise((resolve,reject)=>{try{canvas.toBlob(resolve,type,quality)}catch(e){reject(e)}}),30_000,'Billedbehandlingen tog for lang tid. Prøv et mindre JPEG-billede.',signal);}
export async function encodeCompatible(canvas,quality,signal){
 // Unsupported canvas formats silently become PNG on some browsers, including Safari.
 let blob=await encode(canvas,'image/webp',quality,signal);
 if(blob?.type==='image/webp')return blob;
 const ctx=contextFor(canvas);ctx.save();ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#fff9f0';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
 blob=await encode(canvas,'image/jpeg',quality,signal);
 if(!blob||blob.type!=='image/jpeg')throw Error('Browseren kunne ikke gemme billedet. Prøv et mindre JPEG-billede eller en opdateret browser.');
 return blob;
}
export async function optimizeUpload(file,{signal,onProgress=()=>{},onPreview=()=>{}}={}){
 const {heic}=validateUploadFile(file);onProgress('Åbner billedet…');let decoded;
 try{decoded=await decodePhoto(file,signal)}catch(error){if(error.name==='AbortError')throw error;if(heic)throw Error(HEIC_HELP);throw error;}
 try{
  if(!decoded.width||!decoded.height||decoded.width*decoded.height>40_000_000)throw Error('Billedet er over 40 megapixel. Eksportér en mindre udgave fra Fotos.');
  const form=new FormData();form.append('image',file);
  for(const [size,max] of Object.entries(IMAGE_SIZES)){
   if(signal?.aborted)throw new DOMException('Upload annulleret.','AbortError');onProgress('Optimerer '+({thumb:'miniature',card:'produktfoto',large:'stort foto'}[size])+'…');
   const scale=Math.min(1,max/decoded.width,1600/decoded.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(decoded.width*scale));canvas.height=Math.max(1,Math.round(decoded.height*scale));
   try{const ctx=contextFor(canvas);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(decoded.image,0,0,canvas.width,canvas.height);
    const blob=await encodeCompatible(canvas,size==='large'?0.92:0.88,signal);if(blob.size>3_000_000)throw Error('Billedet indeholder for mange detaljer. Eksportér en mindre JPEG-udgave.');
    form.append(size,blob,size+(blob.type==='image/webp'?'.webp':'.jpg'));if(size==='card')onPreview(blob);
   }finally{canvas.width=canvas.height=1;}
  }return form;
 }finally{decoded.close();}
}
export async function uploadPhoto(file,{signal,onProgress=()=>{},onPreview,fetcher=fetch,optimizer=optimizeUpload,timeoutMs=90_000}={}){
 const controller=new AbortController();let timedOut=false;const cancel=()=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
 const timer=setTimeout(()=>{timedOut=true;controller.abort()},timeoutMs);
 try{
  const form=await optimizer(file,{signal:controller.signal,onProgress,onPreview});onProgress('Uploader billedet…');
  const response=await bounded(fetcher('/api/admin/upload',{method:'POST',body:form,credentials:'same-origin',signal:controller.signal}),timeoutMs,'Upload tog for lang tid.',controller.signal);
  if(response.redirected||[401,403].includes(response.status))throw Error('Dit login er udløbet, eller du mangler adgang. Genindlæs administrationen og log ind igen, før du uploader.');
  if(response.status===413)throw Error('Upload er for stor. Vælg et billede under 20 MB.');
  let result;try{result=await bounded(response.json(),15_000,'Serveren svarede ikke færdigt. Prøv igen.',controller.signal)}catch(error){if(error.name==='AbortError')throw error;throw Error('Serveren kunne ikke bekræfte uploaden. Genindlæs administrationen og kontrollér dit login.');}
  if(!response.ok)throw Error(result.error||'Billedet kunne ikke uploades. Prøv igen.');
  if(typeof result.image!=='string'||!/^\/api\/product-image\/[a-f0-9-]{36}\.(jpg|png|webp|heic)$/.test(result.image))throw Error('Serveren returnerede ikke et gyldigt billede. Prøv igen.');
  onProgress('Billedet er uploadet. Gem produktet for at vise det i webshoppen.');return result.image;
 }catch(error){if(timedOut)throw Error('Upload tog for lang tid. Kontrollér forbindelsen og prøv igen.');if(error.name==='AbortError')throw error;if(error instanceof TypeError)throw Error('Forbindelsen blev afbrudt. Kontrollér internet og login, og prøv igen.');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
