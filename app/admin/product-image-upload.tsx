'use client';
import {useEffect,useRef,useState} from 'react';
import {uploadPhoto,validateUploadFile} from '../../lib/browser-image-upload.mjs';
export default function ProductImageUpload({count,disabled,onUploaded,onBusyChange}:{count:number;disabled:boolean;onUploaded:(image:string)=>void;onBusyChange:(busy:boolean)=>void}){
 const [working,setWorking]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState(false),[preview,setPreview]=useState('');
 const controller=useRef<AbortController|null>(null),alive=useRef(true),urls=useRef<string[]>([]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();urls.current.forEach(url=>URL.revokeObjectURL(url));onBusyChange(false)}},[onBusyChange]);
 function showPreview(blob:Blob){if(!alive.current)return;urls.current.forEach(url=>URL.revokeObjectURL(url));const url=URL.createObjectURL(blob);urls.current=[url];setPreview(url);}
 async function select(files:File[]){
  if(!files.length||working)return;setError(false);setNotice('Billede valgt. Klargør upload…');
  try{files.forEach(validateUploadFile)}catch(e:any){urls.current.forEach(url=>URL.revokeObjectURL(url));urls.current=[];setPreview('');setError(true);setNotice(e.message);return;}

  if(count+files.length>8){setError(true);setNotice('Der kan højst være 8 billeder. Fjern et billede, før du uploader flere.');return;}
  showPreview(files[0]);controller.current=new AbortController();setWorking(true);onBusyChange(true);let added=0;
  try{for(const [index,file]of files.entries()){
   if(index)showPreview(file);
   const image=await uploadPhoto(file,{signal:controller.current.signal,onPreview:showPreview,onProgress:(text:string)=>{if(alive.current)setNotice(`${index+1}/${files.length}: ${text}`)}});
   if(!alive.current)return;onUploaded(image);added++;
  }setNotice(`${added} ${added===1?'billede er':'billeder er'} uploadet og tilføjet nedenfor. Tryk “Gem produkt”, når du er færdig.`);
  }catch(e:any){if(!alive.current)return;setError(e.name!=='AbortError');setNotice((e.name==='AbortError'?'Upload annulleret. Du kan vælge billedet igen.':e.message)+(added?` ${added} uploadede billeder er bevaret nedenfor. Husk at gemme produktet.`:''));}
  finally{if(alive.current){setWorking(false);onBusyChange(false)}}
 }
 return <div className="upload-box" aria-busy={working} style={{border:'1px solid #ddc39b',borderRadius:8,padding:14,margin:'14px 0'}}>
  <label>Upload produktbilleder (op til 8)<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" disabled={disabled||working} onChange={e=>{const files=Array.from(e.currentTarget.files||[]);e.currentTarget.value='';void select(files)}}/></label>
  <p className="muted">JPEG, PNG, WebP eller HEIC/HEIF · maks. 20 MB pr. foto. Billederne optimeres automatisk.</p>
  {preview&&<img src={preview} alt="Forhåndsvisning af det valgte billede" style={{width:140,height:140,objectFit:'contain',background:'#fff9f0'}} onError={e=>{e.currentTarget.style.display='none'}} onLoad={e=>{e.currentTarget.style.display='block'}}/>}
  {working&&<><progress aria-label="Billedupload i gang" style={{width:'100%',marginTop:12}}/><button type="button" onClick={()=>controller.current?.abort()}>Annullér upload</button></>}
  {notice&&<p role={error?'alert':'status'} aria-live={error?'assertive':'polite'} style={{fontSize:14,lineHeight:1.6,fontWeight:600,color:error?'#8b2525':'#3c291b',overflowWrap:'anywhere'}}>{notice}</p>}
 </div>;
}
