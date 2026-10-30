export const IMAGE_KEY=/^[a-f0-9-]{36}\.(jpg|png|webp|heic)$/;
export const SIZES={thumb:160,card:640,large:1600};
export function imageFormat(b){if(b[0]===255&&b[1]===216&&b[2]===255)return 'jpg';if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)return 'png';if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'webp';if(b.length>=24&&String.fromCharCode(...b.slice(4,8))==='ftyp'){const n=new DataView(b.buffer,b.byteOffset,b.byteLength).getUint32(0);if(n>=24&&n<=b.length){for(let i=8;i<Math.min(n,128);i+=4)if(i!==12&&['heic','heix','hevc','hevx'].includes(String.fromCharCode(...b.slice(i,i+4))))return 'heic';}}return null;}
export function webpDimensions(b){
 if(imageFormat(b)!=='webp')return null;const view=new DataView(b.buffer,b.byteOffset,b.byteLength);let offset=12;
 while(offset+8<=b.length){const tag=String.fromCharCode(...b.slice(offset,offset+4)),n=view.getUint32(offset+4,true),p=offset+8;if(p+n>b.length)return null;
  if(tag==='VP8X'&&n>=10)return {width:1+b[p+4]+(b[p+5]<<8)+(b[p+6]<<16),height:1+b[p+7]+(b[p+8]<<8)+(b[p+9]<<16)};
  if(tag==='VP8 '&&n>=10&&b[p+3]===157&&b[p+4]===1&&b[p+5]===42)return {width:view.getUint16(p+6,true)&16383,height:view.getUint16(p+8,true)&16383};
  if(tag==='VP8L'&&n>=5&&b[p]===47){const bits=view.getUint32(p+1,true);return {width:(bits&16383)+1,height:((bits>>>14)&16383)+1};}
  offset=p+n+(n%2);
 }return null;
}
export function imageDimensions(b){
 const format=imageFormat(b),view=new DataView(b.buffer,b.byteOffset,b.byteLength);
 if(format==='webp')return webpDimensions(b);
 if(format==='png'&&b.length>=24&&String.fromCharCode(...b.slice(12,16))==='IHDR')return {width:view.getUint32(16),height:view.getUint32(20)};
 if(format==='jpg'){let offset=2;while(offset+4<=b.length){if(b[offset]!==255)return null;const marker=b[offset+1];if(marker===217||marker===218)return null;const length=view.getUint16(offset+2);if(length<2||offset+2+length>b.length)return null;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)&&length>=7)return {width:view.getUint16(offset+7),height:view.getUint16(offset+5)};offset+=length+2;}}
 return null;
}
export async function storeUpload(bucket,form,key=crypto.randomUUID()){
 const original=form.get('image');if(!(original instanceof File)||!original.size||original.size>20000000)throw Error('Vælg et billede under 20 MB.');
 const bytes=new Uint8Array(await original.arrayBuffer()),ext=imageFormat(bytes),dimensions=imageDimensions(bytes);if(!ext||(ext!=='heic'&&(!dimensions||!dimensions.width||!dimensions.height)))throw Error('Billedformatet understøttes ikke.');
 if(dimensions&&dimensions.width*dimensions.height>40000000)throw Error('Billedet må højst være 40 megapixel.');
 const variants=[];
 for(const [size,max]of Object.entries(SIZES)){
  const file=form.get(size);if(!(file instanceof File)||!file.size||file.size>3000000)throw Error('Upload mangler optimerede billedversioner. Genindlæs administrationen.');
  const body=new Uint8Array(await file.arrayBuffer()),format=imageFormat(body),dims=imageDimensions(body);if(!['webp','jpg'].includes(format)||!dims||!dims.width||!dims.height||dims.width>max||dims.height>1600)throw Error('Ugyldig størrelse på billedversion.');
  variants.push({size,body,format,...dims});
 }
 const originalKey=key+'.'+ext;
 // Immutable UUIDs keep replacement caches separate. Publish metadata only after all objects exist.
 try{await bucket.put(originalKey,bytes,{httpMetadata:{contentType:ext==='jpg'?'image/jpeg':'image/'+ext}});
 for(const v of variants)await bucket.put(originalKey+'/'+v.size+'.'+v.format,v.body,{httpMetadata:{contentType:v.format==='jpg'?'image/jpeg':'image/webp'}});
 await bucket.put(originalKey+'/manifest.json',JSON.stringify(variants.map(({size,width,height,format})=>({size,width,height,format}))),{httpMetadata:{contentType:'application/json'}});}catch{const error=new Error('Billedlageret svarede ikke. Kontrollér forbindelsen og prøv igen.');error.name='ImageStorageError';throw error;}
 return {image:'/api/product-image/'+originalKey,variants:variants.map(({size,width,height})=>({size,width,height}))};
}
export async function serveImage(request,bucket,key){
 if(!IMAGE_KEY.test(key)||!bucket)return new Response('Not found',{status:404});
 const size=new URL(request.url).searchParams.get('size');if(size&&!Object.hasOwn(SIZES,size))return new Response('Invalid size',{status:400});
 let object=size?await bucket.get(key+'/'+size+'.webp'):null;if(size&&!object)object=await bucket.get(key+'/'+size+'.jpg');const optimized=!!object;if(!object)object=await bucket.get(key);if(!object)return new Response('Not found',{status:404});
 const etag=object.httpEtag||'"'+object.etag+'"';const headers={'Content-Type':object.httpMetadata?.contentType||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':size&&!optimized?'public, max-age=300':'public, max-age=31536000, immutable','ETag':etag};
 if(request.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers});
 return new Response(request.method==='HEAD'?null:object.body,{headers});
}

export async function serveCachedImage(request,bucket,key,cache){
 if(!IMAGE_KEY.test(key))return new Response('Not found',{status:404});
 const size=new URL(request.url).searchParams.get('size');if(size&&!Object.hasOwn(SIZES,size))return new Response('Invalid size',{status:400});
 const url=new URL(request.url);url.search='';if(size)url.searchParams.set('size',size);
 const cacheKey=new Request(url.toString());
 let response;try{response=await cache?.match(cacheKey)}catch{}
 if(response){if(request.headers.get('if-none-match')===response.headers.get('etag'))return new Response(null,{status:304,headers:response.headers});return request.method==='HEAD'?new Response(null,{headers:response.headers}):response;}
 response=await serveImage(request,bucket,key);
 if(cache&&response.status===200&&request.method==='GET'){try{await cache.put(cacheKey,response.clone())}catch{}}
 return response;
}
