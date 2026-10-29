'use client';
import {useEffect,useState} from 'react';
export default function ProductLinks({id,active}:{id:string;active:boolean}){
 const [origin,setOrigin]=useState(''),[copied,setCopied]=useState('');
 useEffect(()=>{setOrigin(location.origin);setCopied('')},[id]);
 async function copy(url:string,label:string){try{await navigator.clipboard.writeText(url);setCopied(label+' kopieret.')}catch{setCopied('Markér og kopiér linket i feltet.')}}
 return <div style={{marginTop:24,borderTop:'1px solid #e1d0b6',paddingTop:12}}><h3>Direkte links</h3>{[['Produkt i webshoppen',origin+'/se-flere-smykker.html?produkt='+encodeURIComponent(id)],['Produkt i administrationen',origin+'/admin?product='+encodeURIComponent(id)]].map(([label,url])=><div key={label}><label>{label}<input readOnly value={origin?url:''} onFocus={e=>e.currentTarget.select()}/></label><button type="button" disabled={!origin} onClick={()=>copy(url,label)}>Kopiér link</button></div>)}{!active&&<p className="muted">Produktet er skjult eller slettet og kan ikke ses i webshoppen.</p>}<p role="status" className="muted">{copied}</p></div>
}
