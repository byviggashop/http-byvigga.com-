import manifest from '../data/image-manifest.js';

export function imageInfo(source, size = 'card') {
 const saved=manifest[source]||manifest[source?.replace(/^\//,'')];
 if(saved){const variant=saved.variants.find(v=>v.size===size)||saved.variants.at(-1);return {...variant,srcset:saved.variants.filter(v=>size!=='thumb'||v.size==='thumb').filter((v,i,a)=>a.findIndex(x=>x.width===v.width)===i).map(v=>`${v.src} ${v.width}w`).join(', ')};}
 if(/^\/api\/product-image\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(source||''))return {src:source+'?size='+size,srcset:undefined};
 return {src:source,srcset:undefined};
}
export function imageAttributes(source,size='card',sizes='(max-width: 640px) 44vw, (max-width: 1000px) 30vw, 320px'){
 const info=imageInfo(source,size);const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `src="${escape(info.src)}"${info.srcset?` srcset="${escape(info.srcset)}" sizes="${escape(sizes)}"`:''}${info.width?` width="${info.width}" height="${info.height}"`:''} decoding="async"`;
}
