export const IMAGE_SIZES={thumb:160,card:640,large:1600};
export async function optimizeUpload(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>6000000)throw Error('Vælg et JPG-, PNG- eller WebP-billede under 6 MB.');
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
 try{
  if(!bitmap.width||bitmap.width*bitmap.height>40000000)throw Error('Billedet må højst være 40 megapixel.');
  const form=new FormData();form.append('image',file);
  for(const [size,max] of Object.entries(IMAGE_SIZES)){
   const scale=Math.min(1,max/bitmap.width,1600/bitmap.height),width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d',{colorSpace:'srgb'});if(!ctx)throw Error('Browseren kunne ikke behandle billedet.');
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,width,height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',size==='large'?0.92:0.88));
   if(!blob||blob.type!=='image/webp')throw Error('Browseren understøtter ikke WebP-upload. Prøv en nyere browser.');
   form.append(size,blob,size+'.webp');canvas.width=canvas.height=1;
  }
  return form;
 }finally{bitmap.close();}
}
